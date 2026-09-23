import { describe, expect, test } from "@flying-dice/tslua-luatest";
import * as index from "../src";
import * as oas31Module from "../src/openapi3-ts/oas31";

const keysOf = (value: object): string[] => {
	const keys = Object.keys(value);
	keys.sort();
	return keys;
};

describe("package exports", () => {
	test("the index exports exactly the runtime values responses, body, oas31, Server and ServerVariable", () => {
		expect(keysOf(index)).toEqual([
			"Server",
			"ServerVariable",
			"body",
			"oas31",
			"responses",
		]);
	});

	test("the oas31 namespace is the oas31 module", () => {
		expect(index.oas31).toEqual(oas31Module);
	});

	test("the oas31 namespace exports the builder, model classes and helpers", () => {
		expect(keysOf(index.oas31)).toEqual([
			"OpenApiBuilder",
			"Server",
			"ServerVariable",
			"addExtension",
			"getExtension",
			"getPath",
			"isReferenceObject",
			"isSchemaObject",
		]);
	});

	test("Server and ServerVariable are the same classes in the index and in oas31", () => {
		expect(index.oas31.Server).toBe(index.Server);
		expect(index.oas31.ServerVariable).toBe(index.ServerVariable);
	});

	test("SpecificationExtension is a type-only export", () => {
		expect(
			(index.oas31 as unknown as Record<string, unknown>)
				.SpecificationExtension,
		).toBeUndefined();
	});
});
