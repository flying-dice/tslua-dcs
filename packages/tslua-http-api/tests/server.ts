import type { HttpStatus } from "@flying-dice/tslua-http";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	test,
} from "@flying-dice/tslua-luatest";
import { Application } from "../src";
import { portOf, rawExchange, requestText, roundTrip } from "./helpers";

/** End-to-end behaviour that only shows up on a real socket: the wire format and connection handling. */
describe("Application over a loopback socket", () => {
	let app: Application;

	beforeEach(() => {
		app = new Application("127.0.0.1", 0);
		app.get("/hello", (_req, res) => {
			res.send("Hello World!");
		});
	});

	afterEach(() => app.close());

	test("binds to a free port when given port 0", () => {
		expect(portOf(app)).toBeGreaterThan(0);
	});

	test("writes a complete HTTP/1.1 response", () => {
		expect(rawExchange(app, requestText("GET", "/hello"))).toBe(
			"HTTP/1.1 200 OK\r\nServer: Lua HTTP/1.1\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\nHello World!",
		);
	});

	test("writes an empty 404 when nothing matches", () => {
		expect(rawExchange(app, requestText("GET", "/missing"))).toBe(
			"HTTP/1.1 404 Not Found\r\nServer: Lua HTTP/1.1\r\nConnection: close\r\n\r\n",
		);
	});

	test("reads a request body using Content-Length", () => {
		app.post("/echo", (req, res) => {
			res.send(`[${req.getBody()}]`);
		});
		const res = roundTrip(app, "POST", "/echo", {
			body: "line one\r\nline two",
		});
		expect(res.body).toBe("[line one\r\nline two]");
	});

	test("request header names reach handlers lower-cased", () => {
		app.get("/headers", (req, res) => {
			res.send(req.headers["x-mixed-case"] ?? "missing");
		});
		const res = roundTrip(app, "GET", "/headers", {
			headers: { "X-Mixed-Case": "Value" },
		});
		expect(res.body).toBe("Value");
	});

	test("serves several requests in a row", () => {
		for (const i of [1, 2, 3]) {
			const res = roundTrip(app, "GET", "/hello");
			expect(res.status, `request ${i}`).toBe(200);
			expect(res.body, `request ${i}`).toBe("Hello World!");
		}
	});

	test("pump and acceptNextClient return immediately when no client is waiting", () => {
		expect(app.pump().visited).toBe(0);
		app.acceptNextClient();
		expect(roundTrip(app, "GET", "/hello").status).toBe(200);
	});

	test("serves an idle connection's neighbour while the idle one stays open", () => {
		const socket = require("socket") as {
			connect: (
				this: void,
				address: string,
				port: number,
			) => LuaMultiReturn<[{ send(d: string): void; close(): void }, unknown]>;
		};
		const [idle] = socket.connect("127.0.0.1", portOf(app));
		idle.send("GET /hello HTTP/1.1\r\nHost: x");
		app.pump();
		expect(roundTrip(app, "GET", "/hello").body).toBe("Hello World!");
		expect(app.connectionCount()).toBe(1);
		idle.close();
	});

	test("forwards server options to HttpServer", () => {
		const limited = new Application("127.0.0.1", 0, { maxRequestBodyBytes: 4 });
		limited.post("/echo", (req, res) => {
			res.send(`${req.getBody()}`);
		});
		try {
			expect(roundTrip(limited, "POST", "/echo", { body: "four" }).body).toBe(
				"four",
			);
			expect(
				roundTrip(limited, "POST", "/echo", { body: "five!" }).status,
			).toBe(413);
		} finally {
			limited.close();
		}
	});

	test("unknown status codes are written as Unknown Status", () => {
		app.get("/odd", (_req, res) => {
			res.status(299 as HttpStatus).send("odd");
		});
		expect(rawExchange(app, requestText("GET", "/odd"))).toMatch(
			"^HTTP/1%.1 299 Unknown Status\r\n",
		);
	});

	test("a failing error handler gets a bare 500 from the server, which keeps serving", () => {
		app.useGlobalErrorHandler(() => {
			throw new Error("error handler failed");
		});
		app.get("/throws", () => {
			throw new Error("kaboom");
		});
		expect(rawExchange(app, requestText("GET", "/throws"))).toBe(
			"HTTP/1.1 500 Internal Server Error\r\nServer: Lua HTTP/1.1\r\nConnection: close\r\n\r\n",
		);
		expect(roundTrip(app, "GET", "/hello").body).toBe("Hello World!");
	});

	test("close() stops accepting connections", () => {
		const port = portOf(app);
		app.close();
		const socket = require("socket") as {
			connect: (
				this: void,
				address: string,
				port: number,
			) => LuaMultiReturn<[unknown, string | undefined]>;
		};
		const [client, err] = socket.connect("127.0.0.1", port);
		expect(client).toBeUndefined();
		expect(err).toBeDefined();
		app = new Application("127.0.0.1", 0); // afterEach closes it
	});
});
