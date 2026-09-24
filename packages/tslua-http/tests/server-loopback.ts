/**
 * HttpServer against real LuaSocket over loopback: the server is bound to 127.0.0.1 on an OS-assigned port and
 * non-blocking clients in the same process send raw HTTP while the test pumps the server (support/loopback.ts).
 */
import { Logger } from "@flying-dice/tslua-common";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	restoreAllMocks,
	spyOn,
	stringContaining,
	test,
} from "@flying-dice/tslua-luatest";
import * as socket from "socket";
import {
	type HttpRequest,
	HttpServer,
	type HttpServerOptions,
	type RequestHandler,
} from "../src";
import { fakeClock } from "./doubles/fake-socket";
import {
	ClientExchange,
	drive,
	exchange,
	type LoopbackServer,
	parseResponse,
	startServer,
} from "./support/loopback";

const HELLO =
	"HTTP/1.1 200 OK\r\nServer: Lua HTTP/1.1\r\nConnection: close\r\n\r\nHello";

const servers: LoopbackServer[] = [];
const exchanges: ClientExchange[] = [];

function serve(
	handler: RequestHandler,
	options?: HttpServerOptions,
): LoopbackServer {
	const server = startServer(handler, options);
	servers.push(server);
	return server;
}

/** A server whose handler records each request and answers 200 with `body`. */
function recordingServer(
	body = "Hello",
	options?: HttpServerOptions,
): {
	server: LoopbackServer;
	requests: HttpRequest[];
} {
	const requests: HttpRequest[] = [];
	const server = serve((req, res) => {
		requests.push(req);
		res.status = 200;
		res.body = body;
		return res;
	}, options);
	return { server, requests };
}

function open(
	server: LoopbackServer,
	request: string,
	options?: ConstructorParameters<typeof ClientExchange>[2],
): ClientExchange {
	const client = new ClientExchange(server.port(), request, options);
	exchanges.push(client);
	return client;
}

