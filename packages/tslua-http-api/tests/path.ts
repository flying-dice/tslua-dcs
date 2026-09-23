import { describe, expect, test } from "@flying-dice/tslua-luatest";
import {
	gSubEscapeReservedChars,
	gSubPathParamsToPattern,
	getParamNames,
	getPathParameters,
	isMatch,
	routeToPattern,
} from "../src/path";

describe("isMatch", () => {
	test("should return true for exact match", () => {
		expect(isMatch("/home", "/home")).toBe(true);
	});

	test("should return false for non-matching paths", () => {
		expect(isMatch("/home", "/about")).toBe(false);
	});

	test("should return true for matching dynamic segments", () => {
		expect(isMatch("/user/:id", "/user/123")).toBe(true);
	});

	test("should return false for non-matching dynamic segments", () => {
		expect(isMatch("/user/:id", "/user/")).toBe(false);
	});

	test("matches the whole path, not a prefix or suffix", () => {
		expect(isMatch("/api", "/api/users")).toBe(false);
		expect(isMatch("/users", "/api/users")).toBe(false);
		expect(isMatch("/api/users", "/api/users/")).toBe(false);
	});

	test("the root route only matches the root path", () => {
		expect(isMatch("/", "/")).toBe(true);
		expect(isMatch("/", "/home")).toBe(false);
	});

	test("is case sensitive", () => {
		expect(isMatch("/Home", "/home")).toBe(false);
	});

	test("a parameter matches exactly one segment", () => {
		expect(isMatch("/user/:id", "/user/1/2")).toBe(false);
		expect(isMatch("/user/:id/posts", "/user/1/posts")).toBe(true);
		expect(isMatch("/user/:id/posts", "/user/1/comments")).toBe(false);
	});

	test("a parameter accepts every RFC 3986 safe character and percent-escapes", () => {
		for (const value of [
			"Ground-1",
			"Ground_2",
			"Ground~3",
			"Ground.4",
			"Ground!5",
			"Ground$6",
			"Ground'7",
			"Ground(8)",
			"Ground*9",
			"Ground+10",
			"Ground,11",
			"Ground;12",
			"Ground=13",
			"Aerobatics%20%23003",
		]) {
			expect(isMatch("/complex/:id", `/complex/${value}`), value).toBe(true);
		}
	});

	test("a parameter rejects characters outside the safe set", () => {
		for (const value of ["a b", "a#b", "a@b", "a:b", "a<b>", "a?b"]) {
			expect(isMatch("/complex/:id", `/complex/${value}`), value).toBe(false);
		}
	});

	test("route characters that are Lua pattern magic match literally", () => {
		expect(isMatch("/fixed/Ground.4", "/fixed/Ground.4")).toBe(true);
		expect(isMatch("/fixed/Ground.4", "/fixed/GroundX4")).toBe(false);
		expect(isMatch("/fixed/Ground(8)", "/fixed/Ground(8)")).toBe(true);
		expect(isMatch("/fixed/Ground*9", "/fixed/Ground*9")).toBe(true);
		expect(isMatch("/fixed/Ground*9", "/fixed/Groun9")).toBe(false);
		expect(isMatch("/fixed/Ground+10", "/fixed/Ground+10")).toBe(true);
		expect(isMatch("/fixed/Ground+10", "/fixed/Groundd10")).toBe(false);
		expect(isMatch("/fixed/Ground-1", "/fixed/Ground-1")).toBe(true);
		expect(isMatch("/fixed/Ground-1", "/fixed/Groun1")).toBe(false);
		expect(isMatch("/fixed/a%b", "/fixed/a%b")).toBe(true);
		expect(isMatch("/a?b", "/a?b")).toBe(true);
		expect(isMatch("/a?b", "/b")).toBe(false);
		expect(isMatch("/x[1]", "/x[1]")).toBe(true);
		expect(isMatch("/x[1]", "/x1")).toBe(false);
		expect(isMatch("/a^b$", "/a^b$")).toBe(true);
	});

	test("letters in a route match only themselves", () => {
		// Regression: `w` used to be escaped to the `%w` class, so "/show" matched "/shoX".
		expect(isMatch("/show", "/show")).toBe(true);
		expect(isMatch("/show", "/shoX")).toBe(false);
		expect(isMatch("/www", "/abc")).toBe(false);
	});

	test("parameter names may contain `w` and underscores", () => {
		// Regression: ":wid" never matched and ":user_id" matched "/users/5_id" only.
		expect(isMatch("/users/:wid", "/users/7")).toBe(true);
		expect(isMatch("/users/:user_id", "/users/5")).toBe(true);
		expect(isMatch("/users/:user_id", "/users/5_id")).toBe(true);
	});

	test("`*` is a literal character, not a wildcard", () => {
		expect(isMatch("/files/*", "/files/*")).toBe(true);
		expect(isMatch("/files/*", "/files/docs/file.txt")).toBe(false);
		expect(isMatch("/files/*", "/files/a")).toBe(false);
	});
});

