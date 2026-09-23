import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { decodeUriComponent } from "../src";

describe("decodeUriComponent", () => {
	const reserved: [string, string][] = [
		["Hello%20World", "Hello World"],
		["%23one", "#one"],
		["%40email", "@email"],
		["%24price", "$price"],
		["%26symbol", "&symbol"],
		["%2Bplus", "+plus"],
		["%2Fslash", "/slash"],
		["%3Acolon", ":colon"],
		["%3Bsemicolon", ";semicolon"],
		["%3Dequals", "=equals"],
		["%3Fquestion", "?question"],
		["%40at", "@at"],
		["%25percent", "%percent"],
	];
	for (const [encoded, decoded] of reserved) {
		test(`decodes ${encoded}`, () => {
			expect(decodeUriComponent(encoded)).toBe(decoded);
		});
	}

	test("decodes multiple encoded spaces", () => {
		expect(decodeUriComponent("Multi%20Word%20Test")).toBe("Multi Word Test");
	});

	test("decodes mixed special characters in a single pass", () => {
		// %25 becomes '%', and the resulting "%24" is not decoded again.
		expect(decodeUriComponent("Mixed%23%40%2524Symbols")).toBe(
			"Mixed#@%24Symbols",
		);
	});

	test("returns an empty string unchanged", () => {
		expect(decodeUriComponent("")).toBe("");
	});

	test("decodes encoded spaces in a numeric string", () => {
		expect(decodeUriComponent("123%20456")).toBe("123 456");
	});

	test("leaves a string without escapes unchanged", () => {
		expect(decodeUriComponent("NoEncoding")).toBe("NoEncoding");
	});

	test("decodes '+' as a space (form encoding)", () => {
		expect(decodeUriComponent("a+b+c")).toBe("a b c");
	});

	test("an encoded '+' stays a plus sign", () => {
		expect(decodeUriComponent("1%2B1+%3D+2")).toBe("1+1 = 2");
	});

	test("accepts lower-case hex digits", () => {
		expect(decodeUriComponent("%2f%3a%7e")).toBe("/:~");
		expect(decodeUriComponent("%ff%FF")).toBe(string.char(255, 255));
	});

	test("decodes multi-byte UTF-8 sequences byte by byte", () => {
		expect(decodeUriComponent("caf%C3%A9")).toBe(
			`caf${string.char(0xc3, 0xa9)}`,
		);
		expect(decodeUriComponent("caf%C3%A9")).toHaveLength(5);
	});

	test("decodes control and NUL bytes", () => {
		expect(decodeUriComponent("a%00b%0D%0A")).toBe("a\0b\r\n");
	});

	test("leaves malformed escapes untouched", () => {
		expect(decodeUriComponent("100%")).toBe("100%");
		expect(decodeUriComponent("%2")).toBe("%2");
		expect(decodeUriComponent("%zz")).toBe("%zz");
		expect(decodeUriComponent("%G1%1")).toBe("%G1%1");
	});

	test("decodes an escape that directly follows a malformed one", () => {
		expect(decodeUriComponent("%%41")).toBe("%A");
	});
});
