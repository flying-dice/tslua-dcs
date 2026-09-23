import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { type HttpRequest, readRequestHead } from "../src/request";

describe("readRequestHead", () => {
	test("parses a simple GET request", () => {
		const expected: HttpRequest = {
			method: "GET",
			originalUrl: "/home",
			protocol: "HTTP/1.1",
			headers: { host: "example.com" },
			path: "/home",
			parameters: {},
		};
		expect(
			readRequestHead("GET /home HTTP/1.1\r\nHost: example.com\r\n\r\n"),
		).toEqual(expected);
	});

	test("parses a POST head and ignores the body after the blank line", () => {
		const expected: HttpRequest = {
			method: "POST",
			originalUrl: "/submit",
			protocol: "HTTP/1.1",
			headers: { host: "example.com", "content-type": "application/json" },
			path: "/submit",
			parameters: {},
		};
		expect(
			readRequestHead(
				'POST /submit HTTP/1.1\r\nHost: example.com\r\nContent-Type: application/json\r\n\r\n{"hello":"world"}',
			),
		).toEqual(expected);
	});

	test("extracts query parameters and strips them from the path", () => {
		const expected: HttpRequest = {
			method: "GET",
			originalUrl: "/search?q=test",
			protocol: "HTTP/1.1",
			headers: { host: "example.com" },
			path: "/search",
			parameters: { q: "test" },
		};
		expect(
			readRequestHead(
				"GET /search?q=test HTTP/1.1\r\nHost: example.com\r\n\r\n",
			),
		).toEqual(expected);
	});

	test("never sets a body", () => {
		const request = readRequestHead(
			"POST / HTTP/1.1\r\nContent-Length: 2\r\n\r\nhi",
		);
		expect(request.body).toBeUndefined();
	});

	test("parses a request line without headers", () => {
		expect(readRequestHead("DELETE /units/7 HTTP/1.0")).toEqual({
			method: "DELETE",
			originalUrl: "/units/7",
			protocol: "HTTP/1.0",
			headers: {},
			path: "/units/7",
			parameters: {},
		});
	});

	test("keeps the method's case", () => {
		expect(readRequestHead("patch / HTTP/1.1\r\n\r\n").method).toBe("patch");
	});

	test("lower-cases header names and trims names and values", () => {
		const request = readRequestHead(
			"GET / HTTP/1.1\r\nX-Custom-Header:   padded value  \r\nACCEPT :text/plain\r\n\r\n",
		);
		expect(request.headers).toEqual({
			"x-custom-header": "padded value",
			accept: "text/plain",
		});
	});

	test("keeps colons inside header values (host with port, URLs, times)", () => {
		const request = readRequestHead(
			"GET / HTTP/1.1\r\nHost: localhost:8080\r\nReferer: http://example.com:81/a\r\nX-Time: 12:34:56\r\n\r\n",
		);
		expect(request.headers).toEqual({
			host: "localhost:8080",
			referer: "http://example.com:81/a",
			"x-time": "12:34:56",
		});
	});

	test("accepts an empty header value", () => {
		expect(
			readRequestHead("GET / HTTP/1.1\r\nX-Empty:\r\n\r\n").headers,
		).toEqual({ "x-empty": "" });
	});

	test("a repeated header keeps the last value", () => {
		expect(
			readRequestHead("GET / HTTP/1.1\r\nAccept: a\r\naccept: b\r\n\r\n")
				.headers,
		).toEqual({ accept: "b" });
	});

	test("stops reading headers at the first blank line", () => {
		const request = readRequestHead(
			"GET / HTTP/1.1\r\nA: 1\r\n\r\nB: 2\r\nnot a header",
		);
		expect(request.headers).toEqual({ a: "1" });
	});

	test("rejects a header line without a colon", () => {
		expect(() =>
			readRequestHead("GET / HTTP/1.1\r\nthis is not a header\r\n\r\n"),
		).toThrow("Malformed header line: this is not a header");
	});

	test("a request line without a protocol leaves the protocol undefined", () => {
		const request = readRequestHead("GET /\r\n\r\n");
		expect(request.method).toBe("GET");
		expect(request.path).toBe("/");
		expect(request.protocol).toBeUndefined();
	});

	test("rejects an empty request line", () => {
		expect(() => readRequestHead("")).toThrow();
		expect(() => readRequestHead("\r\n\r\n")).toThrow();
	});

	test("rejects a request line without a target", () => {
		expect(() => readRequestHead("GET\r\n\r\n")).toThrow();
	});

	test("does not decode the target", () => {
		const request = readRequestHead("GET /a%20b?x=%41 HTTP/1.1\r\n\r\n");
		expect(request.path).toBe("/a%20b");
		expect(request.originalUrl).toBe("/a%20b?x=%41");
		expect(request.parameters).toEqual({ x: "%41" });
	});

	test("accepts an absolute-form target", () => {
		const request = readRequestHead(
			"GET http://example.com/x?y=1 HTTP/1.1\r\n\r\n",
		);
		expect(request.path).toBe("http://example.com/x");
		expect(request.parameters).toEqual({ y: "1" });
	});
});
