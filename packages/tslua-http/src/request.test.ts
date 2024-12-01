import { describe, expect, it } from "vitest";
import { type HttpRequest, readRequestHead } from "./request";

describe("readRequestHead", () => {
	it("should correctly parse a simple GET request", () => {
		const rawRequest = "GET /home HTTP/1.1\r\nHost: example.com\r\n\r\n";
		const expected: HttpRequest = {
			method: "GET",
			originalUrl: "/home",
			protocol: "HTTP/1.1",
			headers: { Host: "example.com" },
			path: "/home",
			parameters: {},
		};

		expect(readRequestHead(rawRequest)).toEqual(expected);
	});

	it("should correctly parse a POST request with body", () => {
		const rawRequest =
			'POST /submit HTTP/1.1\r\nHost: example.com\r\nContent-Type: application/json\r\n\r\n{"hello":"world"}';
		const expected: HttpRequest = {
			method: "POST",
			originalUrl: "/submit",
			protocol: "HTTP/1.1",
			headers: { Host: "example.com", "Content-Type": "application/json" },
			path: "/submit",
			parameters: {},
		};

		expect(readRequestHead(rawRequest)).toEqual(expected);
	});

	it("should extract query parameters from the URL", () => {
		const rawRequest =
			"GET /search?q=test HTTP/1.1\r\nHost: example.com\r\n\r\n";
		const expected: HttpRequest = {
			method: "GET",
			originalUrl: "/search?q=test",
			protocol: "HTTP/1.1",
			headers: { Host: "example.com" },
			path: "/search",
			parameters: { q: "test" },
		};

		expect(readRequestHead(rawRequest)).toEqual(expected);
	});
});
