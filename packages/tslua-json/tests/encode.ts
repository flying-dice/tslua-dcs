import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { asArray, asObject, decode, encode, isNull, NULL } from "../src";
import { assertEqual, assertThrows } from "./helpers";

class Point {
	constructor(
		public x: number,
		public y: number,
	) {}

	toJSON() {
		return [this.x, this.y];
	}
}

class Unit {
	constructor(
		public name: string,
		public alive: boolean,
	) {}

	describe() {
		return `${this.name} (${this.alive})`;
	}
}

describe("encode: values", () => {
	test("scalars", () => {
		expect(encode(true)).toBe("true");
		expect(encode(false)).toBe("false");
		expect(encode(undefined)).toBe("null");
		expect(encode(NULL)).toBe("null");
		expect(encode(0)).toBe("0");
		expect(encode(-0)).toBe("0");
		expect(encode(7620.5)).toBe("7620.5");
		expect(encode(0.1 + 0.2)).toBe("0.30000000000000004");
		expect(encode(1e21)).toBe("1e+21");
		expect(encode(123456789012)).toBe("123456789012");
		expect(encode("hi")).toBe('"hi"');
	});

	test("string escaping matches JSON.stringify", () => {
		assertEqual(
			encode('quote " backslash \\ slash /'),
			'"quote \\" backslash \\\\ slash /"',
			"specials",
		);
		assertEqual(encode("\b\f\n\r\t"), '"\\b\\f\\n\\r\\t"', "short escapes");
		assertEqual(
			encode(string.char(0, 1, 0x1f, 0x7f)),
			`"\\u0000\\u0001\\u001f${string.char(0x7f)}"`,
			"controls",
		);
		const utf8 = string.char(0xe2, 0x9c, 0x88);
		assertEqual(encode(utf8), `"${utf8}"`, "UTF-8 passes through");
	});

	test("arrays from TypeScript arrays", () => {
		expect(encode([1, "two", true, [3]])).toBe('[1,"two",true,[3]]');
		expect(encode([])).toBe("[]");
	});

	test("objects from TypeScript object literals", () => {
		assertEqual(
			encode({ b: 1, a: { c: [1, 2] } }, { sortKeys: true }),
			'{"a":{"c":[1,2]},"b":1}',
			"sorted",
		);
		assertEqual(encode({ only: "one" }), '{"only":"one"}', "single key");
	});

	test("array holes encode as null, like JavaScript", () => {
		const list: unknown[] = [];
		list[0] = 1;
		list[3] = 4;
		expect(encode(list)).toBe("[1,null,null,4]");
	});

	test("undefined object fields are omitted", () => {
		expect(encode({ a: 1, b: undefined })).toBe('{"a":1}');
	});

	test("empty tables: array by default, object on request", () => {
		expect(encode({})).toBe("[]");
		expect(encode({}, { emptyTable: "object" })).toBe("{}");
		expect(encode([], { emptyTable: "object" })).toBe("{}");
		expect(encode(asObject({}))).toBe("{}");
		expect(encode(asArray({}), { emptyTable: "object" })).toBe("[]");
		expect(
			encode({ list: asArray([]), map: asObject({}) }, { sortKeys: true }),
		).toBe('{"list":[],"map":{}}');
	});

	test("asObject writes integer keys as strings", () => {
		const byId = asObject<Record<number, string>>({});
		byId[1] = "one";
		byId[20] = "twenty";
		assertEqual(
			encode(byId, { sortKeys: true }),
			'{"1":"one","20":"twenty"}',
			"integer keys",
		);
	});

	test("NULL sentinel", () => {
		expect(encode([NULL, 1, NULL])).toBe("[null,1,null]");
		expect(encode({ a: NULL })).toBe('{"a":null}');
		expect(isNull(NULL)).toBe(true);
		expect(isNull(undefined)).toBe(false);
		expect(tostring(NULL)).toBe("null");
		assertThrows(
			() => {
				(NULL as unknown as Record<string, number>).x = 1;
			},
			"json.NULL is read-only",
			"write to NULL",
		);
	});

	test("toJSON supplies the encoded value", () => {
		expect(encode(new Point(1, 2))).toBe("[1,2]");
		expect(encode({ at: new Point(3, 4) })).toBe('{"at":[3,4]}');
	});

	test("class instances encode their fields, not their methods", () => {
		assertEqual(
			encode(new Unit("Enfield11", true), { sortKeys: true }),
			'{"alive":true,"name":"Enfield11"}',
			"unit",
		);
	});

	test("shared (non-circular) references are allowed", () => {
		const shared = { v: 1 };
		expect(encode([shared, shared])).toBe('[{"v":1},{"v":1}]');
	});
});

