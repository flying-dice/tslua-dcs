/** @noSelfInFile */

import {
	any,
	anything,
	describe,
	expect,
	objectContaining,
	stringContaining,
	stringMatching,
	test,
} from "../src";
import { expectFailure, failureOf } from "./helpers";

class Animal {
	constructor(public name: string) {}
}
class Dog extends Animal {}
class Plain {
	constructor(public name: string) {}
}

describe("expect: backward compatible API", () => {
	test("toBe passes for identical values and fails otherwise", () => {
		expect(1).toBe(1);
		expect("a").toBe("a");
		expect(undefined).toBe(undefined);
		expectFailure(
			() => expect(1).toBe(2),
			"expect(received).toBe(expected)",
			"Expected: 2",
			"Received: 1",
		);
	});

	test("failures are AssertionErrors with the matcher header", () => {
		expect(failureOf(() => expect(true).toBe(false))).toContain(
			"toBe(expected)",
		);
	});

	test("expect(value, label) prefixes the failure message", () => {
		const message = failureOf(() => expect(1, "case 7").toBe(2));
		expect(string.sub(message, 1, 6)).toBe("case 7");
	});

	test("unknown matchers raise a clear error", () => {
		expect(() => (expect(1) as any).toBeAwesome()).toThrow(
			"is not a luatest matcher",
		);
	});
});

describe("toBe", () => {
	test("tables must be the same table", () => {
		const t = { a: 1 };
		expect(t).toBe(t);
		expectFailure(
			() => expect({ a: 1 }).toBe({ a: 1 }),
			"equal but not the same table",
			"use toEqual",
		);
	});

	test("nan is nan", () => {
		expect(0 / 0).toBe(0 / 0);
		expect(0 / 0).not.toBe(1);
	});

	test("numbers print precisely", () => {
		expectFailure(
			() => expect(0.1 + 0.2).toBe(0.3),
			"Received: 0.30000000000000004",
		);
	});

	test("strings show the first differing byte, escaped, with a hex dump for binary", () => {
		expectFailure(
			() => expect("ab\0c").toBe("ab\0d"),
			"strings differ at byte 4 (expected 4 bytes, received 4 bytes)",
			'"ab\\000d"',
			"hex: 61 62 00 64",
		);
	});

	test("long strings are shown as a window around the difference", () => {
		const prefix = string.rep("x", 200);
		const message = failureOf(() => expect(`${prefix}A`).toBe(`${prefix}B`));
		expect(message).toContain(
			"strings differ at byte 201 (expected 201 bytes, received 201 bytes)",
		);
		expect(message).toContain("expected bytes 185..201: ...");
		expect(message).toContain("(201 bytes)");
	});

	test(".not.toBe", () => {
		expect(1).not.toBe(2);
		expectFailure(
			() => expect(1).not.toBe(1),
			"expect(received).not.toBe(expected)",
			"Expected: not 1",
		);
	});
});

