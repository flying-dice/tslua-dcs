import { HttpStatus } from "@flying-dice/tslua-http";
import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { HttpError } from "../src";

describe("HttpError", () => {
	test("carries a status and a message", () => {
		const error = new HttpError(HttpStatus.BAD_REQUEST, "Invalid JSON");
		expect(error.status).toBe(400);
		expect(error.message).toBe("Invalid JSON");
	});

	test("is an Error", () => {
		const error = new HttpError(HttpStatus.NOT_FOUND, "Not Found");
		expect(error).toBeInstanceOf(HttpError);
		expect(error).toBeInstanceOf(Error);
	});

	test("can be thrown and caught with its status", () => {
		expect(() => {
			throw new HttpError(HttpStatus.FORBIDDEN, "Forbidden");
		}).toThrow({ exact: "Forbidden" });

		try {
			throw new HttpError(HttpStatus.FORBIDDEN, "Forbidden");
		} catch (e) {
			expect((e as HttpError).status).toBe(403);
		}
	});
});
