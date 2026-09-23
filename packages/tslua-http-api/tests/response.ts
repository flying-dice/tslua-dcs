import type { HttpResponse } from "@flying-dice/tslua-http";
import { HttpStatus } from "@flying-dice/tslua-http";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
} from "@flying-dice/tslua-luatest";
import { AppHttpResponse, Application } from "../src";
import { makeResponse } from "./helpers";

describe("AppHttpResponse", () => {
	let app: Application;
	let raw: HttpResponse;
	let res: AppHttpResponse;

	beforeAll(() => {
		app = new Application("127.0.0.1", 0);
	});

	afterAll(() => app.close());

	beforeEach(() => {
		app.errors = [];
		raw = makeResponse();
		res = new AppHttpResponse(app, raw);
	});

	test("exposes the underlying HttpResponse", () => {
		expect(res.res).toBe(raw);
	});

	test("status sets the status code and returns the response for chaining", () => {
		expect(res.status(HttpStatus.CREATED)).toBe(res);
		expect(raw.status).toBe(201);
	});

	test("send sets a text/plain body and returns the response for chaining", () => {
		expect(res.send("Hello World!")).toBe(res);
		expect(raw.body).toBe("Hello World!");
		expect(raw.headers["Content-Type"]).toBe("text/plain");
	});

	test("json encodes the value and sets application/json", () => {
		expect(res.json({ status: "OK" })).toBe(res);
		expect(raw.body).toBe('{"status":"OK"}');
		expect(raw.headers["Content-Type"]).toBe("application/json");
	});

	test("json encodes arrays, strings and booleans", () => {
		res.json(["a", "b"]);
		expect(raw.body).toBe('["a","b"]');
		res.json("text");
		expect(raw.body).toBe('"text"');
		res.json(true);
		expect(raw.body).toBe("true");
	});

	test("json records the error on the application and rethrows when encoding fails", () => {
		const value = { callback: () => "not serialisable" };
		expect(() => res.json(value)).toThrow();
		expect(app.errors).toHaveLength(1);
		expect(app.errors[0].value).toBe(value);
		expect(app.errors[0].error).toBeDefined();
	});

	test("the last content writer wins", () => {
		res.json({ a: "b" }).send("plain");
		expect(raw.body).toBe("plain");
		expect(raw.headers["Content-Type"]).toBe("text/plain");
	});

	test("setHeader sets a header verbatim and returns the response for chaining", () => {
		expect(res.setHeader("X-Request-Id", "123")).toBe(res);
		expect(raw.headers).toEqual({ "X-Request-Id": "123" });
	});

	test("setHeader overrides the content type set by send", () => {
		res.send("<p>hi</p>").setHeader("Content-Type", "text/html");
		expect(raw.headers["Content-Type"]).toBe("text/html");
	});

	test("calls chain", () => {
		res.status(HttpStatus.ACCEPTED).setHeader("X-A", "1").send("done");
		expect(raw).toEqual({
			status: 202,
			headers: { "X-A": "1", "Content-Type": "text/plain" },
			body: "done",
		});
	});
});