describe("toEqual", () => {
	test("deep equality of nested tables", () => {
		expect({ a: [1, 2, { b: "c" }], d: true }).toEqual({
			d: true,
			a: [1, 2, { b: "c" }],
		});
		expect([]).toEqual([]);
		expect("s").toEqual("s");
	});

	test("reports the path to the first difference", () => {
		expectFailure(
			() =>
				expect({ list: [1, 2, 3], name: "x" }).toEqual({
					list: [1, 2, 4],
					name: "x",
				}),
			"First difference at received.list[3]: values differ",
			"expected: 4",
			"received: 3",
		);
	});

	test("reports missing and unexpected keys", () => {
		expectFailure(
			() => expect({ a: 1 }).toEqual({ a: 1, b: 2 }),
			"received.b: missing key",
		);
		expectFailure(
			() => expect({ a: 1, c: 3 }).toEqual({ a: 1 }),
			"received.c: unexpected key",
		);
		expectFailure(
			() => expect({ ["two words"]: 1 }).toEqual({}),
			'received["two words"]: unexpected key',
		);
	});

	test("reports type mismatches", () => {
		expectFailure(
			() => expect({ a: "1" }).toEqual({ a: 1 }),
			"expected a number, received a string",
		);
	});

	test("string differences inside tables show byte offsets", () => {
		expectFailure(
			() => expect({ s: "hello" }).toEqual({ s: "help" }),
			"strings differ at byte 4",
		);
	});

	test("is cycle safe", () => {
		const a: any = { name: "a" };
		a.self = a;
		const b: any = { name: "a" };
		b.self = b;
		expect(a).toEqual(b);
		const c: any = { name: "c" };
		c.self = c;
		expectFailure(
			() => expect(a).toEqual(c),
			"received.name: values differ",
			"<cycle>",
		);
	});

	test("ignores metatables (classes)", () => {
		expect(new Animal("rex")).toEqual({ name: "rex" });
		expect(new Animal("rex")).toEqual(new Plain("rex"));
	});

	test("supports asymmetric matchers", () => {
		expect({ id: 12, name: "x", tags: ["a"] }).toEqual({
			id: any("number"),
			name: anything(),
			tags: any("table"),
		});
		expect({ text: "hello world" }).toEqual({
			text: stringContaining("lo wo"),
		});
		expect({ text: "abc123" }).toEqual({ text: stringMatching("^%a+%d+$") });
		expect({ a: 1, b: { c: 2, d: 3 } }).toEqual(
			objectContaining({ b: objectContaining({ c: 2 }) }),
		);
		expect({ pet: new Dog("rex") }).toEqual({ pet: any(Animal) });
		expectFailure(
			() => expect({ id: "12" }).toEqual({ id: any("number") }),
			"does not match any(number)",
		);
		expectFailure(
			() => expect({}).toEqual({ id: anything() }),
			"does not match anything()",
		);
	});

	test(".not.toEqual", () => {
		expect({ a: 1 }).not.toEqual({ a: 2 });
		expectFailure(
			() => expect({ a: 1 }).not.toEqual({ a: 1 }),
			"not.toEqual",
			"Expected: not { a = 1 }",
		);
	});
});

describe("toStrictEqual", () => {
	test("also requires the same metatable", () => {
		expect(new Animal("rex")).toStrictEqual(new Animal("rex"));
		expect({ a: [1] }).toStrictEqual({ a: [1] });
		expectFailure(
			() => expect(new Animal("rex")).toStrictEqual({ name: "rex" }),
			"metatables (classes) differ",
		);
		expectFailure(
			() => expect(new Animal("rex")).toStrictEqual(new Plain("rex")),
			"metatables (classes) differ",
		);
		expect(new Animal("rex")).not.toStrictEqual(new Dog("rex"));
	});
});

describe("nil, definedness and truthiness", () => {
	test("toBeUndefined / toBeNil / toBeNull", () => {
		expect(undefined).toBeUndefined();
		expect(undefined).toBeNil();
		expect(undefined).toBeNull();
		expectFailure(
			() => expect(false).toBeUndefined(),
			"toBeUndefined()",
			"Received: false",
		);
		expectFailure(() => expect(0).toBeNil(), "toBeNil()");
		expectFailure(() => expect("").toBeNull(), "toBeNull()");
		expect(0).not.toBeNil();
	});

	test("toBeDefined", () => {
		expect(false).toBeDefined();
		expect(0).toBeDefined();
		expectFailure(
			() => expect(undefined).toBeDefined(),
			"toBeDefined()",
			"Received: nil",
		);
		expect(undefined).not.toBeDefined();
	});

	test("toBeTruthy / toBeFalsy follow Lua truthiness", () => {
		expect(0).toBeTruthy();
		expect("").toBeTruthy();
		expect({}).toBeTruthy();
		expect(true).toBeTruthy();
		expect(false).toBeFalsy();
		expect(undefined).toBeFalsy();
		expectFailure(
			() => expect(0).toBeFalsy(),
			"only nil and false are falsy in Lua",
		);
		expectFailure(() => expect(false).toBeTruthy(), "toBeTruthy()");
		expectFailure(() => expect(1).not.toBeTruthy(), "not.toBeTruthy()");
	});

	test("toBeNaN", () => {
		expect(0 / 0).toBeNaN();
		expect(1).not.toBeNaN();
		expect("nan").not.toBeNaN();
		expectFailure(() => expect(1).toBeNaN(), "toBeNaN()", "Received: 1");
	});
});

