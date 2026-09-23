import { describe, expect, test } from "@flying-dice/tslua-luatest";
// SpecificationExtension is only re-exported as a type by the package index, so it is imported from its module.
import { SpecificationExtension } from "../src/openapi3-ts/model/specification-extension";

const invalidMessage = (name: string) =>
	`Invalid specification extension: '${name}'. Extensions must start with prefix 'x-`;

describe("SpecificationExtension", () => {
	describe("isValidExtension", () => {
		test("accepts names starting with x-", () => {
			expect(SpecificationExtension.isValidExtension("x-foo")).toBe(true);
			expect(SpecificationExtension.isValidExtension("x-")).toBe(true);
			expect(SpecificationExtension.isValidExtension("x-a.b-c")).toBe(true);
		});

		test("rejects every other name", () => {
			for (const name of [
				"",
				"x",
				"foo",
				"X-foo",
				"-x-foo",
				" x-foo",
				"ax-",
				"x_foo",
			]) {
				expect(
					SpecificationExtension.isValidExtension(name),
					`name "${name}"`,
				).toBe(false);
			}
		});

		test("treats Lua pattern characters literally", () => {
			expect(SpecificationExtension.isValidExtension("x%-")).toBe(false);
			expect(SpecificationExtension.isValidExtension(".-foo")).toBe(false);
		});
	});

	describe("addExtension / getExtension", () => {
		test("stores an extension as a property and reads it back", () => {
			const ext = new SpecificationExtension();
			const payload = { level: 3 };
			ext.addExtension("x-dcs", payload);
			expect(ext["x-dcs"]).toBe(payload);
			expect(ext.getExtension("x-dcs")).toBe(payload);
		});

		test("addExtension replaces an existing value", () => {
			const ext = new SpecificationExtension();
			ext.addExtension("x-a", 1);
			ext.addExtension("x-a", "two");
			expect(ext.getExtension("x-a")).toBe("two");
		});

		test("getExtension returns null (nil) for a missing extension", () => {
			expect(new SpecificationExtension().getExtension("x-missing")).toBeNull();
		});

		test("getExtension returns null (nil) for a false value", () => {
			const ext = new SpecificationExtension();
			ext.addExtension("x-flag", false);
			expect(ext["x-flag"]).toBe(false);
			expect(ext.getExtension("x-flag")).toBeNull();
		});

		test("getExtension returns 0 and empty strings (Lua truthiness; JavaScript would return null)", () => {
			const ext = new SpecificationExtension();
			ext.addExtension("x-zero", 0);
			ext.addExtension("x-empty", "");
			expect(ext.getExtension("x-zero")).toBe(0);
			expect(ext.getExtension("x-empty")).toBe("");
		});

		test("getExtension throws for an invalid name", () => {
			const ext = new SpecificationExtension();
			expect(() => ext.getExtension("foo")).toThrow({
				exact: invalidMessage("foo"),
			});
		});

		test("addExtension throws for an invalid name and stores nothing", () => {
			const ext = new SpecificationExtension();
			expect(() => ext.addExtension("X-foo", 1)).toThrow({
				exact: invalidMessage("X-foo"),
			});
			expect(
				(ext as unknown as Record<string, unknown>)["X-foo"],
			).toBeUndefined();
			expect(ext.listExtensions()).toEqual([]);
		});
	});

	describe("listExtensions", () => {
		test("is empty for a new instance", () => {
			expect(new SpecificationExtension().listExtensions()).toEqual([]);
		});

		test("lists every added extension", () => {
			const ext = new SpecificationExtension();
			ext.addExtension("x-a", 1);
			ext.addExtension("x-b", { nested: true });
			ext.addExtension("x-c", false);
			const names = ext.listExtensions();
			names.sort();
			expect(names).toEqual(["x-a", "x-b", "x-c"]);
		});

		test("ignores own properties that are not extensions and inherited members", () => {
			class Described extends SpecificationExtension {
				description = "not an extension";
			}
			const ext = new Described();
			ext.addExtension("x-only", 1);
			expect(ext.listExtensions()).toEqual(["x-only"]);
		});

		test("ignores non-string keys", () => {
			const ext = new SpecificationExtension();
			(ext as unknown as Record<number, string>)[1] = "x-numeric";
			ext.addExtension("x-real", true);
			expect(ext.listExtensions()).toEqual(["x-real"]);
		});

		test("returns a new array each call", () => {
			const ext = new SpecificationExtension();
			expect(ext.listExtensions()).not.toBe(ext.listExtensions());
		});
	});
});
