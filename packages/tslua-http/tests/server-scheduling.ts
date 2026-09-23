/**
 * HttpServer scheduling against socket doubles and a fake clock: resumable partial writes, independence of
 * connections (no head-of-line blocking), round-robin fairness, per-pump budgets, deadlines and capacity.
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
import { type FakeClient, fakeClient } from "./doubles/fake-socket";
import { errorBytes, fakeServer, HELLO } from "./support/fake-server";

const GET = "GET / HTTP/1.1\r\n\r\n";

/** A client whose complete request is already waiting. */
function ready(path = "/"): FakeClient {
	return fakeClient([`GET ${path} HTTP/1.1\r\n\r\n`]);
}

describe("HttpServer scheduling", () => {
	let logWarn: Mock<typeof Logger.transports.warn>;

	beforeEach(() => {
		spyOn(Logger.transports, "error").mockReturnValue(undefined);
		logWarn = spyOn(Logger.transports, "warn").mockReturnValue(undefined);
	});

	afterEach(() => restoreAllMocks());

	describe("resumable writes", () => {
		test("partial sends, including zero progress, resume at the next byte with nothing lost or repeated", () => {
			const client = fakeClient([GET]);
			client.sendLimits(5, 0, 3, 0, 0, 7);
			const { server } = fakeServer([client]);

			server.pump(); // accepted 5 bytes, then would-block
			expect(client.send).toHaveBeenNthCalledWith(
				1,
				client.socket,
				HELLO,
				1,
				HELLO.length,
			);
			expect(client.written()).toBe(string.sub(HELLO, 1, 5));
			expect(client.close).not.toHaveBeenCalled();

			server.pump(); // zero progress
			expect(client.send).toHaveBeenLastCalledWith(
				client.socket,
				HELLO,
				6,
				HELLO.length,
			);
			server.pump(); // 3 bytes from a non-default start
			expect(client.send).toHaveBeenLastCalledWith(
				client.socket,
				HELLO,
				6,
				HELLO.length,
			);
			expect(client.written()).toBe(string.sub(HELLO, 1, 8));
			server.pump(); // zero
			server.pump(); // zero
			server.pump(); // 7
			expect(client.written()).toBe(string.sub(HELLO, 1, 15));
			expect(client.close).not.toHaveBeenCalled();
			server.pump(); // the rest, in full
			expect(client.send).toHaveBeenLastCalledWith(
				client.socket,
				HELLO,
				16,
				HELLO.length,
			);
			expect(client.written()).toBe(HELLO);
			expect(client.close).toHaveBeenCalledTimes(1);
		});

		test("writes in slices of at most ioChunkBytes", () => {
			const client = fakeClient([GET]);
			const body = string.rep("0123456789", 10);
			const { server } = fakeServer(
				[client],
				{ ioChunkBytes: 32 },
				(_req, res) => {
					res.status = 200;
					res.body = body;
					return res;
				},
			);
			server.pump();
			for (const call of client.send.mock.calls) {
				const [, , first, last] = call as unknown as [
					unknown,
					string,
					number,
					number,
				];
				expect(last - first + 1).toBeLessThanOrEqual(32);
			}
			expect(client.written()).toBe(
				`HTTP/1.1 200 OK\r\nServer: Lua HTTP/1.1\r\nConnection: close\r\n\r\n${body}`,
			);
		});

		test("the connection is closed only after the last byte is accepted", () => {
			const client = fakeClient([GET]);
			client.sendLimits(HELLO.length - 1);
			const { server } = fakeServer([client]);
			server.pump();
			expect(client.close).not.toHaveBeenCalled();
			expect(server.connectionCount()).toBe(1);
			server.pump();
			expect(client.written()).toBe(HELLO);
			expect(client.close).toHaveBeenCalledTimes(1);
			expect(server.connectionCount()).toBe(0);
		});
	});

	describe("independent connections", () => {
		test("an idle connection does not delay a complete request behind it", () => {
			const idle = fakeClient(["GET /idle HT"]);
			const healthy = ready("/healthy");
			const { server, requests } = fakeServer([idle, healthy]);

			server.pump();
			expect(requests.map((r) => r.path)).toEqual(["/healthy"]);
			expect(healthy.written()).toBe(HELLO);
			expect(healthy.close).toHaveBeenCalledTimes(1);
			expect(idle.close).not.toHaveBeenCalled();
			expect(server.connectionCount()).toBe(1);

			// The idle client finishes later and is served then.
			idle.arrive("TP/1.1\r\n\r\n");
			server.pump();
			expect(requests.map((r) => r.path)).toEqual(["/healthy", "/idle"]);
			expect(idle.written()).toBe(HELLO);
		});

		test("a stalled response consumer does not stop a healthy client from completing", () => {
			const stalled = ready("/stalled");
			stalled.sendLimits(0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
			const healthy = fakeClient();
			const { server } = fakeServer([stalled, healthy]);

			server.pump();
			expect(stalled.written()).toBe("");
			healthy.arrive(GET);
			server.pump();
			expect(healthy.written()).toBe(HELLO);
			expect(healthy.close).toHaveBeenCalledTimes(1);
			expect(stalled.close).not.toHaveBeenCalled();
		});

		test("several ready connections all progress in one pump when budget allows", () => {
			const clients = [ready("/1"), ready("/2"), ready("/3"), ready("/4")];
			const { server, requests } = fakeServer(clients);
			const stats = server.pump();
			expect(stats.accepted).toBe(4);
			expect(stats.dispatched).toBe(4);
			expect(stats.closed).toBe(4);
			expect(requests.map((r) => r.path)).toEqual(["/1", "/2", "/3", "/4"]);
			for (const client of clients) expect(client.written()).toBe(HELLO);
		});
	});

	describe("budgets and fairness", () => {
		test("stops accepting at maxAcceptsPerPump", () => {
			const clients = [ready(), ready(), ready(), ready(), ready()];
			const { server, listener } = fakeServer(clients, {
				maxAcceptsPerPump: 2,
			});
			expect(server.pump().accepted).toBe(2);
			expect(listener.accept).toHaveBeenCalledTimes(2);
			expect(server.pump().accepted).toBe(2);
			expect(server.pump().accepted).toBe(1);
		});

		test("stops accepting while maxConnections are open and resumes when one closes", () => {
			const a = fakeClient(["GET / HT"]);
			const b = fakeClient(["GET / HT"]);
			const c = ready("/c");
			const { server, listener, requests } = fakeServer([a, b, c], {
				maxConnections: 2,
			});
			server.pump();
			server.pump();
			expect(listener.accept).toHaveBeenCalledTimes(2); // the first pump, until full
			expect(server.connectionCount()).toBe(2);

			a.arrive("TP/1.1\r\n\r\n");
			server.pump(); // a completes and frees its slot
			expect(server.connectionCount()).toBe(1);
			server.pump(); // c is accepted and served
			expect(requests.map((r) => r.path)).toEqual(["/", "/c"]);
		});

		test("runs at most maxDispatchesPerPump handlers and serves the rest on later pumps, in rotation", () => {
			const clients = [ready("/1"), ready("/2"), ready("/3")];
			const { server, requests } = fakeServer(clients, {
				maxDispatchesPerPump: 1,
			});
			expect(server.pump().dispatched).toBe(1);
			expect(requests.map((r) => r.path)).toEqual(["/1"]);
			expect(server.pump().dispatched).toBe(1);
			expect(server.pump().dispatched).toBe(1);
			expect(requests.map((r) => r.path)).toEqual(["/1", "/2", "/3"]);
			for (const client of clients) expect(client.written()).toBe(HELLO);
		});

		test("visits connections round-robin when maxVisitsPerPump is smaller than the connection count", () => {
			const clients = [fakeClient(), fakeClient(), fakeClient()];
			const { server } = fakeServer(clients, { maxVisitsPerPump: 1 });
			const order: number[] = [];
			for (let pump = 0; pump < 6; pump++) {
				const before = clients.map((c) => c.receive.mock.calls.length);
				expect(server.pump().visited).toBe(1);
				clients.forEach((c, i) => {
					if (c.receive.mock.calls.length > before[i]) order.push(i + 1);
				});
			}
			expect(order).toEqual([1, 2, 3, 1, 2, 3]);
		});

		test("rotates the starting connection so a spent byte budget does not starve later connections", () => {
			const body = string.rep("b", 100);
			const head = `POST / HTTP/1.1\r\nContent-Length: ${body.length}\r\n\r\n`;
			const a = fakeClient([head + body]);
			const b = fakeClient([head + body]);
			const { server, requests } = fakeServer([a, b], {
				maxIoBytesPerPump: 60,
				ioChunkBytes: 60,
			});
			const readA: number[] = [];
			const readB: number[] = [];
			for (let pump = 0; pump < 4; pump++) {
				server.pump();
				readA.push(a.receive.mock.calls.length);
				readB.push(b.receive.mock.calls.length);
			}
			// Each pump's 60-byte budget goes to one connection, alternately.
			expect(readA).toEqual([1, 1, 2, 2]);
			expect(readB).toEqual([0, 1, 1, 2]);
			for (let pump = 0; pump < 10; pump++) server.pump();
			expect(requests).toHaveLength(2);
			expect(requests[0].body).toBe(body);
			expect(requests[1].body).toBe(body);
		});

		test("a slow connection is not starved by a steady stream of fast new clients", () => {
			// Reproduces the benchmark case: one client trickling its request while new clients keep arriving and
			// finishing within a pump. Once complete, the slow request must be dispatched within a pump or two.
			const slow = fakeClient(["GET /slow HTTP/1.1\r\n"]);
			const { server, listener, requests } = fakeServer(
				[slow, ready("/new"), ready("/new")],
				{
					maxDispatchesPerPump: 2,
				},
			);
			server.pump();
			slow.arrive("\r\n");
			for (let pump = 0; pump < 20; pump++) {
				listener.enqueue(ready("/new"), ready("/new"));
				server.pump();
				if (requests.some((r) => r.path === "/slow")) break;
			}
			const position = requests.findIndex((r) => r.path === "/slow");
			expect(position).toBeGreaterThanOrEqual(0);
			expect(position).toBeLessThanOrEqual(6);
			expect(slow.written()).toBe(HELLO);
		});

		test("a connection refused a dispatch goes first in the next pump", () => {
			const a = ready("/a");
			const b = fakeClient(["GET /b HT"]);
			const { server, listener, requests } = fakeServer([a, b], {
				maxDispatchesPerPump: 1,
			});
			server.pump(); // a dispatched; b partial
			b.arrive("TP/1.1\r\n\r\n");
			listener.enqueue(ready("/c"));
			server.pump(); // b completes first in order and is dispatched; c is refused
			listener.enqueue(ready("/d"), ready("/e"));
			server.pump(); // c, refused last time, goes before d and e
			server.pump();
			server.pump();
			expect(requests.map((r) => r.path)).toEqual([
				"/a",
				"/b",
				"/c",
				"/d",
				"/e",
			]);
		});

		test("caps the bytes moved for one connection in one visit", () => {
			const body = string.rep("z", 1000);
			const client = fakeClient([
				`POST / HTTP/1.1\r\nContent-Length: ${body.length}\r\n\r\n${body}`,
			]);
			const { server, requests } = fakeServer([client], {
				maxIoBytesPerVisit: 256,
				ioChunkBytes: 64,
			});
			const stats = server.pump();
			expect(stats.bytesRead).toBe(256);
			expect(requests).toHaveLength(0);
			for (let i = 0; i < 5; i++) server.pump();
			expect(requests[0].body).toBe(body);
		});

		test("does not start another handler once the pump's time budget is spent, and resumes next pump", () => {
			const clients = [ready("/1"), ready("/2"), ready("/3")];
			const fake = fakeServer(
				clients,
				{ maxPumpSeconds: 0.01 },
				(_req, res) => {
					fake.clock.advance(0.02); // a slow handler
					res.status = 200;
					res.body = "Hello";
					return res;
				},
			);
			const first = fake.server.pump();
			expect(first.dispatched).toBe(1);
			expect(first.visited).toBe(1);
			expect(fake.server.pump().dispatched).toBe(1);
			expect(fake.server.pump().dispatched).toBe(1);
			expect(fake.requests.map((r) => r.path)).toEqual(["/1", "/2", "/3"]);
		});

		test("still accepts, visits and dispatches once per pump when every clock reading spends the budget", () => {
			let time = 0;
			const clients = [ready("/1"), ready("/2")];
			const fake = fakeServer(clients, {
				maxPumpSeconds: 0.001,
				clock: () => {
					time += 1;
					return time;
				},
			});
			const stats = fake.server.pump();
			expect(stats.accepted).toBe(1);
			expect(stats.visited).toBe(1);
			expect(stats.dispatched).toBe(1);
			fake.server.pump();
			expect(fake.requests.map((r) => r.path)).toEqual(["/1", "/2"]);
		});
	});

	describe("buffer budget", () => {
		test("a body that does not fit in maxBufferedBytes gets 503 before it is read or dispatched", () => {
			const first = fakeClient([
				"POST /a HTTP/1.1\r\nContent-Length: 60\r\n\r\n",
			]);
			const second = fakeClient([
				"POST /b HTTP/1.1\r\nContent-Length: 50\r\n\r\n",
			]);
			const { server, requests } = fakeServer([first, second], {
				maxBufferedBytes: 100,
			});
			const stats = server.pump();
			expect(stats.bufferedBytes).toBe(60);
			expect(second.written()).toBe(errorBytes(503, "Service Unavailable"));
			expect(second.receive).toHaveBeenCalledTimes(1);
			expect(logWarn).toHaveBeenCalledWith(
				stringContaining(
					"Connection #2: rejected with 503 while reading the request head after 40 bytes: a 50-byte body does not fit",
				),
			);

			first.arrive(string.rep("a", 60));
			expect(server.pump().bufferedBytes).toBe(0);
			expect(requests.map((r) => r.path)).toEqual(["/a"]);
		});

		test("pending responses count against the budget: new bodies get 503, but requests are never held back", () => {
			const stalled = ready("/big");
			stalled.sendLimits(0, 0, 0);
			const { server, listener, requests } = fakeServer(
				[stalled],
				{ maxBufferedBytes: 100 },
				(req, res) => {
					res.status = 200;
					res.body = req.path === "/big" ? string.rep("x", 150) : "Hello";
					return res;
				},
			);
			expect(server.pump().bufferedBytes).toBeGreaterThan(150);

			const get = ready("/next");
			const post = fakeClient([
				"POST /upload HTTP/1.1\r\nContent-Length: 5\r\n\r\nhello",
			]);
			listener.enqueue(get, post);
			server.pump();
			expect(requests.map((r) => r.path)).toEqual(["/big", "/next"]);
			expect(get.written()).toBe(HELLO);
			expect(post.written()).toBe(errorBytes(503, "Service Unavailable"));
		});

		test("releases every reservation when connections close", () => {
			const a = fakeClient([
				"POST / HTTP/1.1\r\nContent-Length: 10\r\n\r\nabc",
			]);
			const b = ready();
			b.sendLimits(0);
			const { server } = fakeServer([a, b]);
			expect(server.pump().bufferedBytes).toBe(10 + HELLO.length);
			server.close();
			expect(server.pump().bufferedBytes).toBe(0);
		});
	});

	describe("deadlines", () => {
		test("a request not complete within requestTimeout gets 408, without dispatch", () => {
			const client = fakeClient([
				"POST / HTTP/1.1\r\nContent-Length: 10\r\n\r\nabc",
			]);
			const { server, clock, requests } = fakeServer([client], {
				requestTimeout: 10,
			});
			server.pump();
			clock.advance(9);
			server.pump();
			expect(client.send).not.toHaveBeenCalled();
			clock.advance(1);
			server.pump();
			expect(requests).toHaveLength(0);
			expect(client.written()).toBe(errorBytes(408, "Request Timeout"));
			expect(client.close).toHaveBeenCalledTimes(1);
			expect(logWarn).toHaveBeenCalledWith(
				stringContaining(
					"Connection #1: rejected with 408 while reading the request body after 42 bytes: request deadline expired",
				),
			);
		});

		test("trickling bytes does not extend the absolute request deadline", () => {
			const client = fakeClient();
			const { server, clock, requests } = fakeServer([client], {
				requestTimeout: 5,
			});
			const raw = "GET /slow HTTP/1.1\r\nX: 0123456789\r\n\r\n";
			for (let i = 1; i <= 6; i++) {
				client.arrive(string.sub(raw, i, i));
				server.pump();
				clock.advance(1);
			}
			expect(requests).toHaveLength(0);
			expect(client.written()).toBe(errorBytes(408, "Request Timeout"));
		});

		test("the optional idle timeout expires a silent connection and is reset by each received byte", () => {
			const client = fakeClient(["G"]);
			const { server, clock } = fakeServer([client], {
				idleTimeout: 2,
				requestTimeout: 100,
			});
			server.pump();
			clock.advance(1.5);
			client.arrive("E");
			server.pump();
			clock.advance(1.5);
			server.pump();
			expect(client.send).not.toHaveBeenCalled();
			clock.advance(0.5);
			server.pump();
			expect(client.written()).toBe(errorBytes(408, "Request Timeout"));
		});

		test("a response not fully sent within responseTimeout is abandoned", () => {
			const stalled = ready();
			stalled.sendLimits(3);
			for (let i = 0; i < 50; i++) stalled.sendLimits(0);
			const { server, clock } = fakeServer([stalled], { responseTimeout: 30 });
			server.pump();
			clock.advance(29);
			server.pump();
			expect(stalled.close).not.toHaveBeenCalled();
			clock.advance(1);
			server.pump();
			expect(stalled.close).toHaveBeenCalledTimes(1);
			expect(stalled.written()).toBe(string.sub(HELLO, 1, 3));
			expect(server.connectionCount()).toBe(0);
			expect(logWarn).toHaveBeenCalledWith(
				stringContaining(
					"Connection #1: closed while writing the response: response deadline expired",
				),
			);
		});

		test("a connection that never sends a byte still gets 408, logged at debug rather than warn", () => {
			const silent = fakeClient();
			const { server, clock } = fakeServer([silent], { requestTimeout: 10 });
			server.pump();
			clock.advance(10);
			server.pump();
			expect(silent.written()).toBe(errorBytes(408, "Request Timeout"));
			expect(silent.close).toHaveBeenCalledTimes(1);
			expect(logWarn).not.toHaveBeenCalled();
		});

		test("the 408 response itself uses the resumable write path", () => {
			const client = fakeClient(["GET / HT"]);
			client.sendLimits(4, 0);
			const { server, clock } = fakeServer([client], { requestTimeout: 1 });
			server.pump();
			clock.advance(1);
			server.pump();
			server.pump();
			server.pump();
			expect(client.written()).toBe(errorBytes(408, "Request Timeout"));
			expect(client.close).toHaveBeenCalledTimes(1);
		});

		test("a clock that jumps backwards neither expires nor resets deadlines", () => {
			const client = fakeClient(["GET / HT"]);
			const { server, clock } = fakeServer([client], { requestTimeout: 10 });
			server.pump(); // accepted at 1000
			clock.advance(8); // 1008
			server.pump();
			clock.set(500); // wall clock stepped back
			server.pump();
			expect(client.send).not.toHaveBeenCalled();
			clock.set(1009); // back past the last reading
			server.pump();
			expect(client.send).not.toHaveBeenCalled();
			clock.set(1010);
			server.pump();
			expect(client.written()).toBe(errorBytes(408, "Request Timeout"));
		});
	});
});