describe("types and classes", () => {
	test("toBeTypeOf uses Lua type names", () => {
		expect("x").toBeTypeOf("string");
		expect({}).toBeTypeOf("table");
		expect(print).toBeTypeOf("function");
		expect(undefined).toBeTypeOf("nil");
		expectFailure(
			() => expect(1).toBeTypeOf("string"),
			'Expected type: "string"',
			'Received type: "number"',
		);
		expect(1).not.toBeTypeOf("string");
	});

	test("toBeInstanceOf works with TypeScriptToLua classes and subclasses", () => {
		expect(new Dog("rex")).toBeInstanceOf(Dog);
		expect(new Dog("rex")).toBeInstanceOf(Animal);
		expect(new Animal("rex")).not.toBeInstanceOf(Dog);
		expect({ name: "rex" }).not.toBeInstanceOf(Animal);
		expectFailure(
			() => expect(new Plain("x")).toBeInstanceOf(Animal),
			"an instance of Animal",
			"Received: Plain {",
		);
		expectFailure(
			() => expect(1).toBeInstanceOf(1 as any),
			"Matcher error: expected a class",
		);
	});
});

describe("number comparisons", () => {
	test("greater / less than", () => {
		expect(2).toBeGreaterThan(1);
		expect(2).toBeGreaterThanOrEqual(2);
		expect(1).toBeLessThan(2);
		expect(2).toBeLessThanOrEqual(2);
		expect(1).not.toBeGreaterThan(1);
		expectFailure(
			() => expect(1).toBeGreaterThan(1),
			"toBeGreaterThan(expected)",
			"Expected: > 1",
			"Received: 1",
		);
		expectFailure(() => expect(1).toBeGreaterThanOrEqual(2), "Expected: >= 2");
		expectFailure(() => expect(2).toBeLessThan(2), "Expected: < 2");
		expectFailure(() => expect(3).toBeLessThanOrEqual(2), "Expected: <= 2");
		expectFailure(
			() => expect(3).not.toBeLessThanOrEqual(3),
			"Expected: not <= 3",
		);
	});

	test("non-numbers are matcher errors, even when negated", () => {
		expectFailure(
			() => expect("2" as any).toBeGreaterThan(1),
			"Matcher error: received value must be a number",
		);
		expectFailure(
			() => expect(2).not.toBeLessThan("3" as any),
			"Matcher error: expected value must be a number",
		);
	});

	test("toBeCloseTo", () => {
		expect(0.1 + 0.2).toBeCloseTo(0.3);
		expect(0.1 + 0.2).toBeCloseTo(0.3, 10);
		expect(1.004).toBeCloseTo(1);
		expect(1.006).not.toBeCloseTo(1);
		expect(math.huge).toBeCloseTo(math.huge);
		expectFailure(
			() => expect(1.1).toBeCloseTo(1, 2),
			"toBeCloseTo(expected)",
			"2 digits",
			"Received: 1.1",
		);
		expectFailure(() => expect("x" as any).toBeCloseTo(1), "Matcher error");
	});
});

