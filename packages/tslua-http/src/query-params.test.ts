import { describe, expect, it } from "vitest";
import { getQueryParams } from "./query-params";

describe("getQueryParams", () => {
	it("should parse multiple query parameters", () => {
		const url = "http://example.com?page=1&sort=asc";
		const result = getQueryParams(url);
		expect(result).toEqual({ page: "1", sort: "asc" });
	});

	it("should handle URLs with no query parameters", () => {
		const url = "http://example.com";
		const result = getQueryParams(url);
		expect(result).toEqual({});
	});

	it("should correctly handle a URL with a single query parameter", () => {
		const url = "http://example.com?search=javascript";
		const result = getQueryParams(url);
		expect(result).toEqual({ search: "javascript" });
	});

	// Optional: Test for edge cases
	it("should handle URLs with empty parameter names or values", () => {
		const url = "http://example.com?name=&=value";
		const result = getQueryParams(url);
		expect(result).toEqual({ name: "", "": "value" });
	});
});
