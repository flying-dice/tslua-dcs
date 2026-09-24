/**
 * HttpServer against scripted socket doubles (tests/doubles/fake-socket.ts): the non-blocking read and write
 * paths, request framing, receive-side closure, failure isolation and shutdown.
 */
import { Logger, LogLevel } from "@flying-dice/tslua-common";
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
import { HttpServer, type RequestHandler } from "../src";
import { fakeClient } from "./doubles/fake-socket";
import { errorBytes, fakeServer, HELLO } from "./support/fake-server";

describe("HttpServer with socket doubles", () => {
	let logError: Mock<typeof Logger.transports.error>;
	let logWarn: Mock<typeof Logger.transports.warn>;

	beforeEach(() => {
		logError = spyOn(Logger.transports, "error").mockReturnValue(undefined);
		logWarn = spyOn(Logger.transports, "warn").mockReturnValue(undefined);
	});

	afterEach(() => {
		restoreAllMocks();
		Logger.level = LogLevel.INFO;
	});

	describe("lifecycle", () => {
		test("binds to the given address and port and makes accept non-blocking", () => {
			const { bind, listener } = fakeServer();
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

		test("rejects options that would disable a bound", () => {
			const { listener } = fakeServer();
			const handler: RequestHandler = (_req, res) => res;
			for (const options of [
				{ maxConnections: 0 },
				{ maxIoBytesPerPump: 1.5 },
				{ maxRequestBodyBytes: -1 },
				{ requestTimeout: 0 },
				{ maxPumpSeconds: -1 },
			]) {
				expect(
					() => new HttpServer("127.0.0.1", 8080, handler, options),
				).toThrow("HttpServer option");
			}
			expect(listener.close).not.toHaveBeenCalled();
		});

		test("does nothing when no client is waiting", () => {
			const { server, listener, requests } = fakeServer();
			const stats = server.pump();
			expect(listener.accept).toHaveBeenCalledTimes(1);
			expect(stats).toEqual({
				accepted: 0,
				visited: 0,
				dispatched: 0,
				bytesRead: 0,
				bytesWritten: 0,
				closed: 0,
				active: 0,
				bufferedBodyBytes: 0,
			});
			expect(requests).toHaveLength(0);
			expect(logError).not.toHaveBeenCalled();
		});

		test("does nothing when accept reports that the listener is closed", () => {
			const { server, listener, requests } = fakeServer();
			listener.accept.mockImplementation(() => $multi(undefined, "closed"));
			server.pump();
			expect(requests).toHaveLength(0);
			expect(logError).not.toHaveBeenCalled();
		});

		test("makes each accepted client non-blocking and reads it in bounded numeric chunks", () => {
			const client = fakeClient(["GET / HTTP/1.1\r\n\r\n"]);
			const { server } = fakeServer([client], { ioChunkBytes: 512 });
			server.pump();
			expect(client.settimeout).toHaveBeenCalledWith(client.socket, 0);
			expect(client.settimeout).not.toHaveBeenCalledWith(client.socket, 2);
			expect(client.receive).toHaveBeenNthCalledWith(1, client.socket, 512);
			for (const call of client.receive.mock.calls) {
				expect(call[1]).toBeTypeOf("number");
			}
		});

		test("answers a complete request in one pump and closes after the whole response is sent", () => {
			const client = fakeClient([
				"POST /x HTTP/1.1\r\nContent-Length: 5\r\n\r\nHello",
			]);
			const { server, requests } = fakeServer([client]);
			const stats = server.pump();

			expect(requests).toHaveLength(1);
			expect(requests[0].body).toBe("Hello");
			expect(client.written()).toBe(HELLO);
			expect(client.send).toHaveBeenCalledWith(
				client.socket,
				HELLO,
				1,
				HELLO.length,
			);
			expect(client.close).toHaveBeenCalledTimes(1);
			expect(stats).toEqual({
				accepted: 1,
				visited: 1,
				dispatched: 1,
				bytesRead: 44,
				bytesWritten: HELLO.length,
				closed: 1,
				active: 0,
				bufferedBodyBytes: 0,
			});
			expect(logError).not.toHaveBeenCalled();
			expect(logWarn).not.toHaveBeenCalled();
		});

		test("acceptNextClient() is a pump", () => {
			const client = fakeClient(["GET / HTTP/1.1\r\n\r\n"]);
			const { server, requests } = fakeServer([client]);
			server.acceptNextClient();
			expect(requests).toHaveLength(1);
			expect(client.written()).toBe(HELLO);
		});

		test("close() closes the listener and every open connection once, and is safe to repeat", () => {
			const a = fakeClient(["GET / HT"]);
			const b = fakeClient();
			const { server, listener } = fakeServer([a, b]);
			server.pump();
			expect(server.connectionCount()).toBe(2);

			server.close();
			server.close();
			expect(listener.close).toHaveBeenCalledTimes(1);
			expect(a.close).toHaveBeenCalledTimes(1);
			expect(b.close).toHaveBeenCalledTimes(1);
			expect(server.connectionCount()).toBe(0);

			const acceptsBefore = listener.accept.mock.calls.length;
			expect(server.pump().visited).toBe(0);
			expect(listener.accept).toHaveBeenCalledTimes(acceptsBefore);
		});

		test("a handler may close the server re-entrantly", () => {
			const a = fakeClient(["GET / HTTP/1.1\r\n\r\n"]);
			const b = fakeClient(["GET / HTTP/1.1\r\n\r\n"]);
			const fake = fakeServer([a, b], {}, (_req, res) => {
				fake.server.close();
				return res;
			});
			fake.server.pump();
			expect(fake.requests).toHaveLength(1);
			expect(a.close).toHaveBeenCalledTimes(1);
			expect(b.close).toHaveBeenCalledTimes(1);
			expect(a.send).not.toHaveBeenCalled();
			expect(logError).not.toHaveBeenCalled();
		});

		test("a handler that calls pump() re-entrantly gets an empty result and cannot reset the outer limits", () => {
			const clients = [
				fakeClient(["GET /1 HTTP/1.1\r\n\r\n"]),
				fakeClient(["GET /2 HTTP/1.1\r\n\r\n"]),
				fakeClient(["GET /3 HTTP/1.1\r\n\r\n"]),
			];
			const inner: unknown[] = [];
			const fake = fakeServer(
				clients,
				{ maxDispatchesPerPump: 1 },
				(_req, res) => {
					const stats = fake.server.pump();
					inner.push({ visited: stats.visited, dispatched: stats.dispatched });
					res.status = 200;
					res.body = "Hello";
					return res;
				},
			);
			const outer = fake.server.pump();
			expect(outer.dispatched).toBe(1);
			expect(fake.requests.map((r) => r.path)).toEqual(["/1"]);
			expect(inner).toEqual([{ visited: 0, dispatched: 0 }]);

			fake.server.pump();
			fake.server.pump();
			expect(fake.requests.map((r) => r.path)).toEqual(["/1", "/2", "/3"]);
			for (const client of clients) expect(client.written()).toBe(HELLO);
		});

		test("logs connection events at debug level, never per pump", () => {
			Logger.level = LogLevel.DEBUG;
			const debug = spyOn(Logger.transports, "debug").mockReturnValue(
				undefined,
			);
			const idle = fakeClient();
			const { server } = fakeServer([idle]);
			server.pump();
			expect(debug).toHaveBeenCalledTimes(1);
			expect(debug).toHaveBeenCalledWith(
				"[DEBUG] [HttpServer] - Accepted connection #1",
			);
			for (let i = 0; i < 5; i++) server.pump();
			expect(debug).toHaveBeenCalledTimes(1);
		});
	});

	describe("incremental reads", () => {
		test("reconstructs a head fragmented inside the request line, a header and the CRLF terminator", () => {
			const client = fakeClient([
				"GE",
				"T /pa",
				"th?x=1 HT",
				"TP/1.1\r",
				"\nHost: exa",
				"mple.com\r\n\r",
				"\n",
			]);
			const { server, requests } = fakeServer([client]);
			for (let i = 1; i <= 6; i++) {
				server.pump();
				expect(requests, `after pump ${i}`).toHaveLength(0);
			}
			server.pump();
			expect(requests).toEqual([
				{
					method: "GET",
					originalUrl: "/path?x=1",
					protocol: "HTTP/1.1",
					path: "/path",
					parameters: { x: "1" },
					headers: { host: "example.com" },
				},
			]);
			expect(client.written()).toBe(HELLO);
		});

		test("a request split at any byte is reconstructed exactly and dispatched once", () => {
			const raw =
				"PUT /blob HTTP/1.1\r\nHost: h\r\nContent-Length: 8\r\n\r\na\r\n\0b\r\nc";
			for (let at = 1; at < raw.length; at++) {
				const client = fakeClient([
					string.sub(raw, 1, at),
					string.sub(raw, at + 1),
				]);
				const { server, requests } = fakeServer([client]);
				server.pump();
				server.pump();
				server.pump();
				expect(requests, `split at ${at}`).toHaveLength(1);
				expect(requests[0].body, `split at ${at}`).toBe("a\r\n\0b\r\nc");
				expect(requests[0].headers, `split at ${at}`).toEqual({
					host: "h",
					"content-length": "8",
				});
				expect(client.written(), `split at ${at}`).toBe(HELLO);
				restoreAllMocks();
			}
		});

		test("a body trickled one byte per pump arrives intact and is dispatched exactly once, after the last byte", () => {
			const body = `x\0\r\n\r\ny${string.char(255)}`;
			const client = fakeClient([
				`POST / HTTP/1.1\r\nContent-Length: ${body.length}\r\n\r\n`,
			]);
			for (let i = 1; i <= body.length; i++)
				client.arrive(string.sub(body, i, i));
			const { server, requests } = fakeServer([client]);

			server.pump(); // the head
			for (let i = 1; i <= body.length; i++) {
				expect(requests, `before byte ${i}`).toHaveLength(0);
				server.pump();
			}
			expect(requests).toHaveLength(1);
			expect(requests[0].body).toBe(body);
			server.pump();
			server.pump();
			expect(requests).toHaveLength(1);
		});

		test("keeps body bytes that arrive in the same read as the end of the head", () => {
			const client = fakeClient([
				"POST / HTTP/1.1\r\nContent-Length: 6\r\n\r\nabc",
				"def",
			]);
			const { server, requests } = fakeServer([client]);
			server.pump();
			expect(requests).toHaveLength(0);
			server.pump();
			expect(requests[0].body).toBe("abcdef");
		});

		test("never asks for more body bytes than remain", () => {
			const client = fakeClient([
				"POST / HTTP/1.1\r\nContent-Length: 10\r\n\r\n",
				"0123",
			]);
			const { server } = fakeServer([client], { ioChunkBytes: 64 });
			server.pump();
			server.pump();
			expect(client.receive).toHaveBeenLastCalledWith(client.socket, 10);
			server.pump();
			expect(client.receive).toHaveBeenLastCalledWith(client.socket, 6);
		});

		test("ignores bytes after the declared body", () => {
			const client = fakeClient([
				"POST / HTTP/1.1\r\nContent-Length: 3\r\n\r\nabcdef",
			]);
			const { server, requests } = fakeServer([client]);
			server.pump();
			expect(requests[0].body).toBe("abc");
		});

		test("does not read a body without Content-Length, or with Content-Length: 0", () => {
			for (const header of ["", "Content-Length: 0\r\n"]) {
				const client = fakeClient([`POST / HTTP/1.1\r\n${header}\r\nignored`]);
				const { server, requests } = fakeServer([client]);
				server.pump();
				expect(requests).toHaveLength(1);
				expect(requests[0].body).toBeUndefined();
				expect(client.written()).toBe(HELLO);
				restoreAllMocks();
			}
		});

		test("accepts a bare-LF head", () => {
			const client = fakeClient([
				"GET /lf HTTP/1.1\nHost: example.com\nContent-Length: 2\n\nhi",
			]);
			const { server, requests } = fakeServer([client]);
			server.pump();
			expect(requests[0].path).toBe("/lf");
			expect(requests[0].body).toBe("hi");
		});
	});

	describe("request framing", () => {
		const rejected: [string, string, number, string][] = [
			[
				"a header line without a colon",
				"GET / HTTP/1.1\r\nno colon here\r\n\r\n",
				400,
				"Bad Request",
			],
			["an empty request line", "\r\n\r\n", 400, "Bad Request"],
			["a request line without a target", "GET\r\n\r\n", 400, "Bad Request"],
			[
				"a non-numeric Content-Length",
				"POST / HTTP/1.1\r\nContent-Length: abc\r\n\r\n",
				400,
				"Bad Request",
			],
			[
				"a negative Content-Length",
				"POST / HTTP/1.1\r\nContent-Length: -5\r\n\r\n",
				400,
				"Bad Request",
			],
			[
				"a signed Content-Length",
				"POST / HTTP/1.1\r\nContent-Length: +5\r\n\r\nhello",
				400,
				"Bad Request",
			],
			[
				"a list-valued Content-Length",
				"POST / HTTP/1.1\r\nContent-Length: 5, 5\r\n\r\nhello",
				400,
				"Bad Request",
			],
			[
				"conflicting Content-Length headers",
				"POST / HTTP/1.1\r\nContent-Length: 5\r\ncontent-length: 6\r\n\r\nhello!",
				400,
				"Bad Request",
			],
			[
				"Transfer-Encoding: chunked",
				"POST / HTTP/1.1\r\nTransfer-Encoding: chunked\r\n\r\n5\r\nhello\r\n0\r\n\r\n",
				501,
				"Not Implemented",
			],
			[
				"Transfer-Encoding together with Content-Length",
				"POST / HTTP/1.1\r\nContent-Length: 5\r\nTransfer-Encoding: chunked\r\n\r\nhello",
				400,
				"Bad Request",
			],
			[
				"Expect: 100-continue",
				"POST / HTTP/1.1\r\nExpect: 100-continue\r\nContent-Length: 5\r\n\r\n",
				417,
				"Expectation Failed",
			],
			[
				"a Content-Length above maxRequestBodyBytes",
				"POST / HTTP/1.1\r\nContent-Length: 1048577\r\n\r\n",
				413,
				"Payload Too Large",
			],
			[
				"a Content-Length too large for a number",
				"POST / HTTP/1.1\r\nContent-Length: 99999999999999999999999\r\n\r\n",
				413,
				"Payload Too Large",
			],
		];
		for (const [name, raw, status, text] of rejected) {
			test(`rejects ${name} with ${status} and never dispatches it`, () => {
				const client = fakeClient([raw]);
				const { server, requests } = fakeServer([client]);
				server.pump();
				expect(requests).toHaveLength(0);
				expect(client.written()).toBe(errorBytes(status, text));
				expect(client.close).toHaveBeenCalledTimes(1);
				expect(logWarn).toHaveBeenCalledWith(
					stringContaining(`Connection #1: rejected with ${status}`),
				);
			});
		}

		test("accepts identical duplicate Content-Length headers", () => {
			const client = fakeClient([
				"POST / HTTP/1.1\r\nContent-Length: 5\r\nContent-Length: 5\r\n\r\nhello",
			]);
			const { server, requests } = fakeServer([client]);
			server.pump();
			expect(requests[0].body).toBe("hello");
		});

		test("rejects an oversized declared body before reading any of it", () => {
			const client = fakeClient([
				"POST / HTTP/1.1\r\nContent-Length: 11\r\n\r\n",
				"0123456789a",
			]);
			const { server } = fakeServer([client], { maxRequestBodyBytes: 10 });
			server.pump();
			expect(client.receive).toHaveBeenCalledTimes(1);
			expect(client.written()).toBe(errorBytes(413, "Payload Too Large"));
		});

		test("rejects a head without a terminator once it exceeds maxRequestHeaderBytes, without buffering more", () => {
			const client = fakeClient();
			for (let i = 0; i < 100; i++) client.arrive(string.rep("a", 50));
			const { server } = fakeServer([client], {
				maxRequestHeaderBytes: 200,
				ioChunkBytes: 64,
			});
			for (let i = 0; i < 10; i++) server.pump();
			expect(client.receive).toHaveBeenCalledTimes(5); // 250 bytes > 200
			expect(client.written()).toBe(
				errorBytes(431, "Request Header Fields Too Large"),
			);
			expect(client.close).toHaveBeenCalledTimes(1);
		});

		test("rejects a terminated head longer than maxRequestHeaderBytes", () => {
			const client = fakeClient([
				`GET / HTTP/1.1\r\nX: ${string.rep("a", 200)}\r\n\r\n`,
			]);
			const { server, requests } = fakeServer([client], {
				maxRequestHeaderBytes: 100,
			});
			server.pump();
			expect(requests).toHaveLength(0);
			expect(client.written()).toBe(
				errorBytes(431, "Request Header Fields Too Large"),
			);
		});

		test("rejects more than maxRequestHeaderCount header lines", () => {
			const ok = fakeClient(["GET / HTTP/1.1\r\nA: 1\r\nB: 2\r\n\r\n"]);
			const tooMany = fakeClient([
				"GET / HTTP/1.1\r\nA: 1\r\nB: 2\r\nC: 3\r\n\r\n",
			]);
			const { server, requests } = fakeServer([ok, tooMany], {
				maxRequestHeaderCount: 2,
			});
			server.pump();
			expect(requests).toHaveLength(1);
			expect(tooMany.written()).toBe(
				errorBytes(431, "Request Header Fields Too Large"),
			);
		});

		test("always advertises Connection: close, replacing a Connection header set by the handler", () => {
			const client = fakeClient(["GET / HTTP/1.1\r\n\r\n"]);
			const { server } = fakeServer([client], {}, (_req, res) => {
				res.status = 200;
				res.headers.connection = "keep-alive";
				return res;
			});
			server.pump();
			expect(client.written()).toBe(
				"HTTP/1.1 200 OK\r\nServer: Lua HTTP/1.1\r\nConnection: close\r\n\r\n",
			);
		});
	});

	describe("receive-side closure", () => {
		test("answers a complete request that arrives together with the client's half-close", () => {
			const client = fakeClient([
				{
					error: "closed",
					partial: "POST / HTTP/1.1\r\nContent-Length: 2\r\n\r\nhi",
				},
			]);
			const { server, requests } = fakeServer([client]);
			server.pump();
			expect(requests[0].body).toBe("hi");
			expect(client.written()).toBe(HELLO);
			expect(logWarn).not.toHaveBeenCalled();
		});

		test("drops a connection closed in the middle of the head without a response", () => {
			const client = fakeClient([
				"GET / HTTP/1.1\r\n",
				"Host: x",
				{ error: "closed" },
			]);
			const { server, requests } = fakeServer([client]);
			server.pump();
			server.pump();
			server.pump();
			expect(requests).toHaveLength(0);
			expect(client.send).not.toHaveBeenCalled();
			expect(client.close).toHaveBeenCalledTimes(1);
			expect(logWarn).toHaveBeenCalledWith(
				stringContaining(
					"Connection #1: closed while reading the request head: Incomplete request head: received 23 bytes (closed)",
				),
			);
		});

		test("drops a connection closed before the whole body arrives, without dispatch", () => {
			const client = fakeClient([
				"POST / HTTP/1.1\r\nContent-Length: 5\r\n\r\n",
				{ error: "closed", partial: "Hel" },
			]);
			const { server, requests } = fakeServer([client]);
			server.pump();
			server.pump();
			expect(requests).toHaveLength(0);
			expect(client.send).not.toHaveBeenCalled();
			expect(logWarn).toHaveBeenCalledWith(
				stringContaining(
					"Incomplete request body: expected 5 bytes, received 3 (closed)",
				),
			);
			expect(client.close).toHaveBeenCalledTimes(1);
		});

		test("a client that connects and closes without sending anything is dropped quietly", () => {
			const client = fakeClient([{ error: "closed" }]);
			const { server, requests } = fakeServer([client]);
			server.pump();
			expect(requests).toHaveLength(0);
			expect(client.close).toHaveBeenCalledTimes(1);
			expect(logWarn).not.toHaveBeenCalled();
			expect(logError).not.toHaveBeenCalled();
		});

		test("a socket error while reading drops the connection", () => {
			const client = fakeClient([
				"GET / HT",
				{ error: "connection reset by peer" },
			]);
			const { server, requests } = fakeServer([client]);
			server.pump();
			server.pump();
			expect(requests).toHaveLength(0);
			expect(client.close).toHaveBeenCalledTimes(1);
			expect(logWarn).toHaveBeenCalledWith(
				stringContaining("(connection reset by peer)"),
			);
		});
	});

	describe("failure isolation", () => {
		test("a throwing handler gets 500 and the next connection is served in the same pump", () => {
			const a = fakeClient(["GET /a HTTP/1.1\r\n\r\n"]);
			const b = fakeClient(["GET /b HTTP/1.1\r\n\r\n"]);
			const { server, requests } = fakeServer([a, b], {}, (req, res) => {
				if (req.path === "/a") throw new Error("handler exploded");
				res.status = 200;
				res.body = "Hello";
				return res;
			});
			server.pump();
			expect(requests.map((r) => r.path)).toEqual(["/a", "/b"]);
			expect(a.written()).toBe(errorBytes(500, "Internal Server Error"));
			expect(b.written()).toBe(HELLO);
			expect(logError).toHaveBeenCalledWith(
				stringContaining(
					"[ERROR] [HttpServer] - Connection #1: request handler failed: ",
				),
			);
			expect(logError).toHaveBeenCalledWith(
				stringContaining("handler exploded"),
			);
		});

		test("a handler that returns nothing gets 500", () => {
			const client = fakeClient(["GET / HTTP/1.1\r\n\r\n"]);
			const { server } = fakeServer(
				[client],
				{},
				(() => undefined) as unknown as RequestHandler,
			);
			server.pump();
			expect(client.written()).toBe(errorBytes(500, "Internal Server Error"));
			expect(logError).toHaveBeenCalledWith(
				stringContaining("request handler did not return a response"),
			);
		});

		test("a response larger than maxResponseBytes is replaced by 500", () => {
			const client = fakeClient(["GET / HTTP/1.1\r\n\r\n"]);
			const { server } = fakeServer(
				[client],
				{ maxResponseBytes: 100 },
				(_req, res) => {
					res.status = 200;
					res.body = string.rep("x", 200);
					return res;
				},
			);
			server.pump();
			expect(client.written()).toBe(errorBytes(500, "Internal Server Error"));
			expect(logError).toHaveBeenCalledWith(
				stringContaining("exceeds 100 bytes"),
			);
		});

		test("an error raised by a socket closes that connection only", () => {
			const broken = fakeClient();
			broken.receive.mockImplementation(() => {
				error("socket exploded");
			});
			const good = fakeClient(["GET / HTTP/1.1\r\n\r\n"]);
			const { server } = fakeServer([broken, good]);
			server.pump();
			expect(broken.close).toHaveBeenCalledTimes(1);
			expect(good.written()).toBe(HELLO);
			expect(logError).toHaveBeenCalledWith(
				stringContaining("socket exploded"),
			);
		});

		test("a failed send closes that connection and logs the byte counts", () => {
			const failing = fakeClient(["GET / HTTP/1.1\r\n\r\n"]);
			failing.sendLimits({ error: "closed", accepted: 10 });
			const good = fakeClient(["GET / HTTP/1.1\r\n\r\n"]);
			const { server } = fakeServer([failing, good]);
			server.pump();
			expect(failing.close).toHaveBeenCalledTimes(1);
			expect(logWarn).toHaveBeenCalledWith(
				stringContaining(
					`Connection #1: closed while writing the response: response write failed (closed) after 10 of ${HELLO.length} bytes`,
				),
			);
			expect(good.written()).toBe(HELLO);
		});

		test("a would-block read is not logged", () => {
			const client = fakeClient(["GET / HT"]);
			const { server } = fakeServer([client]);
			for (let i = 0; i < 5; i++) server.pump();
			expect(logWarn).not.toHaveBeenCalled();
			expect(logError).not.toHaveBeenCalled();
		});
	});
});
