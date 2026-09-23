import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { decode, encode, isNull, NULL } from "../src";
import { assertEqual, assertThrows } from "./helpers";

describe("decode: values", () => {
	test("scalars", () => {
		expect(decode("true")).toBe(true);
		expect(decode("false")).toBe(false);
		expect(decode("null")).toBe(undefined);
		expect(decode("42")).toBe(42);
		expect(decode("-1.5e2")).toBe(-150);
		expect(decode('"hi"')).toBe("hi");
	});

	test("objects and arrays become Lua tables", () => {
		const value = decode<{
			name: string;
			list: number[];
			nested: { ok: boolean };
		}>('{"name":"Enfield11","list":[1,2,3],"nested":{"ok":true}}');
		expect(value.name).toBe("Enfield11");
		expect(value.list.length).toBe(3);
		expect(value.list[2]).toBe(3);
		expect(value.nested.ok).toBe(true);
	});

	test("null removes object keys and leaves array holes by default", () => {
		const value = decode<{ a?: number; b: number }>('{"a":null,"b":1}');
		expect(value.a).toBe(undefined);
		let keys = 0;
		for (const [_] of pairs(value)) keys++;
		expect(keys).toBe(1);

		const list = decode<(number | undefined)[]>("[1,null,3]");
		expect(list[0]).toBe(1);
		expect(list[1]).toBe(undefined);
		expect(list[2]).toBe(3);
	});

	test("nullValue: NULL keeps nulls in objects and arrays", () => {
		const value = decode<{ a: unknown; list: unknown[] }>(
			'{"a":null,"list":[null,null]}',
			{ nullValue: NULL },
		);
		expect(isNull(value.a)).toBe(true);
		expect(value.list.length).toBe(2);
		expect(isNull(value.list[1])).toBe(true);
		assertEqual(
			encode(value, { sortKeys: true }),
			'{"a":null,"list":[null,null]}',
			"round trip",
		);
	});

	test("empty arrays and objects remember their kind", () => {
		assertEqual(encode(decode("[]")), "[]", "array");
		assertEqual(encode(decode("{}")), "{}", "object");
		assertEqual(
			encode(decode('{"a":{},"b":[]}'), { sortKeys: true }),
			'{"a":{},"b":[]}',
			"nested",
		);
	});

	test("duplicate keys keep the last value", () => {
		expect(decode<{ a: number }>('{"a":1,"a":2}').a).toBe(2);
	});

	test("numbers: negative zero, huge exponents and precision", () => {
		expect(1 / decode<number>("-0")).toBe(-math.huge);
		expect(decode("1e400")).toBe(math.huge);
		expect(decode("-1e400")).toBe(-math.huge);
		expect(decode("1e-400")).toBe(0);
		expect(decode("0.1")).toBe(0.1);
		expect(decode("9007199254740993")).toBe(9007199254740992);
	});
});

describe("decode: strings", () => {
	test("escapes", () => {
		assertEqual(
			decode('"\\"\\\\\\/\\b\\f\\n\\r\\t"'),
			'"\\/\b\f\n\r\t',
			"simple escapes",
		);
		assertEqual(
			decode('"\\u0041\\u00e9"'),
			`A${string.char(0xc3, 0xa9)}`,
			"BMP escapes",
		);
		assertEqual(
			decode('"\\u20AC"'),
			string.char(0xe2, 0x82, 0xac),
			"3-byte escape",
		);
		assertEqual(
			decode('"\\uD83D\\uDE80"'),
			string.char(0xf0, 0x9f, 0x9a, 0x80),
			"surrogate pair",
		);
		assertEqual(decode('"a\\u0000b"'), `a${string.char(0)}b`, "escaped NUL");
	});

	test("unpaired surrogates become U+FFFD", () => {
		const replacement = string.char(0xef, 0xbf, 0xbd);
		assertEqual(decode('"\\uD83D"'), replacement, "lone high");
		assertEqual(decode('"\\uDE80"'), replacement, "lone low");
		assertEqual(decode('"\\uD83Dx"'), `${replacement}x`, "high then text");
		assertEqual(
			decode('"\\uD83D\\u0041"'),
			`${replacement}A`,
			"high then non-surrogate escape",
		);
		assertEqual(
			decode('"\\uDE80\\uD83D"'),
			replacement + replacement,
			"reversed pair",
		);
	});

	test("raw bytes pass through unchanged, including invalid UTF-8", () => {
		const bytes = string.char(0xc3, 0xa9, 0xff, 0xfe, 0x7f);
		assertEqual(decode(`"${bytes}"`), bytes, "raw bytes");
	});

	test("long strings with many escapes", () => {
		const text = string.rep("ab\\n\\u00e9", 5000);
		const expected = string.rep(`ab\n${string.char(0xc3, 0xa9)}`, 5000);
		assertEqual(decode(`"${text}"`), expected, "long string");
	});
});

