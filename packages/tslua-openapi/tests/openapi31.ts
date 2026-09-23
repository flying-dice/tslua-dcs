import { describe, expect, test } from "@flying-dice/tslua-luatest";
import {
	getPath,
	isReferenceObject,
	isSchemaObject,
	type PathsObject,
	type ReferenceObject,
	type SchemaObject,
} from "../src/openapi3-ts/oas31";

describe("getPath", () => {
	const paths: PathsObject = {
		"/units": { summary: "Units" },
		"x-internal": { summary: "an extension, not a path" },
	};

	test("returns the path item for a path", () => {
		expect(getPath(paths, "/units")).toBe(paths["/units"]);
	});

	test("returns undefined for a missing path", () => {
		expect(getPath(paths, "/groups")).toBeUndefined();
	});

	test("returns undefined for an undefined paths object", () => {
		expect(getPath(undefined, "/units")).toBeUndefined();
	});

	test("returns undefined for extension names, even when present", () => {
		expect(getPath(paths, "x-internal")).toBeUndefined();
	});
});

describe("isReferenceObject / isSchemaObject", () => {
	test("an object with $ref is a reference, not a schema", () => {
		const ref: ReferenceObject = { $ref: "#/components/schemas/Unit" };
		expect(isReferenceObject(ref)).toBe(true);
		expect(isSchemaObject(ref)).toBe(false);
	});

	test("a reference with a summary and description is still a reference", () => {
		const ref: ReferenceObject = {
			$ref: "#/x",
			summary: "s",
			description: "d",
		};
		expect(isReferenceObject(ref)).toBe(true);
	});

	test("a schema without $ref is a schema, not a reference", () => {
		const schema: SchemaObject = {
			type: "object",
			properties: { a: { $ref: "#/nested" } },
		};
		expect(isReferenceObject(schema)).toBe(false);
		expect(isSchemaObject(schema)).toBe(true);
	});

	test("an empty object is a schema", () => {
		expect(isReferenceObject({})).toBe(false);
		expect(isSchemaObject({})).toBe(true);
	});

	test("an undefined $ref is absent (Lua tables cannot hold nil)", () => {
		const obj = { $ref: undefined } as unknown as ReferenceObject;
		expect(isReferenceObject(obj)).toBe(false);
		expect(isSchemaObject(obj)).toBe(true);
	});

	test("only own properties count: a $ref inherited through the metatable is ignored", () => {
		const proto = { $ref: "#/inherited" };
		const obj = setmetatable(
			{},
			{ __index: proto },
		) as unknown as ReferenceObject;
		expect(obj.$ref).toBe("#/inherited");
		expect(isReferenceObject(obj)).toBe(false);
		expect(isSchemaObject(obj)).toBe(true);
	});

	test("a class instance with a $ref field is a reference", () => {
		class Ref {
			$ref = "#/components/schemas/Unit";
		}
		expect(isReferenceObject(new Ref())).toBe(true);
		expect(isSchemaObject(new Ref())).toBe(false);
	});
});
