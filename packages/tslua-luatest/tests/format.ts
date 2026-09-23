/** @noSelfInFile */

import {
	deepDiff,
	deepEqual,
	describe,
	describeStringDifference,
	escapeString,
	expect,
	firstDifference,
	formatValue,
	test,
} from "../src";

describe("formatValue", () => {
	test("scalars", () => {
		expect(formatValue(undefined)).toBe("nil");
		expect(formatValue(true)).toBe("true");
		expect(formatValue(12)).toBe("12");
		expect(formatValue(-0.5)).toBe("-0.5");
		expect(formatValue(0.1 + 0.2)).toBe("0.30000000000000004");
		expect(formatValue(0 / 0)).toBe("nan");
		expect(formatValue(math.huge)).toBe("inf");
		expect(formatValue(-math.huge)).toBe("-inf");
		expect(formatValue(print)).toMatch("^<function: ");
	});

	test("strings are quoted and escaped byte by byte", () => {
		expect(formatValue('say "hi"\\')).toBe('"say \\"hi\\"\\\\"');
		expect(formatValue("a\nb\tc\r")).toBe('"a\\nb\\tc\\r"');
		expect(formatValue(string.char(0, 1, 127, 255))).toBe(
			'"\\000\\001\\127\\255"',
		);
		expect(escapeString("plain text")).toBe("plain text");
	});

	test("long strings are truncated with their length", () => {
		expect(formatValue(string.rep("a", 130))).toBe(
			`"${string.rep("a", 120)}"... (130 bytes)`,
		);
		expect(formatValue("abcdef", { maxString: 3 })).toBe('"abc"... (6 bytes)');
	});

	test("arrays and maps", () => {
		expect(formatValue([])).toBe("{}");
		expect(formatValue([1, "two", [3]])).toBe('{ 1, "two", { 3 } }');
		expect(formatValue({ b: 2, a: 1, ["with space"]: true })).toBe(
			'{ a = 1, b = 2, ["with space"] = true }',
		);
	});

	test("mixed keys are sorted: numbers, strings, then the rest", () => {
		const value = new LuaTable<string | number | boolean, number>();
		value.set("z", 1);
		value.set(10, 2);
		value.set(2, 3);
		value.set(true, 4);
		expect(formatValue(value)).toBe("{ [2] = 3, [10] = 2, z = 1, [true] = 4 }");
	});

	test("depth and width limits", () => {
		expect(formatValue({ a: { b: { c: { d: {} } } } })).toBe(
			"{ a = { b = { c = {...} } } }",
		);
		expect(formatValue({ a: { b: 1 } }, { maxDepth: 1 })).toBe("{ a = {...} }");
		expect(formatValue([1, 2, 3, 4], { maxItems: 2 })).toBe(
			"{ 1, 2, ... (2 more) }",
		);
	});

	test("cycles", () => {
		const value: any = { name: "loop" };
		value.self = value;
		expect(formatValue(value)).toBe('{ name = "loop", self = <cycle> }');
	});

	test("shared (non-cyclic) references print in full", () => {
		const shared = { x: 1 };
		expect(formatValue({ a: shared, b: shared })).toBe(
			"{ a = { x = 1 }, b = { x = 1 } }",
		);
	});
});

describe("string differences", () => {
	test("firstDifference", () => {
		expect(firstDifference("abc", "abc")).toBeUndefined();
		expect(firstDifference("abc", "abd")).toBe(3);
		expect(firstDifference("ab", "abc")).toBe(3);
		expect(firstDifference("", "a")).toBe(1);
	});

	test("describeStringDifference shows offsets, lengths and windows", () => {
		expect(describeStringDifference("same", "same")).toBeUndefined();
		expect(describeStringDifference("abc", "abX")).toBe(
			[
				"strings differ at byte 3 (expected 3 bytes, received 3 bytes)",
				'  expected bytes 1..3: "abc"',
				'  received bytes 1..3: "abX"',
			].join("\n"),
		);
	});

	test("binary windows include a hex dump", () => {
		const text = describeStringDifference(
			string.char(0, 1),
			string.char(0, 2),
		) as string;
		expect(text).toContain(
			'expected bytes 1..2: "\\000\\001"\n      hex: 00 01',
		);
		expect(text).toContain("hex: 00 02");
	});

	test("windows of long strings are elided on both sides", () => {
		const base = string.rep("-", 100);
		const text = describeStringDifference(
			`${base}A${base}`,
			`${base}B${base}`,
		) as string;
		expect(text).toContain(
			'expected bytes 85..133: ..."----------------A--------------------------------"...',
		);
	});
});

describe("deepDiff", () => {
	test("returns undefined for equal values", () => {
		expect(
			deepDiff({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }),
		).toBeUndefined();
		expect(deepEqual(0 / 0, 0 / 0)).toBe(true);
	});

	test("reports the path, both values and a reason", () => {
		expect(deepDiff({ a: [1, { b: 2 }] }, { a: [1, { b: 3 }] })).toEqual({
			path: ".a[2].b",
			expected: 3,
			received: 2,
			reason: "values differ",
		});
		expect(deepDiff(1, "1")).toEqual({
			path: "",
			expected: "1",
			received: 1,
			reason: "expected a string, received a number",
		});
	});

	test("table keys compare by identity", () => {
		const key = {};
		const a = new LuaTable<object, number>();
		a.set(key, 1);
		const b = new LuaTable<object, number>();
		b.set(key, 1);
		expect(deepEqual(a, b)).toBe(true);
		const c = new LuaTable<object, number>();
		c.set({}, 1);
		expect(deepEqual(a, c)).toBe(false);
	});

	test("metamethods are ignored (rawget)", () => {
		const proxy = setmetatable({}, { __index: () => "anything" });
		expect(deepEqual(proxy, {})).toBe(true);
		expect(deepEqual(proxy, {}, true)).toBe(false);
	});

	test("mutually recursive structures terminate", () => {
		const a: any = { child: { parent: undefined } };
		a.child.parent = a;
		const b: any = { child: { parent: undefined } };
		b.child.parent = b;
		expect(deepEqual(a, b)).toBe(true);
	});
});
