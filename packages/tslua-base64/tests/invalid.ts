import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { type Base64Alphabet, decode, encode, tryDecode } from "../src";
import { assertEqual, assertThrows } from "./helpers";

// [input, alphabet, expected message fragment]. Non-ASCII bytes are built with
// string.char: TypeScript string escapes above 0x7F become UTF-16 code units.
const INVALID: [string, Base64Alphabet, string][] = [
	["Z", "standard", "truncated input"],
	["Zm9vY", "standard", "truncated input"],
	["=", "standard", "incorrect padding"],
	["==", "standard", "incorrect padding"],
	["Zg=", "standard", "incorrect padding"],
	["Zm9v=", "standard", "incorrect padding"],
	["Zm9v==", "standard", "incorrect padding"],
	["Zm8==", "standard", "incorrect padding"],
	["Zg===", "standard", "too much padding at position 5"],
	["Zg==Zg==", "standard", "unexpected character after padding at position 5"],
	["Zg=g", "standard", "unexpected character after padding at position 4"],
	["Zm9v!", "standard", "invalid character '!' at position 5"],
	["Zm 9v.", "standard", "invalid character '.' at position 6"],
	[
		`Zm9${string.char(0)}v`,
		"standard",
		"invalid character byte 0x00 at position 4",
	],
	[
		`Zm9${string.char(0xc3, 0xa9)}`,
		"standard",
		"invalid character byte 0xC3 at position 4",
	],
	[
		`Zm9v${string.char(11)}`,
		"standard",
		"invalid character byte 0x0B at position 5",
	],
	["-_-_", "standard", "invalid character '-' at position 1"],
	["ab_c", "standard", "invalid character '_' at position 3"],
	["+/+/", "url", "invalid character '+' at position 1"],
	["ab/c", "url", "invalid character '/' at position 3"],
];

describe("Invalid input", () => {
	test("decode rejects malformed input with a precise message", () => {
		for (const [input, alphabet, fragment] of INVALID) {
			assertThrows(
				() => decode(input, { alphabet }),
				`base64.decode: ${fragment}`,
				`decode(${input})`,
			);
		}
	});

	test("tryDecode returns undefined for the same inputs", () => {
		for (const [input, alphabet] of INVALID) {
			assertEqual(
				tryDecode(input, { alphabet }),
				undefined,
				`tryDecode(${input})`,
			);
		}
	});

	test("empty and whitespace-only input decode to the empty string", () => {
		assertEqual(decode(""), "", "empty");
		assertEqual(decode(" \t\r\n "), "", "whitespace");
	});

	test("non-string arguments are rejected", () => {
		assertThrows(
			() => encode(undefined as unknown as string),
			"base64.encode: expected a string, got nil",
			"encode(nil)",
		);
		assertThrows(
			() => encode(123 as unknown as string),
			"base64.encode: expected a string, got number",
			"encode(123)",
		);
		assertThrows(
			() => decode({} as unknown as string),
			"base64.decode: expected a string, got table",
			"decode({})",
		);
		expect(tryDecode(false as unknown as string)).toBe(undefined);
	});

	test("unknown alphabets are rejected", () => {
		const bogus = "base32" as Base64Alphabet;
		assertThrows(
			() => encode("x", { alphabet: bogus }),
			"base64.encode: unknown alphabet 'base32'",
			"encode",
		);
		assertThrows(
			() => decode("eA==", { alphabet: bogus }),
			"base64.decode: unknown alphabet 'base32'",
			"decode",
		);
		assertThrows(
			() => tryDecode("eA==", { alphabet: bogus }),
			"base64.tryDecode: unknown alphabet 'base32'",
			"tryDecode",
		);
	});
});
