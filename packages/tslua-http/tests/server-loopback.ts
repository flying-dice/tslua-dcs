/**
 * HttpServer against real LuaSocket over loopback: the server is bound to 127.0.0.1 on an
 * OS-assigned port and a client socket in the same process sends raw HTTP.
 */
import { Logger, LogLevel } from "@flying-dice/tslua-common";
import {
	afterEach,
	describe,
	expect,
	restoreAllMocks,
	spyOn,
	stringContaining,
	test,
} from "@flying-dice/tslua-luatest";
import { HttpServer, type HttpRequest, type RequestHandler } from "../src";
import {
	connect,
	exchange,
	type LoopbackServer,
	parseResponse,
	readAll,
	startServer,
} from "./support/loopback";

const servers: LoopbackServer[] = [];

function serve(handler: RequestHandler): LoopbackServer {
	const server = startServer(handler);
	servers.push(server);
	return server;
}

/** A server whose handler records each request and answers 200 with `body`. */
function recordingServer(body = "Hello"): {
	server: LoopbackServer;
	requests: HttpRequest[];
} {
	const requests: HttpRequest[] = [];
	const server = serve((req, res) => {
		requests.push(req);
		res.status = 200;
		res.body = body;
		return res;
	});
	return { server, requests };
}

describe("HttpServer over loopback", () => {
	afterEach(() => {
		restoreAllMocks();
		Logger.level = LogLevel.INFO;
		for (const server of servers.splice(0)) server.close();
	});

	describe("binding", () => {
		test("binds to an OS-assigned port when given port 0", () => {
			const { server } = recordingServer();
			expect(server.port()).toBeGreaterThan(0);
		});

		test("throws a descriptive error when the address cannot be bound", () => {
			expect(
				() => new HttpServer("256.256.256.256", 0, (_req, res) => res),
			).toThrow("Failed to bind 256.256.256.256:0: ");
		});
	});

	describe("request handling", () => {
		test("answers a GET request and passes the parsed request to the handler", () => {
			const { server, requests } = recordingServer();
			const raw = exchange(
				server,
				"GET /units?coalition=blue&limit=2 HTTP/1.1\r\nHost: 127.0.0.1:8080\r\nAccept: */*\r\n\r\n",
			);

			expect(raw).toBe("HTTP/1.1 200 OK\r\nServer: Lua HTTP/1.1\r\n\r\nHello");
			expect(requests).toEqual([
				{
					method: "GET",
					originalUrl: "/units?coalition=blue&limit=2",
					protocol: "HTTP/1.1",
					path: "/units",
					parameters: { coalition: "blue", limit: "2" },
					headers: { host: "127.0.0.1:8080", accept: "*/*" },
				},
			]);
		});

		test("the handler starts from an empty 404 response", () => {
			let initial: unknown;
			const server = serve((_req, res) => {
				initial = { status: res.status, headers: res.headers, body: res.body };
				return res;
			});
			const raw = exchange(server, "GET /missing HTTP/1.1\r\n\r\n");

			expect(initial).toEqual({ status: 404, headers: {} });
			expect(raw).toBe(
				"HTTP/1.1 404 Not Found\r\nServer: Lua HTTP/1.1\r\n\r\n",
			);
		});

		test("sends the status, headers and body the handler returns", () => {
			const server = serve((_req, res) => {
				res.status = 201;
				res.headers["Content-Type"] = "application/json";
				res.body = '{"id":1}';
				return res;
			});
			const response = parseResponse(
				exchange(server, "POST /units HTTP/1.1\r\nContent-Length: 0\r\n\r\n"),
			);

			expect(response.statusLine).toBe("HTTP/1.1 201 Created");
			expect(response.headerLines).toEqual([
				"Server: Lua HTTP/1.1",
				"Content-Type: application/json",
			]);
			expect(response.body).toBe('{"id":1}');
		});

		test("the handler may return a new response object", () => {
			const server = serve(() => ({
				status: 418,
				headers: {},
				body: "short and stout",
			}));
			expect(exchange(server, "BREW /pot HTTP/1.1\r\n\r\n")).toBe(
				"HTTP/1.1 418 I'm a Teapot\r\nServer: Lua HTTP/1.1\r\n\r\nshort and stout",
			);
		});

		test("reads a body of Content-Length bytes", () => {
			const { server, requests } = recordingServer();
			exchange(
				server,
				'POST /submit HTTP/1.1\r\nContent-Type: application/json\r\nContent-Length: 17\r\n\r\n{"hello":"world"}',
			);
			expect(requests[0].body).toBe('{"hello":"world"}');
			expect(requests[0].headers["content-length"]).toBe("17");
		});

		test("reads a binary body containing CRLFs and NUL bytes intact", () => {
			const { server, requests } = recordingServer();
			const body = `a\r\n\r\nb\0c${string.char(255)}`;
			exchange(
				server,
				`PUT /blob HTTP/1.1\r\nContent-Length: ${body.length}\r\n\r\n${body}`,
			);
			expect(requests[0].body).toBe(body);
		});

		test("reads a larger body", () => {
			const { server, requests } = recordingServer();
			const body = string.rep("0123456789abcdef", 512); // 8 KiB
			exchange(
				server,
				`POST /big HTTP/1.1\r\nContent-Length: ${body.length}\r\n\r\n${body}`,
			);
			expect(requests[0].body).toHaveLength(8192);
			expect(requests[0].body).toBe(body);
		});

		test("reads only Content-Length bytes when the client sends more", () => {
			const { server, requests } = recordingServer();
			exchange(server, "POST / HTTP/1.1\r\nContent-Length: 3\r\n\r\nabcdef");
			expect(requests[0].body).toBe("abc");
		});

		const noBody: [string, string][] = [
			["no Content-Length header", ""],
			["Content-Length: 0", "Content-Length: 0\r\n"],
			["a non-numeric Content-Length", "Content-Length: abc\r\n"],
			["a negative Content-Length", "Content-Length: -5\r\n"],
		];
		for (const [name, header] of noBody) {
			test(`does not read a body with ${name}`, () => {
				const { server, requests } = recordingServer();
				const raw = exchange(server, `POST / HTTP/1.1\r\n${header}\r\nignored`);
				expect(requests).toHaveLength(1);
				expect(requests[0].body).toBeUndefined();
				expect(raw).toBe(
					"HTTP/1.1 200 OK\r\nServer: Lua HTTP/1.1\r\n\r\nHello",
				);
			});
		}

		test("accepts bare LF line endings", () => {
			const { server, requests } = recordingServer();
			exchange(
				server,
				"GET /lf HTTP/1.1\nHost: example.com\nContent-Length: 2\n\nhi",
			);
			expect(requests[0].path).toBe("/lf");
			expect(requests[0].headers).toEqual({
				host: "example.com",
				"content-length": "2",
			});
			expect(requests[0].body).toBe("hi");
		});

		test("closes the connection after each response", () => {
			const { server } = recordingServer();
			const client = connect(server.port());
			client.send("GET / HTTP/1.1\r\n\r\n");
			server.acceptNextClient();
			expect(readAll(client)).toBe(
				"HTTP/1.1 200 OK\r\nServer: Lua HTTP/1.1\r\n\r\nHello",
			);
			const [data, err] = client.receive("*l");
			expect(data).toBeUndefined();
			expect(err).toBe("closed");
			client.close();
		});

		test("logs its progress at debug level", () => {
			Logger.level = LogLevel.DEBUG;
			const debug = spyOn(Logger.transports, "debug").mockReturnValue(
				undefined,
			);
			const { server } = recordingServer();
			exchange(server, "POST / HTTP/1.1\r\nContent-Length: 2\r\n\r\nhi");
			expect(debug).toHaveBeenCalledWith(
				"[DEBUG] [HttpServer] - Fetching request body 2",
			);
			expect(debug).toHaveBeenLastCalledWith(
				"[DEBUG] [HttpServer] - Closing client",
			);
			// The corrected Logger contract (#127): the message is the only argument.
			for (const call of debug.mock.calls) expect(call.n).toBe(1);
		});
	});

	describe("accept loop", () => {
		test("returns immediately when no client is waiting", () => {
			const { server, requests } = recordingServer();
			server.acceptNextClient();
			server.acceptNextClient();
			expect(requests).toHaveLength(0);
		});

		test("handles one waiting client per call", () => {
			const { server, requests } = recordingServer();
			const first = connect(server.port());
			const second = connect(server.port());
			first.send("GET /first HTTP/1.1\r\n\r\n");
			second.send("GET /second HTTP/1.1\r\n\r\n");

			server.acceptNextClient();
			expect(requests).toHaveLength(1);
			server.acceptNextClient();
			expect(requests).toHaveLength(2);
			server.acceptNextClient();
			expect(requests).toHaveLength(2);

			expect(requests.map((r) => r.path)).toEqual(["/first", "/second"]);
			expect(parseResponse(readAll(first)).statusLine).toBe("HTTP/1.1 200 OK");
			expect(parseResponse(readAll(second)).statusLine).toBe("HTTP/1.1 200 OK");
			first.close();
			second.close();
		});

		test("serves consecutive requests", () => {
			const server = serve((req, res) => {
				res.status = 200;
				res.body = req.path;
				return res;
			});
			for (const path of ["/a", "/b", "/c"]) {
				expect(
					parseResponse(exchange(server, `GET ${path} HTTP/1.1\r\n\r\n`)).body,
				).toBe(path);
			}
		});

		test("close() releases the listening socket", () => {
			const { server, requests } = recordingServer();
			server.close();
			servers.splice(0); // already closed
			// Accepting on a closed listener reports "closed", which is ignored.
			server.acceptNextClient();
			expect(requests).toHaveLength(0);
		});
	});

	describe("failures", () => {
		test("a throwing handler is logged, the client is closed without a response, and serving continues", () => {
			const error = spyOn(Logger.transports, "error").mockReturnValue(
				undefined,
			);
			let calls = 0;
			const server = serve((_req, res) => {
				calls++;
				if (calls === 1) throw new Error("handler exploded");
				res.status = 200;
				return res;
			});

			expect(exchange(server, "GET / HTTP/1.1\r\n\r\n")).toBe("");
			expect(error).toHaveBeenCalledWith(
				stringContaining("[ERROR] [HttpServer] - Error handling client: "),
			);
			expect(error).toHaveBeenCalledWith(stringContaining("handler exploded"));

			expect(exchange(server, "GET / HTTP/1.1\r\n\r\n")).toBe(
				"HTTP/1.1 200 OK\r\nServer: Lua HTTP/1.1\r\n\r\n",
			);
		});

		test("a handler that returns nothing is logged and gets no response", () => {
			const error = spyOn(Logger.transports, "error").mockReturnValue(
				undefined,
			);
			const server = serve((() => undefined) as unknown as RequestHandler);
			expect(exchange(server, "GET / HTTP/1.1\r\n\r\n")).toBe("");
			expect(error).toHaveBeenCalledTimes(1);
		});

		test("a malformed header line is logged and the handler is not called", () => {
			const error = spyOn(Logger.transports, "error").mockReturnValue(
				undefined,
			);
			const { server, requests } = recordingServer();
			expect(exchange(server, "GET / HTTP/1.1\r\nno colon here\r\n\r\n")).toBe(
				"",
			);
			expect(requests).toHaveLength(0);
			expect(error).toHaveBeenCalledWith(
				stringContaining("Malformed header line: no colon here"),
			);
		});

		test("an empty request line is logged and the handler is not called", () => {
			const error = spyOn(Logger.transports, "error").mockReturnValue(
				undefined,
			);
			const { server, requests } = recordingServer();
			expect(exchange(server, "\r\n")).toBe("");
			expect(requests).toHaveLength(0);
			expect(error).toHaveBeenCalledTimes(1);
		});

		test("a client that closes mid-head is logged and the handler is not called", () => {
			const error = spyOn(Logger.transports, "error").mockReturnValue(
				undefined,
			);
			const { server, requests } = recordingServer();
			expect(
				exchange(server, "GET / HTTP/1.1\r\nHost: x", { endRequest: true }),
			).toBe("");
			expect(requests).toHaveLength(0);
			expect(error).toHaveBeenCalledWith(
				stringContaining("Client returned unexpected value, terminating"),
			);
		});

		test("a client that connects and sends nothing is dropped", () => {
			const error = spyOn(Logger.transports, "error").mockReturnValue(
				undefined,
			);
			const { server, requests } = recordingServer();
			expect(exchange(server, "", { endRequest: true })).toBe("");
			expect(requests).toHaveLength(0);
			expect(error).toHaveBeenCalledTimes(1);
		});

		test("partial data then an early close: the handler is not called and nothing is sent", () => {
			const { server, requests } = recordingServer();
			const error = spyOn(Logger.transports, "error").mockReturnValue(
				undefined,
			);
			const raw = exchange(
				server,
				"POST / HTTP/1.1\r\nContent-Length: 10\r\n\r\nabc",
				{ endRequest: true },
			);
			expect(requests).toHaveLength(0);
			expect(raw).toBe("");
			expect(error).toHaveBeenCalledWith(
				stringContaining(
					"Incomplete request body: expected 10 bytes, received 3 (closed)",
				),
			);
		});

		test("partial data then silence: the server times out with 408 and no dispatch", () => {
			const { server, requests } = recordingServer();
			const error = spyOn(Logger.transports, "error").mockReturnValue(
				undefined,
			);
			// The client stays connected but never sends the rest; the server's 2s read timeout fires.
			const raw = exchange(
				server,
				"POST / HTTP/1.1\r\nContent-Length: 10\r\n\r\nabc",
			);
			expect(requests).toHaveLength(0);
			expect(raw).toMatch("^HTTP/1%.1 408 Request Timeout\r\n");
			expect(error).toHaveBeenCalledWith(
				stringContaining(
					"Incomplete request body: expected 10 bytes, received 3 (timeout)",
				),
			);
		});
	});
});
