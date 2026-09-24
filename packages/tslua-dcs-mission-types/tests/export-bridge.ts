/**
 * scripts/export.bridge.lua is the chunk `npm run export` evaluates inside DCS (through the project
 * mission bridge) to generate src/exports/*.export.ts from the live mission environment. These tests
 * run the same chunk on lua51 against synthetic namespaces, exactly as scripts/export.ts prepares it:
 * the two quoted placeholders are replaced by Lua string literals.
 */
import { describe, expect, test } from "@flying-dice/tslua-luatest";

function readBridge(): string {
	const [file, openError] = io.open("scripts/export.bridge.lua", "rb");
	if (!file) error(`cannot read the export bridge: ${openError}`);
	const source = file.read("*a") as string;
	file.close();
	return source;
}

const bridge = readBridge();

/** `%q` quoting is a valid Lua string literal for any bytes, like `lua()` in scripts/export.ts. */
function quote(value: string): string {
	return string.format("%q", value);
}

function exportNamespace(
	namespace: string,
	root: unknown,
	version = "2.9.29.27468",
): Record<string, string> {
	const [code] = string.gsub(
		string.gsub(bridge, "%[%[NAMESPACE%]%]", () => quote(namespace))[0],
		"%[%[DCS_VERSION%]%]",
		() => quote(version),
	);
	const [chunk, compileError] = loadstring(code, "=export.bridge.lua");
	if (!chunk) error(`bridge does not compile: ${compileError}`);
	const globals = _G as unknown as Record<string, unknown>;
	const previous = globals[namespace];
	globals[namespace] = root;
	try {
		return (chunk as () => Record<string, string>)();
	} finally {
		globals[namespace] = previous;
	}
}

function exported(namespace: string, root: unknown, version?: string): string {
	return exportNamespace(namespace, root, version)[`${namespace}.export.ts`];
}

describe("export bridge", () => {
	test("returns one file named after the namespace", () => {
		const files = exportNamespace("tsluaNamespace", { f: () => 1 });
		expect(Object.keys(files)).toEqual(["tsluaNamespace.export.ts"]);
	});

	test("a namespace becomes a @noSelf interface with typed members in sorted order", () => {
		const text = exported("tsluaNamespace", {
			zeta: () => 1,
			alpha: "text",
			count: 3,
			enabled: true,
			nested: { inner: () => 2, VALUE: 1 },
		});
		expect(text).toBe(
			[
				"/**",
				" * @version 2.9.29.27468",
				" * @noSelf",
				" */",
				"export interface _tsluaNamespace {",
				"\talpha: string;",
				"\tcount: number;",
				"\tenabled: boolean;",
				"\tnested: {",
				"\t\tVALUE: number;",
				"\t\tinner(...args: any[]): unknown;",
				"\t};",
				"\tzeta(...args: any[]): unknown;",
				"}",
				"",
			].join("\n"),
		);
	});

	test("a class table (with className_) is not @noSelf", () => {
		const text = exported("tsluaClass", {
			className_: "tsluaClass",
			getName: () => "x",
		});
		expect(text).not.toContain("@noSelf");
		expect(text).toContain(
			"\tclassName_: string;\n\tgetName(...args: any[]): unknown;\n",
		);
	});

	test("numeric keys come first as [n] and unusual string keys are quoted", () => {
		const root: Record<string | number, unknown> = {
			2: "two",
			1: "one",
			"with space": 1,
			'quo"te': 2,
			"back\\slash": 3,
			"tab\there": 4,
			"bell\u0007": 5,
			$valid_1: 6,
		};
		const text = exported("tsluaKeys", root);
		expect(text).toContain(
			[
				"\t[1]: string;",
				"\t[2]: string;",
				"\t$valid_1: number;",
				'\t"back\\\\slash": number;',
				'\t"bell\\u0007": number;',
				'\t"quo\\"te": number;',
				'\t"tab\\there": number;',
				'\t"with space": number;',
			].join("\n"),
		);
	});

	test("metamethod-style keys starting with __ are skipped", () => {
		const text = exported("tsluaHidden", {
			__index: {},
			__call: () => 1,
			visible: 1,
		});
		expect(text).not.toContain("__");
		expect(text).toContain("\tvisible: number;");
	});

	test("cycles are reported instead of followed", () => {
		const root: Record<string, unknown> = { name: "root" };
		const child: Record<string, unknown> = { back: root };
		root.child = child;
		child.self = child;
		const text = exported("tsluaCycle", root);
		expect(text).toContain(
			'\t\t * Cyclic reference at "tsluaCycle.child.back".',
		);
		expect(text).toContain("\t\tback: unknown;");
		expect(text).toContain(
			'\t\t * Cyclic reference at "tsluaCycle.child.self".',
		);
		expect(text).toContain("\t\tself: unknown;");
	});

	test("a table seen twice without a cycle is expanded both times", () => {
		const shared = { value: 1 };
		const text = exported("tsluaShared", { a: shared, b: shared });
		expect(text).toContain(
			"\ta: {\n\t\tvalue: number;\n\t};\n\tb: {\n\t\tvalue: number;\n\t};",
		);
	});

	test("keys TypeScript cannot name are counted in a comment", () => {
		const root = new LuaTable<AnyNotNil, unknown>();
		root.set(1.5, "fraction");
		root.set(true, "boolean");
		root.set({}, "table");
		root.set("kept", 1);
		const text = exported("tsluaOmitted", root);
		expect(text).toContain(
			'\t * Omitted 3 non-representable Lua key(s) at "tsluaOmitted";',
		);
		expect(text).toContain("\tkept: number;");
	});

	test("values of other Lua types become unknown", () => {
		const text = exported("tsluaOther", {
			routine: coroutine.create(() => undefined),
		});
		expect(text).toContain("\troutine: unknown;");
	});

	test("the version is sanitised so it cannot close the comment or add lines", () => {
		const text = exported("tsluaVersion", {}, "2.9 */ injected\r\nline");
		expect(text).toContain(" * @version 2.9 * / injected  line\n");
	});

	test("refuses a missing namespace", () => {
		expect(() => exported("tsluaMissing", undefined)).toThrow(
			"tslua-dcs export tsluaMissing: root is not a table",
		);
		expect(() => exported("tsluaString", "text")).toThrow(
			"root is not a table",
		);
	});

	test("refuses a missing DCS version", () => {
		expect(() => exported("tsluaNoVersion", {}, "")).toThrow(
			"tslua-dcs export tsluaNoVersion: DCS version is missing",
		);
	});

	test("stops at the depth limit", () => {
		const root: Record<string, unknown> = {};
		let current = root;
		for (let depth = 0; depth < 14; depth++) {
			const next: Record<string, unknown> = {};
			current.next = next;
			current = next;
		}
		expect(() => exported("tsluaDeep", root)).toThrow(
			"depth limit at tsluaDeep.next.next",
		);
	});

	test("stops at the member limit", () => {
		const root = new LuaTable<string, number>();
		for (let index = 1; index <= 20001; index++) root.set(`m${index}`, index);
		expect(() => exported("tsluaWide", root)).toThrow(
			"member limit at tsluaWide",
		);
	});

	test("stops at the generated size limit", () => {
		const root = new LuaTable<string, number>();
		const padding = string.rep("k", 200);
		for (let index = 1; index <= 10000; index++)
			root.set(`${padding}${index}`, index);
		expect(() => exported("tsluaLarge", root)).toThrow(
			"generated source exceeds size limit",
		);
	});
});
