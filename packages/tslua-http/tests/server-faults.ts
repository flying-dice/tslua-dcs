/**
 * HttpServer against scripted socket doubles (tests/doubles/fake-socket.ts): exact call sequences
 * and faults such as read timeouts, partial reads and failed sends.
 */
import { Logger } from "@flying-dice/tslua-common";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	type Mock,
	restoreAllMocks,
	spyOn,
	stringContaining,
	test,
} from "@flying-dice/tslua-luatest";
import * as socket from "socket";
import { HttpServer, type HttpRequest } from "../src";
import {
	type FakeClient,
	type FakeListener,
	fakeClient,
	fakeListener,
	useFakeListener,
} from "./doubles/fake-socket";

describe("HttpServer with socket doubles", () => {
	let listener: FakeListener;
	let bind: Mock;
	let logError: Mock<typeof Logger.transports.error>;
	let requests: HttpRequest[];

	/** Queues `client` on the listener and builds a server answering 200 "Hello". */
	function serverFor(...clients: FakeClient[]): HttpServer {
		listener = fakeListener(clients);
		bind = useFakeListener(listener);
		return new HttpServer("127.0.0.1", 8080, (req, res) => {
			requests.push(req);
			res.status = 200;
			res.body = "Hello";
			return res;
		});
	}

	beforeEach(() => {
		requests = [];
		logError = spyOn(Logger.transports, "error").mockReturnValue(undefined);
	});

	afterEach(() => restoreAllMocks());

	test("binds to the given address and port and makes accept non-blocking", () => {
		serverFor();
		expect(bind).toHaveBeenCalledWith("127.0.0.1", 8080);
		expect(listener.settimeout).toHaveBeenCalledWith(listener.socket, 0);
	});

	test("reports a bind failure with LuaSocket's message", () => {
		spyOn(socket, "bind").mockImplementation(() =>
			$multi(undefined, "address already in use"),
		);
		expect(() => new HttpServer("0.0.0.0", 80, (_req, res) => res)).toThrow({
			includes: "Failed to bind 0.0.0.0:80: address already in use",
		});
	});

	test("close() closes the listening socket", () => {
		serverFor().close();
		expect(listener.close).toHaveBeenCalledTimes(1);
	});

	test("reads the head line by line, then the body by length, responds and closes", () => {
		const client = fakeClient([
			"GET / HTTP/1.1",
			"Content-Length: 5",
			"",
			"Hello",
		]);
		serverFor(client).acceptNextClient();

		expect(client.receive).toHaveBeenCalledTimes(4);
		expect(client.receive).toHaveBeenNthCalledWith(1, client.socket, "*l");
		expect(client.receive).toHaveBeenNthCalledWith(2, client.socket, "*l");
		expect(client.receive).toHaveBeenNthCalledWith(3, client.socket, "*l");
		expect(client.receive).toHaveBeenNthCalledWith(4, client.socket, 5);
		expect(client.settimeout).toHaveBeenCalledWith(client.socket, 2);
		expect(requests[0].body).toBe("Hello");
		expect(client.send).toHaveBeenCalledTimes(1);
		expect(client.send).toHaveBeenCalledWith(
			client.socket,
			"HTTP/1.1 200 OK\r\nServer: Lua HTTP/1.1\r\n\r\nHello",
		);
		expect(client.close).toHaveBeenCalledTimes(1);
		expect(logError).not.toHaveBeenCalled();
	});

	test("does not read a body when there is no Content-Length", () => {
		const client = fakeClient(["GET / HTTP/1.1", ""]);
		serverFor(client).acceptNextClient();
		expect(client.receive).toHaveBeenCalledTimes(2);
		expect(requests[0].body).toBeUndefined();
		expect(client.send).toHaveBeenCalledTimes(1);
	});

	test("does nothing when no client is waiting", () => {
		const server = serverFor();
		server.acceptNextClient();
		expect(listener.accept).toHaveBeenCalledTimes(1);
		expect(requests).toHaveLength(0);
		expect(logError).not.toHaveBeenCalled();
	});

	test("does nothing when accept reports that the listener is closed", () => {
		const server = serverFor();
		listener.accept.mockImplementation(() => $multi(undefined, "closed"));
		server.acceptNextClient();
		expect(requests).toHaveLength(0);
		expect(logError).not.toHaveBeenCalled();
	});

	test("a read timeout on the request line closes the client without a response", () => {
		const client = fakeClient([{ error: "timeout", partial: "GET / HT" }]);
		serverFor(client).acceptNextClient();

		expect(client.receive).toHaveBeenCalledTimes(1);
		expect(client.send).not.toHaveBeenCalled();
		expect(client.close).toHaveBeenCalledTimes(1);
		expect(requests).toHaveLength(0);
		expect(logError).toHaveBeenCalledWith(
			stringContaining("Client returned unexpected value, terminating"),
		);
	});

	test("a closed connection in the middle of the headers closes the client", () => {
		const client = fakeClient([
			"GET / HTTP/1.1",
			"Host: x",
			{ error: "closed" },
		]);
		serverFor(client).acceptNextClient();

		expect(client.receive).toHaveBeenCalledTimes(3);
		expect(client.send).not.toHaveBeenCalled();
		expect(client.close).toHaveBeenCalledTimes(1);
		expect(logError).toHaveBeenCalledTimes(1);
	});

	test("a read timeout on the body answers 408 and never calls the handler", () => {
		const client = fakeClient([
			"POST / HTTP/1.1",
			"Content-Length: 5",
			"",
			{ error: "timeout", partial: "He" },
		]);
		serverFor(client).acceptNextClient();

		expect(client.receive).toHaveBeenLastCalledWith(client.socket, 5);
		expect(requests).toHaveLength(0);
		expect(client.send).toHaveBeenCalledTimes(1);
		const [, sent] = client.send.mock.calls[0];
		expect(sent).toMatch("^HTTP/1%.1 408 Request Timeout\r\n");
		expect(sent).toContain("Connection: close");
		expect(logError).toHaveBeenCalledWith(
			stringContaining(
				"Incomplete request body: expected 5 bytes, received 2 (timeout)",
			),
		);
		expect(client.close).toHaveBeenCalledTimes(1);
	});

	test("a connection closed before the whole body arrives is dropped without dispatch", () => {
		const client = fakeClient([
			"POST / HTTP/1.1",
			"Content-Length: 5",
			"",
			{ error: "closed", partial: "Hel" },
		]);
		serverFor(client).acceptNextClient();

		expect(requests).toHaveLength(0);
		expect(client.send).not.toHaveBeenCalled();
		expect(logError).toHaveBeenCalledWith(
			stringContaining(
				"Incomplete request body: expected 5 bytes, received 3 (closed)",
			),
		);
		expect(client.close).toHaveBeenCalledTimes(1);
	});

	test("an early close with no body bytes at all is dropped without dispatch", () => {
		const client = fakeClient([
			"POST / HTTP/1.1",
			"Content-Length: 5",
			"",
			{ error: "closed" },
		]);
		serverFor(client).acceptNextClient();

		expect(requests).toHaveLength(0);
		expect(client.send).not.toHaveBeenCalled();
		expect(logError).toHaveBeenCalledWith(
			stringContaining("expected 5 bytes, received 0 (closed)"),
		);
	});

	test("the server keeps serving after an incomplete body", () => {
		const bad = fakeClient([
			"POST / HTTP/1.1",
			"Content-Length: 5",
			"",
			{ error: "closed" },
		]);
		const good = fakeClient([
			"POST / HTTP/1.1",
			"Content-Length: 5",
			"",
			"Hello",
		]);
		const server = serverFor(bad, good);
		server.acceptNextClient();
		server.acceptNextClient();
		expect(requests).toHaveLength(1);
		expect(requests[0].body).toBe("Hello");
	});

	test("a failed send is ignored and the client is still closed", () => {
		const client = fakeClient(["GET / HTTP/1.1", ""]);
		client.send.mockImplementation(() => $multi(undefined, "closed", 0));
		serverFor(client).acceptNextClient();

		expect(client.send).toHaveBeenCalledTimes(1);
		expect(client.close).toHaveBeenCalledTimes(1);
		expect(logError).not.toHaveBeenCalled();
	});

	test("an error raised by the socket is logged and the client is closed", () => {
		const client = fakeClient();
		client.receive.mockImplementation(() => {
			error("socket exploded");
		});
		serverFor(client).acceptNextClient();

		expect(client.close).toHaveBeenCalledTimes(1);
		expect(logError).toHaveBeenCalledWith(stringContaining("socket exploded"));
	});

	test("each call accepts at most one client", () => {
		const first = fakeClient(["GET /1 HTTP/1.1", ""]);
		const second = fakeClient(["GET /2 HTTP/1.1", ""]);
		const server = serverFor(first, second);

		server.acceptNextClient();
		expect(requests.map((r) => r.path)).toEqual(["/1"]);
		expect(second.receive).not.toHaveBeenCalled();

		server.acceptNextClient();
		expect(requests.map((r) => r.path)).toEqual(["/1", "/2"]);
	});
});