describe("collections and strings", () => {
	test("toContain finds substrings (plain) and array items (identity)", () => {
		expect("hello world").toContain("o w");
		expect("a.b").toContain(".");
		expect("abc").not.toContain(".");
		const item = { id: 1 };
		expect([1, 2, 3]).toContain(2);
		expect([item]).toContain(item);
		expect([{ id: 1 }]).not.toContain({ id: 1 });
		expectFailure(
			() => expect([1, 2]).toContain(3),
			"toContain(expected)",
			"to contain 3",
			"Received: { 1, 2 }",
		);
		expectFailure(
			() => expect("abc").toContain(1 as any),
			"Matcher error: a string can only contain a string",
		);
		expectFailure(
			() => expect(5).toContain(5),
			"Matcher error: received value must be a string or a table",
		);
	});

	test("toContainEqual compares items deeply", () => {
		expect([{ id: 1 }, { id: 2 }]).toContainEqual({ id: 2 });
		expect([{ id: 1 }]).not.toContainEqual({ id: 3 });
		expectFailure(
			() => expect([{ id: 1 }]).toContainEqual({ id: 3 }),
			"to contain an item equal to { id = 3 }",
		);
		expectFailure(() => expect("abc").toContainEqual("a"), "Matcher error");
	});

	test("toHaveLength uses #", () => {
		expect("abc").toHaveLength(3);
		expect("a\0b").toHaveLength(3);
		expect([1, 2]).toHaveLength(2);
		expect([]).toHaveLength(0);
		expect([1]).not.toHaveLength(2);
		expectFailure(
			() => expect([1, 2]).toHaveLength(3),
			"Expected length: 3",
			"Received length: 2",
		);
		expectFailure(() => expect(3).toHaveLength(1), "Matcher error");
	});

	test("toMatch uses Lua patterns, or plain text with { plain: true }", () => {
		expect("abc123").toMatch("^%a+%d+$");
		expect("1.5").toMatch(".", { plain: true });
		expect("15").not.toMatch("%.");
		expect("15").not.toMatch(".", { plain: true });
		expectFailure(
			() => expect("abc").toMatch("^%d"),
			'Pattern: "^%d"',
			'Received: "abc"',
		);
		expectFailure(
			() => expect("abc").toMatch("[", { plain: true }),
			'Plain text: "["',
		);
		expectFailure(
			() => expect("abc").toMatch("[a"),
			"Matcher error: invalid Lua pattern",
		);
		expectFailure(
			() => expect(1).toMatch("1"),
			"Matcher error: received value must be a string",
		);
	});

	test("toHaveProperty resolves dotted paths and key arrays", () => {
		const value = {
			a: { b: { c: 3 } },
			list: [10, 20],
			["x.y"]: true,
			f: false,
		};
		expect(value).toHaveProperty("a.b.c");
		expect(value).toHaveProperty("a.b", { c: 3 });
		expect(value).toHaveProperty("list.2", 20);
		expect(value).toHaveProperty(["list", 1], 10);
		expect(value).toHaveProperty(["x.y"]);
		expect(value).toHaveProperty("f", false);
		expect(value).not.toHaveProperty("a.x");
		expect(value).not.toHaveProperty("a.b.c", 4);
		expectFailure(
			() => expect(value).toHaveProperty("a.z"),
			"does not resolve to a non-nil value",
		);
		expectFailure(
			() => expect(value).toHaveProperty("a.b", { c: 4 }),
			"Expected value: { c = 4 }",
			"value.c",
		);
	});

	test("toHaveProperty uses normal indexing, so class methods are visible", () => {
		expect(new Animal("rex")).toHaveProperty("name", "rex");
		expect(new Animal("rex")).toHaveProperty("constructor");
	});
});

describe("failure previews", () => {
	test("tables are pretty-printed with a depth limit", () => {
		expectFailure(
			() => expect({ a: { b: { c: { d: 1 } } } }).toBe(1),
			"Received: { a = { b = { c = {...} } } }",
		);
	});

	test("class instances show their class name", () => {
		expectFailure(
			() => expect(new Dog("rex")).toBe(1),
			'Received: Dog { name = "rex" }',
		);
	});
});
