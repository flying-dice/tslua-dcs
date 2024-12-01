import { describe, expect, it } from "vitest";
import { HttpStatus } from "./constants";
import { type HttpResponse, assembleResponseString } from "./response";

describe("assembleResponseString", () => {
	it("should assemble a response string with body", () => {
		const response: HttpResponse = {
			status: HttpStatus.OK,
			body: "Hello, world!",
			headers: {
				"Content-Type": "text/plain",
			},
		};

		expect(assembleResponseString(response)).toMatchInlineSnapshot(`
"HTTP/1.1 200 OK
Server: Lua HTTP/1.1
Content-Type: text/plain

Hello, world!"
`);
	});

	it("should assemble a response string without body", () => {
		const response: HttpResponse = {
			status: HttpStatus.NOT_FOUND,
			headers: {
				"Content-Type": "text/plain",
			},
		};

		expect(assembleResponseString(response)).toMatchInlineSnapshot(`
"HTTP/1.1 404 Not Found
Server: Lua HTTP/1.1
Content-Type: text/plain

"
`);
	});

	it("should handle unknown status codes", () => {
		const response: HttpResponse = {
			// @ts-ignore
			status: 999,
			headers: {
				"Content-Type": "text/plain",
			},
		};

		expect(assembleResponseString(response)).toMatchSnapshot(`
"HTTP/1.1 999 Unknown Status
Server: Lua HTTP/1.1
Content-Type: text/plain

"
`);
	});
});