describe("HttpServer over loopback", () => {
	beforeEach(() => {
		spyOn(Logger.transports, "warn").mockReturnValue(undefined);
		spyOn(Logger.transports, "error").mockReturnValue(undefined);
	});

	afterEach(() => {
		restoreAllMocks();
		for (const client of exchanges.splice(0)) client.close();
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

			expect(raw).toBe(HELLO);
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
				"HTTP/1.1 404 Not Found\r\nServer: Lua HTTP/1.1\r\nConnection: close\r\n\r\n",
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
				"Connection: close",
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
				"HTTP/1.1 418 I'm a Teapot\r\nServer: Lua HTTP/1.1\r\nConnection: close\r\n\r\nshort and stout",
			);
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

		test("reads a body larger than one read chunk", () => {
			const { server, requests } = recordingServer("Hello", {
				ioChunkBytes: 1000,
			});
			const body = string.rep("0123456789abcdef", 4096); // 64 KiB
			exchange(
				server,
				`POST /big HTTP/1.1\r\nContent-Length: ${body.length}\r\n\r\n${body}`,
			);
			expect(requests[0].body).toHaveLength(65536);
			expect(requests[0].body).toBe(body);
		});

		test("reconstructs a request written one byte per pump", () => {
			const { server, requests } = recordingServer();
			const raw = exchange(
				server,
				"POST /frag?a=1 HTTP/1.1\r\nHost: x\r\nContent-Length: 4\r\n\r\n\r\n\0z",
				{ sliceBytes: 1 },
			);
			expect(raw).toBe(HELLO);
			expect(requests).toHaveLength(1);
			expect(requests[0].path).toBe("/frag");
			expect(requests[0].body).toBe("\r\n\0z");
		});

		test("rejects an invalid Content-Length with 400 instead of guessing", () => {
			const { server, requests } = recordingServer();
			const raw = exchange(
				server,
				"POST / HTTP/1.1\r\nContent-Length: abc\r\n\r\n",
			);
			expect(requests).toHaveLength(0);
			expect(raw).toBe(
				"HTTP/1.1 400 Bad Request\r\nServer: Lua HTTP/1.1\r\nConnection: close\r\n\r\n",
			);
		});

		test("closes the connection after each response", () => {
			const { server } = recordingServer();
			const client = open(server, "GET / HTTP/1.1\r\n\r\n");
			drive(server, [client]);
			expect(client.response()).toBe(HELLO);
			expect(client.done).toBe(true);
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
	});

	describe("concurrency", () => {
		test("an idle connection does not hold up a complete request, and still gets its deadline response", () => {
			const clock = fakeClock();
			const { server, requests } = recordingServer("Hello", {
				clock: clock.clock,
				requestTimeout: 10,
			});
			const idle = open(server, "GET /idle HTTP/1.1\r\nHost: x"); // never finished
			drive(
				server,
				[idle],
				() => idle.requestSent && server.connectionCount() === 1,
			);

			const healthy = open(server, "GET /healthy HTTP/1.1\r\n\r\n");
			const started = socket.gettime();
			drive(server, [idle, healthy], () => healthy.done);
			// Generous: a pump that waited on the idle socket (the old 2 s read timeout) would take far longer.
			expect(socket.gettime() - started).toBeLessThan(1);
			expect(healthy.response()).toBe(HELLO);
			expect(requests.map((r) => r.path)).toEqual(["/healthy"]);
			expect(idle.done).toBe(false);
			expect(server.connectionCount()).toBe(1);

			clock.advance(10);
			drive(server, [idle]);
			expect(idle.response()).toBe(
				"HTTP/1.1 408 Request Timeout\r\nServer: Lua HTTP/1.1\r\nConnection: close\r\n\r\n",
			);
			expect(requests).toHaveLength(1);
		});

		test("a client that stops reading a large response does not stop a healthy client", () => {
			const big = string.rep("0123456789abcdef", 1048576); // 16 MiB, more than loopback buffers hold
			let bigDispatched = false;
			const server = serve(
				(req, res) => {
					if (req.path === "/big") bigDispatched = true;
					res.status = 200;
					res.body = req.path === "/big" ? big : "small";
					return res;
				},
				{ maxResponseBytes: 32 * 1048576 },
			);
			const stalled = open(server, "GET /big HTTP/1.1\r\n\r\n", {
				read: false,
			});
			// Pump until the stalled response fills the socket buffers: a pump then writes nothing.
			drive(server, [stalled], () => {
				if (!bigDispatched) return false;
				const stats = server.pump();
				return stats.bytesWritten === 0 && server.connectionCount() === 1;
			});

			const healthy = open(server, "GET /small HTTP/1.1\r\n\r\n");
			drive(server, [stalled, healthy], () => healthy.done);
			expect(parseResponse(healthy.response()).body).toBe("small");
			expect(server.connectionCount()).toBe(1);

			// The stalled client resumes reading and receives every byte exactly once.
			const resumed = drive(server, [], () => {
				stalled.read();
				return stalled.done;
			});
			expect(resumed.length).toBeGreaterThan(0);
			const response = parseResponse(stalled.response());
			expect(response.body).toHaveLength(big.length);
			expect(response.body === big).toBe(true);
		});

		test("a burst of clients is served within one pump when the budgets allow", () => {
			const { server, requests } = recordingServer("Hello", {
				maxAcceptsPerPump: 8,
				maxConnections: 8,
				maxDispatchesPerPump: 8,
				clock: fakeClock().clock, // the time budget never runs out
			});
			const clients: ClientExchange[] = [];
			for (let i = 1; i <= 6; i++) {
				const client = open(server, `GET /${i} HTTP/1.1\r\n\r\n`);
				client.step(); // the whole request is now in the server's receive buffer
				clients.push(client);
			}
			const stats = server.pump();
			expect(stats.accepted).toBe(6);
			expect(stats.dispatched).toBe(6);
			drive(server, clients);
			expect(requests).toHaveLength(6);
			for (const client of clients) expect(client.response()).toBe(HELLO);
		});
	});

	describe("receive-side closure", () => {
		test("answers a complete request after the client half-closes", () => {
			const { server, requests } = recordingServer();
			const raw = exchange(
				server,
				"POST / HTTP/1.1\r\nContent-Length: 2\r\n\r\nhi",
				{
					endRequest: true,
				},
			);
			expect(requests[0].body).toBe("hi");
			expect(raw).toBe(HELLO);
		});

		test("never dispatches an incomplete body followed by a half-close, and sends nothing", () => {
			const { server, requests } = recordingServer();
			const raw = exchange(
				server,
				"POST / HTTP/1.1\r\nContent-Length: 10\r\n\r\nabc",
				{ endRequest: true },
			);
			expect(requests).toHaveLength(0);
			expect(raw).toBe("");
		});

		test("never dispatches an incomplete head followed by a half-close", () => {
			const { server, requests } = recordingServer();
			expect(
				exchange(server, "GET / HTTP/1.1\r\nHost: x", { endRequest: true }),
			).toBe("");
			expect(requests).toHaveLength(0);
		});

		test("a client that connects and sends nothing is dropped", () => {
			const { server, requests } = recordingServer();
			expect(exchange(server, "", { endRequest: true })).toBe("");
			expect(requests).toHaveLength(0);
		});
	});

	describe("failures", () => {
		test("a throwing handler gets 500 and serving continues", () => {
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

			expect(exchange(server, "GET / HTTP/1.1\r\n\r\n")).toBe(
				"HTTP/1.1 500 Internal Server Error\r\nServer: Lua HTTP/1.1\r\nConnection: close\r\n\r\n",
			);
			expect(error).toHaveBeenCalledWith(stringContaining("handler exploded"));
			expect(exchange(server, "GET / HTTP/1.1\r\n\r\n")).toBe(
				"HTTP/1.1 200 OK\r\nServer: Lua HTTP/1.1\r\nConnection: close\r\n\r\n",
			);
		});

		test("a malformed header line gets 400 and the handler is not called", () => {
			const { server, requests } = recordingServer();
			expect(exchange(server, "GET / HTTP/1.1\r\nno colon here\r\n\r\n")).toBe(
				"HTTP/1.1 400 Bad Request\r\nServer: Lua HTTP/1.1\r\nConnection: close\r\n\r\n",
			);
			expect(requests).toHaveLength(0);
		});

		test("close() releases the listening socket and open connections", () => {
			const { server, requests } = recordingServer();
			const client = open(server, "GET / HTTP/1.1\r\nHost: x");
			drive(server, [client], () => server.connectionCount() === 1);
			server.close();
			server.close();
			servers.splice(0); // already closed
			expect(server.pump().visited).toBe(0);
			client.read();
			expect(client.done).toBe(true);
			expect(requests).toHaveLength(0);
		});
	});
});
