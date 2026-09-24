// scripts/export.bridge.lua turns a live DCS namespace table into a TypeScript interface. These
// tests run it on lua51 against fixture tables, covering every kind of member and every limit.

import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { bridgeSource, runBridge } from "./bridge";

function generate(
	namespace: string,
	root: unknown,
	version = "2.9.29.27468",
): string {
	const result = runBridge(namespace, version, { [namespace]: root });
	const file = `${namespace}.export.ts`;
	expect(Object.keys(result)).toEqual([file]);
	return result[file];
}

describe("export.bridge.lua", () => {
	test("the chunk still has both placeholders scripts/export.ts replaces", () => {
		const source = bridgeSource("X", "1");
		expect(source).not.toContain("[[NAMESPACE]]");
		expect(source).not.toContain("[[DCS_VERSION]]");
		expect(source).toContain('local namespace = "X"');
		expect(source).toContain('local dcs_version = "1"');
	});

	test("emits every member kind, sorted, with nested tables", () => {
		const root = {
			zeta: () => {},
			alpha: 1,
			name: "x",
			enabled: true,
			nested: { inner: 2, fn: () => {} },
			1: "first",
			2: "second",
			co: coroutine.create(() => {}),
		};
		expect(generate("Fixture", root)).toBe(
			[
				"/**",
				" * @version 2.9.29.27468",
				" * @noSelf",
				" */",
				"export interface _Fixture {",
				"\t[1]: string;",
				"\t[2]: string;",
				"\talpha: number;",
				"\tco: unknown;",
				"\tenabled: boolean;",
				"\tname: string;",
				"\tnested: {",
				"\t\tfn(...args: any[]): unknown;",
				"\t\tinner: number;",
				"\t};",
				"\tzeta(...args: any[]): unknown;",
				"}",
				"",
			].join("\n"),
		);
	});

	test("quotes keys that are not identifiers and escapes their bytes", () => {
		const output = generate("Keys", {
			"with space": 1,
			'quote"s': 2,
			"line\nbreak": 3,
			"ctrl\u0001": 4,
			$dollar: 5,
		});
		expect(output).toContain("\t$dollar: number;");
		expect(output).toContain('\t"with space": number;');
		expect(output).toContain('\t"quote\\"s": number;');
		expect(output).toContain('\t"line\\nbreak": number;');
		expect(output).toContain('\t"ctrl\\u0001": number;');
	});

	test("skips metamethod-style keys and reports keys TypeScript cannot name", () => {
		const root = new LuaTable();
		root.set("__index", 1);
		root.set("kept", 2);
		root.set(true, 3);
		root.set(1.5, 4);
		const output = generate("Odd", root);
		expect(output).not.toContain("__index");
		expect(output).toContain("\tkept: number;");
		expect(output).toContain(
			'\t * Omitted 2 non-representable Lua key(s) at "Odd";',
		);
	});

	test("marks cycles instead of recursing", () => {
		const root: Record<string, unknown> = { value: 1 };
		root.self = root;
		const child: Record<string, unknown> = {};
		child.parent = child;
		root.child = child;
		const output = generate("Cyclic", root);
		expect(output).toContain('\t * Cyclic reference at "Cyclic.self".');
		expect(output).toContain("\tself: unknown;");
		expect(output).toContain(
			'\t\t * Cyclic reference at "Cyclic.child.parent".',
		);
	});

	test("a shared (non-cyclic) table is expanded at each place it appears", () => {
		const shared = { x: 1 };
		const output = generate("Shared", { a: shared, b: shared });
		expect(output).toContain("\ta: {\n\t\tx: number;\n\t};");
		expect(output).toContain("\tb: {\n\t\tx: number;\n\t};");
	});

	test("a class-like root (className_) is not @noSelf", () => {
		const output = generate("Unit", { className_: "Unit", getName: () => {} });
		expect(output).not.toContain("@noSelf");
		expect(output).toContain("\tclassName_: string;");
	});

	test("sanitizes the version comment", () => {
		const output = generate("V", {}, "2.9 */ evil\nline");
		expect(output).toContain(" * @version 2.9 * / evil line\n");
	});

	test("fails when the namespace is not a table", () => {
		expect(() => generate("Missing", undefined)).toThrow(
			"tslua-dcs export Missing: root is not a table",
		);
		expect(() => generate("Scalar", 5)).toThrow("root is not a table");
	});

	test("fails without a DCS version", () => {
		expect(() => generate("NoVersion", {}, "")).toThrow(
			"tslua-dcs export NoVersion: DCS version is missing",
		);
	});

	test("enforces the depth limit", () => {
		const root: Record<string, unknown> = {};
		let level = root;
		for (let depth = 0; depth < 14; depth++) {
			const next: Record<string, unknown> = {};
			level.next = next;
			level = next;
		}
		expect(() => generate("Deep", root)).toThrow("depth limit at Deep.next");
	});

	test("enforces the member limit", () => {
		const root: Record<string, number> = {};
		for (let index = 0; index <= 20000; index++) root[`m${index}`] = index;
		expect(() => generate("Wide", root)).toThrow(
			"tslua-dcs export Wide: member limit at Wide",
		);
	});

	test("enforces the size limit", () => {
		const root: Record<string, number> = {};
		const padding = string.rep("x", 200);
		for (let index = 0; index < 12000; index++)
			root[`${padding}${index}`] = index;
		expect(() => generate("Large", root)).toThrow(
			"generated source exceeds size limit",
		);
	});
});
