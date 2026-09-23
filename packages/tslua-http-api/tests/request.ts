import { Logger } from "@flying-dice/tslua-common";
import { HttpStatus } from "@flying-dice/tslua-http";
import {
	afterAll,
	afterEach,
	anything,
	beforeAll,
	describe,
	expect,
	restoreAllMocks,
	spyOn,
	stringContaining,
	test,
} from "@flying-dice/tslua-luatest";
import { AppHttpRequest, Application, HttpError } from "../src";
import { type RequestInit, makeRequest } from "./helpers";

describe("AppHttpRequest", () => {
	let app: Application;

	beforeAll(() => {
		app = new Application("127.0.0.1", 0);
	});

	afterAll(() => app.close());

	const create = (
		url: string,
		init: RequestInit = {},
		params: Record<string, string> = {},
		method = "GET",
	) => new AppHttpRequest(app, makeRequest(method, url, init), params);

	describe("request line accessors", () => {
		test("exposes the method, path, original URL and protocol", () => {
			const req = create("/api/users?page=2", {}, {}, "POST");
			expect(req.method).toBe("POST");
			expect(req.path).toBe("/api/users");
			expect(req.originalUrl).toBe("/api/users?page=2");
			expect(req.protocol).toBe("HTTP/1.1");
		});

		test("exposes the underlying HttpRequest", () => {
			const raw = makeRequest("GET", "/x");
			expect(new AppHttpRequest(app, raw, {}).req).toBe(raw);
		});
	});

	describe("headers", () => {
		test("getHeaderValue looks names up case-insensitively", () => {
			const req = create("/", { headers: { Authorization: "Bearer 123" } });
			expect(req.getHeaderValue("Authorization")).toBe("Bearer 123");
			expect(req.getHeaderValue("authorization")).toBe("Bearer 123");
			expect(req.getHeaderValue("AUTHORIZATION")).toBe("Bearer 123");
		});

		test("getHeaderValue returns undefined for a missing header", () => {
			expect(create("/").getHeaderValue("X-Missing")).toBeUndefined();
		});

		test("getHeaderValueOrThrow returns a present header", () => {
			const req = create("/", { headers: { "X-Token": "abc" } });
			expect(req.getHeaderValueOrThrow("x-token")).toBe("abc");
		});

		test("getHeaderValueOrThrow throws the default error for a missing header", () => {
			expect(() => create("/").getHeaderValueOrThrow("X-Missing")).toThrow({
				exact: "Header is not defined",
			});
		});

		test("getHeaderValueOrThrow throws the given error", () => {
			const error = new HttpError(HttpStatus.UNAUTHORIZED, "No token");
			let caught: unknown;
			try {
				create("/").getHeaderValueOrThrow("X-Missing", error);
			} catch (e) {
				caught = e;
			}
			expect(caught).toBe(error);
		});

		test("headers (deprecated) returns the lower-cased header record", () => {
			const req = create("/", { headers: { "X-A": "1" } });
			expect(req.headers).toEqual({ "x-a": "1" });
		});
	});

	describe("query parameters", () => {
		test("getQueryParameterValue returns a parameter", () => {
			expect(create("/?page=2&sort=asc").getQueryParameterValue("sort")).toBe(
				"asc",
			);
		});

		test("getQueryParameterValue returns undefined for a missing parameter", () => {
			expect(create("/").getQueryParameterValue("page")).toBeUndefined();
		});

		test("getQueryParameterValueOrThrow returns a parameter", () => {
			expect(create("/?page=2").getQueryParameterValueOrThrow("page")).toBe(
				"2",
			);
		});

		test("getQueryParameterValueOrThrow throws the default error", () => {
			expect(() => create("/").getQueryParameterValueOrThrow("page")).toThrow({
				exact: "Query parameter is not defined",
			});
		});

		test("getQueryParameterValueOrThrow throws the given error", () => {
			expect(() =>
				create("/").getQueryParameterValueOrThrow(
					"page",
					new Error("need page"),
				),
			).toThrow({ exact: "need page" });
		});

		test("query (deprecated) returns the parameter record", () => {
			expect(create("/?a=1&b=2").query).toEqual({ a: "1", b: "2" });
		});
	});

	describe("path parameters", () => {
		test("getPathParameterValue returns a parameter", () => {
			expect(create("/", {}, { id: "7" }).getPathParameterValue("id")).toBe(
				"7",
			);
		});

		test("getPathParameterValue returns undefined for a missing parameter", () => {
			expect(create("/").getPathParameterValue("id")).toBeUndefined();
		});

		test("getPathParameterValueOrThrow returns a parameter", () => {
			expect(
				create("/", {}, { id: "7" }).getPathParameterValueOrThrow("id"),
			).toBe("7");
		});

		test("getPathParameterValueOrThrow throws the default error", () => {
			expect(() => create("/").getPathParameterValueOrThrow("id")).toThrow({
				exact: "Path parameter is not defined",
			});
		});

		test("getPathParameterValueOrThrow throws the given error", () => {
			expect(() =>
				create("/").getPathParameterValueOrThrow("id", new Error("need id")),
			).toThrow({ exact: "need id" });
		});

		test("params (deprecated) returns the parameter record", () => {
			expect(create("/", {}, { a: "1" }).params).toEqual({ a: "1" });
		});
	});

	describe("body", () => {
		afterEach(() => restoreAllMocks());

		test("is undefined when the request has no body", () => {
			const req = create("/");
			expect(req.body).toBeUndefined();
			expect(req.getBody()).toBeUndefined();
		});

		test("an empty body string is returned as is (Lua strings are truthy)", () => {
			expect(create("/", { body: "" }).getBody()).toBe("");
		});

		test("is the raw string for non-JSON content types", () => {
			const req = create("/", {
				headers: { "Content-Type": "text/plain" },
				body: '{"a":"b"}',
			});
			expect(req.getBody()).toBe('{"a":"b"}');
		});

		test("is the raw string when there is no content type", () => {
			expect(create("/", { body: "Example Body" }).getBody()).toBe(
				"Example Body",
			);
		});

		test("is decoded when the content type is application/json", () => {
			const req = create("/", {
				headers: { "Content-Type": "application/json" },
				body: '{"name":"John","tags":["a","b"],"nested":{"ok":true}}',
			});
			expect(req.getBody()).toEqual({
				name: "John",
				tags: ["a", "b"],
				nested: { ok: true },
			});
			expect(req.body).toEqual(req.getBody());
		});

		test("is not decoded for application/json with parameters (exact match only)", () => {
			const req = create("/", {
				headers: { "Content-Type": "application/json; charset=utf-8" },
				body: '{"a":"b"}',
			});
			expect(req.getBody()).toBe('{"a":"b"}');
		});

		test("throws HttpError 400 and logs when the JSON is invalid", () => {
			const logged = spyOn(Logger.transports, "error");
			const req = create("/", {
				headers: { "Content-Type": "application/json" },
				body: "{not json",
			});
			let caught: unknown;
			try {
				req.getBody();
			} catch (e) {
				caught = e;
			}
			logged.mockRestore();
			expect(caught).toBeInstanceOf(HttpError);
			expect((caught as HttpError).status).toBe(HttpStatus.BAD_REQUEST);
			expect((caught as HttpError).message).toBe("Invalid JSON");
			// Logger transports are called as methods: the receiver comes first.
			expect(logged).toHaveBeenCalledWith(
				anything(),
				stringContaining("[ERROR] [AppHttpRequest] - Error parsing JSON"),
			);
		});

		test("getBodyOrThrow returns a present body", () => {
			expect(create("/", { body: "x" }).getBodyOrThrow()).toBe("x");
		});

		test("getBodyOrThrow throws the default error without a body", () => {
			expect(() => create("/").getBodyOrThrow()).toThrow({
				exact: "Body is not defined",
			});
		});

		test("getBodyOrThrow throws the given error without a body", () => {
			expect(() => create("/").getBodyOrThrow(new Error("need body"))).toThrow({
				exact: "need body",
			});
		});
	});
});
