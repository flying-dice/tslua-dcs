import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { decodeUriComponent } from "../src";

describe("decodeUriComponent", () => {
	test("Spaces should be decoded correctly", () => {
		expect(decodeUriComponent("Hello%20World")).toBe("Hello World");
	});

	test("Hash symbols should be decoded correctly", () => {
		expect(decodeUriComponent("%23one")).toBe("#one");
	});

	test("At symbol should be decoded correctly", () => {
		expect(decodeUriComponent("%40email")).toBe("@email");
	});

	test("Dollar symbol should be decoded correctly", () => {
		expect(decodeUriComponent("%24price")).toBe("$price");
	});

	test("Ampersand should be decoded correctly", () => {
		expect(decodeUriComponent("%26symbol")).toBe("&symbol");
	});

	test("Plus symbol should be decoded correctly", () => {
		expect(decodeUriComponent("%2Bplus")).toBe("+plus");
	});

	test("Slash should be decoded correctly", () => {
		expect(decodeUriComponent("%2Fslash")).toBe("/slash");
	});

	test("Colon should be decoded correctly", () => {
		expect(decodeUriComponent("%3Acolon")).toBe(":colon");
	});

	test("Semicolon should be decoded correctly", () => {
		expect(decodeUriComponent("%3Bsemicolon")).toBe(";semicolon");
	});

	test("Equals symbol should be decoded correctly", () => {
		expect(decodeUriComponent("%3Dequals")).toBe("=equals");
	});

	test("Question mark should be decoded correctly", () => {
		expect(decodeUriComponent("%3Fquestion")).toBe("?question");
	});

	test("At symbol should be decoded correctly", () => {
		expect(decodeUriComponent("%40at")).toBe("@at");
	});

	test("Multiple encoded spaces should be decoded correctly", () => {
		expect(decodeUriComponent("Multi%20Word%20Test")).toBe("Multi Word Test");
	});

	test("Mixed special characters should be decoded correctly", () => {
		expect(decodeUriComponent("Mixed%23%40%2524Symbols")).toBe(
			"Mixed#@%24Symbols",
		);
	});

	test("Empty string should return empty string", () => {
		expect(decodeUriComponent("")).toBe("");
	});

	test("Encoded spaces in a numeric string should be decoded correctly", () => {
		expect(decodeUriComponent("123%20456")).toBe("123 456");
	});

	test("String without encoding should remain unchanged", () => {
		expect(decodeUriComponent("NoEncoding")).toBe("NoEncoding");
	});
});
