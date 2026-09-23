import { describe, expect, test } from "@flying-dice/tslua-luatest";
import {
	addExtension,
	getExtension,
	type ISpecificationExtension,
} from "../src/openapi3-ts/oas31";

describe("getExtension", () => {
	test("returns undefined for an undefined object", () => {
		expect(getExtension(undefined, "x-foo")).toBeUndefined();
	});

	test("returns the value of a valid extension", () => {
		const payload = { a: 1 };
		const obj: ISpecificationExtension = { "x-foo": payload };
		expect(getExtension(obj, "x-foo")).toBe(payload);
	});

	test("returns falsy values as they are", () => {
		const obj: ISpecificationExtension = { "x-false": false, "x-zero": 0 };
		expect(getExtension(obj, "x-false")).toBe(false);
		expect(getExtension(obj, "x-zero")).toBe(0);
	});

	test("returns undefined for a missing extension", () => {
		expect(getExtension({}, "x-missing")).toBeUndefined();
	});

	test("returns undefined for an invalid name, even when the property exists", () => {
		const obj = { foo: "bar" } as unknown as ISpecificationExtension;
		expect(getExtension(obj, "foo")).toBeUndefined();
	});
});

describe("addExtension", () => {
	test("sets a valid extension on the object", () => {
		const obj: ISpecificationExtension = {};
		addExtension(obj, "x-foo", 42);
		expect(obj).toEqual({ "x-foo": 42 });
	});

	test("replaces an existing extension", () => {
		const obj: ISpecificationExtension = { "x-foo": 1 };
		addExtension(obj, "x-foo", 2);
		expect(obj).toEqual({ "x-foo": 2 });
	});

	test("ignores an invalid name without throwing", () => {
		const obj: ISpecificationExtension = {};
		expect(() => addExtension(obj, "foo", 42)).not.toThrow();
		expect(obj).toEqual({});
	});

	test("ignores an undefined object without throwing", () => {
		expect(() => addExtension(undefined, "x-foo", 42)).not.toThrow();
	});

	test("round-trips with getExtension", () => {
		const obj: ISpecificationExtension = {};
		addExtension(obj, "x-round", ["trip"]);
		expect(getExtension(obj, "x-round")).toEqual(["trip"]);
	});
});
