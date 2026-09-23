/** @noSelfInFile */

import {
	describe,
	errorMessage,
	expect,
	fn,
	stripPosition,
	test,
} from "../src";
import { expectFailure } from "./helpers";

const throwsError = () => {
	throw new Error("disk full: 3 bytes left");
};
const raisesString = () => error("plain failure");
const raisesStringNoPosition = () => error("no position", 0);
const raisesTable = () => error({ code: 42 } as any);
const passes = () => {};

describe("toThrow", () => {
	test("toThrow() accepts any error", () => {
		expect(throwsError).toThrow();
		expect(raisesString).toThrow();
		expect(raisesTable).toThrow();
		expectFailure(
			() => expect(passes).toThrow(),
			"toThrow()",
			"Received function did not throw",
		);
	});

	test("toThrow(text) is a plain substring match on the message", () => {
		expect(throwsError).toThrow("disk full: 3 bytes left");
		expect(throwsError).toThrow("3 bytes");
		expect(raisesString).toThrow("plain failure");
		expect(() => error("50% (a+b)")).toThrow("% (a+b)");
		expectFailure(
			() => expect(throwsError).toThrow("network"),
			'does not contain "network"',
			'Thrown message: "disk full',
		);
		expectFailure(
			() => expect(passes).toThrow("x"),
			'toThrow("x")',
			"did not throw",
		);
	});

	test("{ exact } compares the whole message, ignoring Lua's position prefix", () => {
		expect(throwsError).toThrow({ exact: "disk full: 3 bytes left" });
		expect(raisesString).toThrow({ exact: "plain failure" });
		expect(raisesStringNoPosition).toThrow({ exact: "no position" });
		expectFailure(
			() => expect(throwsError).toThrow({ exact: "disk full" }),
			'is not exactly "disk full"',
		);
	});

	test("{ pattern } matches a Lua pattern", () => {
		expect(throwsError).toThrow({ pattern: "^disk full: %d+ bytes" });
		expect(raisesString).toThrow({ pattern: ":%d+: plain failure$" });
		expectFailure(
			() => expect(throwsError).toThrow({ pattern: "^%d" }),
			'does not match pattern "^%d"',
		);
	});

	test("{ includes } and combinations: every given field must hold", () => {
		expect(throwsError).toThrow({ includes: "full", pattern: "left$" });
		expectFailure(
			() => expect(throwsError).toThrow({ includes: "nope", pattern: "^x" }),
			'does not contain "nope" and does not match pattern "^x"',
		);
	});

	test("non-string, non-Error values are formatted", () => {
		expect(raisesTable).toThrow("code = 42");
	});

	test("not.toThrow", () => {
		expect(passes).not.toThrow();
		expect(throwsError).not.toThrow("network");
		expectFailure(
			() => expect(throwsError).not.toThrow(),
			"not.toThrow()",
			'Received function threw: "disk full',
		);
		expectFailure(
			() => expect(throwsError).not.toThrow("disk"),
			'Expected the error not to match "disk"',
		);
	});

	test("requires a function (backward compatible message)", () => {
		expectFailure(
			() => expect(1).toThrow("error"),
			"Expected a function for toThrow matcher",
		);
		expectFailure(
			() => expect(1).not.toThrow(),
			"Expected a function for toThrow matcher",
		);
	});

	test("accepts callable mocks", () => {
		const mock = fn(() => error("from mock", 0));
		expect(mock).toThrow({ exact: "from mock" });
	});

	test("the legacy exact-message call still passes", () => {
		expect(() => {
			throw new Error("error");
		}).toThrow("error");
	});
});

describe("error helpers", () => {
	test("errorMessage reads Error.message, strings and other values", () => {
		expect(errorMessage(new Error("boom"))).toBe("boom");
		expect(errorMessage("text")).toBe("text");
		expect(errorMessage({ message: "custom" })).toBe("custom");
		expect(errorMessage(12)).toBe("12");
		expect(errorMessage(undefined)).toBe("nil");
	});

	test("stripPosition removes a chunk:line: prefix only", () => {
		expect(stripPosition("tests.lua:12: boom")).toBe("boom");
		expect(stripPosition('[string "x"]:3: boom: 4: x')).toBe("boom: 4: x");
		expect(stripPosition("no prefix")).toBe("no prefix");
	});
});
