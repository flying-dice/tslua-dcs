import { describe, expect, test } from "@flying-dice/tslua-luatest";
import * as api from "../src";
import { CRLF, EMPTY_LINE, HttpStatus, StatusText } from "../src/constants";

describe("constants", () => {
	test("CRLF is carriage return + line feed and EMPTY_LINE is empty", () => {
		expect(CRLF).toBe("\r\n");
		expect(EMPTY_LINE).toBe("");
	});

	test("common statuses have their numeric codes", () => {
		expect(HttpStatus.CONTINUE).toBe(100);
		expect(HttpStatus.OK).toBe(200);
		expect(HttpStatus.NO_CONTENT).toBe(204);
		expect(HttpStatus.MOVED_PERMANENTLY).toBe(301);
		expect(HttpStatus.BAD_REQUEST).toBe(400);
		expect(HttpStatus.NOT_FOUND).toBe(404);
		expect(HttpStatus.IM_A_TEAPOT).toBe(418);
		expect(HttpStatus.INTERNAL_SERVER_ERROR).toBe(500);
		expect(HttpStatus.NETWORK_AUTHENTICATION_REQUIRED).toBe(511);
	});

	test("HttpStatus has a reverse mapping from code to name", () => {
		expect(HttpStatus[200]).toBe("OK");
		expect(HttpStatus[404]).toBe("NOT_FOUND");
	});

	test("every HttpStatus code has a non-empty StatusText", () => {
		const missing: string[] = [];
		let codes = 0;
		for (const [name, code] of pairs(HttpStatus)) {
			if (typeof code !== "number") continue;
			codes++;
			const text = StatusText[code as HttpStatus];
			if (typeof text !== "string" || text === "") missing.push(`${name}`);
		}
		expect(codes).toBe(58);
		expect(missing).toEqual([]);
	});

	test("StatusText has no entries for codes outside HttpStatus", () => {
		const extra: number[] = [];
		for (const [code] of pairs(StatusText)) {
			if (HttpStatus[code as HttpStatus] === undefined) extra.push(code);
		}
		expect(extra).toEqual([]);
	});

	test("StatusText uses the standard reason phrases", () => {
		expect(StatusText[HttpStatus.OK]).toBe("OK");
		expect(StatusText[HttpStatus.CREATED]).toBe("Created");
		expect(StatusText[HttpStatus.NOT_FOUND]).toBe("Not Found");
		expect(StatusText[HttpStatus.REQUEST_TOO_LONG]).toBe("Payload Too Large");
		expect(StatusText[HttpStatus.IM_A_TEAPOT]).toBe("I'm a Teapot");
		expect(StatusText[HttpStatus.INTERNAL_SERVER_ERROR]).toBe(
			"Internal Server Error",
		);
	});
});

describe("package entry point", () => {
	test("exports the server, the URI decoder and the status tables", () => {
		expect(api.HttpServer).toBeDefined();
		expect(api.decodeUriComponent).toBeTypeOf("function");
		expect(api.HttpStatus).toBe(HttpStatus);
		expect(api.StatusText).toBe(StatusText);
	});
});