describe("gSubEscapeReservedChars", () => {
	test("escapes every Lua pattern magic character", () => {
		expect(gSubEscapeReservedChars("^$()%.[]*+-?")).toBe(
			"%^%$%(%)%%%.%[%]%*%+%-%?",
		);
	});

	test("leaves letters, digits, `/`, `:` and `_` alone", () => {
		expect(gSubEscapeReservedChars("/api/v1/users/:user_id")).toBe(
			"/api/v1/users/:user_id",
		);
	});

	test("leaves the other RFC 3986 characters alone", () => {
		expect(gSubEscapeReservedChars("~!&',;=")).toBe("~!&',;=");
	});
});

describe("gSubPathParamsToPattern", () => {
	test("replaces each parameter with a capture of safe characters", () => {
		expect(gSubPathParamsToPattern("/a/:x/b/:y_z")).toBe(
			"/a/([%w_%%-%.~!$&'()*+,;=]+)/b/([%w_%%-%.~!$&'()*+,;=]+)",
		);
	});

	test("returns routes without parameters unchanged", () => {
		expect(gSubPathParamsToPattern("/a/b")).toBe("/a/b");
	});
});

describe("routeToPattern", () => {
	test("anchors the escaped pattern at both ends", () => {
		expect(routeToPattern("/a.b")).toBe("^/a%.b$");
	});

	test("combines escaping with parameter captures", () => {
		expect(routeToPattern("/v1.0/:id")).toBe(
			"^/v1%.0/([%w_%%-%.~!$&'()*+,;=]+)$",
		);
	});
});

describe("getParamNames", () => {
	test("returns parameter names in order", () => {
		expect(getParamNames("/groups/:groupId/units/:unitId")).toEqual([
			"groupId",
			"unitId",
		]);
	});

	test("keeps underscores in names", () => {
		expect(getParamNames("/users/:user_id")).toEqual(["user_id"]);
	});

	test("returns an empty list for a route without parameters", () => {
		expect(getParamNames("/health")).toEqual([]);
	});
});

describe("getPathParameters", () => {
	test("maps each parameter name to its segment", () => {
		expect(
			getPathParameters(
				"/groups/:groupId/units/:unitId",
				"/groups/Ground-1/units/Ground-1-1",
			),
		).toEqual({ groupId: "Ground-1", unitId: "Ground-1-1" });
	});

	test("keeps percent-escapes undecoded", () => {
		expect(getPathParameters("/complex/:id", "/complex/a%20b")).toEqual({
			id: "a%20b",
		});
	});

	test("supports names with `w` and underscores", () => {
		expect(getPathParameters("/u/:wid/:user_id", "/u/1/2")).toEqual({
			wid: "1",
			user_id: "2",
		});
	});

	test("returns an empty record for a route without parameters", () => {
		expect(getPathParameters("/health", "/health")).toEqual({});
	});

	test("returns an empty record when the path does not match", () => {
		expect(getPathParameters("/users/:id", "/other/1")).toEqual({});
	});
});
