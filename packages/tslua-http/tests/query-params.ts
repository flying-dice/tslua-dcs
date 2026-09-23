import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { getQueryParams } from "../src/query-params";

describe("getQueryParams", () => {
	test("parses multiple query parameters", () => {
		expect(getQueryParams("http://example.com?page=1&sort=asc")).toEqual({
			page: "1",
			sort: "asc",
		});
	});

	test("returns an empty table for a URL without a query string", () => {
		expect(getQueryParams("http://example.com")).toEqual({});
		expect(getQueryParams("/path")).toEqual({});
	});

	test("parses a single query parameter", () => {
		expect(getQueryParams("http://example.com?search=javascript")).toEqual({
			search: "javascript",
		});
	});

	test("keeps empty names and empty values", () => {
		expect(getQueryParams("http://example.com?name=&=value")).toEqual({
			name: "",
			"": "value",
		});
	});

	test("works on a request target (path only)", () => {
		expect(getQueryParams("/api/units?coalition=blue&limit=10")).toEqual({
			coalition: "blue",
			limit: "10",
		});
	});

	test("a trailing '?' yields no parameters", () => {
		expect(getQueryParams("/path?")).toEqual({});
	});

	test("a parameter without '=' has no value, so it is absent", () => {
		expect(getQueryParams("/path?flag&x=1")).toEqual({ x: "1" });
	});

	test("a repeated parameter keeps the last value", () => {
		expect(getQueryParams("/path?a=1&a=2")).toEqual({ a: "2" });
	});

	test("values are not URI-decoded", () => {
		expect(getQueryParams("/path?q=hello%20world&p=a+b")).toEqual({
			q: "hello%20world",
			p: "a+b",
		});
	});

	// Documents current limitations (see the PR notes): values are split on every '=' and '?'.
	test("a value containing '=' is truncated at the '='", () => {
		expect(getQueryParams("/path?token=abc==")).toEqual({ token: "abc" });
	});

	test("anything after a second '?' is ignored", () => {
		expect(getQueryParams("/path?a=1?b=2")).toEqual({ a: "1" });
	});

	test("an empty pair between '&&' is ignored", () => {
		expect(getQueryParams("/path?a=1&&b=2")).toEqual({ a: "1", b: "2" });
	});
});
