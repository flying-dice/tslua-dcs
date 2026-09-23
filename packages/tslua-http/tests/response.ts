import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { HttpStatus } from "../src/constants";
import { assembleResponseString, type HttpResponse } from "../src/response";

describe("assembleResponseString", () => {
	test("assembles a response with a body", () => {
		const response: HttpResponse = {
			status: HttpStatus.OK,
			body: "Hello, world!",
			headers: { "Content-Type": "text/plain" },
		};
		expect(assembleResponseString(response)).toBe(
			"HTTP/1.1 200 OK\r\nServer: Lua HTTP/1.1\r\nContent-Type: text/plain\r\n\r\nHello, world!",
		);
	});

	test("assembles a response without a body, ending with a blank line", () => {
		const response: HttpResponse = {
			status: HttpStatus.NOT_FOUND,
			headers: { "Content-Type": "text/plain" },
		};
		expect(assembleResponseString(response)).toBe(
			"HTTP/1.1 404 Not Found\r\nServer: Lua HTTP/1.1\r\nContent-Type: text/plain\r\n\r\n",
		);
	});

	test("uses 'Unknown Status' for a code without a reason phrase", () => {
		const response = {
			status: 999,
			headers: { "Content-Type": "text/plain" },
		} as unknown as HttpResponse;
		expect(assembleResponseString(response)).toBe(
			"HTTP/1.1 999 Unknown Status\r\nServer: Lua HTTP/1.1\r\nContent-Type: text/plain\r\n\r\n",
		);
	});

	test("always sends the Server header, even with no other headers", () => {
		expect(
			assembleResponseString({ status: HttpStatus.NO_CONTENT, headers: {} }),
		).toBe("HTTP/1.1 204 No Content\r\nServer: Lua HTTP/1.1\r\n\r\n");
	});

	test("an empty body is serialised like a missing body", () => {
		expect(
			assembleResponseString({ status: HttpStatus.OK, headers: {}, body: "" }),
		).toBe(assembleResponseString({ status: HttpStatus.OK, headers: {} }));
	});

	test("writes every header once, after the Server header", () => {
		const raw = assembleResponseString({
			status: HttpStatus.CREATED,
			headers: {
				"Content-Type": "application/json",
				Location: "/units/1",
				"X-A": "1",
			},
			body: "{}",
		});
		const [head, body] = raw.split("\r\n\r\n");
		const lines = head.split("\r\n");
		expect(lines[0]).toBe("HTTP/1.1 201 Created");
		expect(lines[1]).toBe("Server: Lua HTTP/1.1");
		expect(lines).toHaveLength(5);
		expect(lines).toContain("Content-Type: application/json");
		expect(lines).toContain("Location: /units/1");
		expect(lines).toContain("X-A: 1");
		expect(body).toBe("{}");
	});

	test("does not add a Content-Length header", () => {
		expect(
			assembleResponseString({
				status: HttpStatus.OK,
				headers: {},
				body: "abc",
			}),
		).not.toContain("Content-Length");
	});

	test("keeps a caller-supplied Content-Length header", () => {
		expect(
			assembleResponseString({
				status: HttpStatus.OK,
				headers: { "Content-Length": "3" },
				body: "abc",
			}),
		).toBe(
			"HTTP/1.1 200 OK\r\nServer: Lua HTTP/1.1\r\nContent-Length: 3\r\n\r\nabc",
		);
	});

	test("passes the body through byte for byte", () => {
		const body = `line1\r\n\r\nline2\0${string.char(255)}`;
		const raw = assembleResponseString({
			status: HttpStatus.OK,
			headers: {},
			body,
		});
		expect(raw).toBe(`HTTP/1.1 200 OK\r\nServer: Lua HTTP/1.1\r\n\r\n${body}`);
	});

	test("uses the StatusText reason phrase for other codes", () => {
		expect(
			assembleResponseString({
				status: HttpStatus.MOVED_TEMPORARILY,
				headers: {},
			}),
		).toMatch('^HTTP/1%.1 302 Found %(Previously "Moved Temporarily"%)\r\n');
		expect(
			assembleResponseString({
				status: HttpStatus.INTERNAL_SERVER_ERROR,
				headers: {},
			}),
		).toMatch("^HTTP/1%.1 500 Internal Server Error\r\n");
	});
});