describe("encode: formatting", () => {
	const value = { b: [1, { c: true }], a: {}, d: [] as number[] };

	test("indent with a number of spaces, like JSON.stringify(value, null, 2)", () => {
		const expected =
			'{\n  "a": [],\n  "b": [\n    1,\n    {\n      "c": true\n    }\n  ],\n  "d": []\n}';
		assertEqual(
			encode(value, { sortKeys: true, indent: 2 }),
			expected,
			"indent 2",
		);
	});

	test("indent with a string", () => {
		assertEqual(
			encode([1, [2]], { indent: "\t" }),
			"[\n\t1,\n\t[\n\t\t2\n\t]\n]",
			"tab indent",
		);
	});

	test("indent is clamped to 10 like JSON.stringify", () => {
		assertEqual(
			encode([1], { indent: 20 }),
			`[\n${string.rep(" ", 10)}1\n]`,
			"numeric clamp",
		);
		assertEqual(
			encode([1], { indent: "abcdefghijklmn" }),
			"[\nabcdefghij1\n]",
			"string clamp",
		);
		assertEqual(encode([1], { indent: 0 }), "[1]", "zero is compact");
	});
});

describe("encode: errors", () => {
	test("functions and other Lua-only types", () => {
		assertThrows(
			() => encode(() => 1),
			"json.encode: cannot encode a value of type function at $",
			"top level",
		);
		assertThrows(
			() => encode({ handlers: [1, 2, () => 3] }),
			"json.encode: cannot encode a value of type function at $.handlers[2]",
			"nested path",
		);
		assertThrows(
			() => encode({ "odd key": { x: coroutine.create(() => {}) } }),
			'cannot encode a value of type thread at $["odd key"].x',
			"quoted path segment",
		);
	});

	test("NaN and infinities", () => {
		assertThrows(
			() => encode(0 / 0),
			"(JSON has no NaN or Infinity) at $",
			"NaN",
		);
		assertThrows(
			() => encode([math.huge]),
			"cannot encode inf (JSON has no NaN or Infinity) at $[0]",
			"inf",
		);
		assertThrows(() => encode({ v: -math.huge }), "cannot encode -inf", "-inf");
	});

	test("circular references", () => {
		const loop: { self?: unknown } = {};
		loop.self = loop;
		assertThrows(
			() => encode(loop),
			"json.encode: circular reference at $.self",
			"object cycle",
		);
		const list: unknown[] = [];
		list.push([list]);
		assertThrows(
			() => encode(list),
			"circular reference at $[0][0]",
			"array cycle",
		);
	});

	test("non-string, non-integer keys", () => {
		// Like JSON.stringify({ 1: "a", b: 2 }), integer keys beside string keys become strings.
		assertEqual(
			encode({ 1: "a", b: 2 }, { sortKeys: true }),
			'{"1":"a","b":2}',
			"string and integer keys",
		);
		const weird = new LuaTable<AnyNotNil, number>();
		weird.set(true, 1);
		assertThrows(
			() => encode(weird),
			"cannot encode a table with keys that are not strings or positive integers",
			"boolean key",
		);
		const fractional = new LuaTable<number, number>();
		fractional.set(1.5, 1);
		assertThrows(
			() => encode(fractional),
			"cannot encode a table with keys that are not strings or positive integers",
			"fraction",
		);
	});

	test("overly sparse arrays", () => {
		const sparse: unknown[] = [];
		sparse[999999] = 1;
		assertThrows(
			() => encode(sparse),
			"array is too sparse (1 values, highest index 1000000)",
			"sparse",
		);
	});

	test("maxDepth", () => {
		let nested: unknown = 1;
		for (let i = 0; i < 600; i++) nested = [nested];
		assertThrows(
			() => encode(nested),
			"nesting is deeper than maxDepth (512)",
			"default",
		);
		expect(encode([[1]], { maxDepth: 2 })).toBe("[[1]]");
		assertThrows(
			() => encode([[[1]]], { maxDepth: 2 }),
			"nesting is deeper than maxDepth (2)",
			"custom",
		);
	});

	test("asArray/asObject validate their argument", () => {
		assertThrows(
			() => asArray(1 as unknown as object),
			"json.asArray: expected a table, got number",
			"number",
		);
		assertThrows(
			() => asObject(new Unit("x", true)),
			"json.asObject: the table already has a metatable",
			"class instance",
		);
	});

	test("the encoder is reusable after an error", () => {
		assertThrows(() => encode({ f: () => 1 }), "function", "error");
		expect(encode({ ok: true })).toBe('{"ok":true}');
		expect(decode<{ ok: boolean }>(encode({ ok: true })).ok).toBe(true);
	});
});
