import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { isMatch } from "../src/path";

describe("isMatch", () => {
	test("should return true for exact match", () => {
		expect(isMatch("/home", "/home")).toBe(true);
	});

	test("should return false for non-matching paths", () => {
		expect(isMatch("/home", "/about")).toBe(false);
	});

	test("should return true for matching dynamic segments", () => {
		expect(isMatch("/user/:id", "/user/123")).toBe(true);
	});

	test("should return false for non-matching dynamic segments", () => {
		expect(isMatch("/user/:id", "/user/")).toBe(false);
	});

	// TODO: Implement wildcard matching
	// test("should return true for matching wildcard segments", () => {
	// 	expect(isMatch("/files/*", "/files/docs/file.txt")).toBe(true);
	// });
	//
	// test("should return true for matching wildcard segments", () => {
	// 	expect(isMatch("/files/.*", "/files/docs/file.txt")).toBe(true);
	// });
});