describe("decode: errors", () => {
	const cases: [string, string][] = [
		["", "json.decode: unexpected end of input at line 1 column 1"],
		["[1,]", "json.decode: unexpected ']' at line 1 column 4"],
		[
			'{"a":1,}',
			"json.decode: expected a string key but found '}' at line 1 column 8",
		],
		[
			'{\n  "a": 1\n  "b": 2\n}',
			"json.decode: expected ',' or '}' but found '\"' at line 3 column 3",
		],
		[
			"[1 2]",
			"json.decode: expected ',' or ']' but found '2' at line 1 column 4",
		],
		['{"a" 1}', "json.decode: expected ':' but found '1' at line 1 column 6"],
		["01", "json.decode: leading zeros are not allowed at line 1 column 1"],
		[
			"1.",
			"json.decode: expected a digit after the decimal point at line 1 column 3",
		],
		["1e", "json.decode: expected a digit in the exponent at line 1 column 3"],
		[
			"-",
			"json.decode: invalid number (unexpected end of input) at line 1 column 2",
		],
		['"abc', "json.decode: unterminated string at line 1 column 1"],
		[
			'"a\nb"',
			"json.decode: unescaped control character in string at line 1 column 3",
		],
		['"\\x"', "json.decode: invalid escape 'x' at line 1 column 2"],
		['"\\u12"', "json.decode: invalid \\u escape at line 1 column 2"],
		["tru", "json.decode: unexpected 't' at line 1 column 1"],
		[
			"[1] x",
			"json.decode: unexpected 'x' after the JSON value at line 1 column 5",
		],
		["\n\n  @", "json.decode: unexpected '@' at line 3 column 3"],
	];

	test("messages name the problem, line and column", () => {
		for (const [input, message] of cases) {
			let actual: string | undefined;
			try {
				decode(input);
			} catch (error) {
				actual = (error as Error).message;
			}
			assertEqual(actual, message, `decode(${input})`);
		}
	});

	test("non-ASCII bytes are described by value", () => {
		assertThrows(
			() => decode(string.char(0xef, 0xbb, 0xbf, 0x7b, 0x7d)),
			"unexpected byte 0xEF",
			"BOM",
		);
	});

	test("maxDepth limits nesting", () => {
		const depth = (n: number) => string.rep("[", n) + string.rep("]", n);
		expect(encode(decode(depth(512)))).toBe(depth(512));
		assertThrows(
			() => decode(depth(513)),
			"nesting is deeper than maxDepth (512)",
			"default",
		);
		assertThrows(
			() => decode(depth(3), { maxDepth: 2 }),
			"nesting is deeper than maxDepth (2)",
			"custom",
		);
	});

	test("pathological nesting fails cleanly instead of overflowing the stack", () => {
		assertThrows(
			() => decode(string.rep("[", 100000)),
			"nesting is deeper than maxDepth",
			"100k arrays",
		);
		assertThrows(
			() => decode(string.rep('{"a":', 100000)),
			"nesting is deeper than maxDepth",
			"100k objects",
		);
	});

	test("non-string input is rejected", () => {
		assertThrows(
			() => decode(undefined as unknown as string),
			"json.decode: expected a string, got nil",
			"nil",
		);
		assertThrows(
			() => decode(1 as unknown as string),
			"json.decode: expected a string, got number",
			"number",
		);
	});
});
