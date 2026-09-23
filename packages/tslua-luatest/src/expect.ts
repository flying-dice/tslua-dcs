/** @noSelfInFile */

import { type Difference, deepDiff, isInstanceOf } from "./equality";
import { describeStringDifference, formatValue, isNaNValue } from "./format";
import { type CallArgs, isMock, type Mock } from "./mock";

/** Name given to errors raised by failed assertions. */
export const ASSERTION_ERROR = "AssertionError";

/** Raises an assertion failure. The error is a TypeScriptToLua `Error` named `AssertionError`. */
export function fail(message = "fail() was called"): never {
	const error = new Error(message);
	error.name = ASSERTION_ERROR;
	throw error;
}

/** True when `error` was raised by a failed assertion ({@link fail} or a matcher). */
export function isAssertionError(error: unknown): boolean {
	return type(error) === "table" && (error as Error).name === ASSERTION_ERROR;
}

/**
 * The message of any thrown value: a TypeScriptToLua `Error`'s (or any table's) `message`
 * field, a string as-is (including the `chunk:line:` prefix Lua adds), anything else formatted.
 */
export function errorMessage(error: unknown): string {
	if (type(error) === "string") return error as string;
	if (type(error) === "table") {
		const message = (error as { message?: unknown }).message;
		if (type(message) === "string") return message as string;
	}
	return formatValue(error);
}

/** Strips the `chunk:line: ` position prefix Lua adds to string errors raised by `error()`. */
export function stripPosition(message: string): string {
	const [stripped] = string.gsub(message, "^[^\n]-:%d+: ", "", 1);
	return stripped;
}

/** What `toThrow` accepts: nothing (any error), a substring, or an object of exact/includes/pattern. */
export type ThrowExpectation =
	| string
	| {
			/** The message must equal this, with or without Lua's `chunk:line: ` prefix. */
			exact?: string;
			/** The message must contain this text (plain, no pattern characters). */
			includes?: string;
			/** The message must match this Lua pattern (`string.find`). */
			pattern?: string;
	  };

/**
 * Options for `toMatch`.
 * @noSelf
 */
export interface MatchOptions {
	/** Treat the pattern as plain text (no Lua pattern characters). */
	plain?: boolean;
}

/**
 * Matchers returned by {@link expect}. Every matcher is also available negated under `.not`.
 * @noSelf
 */
export interface Matchers {
	/** The same matchers, negated. */
	readonly not: Matchers;

	/** Identity: `rawequal(received, expected)`, except that `nan` is `nan`. Tables must be the same table. */
	toBe: (expected: unknown) => void;
	/** Deep structural equality (see `deepDiff`); reports the path to the first difference. */
	toEqual: (expected: unknown) => void;
	/** Like `toEqual`, and every pair of tables must also share the same metatable (class). */
	toStrictEqual: (expected: unknown) => void;

	/** The value is `nil`. (`undefined` and `null` are both `nil` in Lua.) */
	toBeUndefined: () => void;
	/** Alias of `toBeUndefined`. */
	toBeNil: () => void;
	/** Alias of `toBeUndefined`. */
	toBeNull: () => void;
	/** The value is not `nil` (`false` is defined). */
	toBeDefined: () => void;
	/** Lua truthiness: everything except `nil` and `false` is truthy, including `0` and `""`. */
	toBeTruthy: () => void;
	/** Lua truthiness: only `nil` and `false` are falsy. */
	toBeFalsy: () => void;
	/** The value is the number `nan`. */
	toBeNaN: () => void;
	/** `type(received) === luaType`, e.g. `"string"`, `"table"`, `"function"`, `"nil"`. */
	toBeTypeOf: (luaType: string) => void;
	/** `received instanceof ctor` for TypeScriptToLua classes (subclasses included). */
	toBeInstanceOf: (ctor: abstract new (...args: any[]) => unknown) => void;

	/** `received > expected` (numbers only). */
	toBeGreaterThan: (expected: number) => void;
	/** `received >= expected` (numbers only). */
	toBeGreaterThanOrEqual: (expected: number) => void;
	/** `received < expected` (numbers only). */
	toBeLessThan: (expected: number) => void;
	/** `received <= expected` (numbers only). */
	toBeLessThanOrEqual: (expected: number) => void;
	/** `|received - expected| < 10^-digits / 2`; `digits` defaults to 2. */
	toBeCloseTo: (expected: number, digits?: number) => void;

	/** A string contains a substring (plain text), or a table has a value that `toBe`s `item`. */
	toContain: (item: unknown) => void;
	/** A table has a value that `toEqual`s `item`. */
	toContainEqual: (item: unknown) => void;
	/** `#received === length` for strings and tables (TypeScriptToLua arrays use `#`). */
	toHaveLength: (length: number) => void;
	/** A string matches a Lua pattern (`string.find`), or contains it as plain text with `{ plain: true }`. */
	toMatch: (pattern: string, options?: MatchOptions) => void;
	/**
	 * The value has a non-nil property at `path` (and, when `value` is given and not nil, it
	 * `toEqual`s `value`). A string path is split on `.`; a segment that is not found as a string
	 * key is retried as a number (`"list.1"`). An array path uses its keys as-is (Lua keys, 1-based).
	 */
	toHaveProperty: (path: string | (string | number)[], value?: unknown) => void;

	/**
	 * Calls the function and expects it to raise an error.
	 * - `toThrow()` accepts any error.
	 * - `toThrow("text")` requires the message to contain `text` (plain substring, like Jest).
	 * - `toThrow({ exact })`, `{ includes }`, `{ pattern }` (Lua pattern): every given field must hold.
	 *
	 * The message is `error.message` for thrown `Error`s (tables with a `message` field), or the
	 * string itself for `error("...")`, including Lua's `chunk:line: ` prefix (`exact` ignores it).
	 */
	toThrow: (expected?: ThrowExpectation) => void;

	/** The mock was called at least once. */
	toHaveBeenCalled: () => void;
	/** The mock was called exactly `times` times. */
	toHaveBeenCalledTimes: (times: number) => void;
	/** Some call's arguments `toEqual` `args` (trailing `nil`s are ignored). */
	toHaveBeenCalledWith: (...args: unknown[]) => void;
	/** The last call's arguments `toEqual` `args`. */
	toHaveBeenLastCalledWith: (...args: unknown[]) => void;
	/** The `nth` call (1-based) had arguments that `toEqual` `args`. */
	toHaveBeenNthCalledWith: (nth: number, ...args: unknown[]) => void;
	/** Some call returned (first return value) a value that `toEqual`s `value`. */
	toHaveReturnedWith: (value: unknown) => void;
}

/** @noSelf */
interface Assertion {
	value: unknown;
	negated: boolean;
	label?: string;
}

function raise(assertion: Assertion, header: string, details: string): never {
	const lines: string[] = [];
	if (assertion.label !== undefined) lines.push(assertion.label);
	lines.push(header);
	if (details !== "") lines.push(details);
	return fail(lines.join("\n"));
}

function headerOf(
	assertion: Assertion,
	matcher: string,
	args = "expected",
): string {
	return `expect(received).${assertion.negated ? "not." : ""}${matcher}(${args})`;
}

/** Throws unless `pass` agrees with the (possibly negated) assertion. */
function verdict(
	assertion: Assertion,
	matcher: string,
	pass: boolean,
	details: () => string,
	args?: string,
): void {
	if (pass !== assertion.negated) return;
	raise(assertion, headerOf(assertion, matcher, args), details());
}

/** Wrong usage (e.g. a number matcher on a string): fails whether or not the assertion is negated. */
function usage(
	assertion: Assertion,
	matcher: string,
	problem: string,
	args?: string,
): never {
	return raise(
		assertion,
		headerOf(assertion, matcher, args),
		`Matcher error: ${problem}`,
	);
}

const fmt = (value: unknown) => formatValue(value);

function expectedReceived(
	assertion: Assertion,
	expected: unknown,
	received: unknown,
): string {
	const not = assertion.negated ? "not " : "";
	const lines = [
		`Expected: ${not}${fmt(expected)}`,
		`Received: ${fmt(received)}`,
	];
	if (
		!assertion.negated &&
		type(expected) === "string" &&
		type(received) === "string"
	) {
		const difference = describeStringDifference(
			expected as string,
			received as string,
		);
		if (difference !== undefined) lines.push(difference);
	}
	return lines.join("\n");
}

function describeDifference(
	assertion: Assertion,
	difference: Difference | undefined,
	expected: unknown,
): string {
	if (assertion.negated || difference === undefined) {
		return `Expected: not ${fmt(expected)}\nReceived: ${fmt(assertion.value)}`;
	}
	if (
		difference.path === "" &&
		(type(expected) !== "table" || type(assertion.value) !== "table")
	) {
		return expectedReceived(assertion, expected, assertion.value);
	}
	const lines = [
		`First difference at received${difference.path}: ${difference.reason}`,
		`  expected: ${fmt(difference.expected)}`,
		`  received: ${fmt(difference.received)}`,
	];
	if (
		type(difference.expected) === "string" &&
		type(difference.received) === "string"
	) {
		const strings = describeStringDifference(
			difference.expected as string,
			difference.received as string,
		);
		if (strings !== undefined) lines.push(strings);
	}
	lines.push(`Expected: ${fmt(expected)}`, `Received: ${fmt(assertion.value)}`);
	return lines.join("\n");
}

function isNumber(value: unknown): value is number {
	return type(value) === "number";
}

function compare(
	assertion: Assertion,
	matcher: string,
	expected: number,
	operator: string,
	test: (received: number, expected: number) => boolean,
): void {
	const received = assertion.value;
	if (!isNumber(received))
		usage(
			assertion,
			matcher,
			`received value must be a number, got ${fmt(received)}`,
		);
	if (!isNumber(expected))
		usage(
			assertion,
			matcher,
			`expected value must be a number, got ${fmt(expected)}`,
		);
	verdict(
		assertion,
		matcher,
		test(received, expected),
		() =>
			`Expected: ${assertion.negated ? "not " : ""}${operator} ${fmt(expected)}\nReceived: ${fmt(received)}`,
	);
}

function contains(text: string, fragment: string): boolean {
	const [found] = string.find(text, fragment, 1, true);
	return found !== undefined;
}

function argsList(args: CallArgs | unknown[], n?: number): unknown[] {
	const count = n ?? (args as CallArgs).n ?? args.length;
	const list: unknown[] = [];
	for (let i = 1; i <= count; i++)
		(list as any)[i - 1] = rawget(args as any, i);
	return list;
}

function formatArgs(args: unknown[], n: number): string {
	const parts: string[] = [];
	for (let i = 1; i <= n; i++) parts.push(fmt(rawget(args as any, i)));
	return `(${parts.join(", ")})`;
}

function formatCalls(mock: Mock): string {
	const calls = mock.mock.calls;
	if (calls.length === 0) return "Received: 0 calls";
	const lines = [
		`Received ${calls.length} call${calls.length === 1 ? "" : "s"}:`,
	];
	for (let i = 0; i < calls.length && i < 10; i++) {
		lines.push(`  ${i + 1}: ${formatArgs(calls[i], calls[i].n)}`);
	}
	if (calls.length > 10) lines.push(`  ... (${calls.length - 10} more)`);
	return lines.join("\n");
}

function requireMock(
	assertion: Assertion,
	matcher: string,
	args?: string,
): Mock {
	if (!isMock(assertion.value)) {
		usage(
			assertion,
			matcher,
			`received value must be a mock created by fn() or spyOn(), got ${fmt(assertion.value)}`,
			args,
		);
	}
	return assertion.value as Mock;
}

function callMatches(
	call: CallArgs,
	expected: unknown[],
	expectedCount: number,
): boolean {
	return (
		deepDiff(argsList(call), argsList(expected, expectedCount)) === undefined
	);
}

function resolveProperty(
	value: unknown,
	path: string | (string | number)[],
): { found: boolean; value: unknown } {
	let segments: unknown[];
	if (type(path) === "string") {
		segments = [];
		for (const [segment] of string.gmatch(path as string, "[^.]+"))
			segments.push(segment);
	} else {
		segments = path as unknown[];
	}
	let current = value;
	for (const segment of segments) {
		if (type(current) !== "table") return { found: false, value: undefined };
		let next = (current as any)[segment as any];
		if (next === undefined && type(path) === "string") {
			const numeric = tonumber(segment);
			if (numeric !== undefined) next = (current as any)[numeric];
		}
		if (next === undefined) return { found: false, value: undefined };
		current = next;
	}
	return { found: true, value: current };
}

function throwExpectationText(expected: ThrowExpectation | undefined): string {
	if (expected === undefined) return "";
	return fmt(expected);
}

type MatcherImpl = (assertion: Assertion, ...args: any[]) => void;

const matchers: Record<string, MatcherImpl> = {
	toBe: (a, expected: unknown) => {
		const received = a.value;
		const pass =
			rawequal(received, expected) ||
			(isNaNValue(received) && isNaNValue(expected));
		verdict(a, "toBe", pass, () => {
			let text = expectedReceived(a, expected, received);
			if (
				!a.negated &&
				type(received) === "table" &&
				deepDiff(received, expected) === undefined
			) {
				text = `${text}\nThe tables are equal but not the same table: use toEqual to compare contents.`;
			}
			return text;
		});
	},
	toEqual: (a, expected: unknown) => {
		const difference = deepDiff(a.value, expected);
		verdict(a, "toEqual", difference === undefined, () =>
			describeDifference(a, difference, expected),
		);
	},
	toStrictEqual: (a, expected: unknown) => {
		const difference = deepDiff(a.value, expected, true);
		verdict(a, "toStrictEqual", difference === undefined, () =>
			describeDifference(a, difference, expected),
		);
	},
	toBeUndefined: (a) => {
		verdict(
			a,
			"toBeUndefined",
			a.value === undefined,
			() => `Received: ${fmt(a.value)}`,
			"",
		);
	},
	toBeNil: (a) => {
		verdict(
			a,
			"toBeNil",
			a.value === undefined,
			() => `Received: ${fmt(a.value)}`,
			"",
		);
	},
	toBeNull: (a) => {
		verdict(
			a,
			"toBeNull",
			a.value === undefined,
			() => `Received: ${fmt(a.value)}`,
			"",
		);
	},
	toBeDefined: (a) => {
		verdict(
			a,
			"toBeDefined",
			a.value !== undefined,
			() => `Received: ${fmt(a.value)}`,
			"",
		);
	},
	toBeTruthy: (a) => {
		const pass = a.value !== undefined && a.value !== false;
		verdict(
			a,
			"toBeTruthy",
			pass,
			() => `Received: ${fmt(a.value)} (only nil and false are falsy in Lua)`,
			"",
		);
	},
	toBeFalsy: (a) => {
		const pass = a.value === undefined || a.value === false;
		verdict(
			a,
			"toBeFalsy",
			pass,
			() => `Received: ${fmt(a.value)} (only nil and false are falsy in Lua)`,
			"",
		);
	},
	toBeNaN: (a) => {
		const pass = isNaNValue(a.value);
		verdict(a, "toBeNaN", pass, () => `Received: ${fmt(a.value)}`, "");
	},
	toBeTypeOf: (a, luaType: string) => {
		verdict(
			a,
			"toBeTypeOf",
			type(a.value) === luaType,
			() =>
				`Expected type: ${a.negated ? "not " : ""}${fmt(luaType)}\nReceived type: ${fmt(type(a.value))}\nReceived: ${fmt(a.value)}`,
		);
	},
	toBeInstanceOf: (a, ctor: unknown) => {
		if (type(ctor) !== "table")
			usage(a, "toBeInstanceOf", `expected a class, got ${fmt(ctor)}`);
		const name = rawget(ctor as any, "name");
		verdict(
			a,
			"toBeInstanceOf",
			isInstanceOf(a.value, ctor),
			() =>
				`Expected: ${a.negated ? "not " : ""}an instance of ${tostring(name ?? "the class")}\nReceived: ${fmt(a.value)}`,
		);
	},
	toBeGreaterThan: (a, e: number) =>
		compare(a, "toBeGreaterThan", e, ">", (r, x) => r > x),
	toBeGreaterThanOrEqual: (a, e: number) =>
		compare(a, "toBeGreaterThanOrEqual", e, ">=", (r, x) => r >= x),
	toBeLessThan: (a, e: number) =>
		compare(a, "toBeLessThan", e, "<", (r, x) => r < x),
	toBeLessThanOrEqual: (a, e: number) =>
		compare(a, "toBeLessThanOrEqual", e, "<=", (r, x) => r <= x),
	toBeCloseTo: (a, expected: number, digits?: number) => {
		const places = digits ?? 2;
		const received = a.value;
		if (!isNumber(received))
			usage(
				a,
				"toBeCloseTo",
				`received value must be a number, got ${fmt(received)}`,
			);
		if (!isNumber(expected))
			usage(
				a,
				"toBeCloseTo",
				`expected value must be a number, got ${fmt(expected)}`,
			);
		const tolerance = 10 ** -places / 2;
		const pass =
			(received === math.huge && expected === math.huge) ||
			(received === -math.huge && expected === -math.huge) ||
			math.abs(received - expected) < tolerance;
		verdict(
			a,
			"toBeCloseTo",
			pass,
			() =>
				`Expected: ${a.negated ? "not " : ""}${fmt(expected)} (within ${fmt(tolerance)}, ${places} digits)\nReceived: ${fmt(received)}\nDifference: ${fmt(math.abs(received - expected))}`,
		);
	},
	toContain: (a, item: unknown) => {
		const received = a.value;
		let pass = false;
		if (type(received) === "string") {
			if (type(item) !== "string")
				usage(
					a,
					"toContain",
					`a string can only contain a string, got ${fmt(item)}`,
				);
			pass = contains(received as string, item as string);
		} else if (type(received) === "table") {
			for (const [_, value] of pairs(received as object)) {
				if (rawequal(value, item) || (isNaNValue(value) && isNaNValue(item))) {
					pass = true;
					break;
				}
			}
		} else {
			usage(
				a,
				"toContain",
				`received value must be a string or a table, got ${fmt(received)}`,
			);
		}
		verdict(
			a,
			"toContain",
			pass,
			() =>
				`Expected: ${a.negated ? "not " : ""}to contain ${fmt(item)}\nReceived: ${fmt(received)}`,
		);
	},
	toContainEqual: (a, item: unknown) => {
		const received = a.value;
		if (type(received) !== "table")
			usage(
				a,
				"toContainEqual",
				`received value must be a table, got ${fmt(received)}`,
			);
		let pass = false;
		for (const [_, value] of pairs(received as object)) {
			if (deepDiff(value, item) === undefined) {
				pass = true;
				break;
			}
		}
		verdict(
			a,
			"toContainEqual",
			pass,
			() =>
				`Expected: ${a.negated ? "not " : ""}to contain an item equal to ${fmt(item)}\nReceived: ${fmt(received)}`,
		);
	},
	toHaveLength: (a, length: number) => {
		const received = a.value;
		if (type(received) !== "string" && type(received) !== "table") {
			usage(
				a,
				"toHaveLength",
				`received value must be a string or a table, got ${fmt(received)}`,
			);
		}
		const actual = (received as string).length;
		verdict(
			a,
			"toHaveLength",
			actual === length,
			() =>
				`Expected length: ${a.negated ? "not " : ""}${fmt(length)}\nReceived length: ${fmt(actual)}\nReceived: ${fmt(received)}`,
		);
	},
	toMatch: (a, pattern: string, options?: MatchOptions) => {
		const received = a.value;
		if (type(received) !== "string")
			usage(
				a,
				"toMatch",
				`received value must be a string, got ${fmt(received)}`,
			);
		if (type(pattern) !== "string")
			usage(a, "toMatch", `pattern must be a string, got ${fmt(pattern)}`);
		const plain = options?.plain === true;
		const [ok, found] = pcall(
			() => string.find(received as string, pattern, 1, plain)[0],
		);
		if (!ok)
			usage(
				a,
				"toMatch",
				`invalid Lua pattern ${fmt(pattern)}: ${tostring(found)}`,
			);
		verdict(
			a,
			"toMatch",
			found !== undefined,
			() =>
				`${plain ? "Plain text" : "Pattern"}: ${a.negated ? "not " : ""}${fmt(pattern)}\nReceived: ${fmt(received)}`,
		);
	},
	toHaveProperty: (a, path: string | (string | number)[], value?: unknown) => {
		const resolved = resolveProperty(a.value, path);
		let pass = resolved.found;
		let difference: Difference | undefined;
		if (pass && value !== undefined) {
			difference = deepDiff(resolved.value, value);
			pass = difference === undefined;
		}
		verdict(
			a,
			"toHaveProperty",
			pass,
			() => {
				const lines = [`Path: ${fmt(path)}`];
				if (!resolved.found)
					lines.push("The path does not resolve to a non-nil value");
				else lines.push(`Value at path: ${fmt(resolved.value)}`);
				if (value !== undefined)
					lines.push(`Expected value: ${a.negated ? "not " : ""}${fmt(value)}`);
				if (difference !== undefined && difference.path !== "") {
					lines.push(
						`First difference at value${difference.path}: ${difference.reason}`,
					);
				}
				lines.push(`Received: ${fmt(a.value)}`);
				return lines.join("\n");
			},
			value === undefined ? "path" : "path, value",
		);
	},
	toThrow: (a, expected?: ThrowExpectation) => {
		const args = throwExpectationText(expected);
		if (type(a.value) !== "function" && !isMock(a.value)) {
			usage(a, "toThrow", "Expected a function for toThrow matcher", args);
		}
		const [ok, thrown] = pcall(a.value as () => void);
		const threw = !ok;
		const message = threw ? errorMessage(thrown) : "";
		const problems: string[] = [];
		if (threw && expected !== undefined) {
			if (type(expected) === "string") {
				if (!contains(message, expected as string))
					problems.push(`does not contain ${fmt(expected)}`);
			} else {
				const spec = expected as Exclude<ThrowExpectation, string>;
				if (
					spec.exact !== undefined &&
					message !== spec.exact &&
					stripPosition(message) !== spec.exact
				) {
					problems.push(`is not exactly ${fmt(spec.exact)}`);
				}
				if (spec.includes !== undefined && !contains(message, spec.includes)) {
					problems.push(`does not contain ${fmt(spec.includes)}`);
				}
				if (spec.pattern !== undefined) {
					const [found] = string.find(message, spec.pattern);
					if (found === undefined)
						problems.push(`does not match pattern ${fmt(spec.pattern)}`);
				}
			}
		}
		const pass = threw && problems.length === 0;
		verdict(
			a,
			"toThrow",
			pass,
			() => {
				if (!threw) return "Received function did not throw";
				if (a.negated) {
					return expected === undefined
						? `Received function threw: ${fmt(message)}`
						: `Expected the error not to match ${args}\nThrown message: ${fmt(message)}`;
				}
				return `Thrown message ${problems.join(" and ")}\nThrown message: ${fmt(message)}`;
			},
			args,
		);
	},
	toHaveBeenCalled: (a) => {
		const mock = requireMock(a, "toHaveBeenCalled", "");
		verdict(
			a,
			"toHaveBeenCalled",
			mock.mock.calls.length > 0,
			() => `Mock: ${mock.getMockName()}\n${formatCalls(mock)}`,
			"",
		);
	},
	toHaveBeenCalledTimes: (a, times: number) => {
		const mock = requireMock(a, "toHaveBeenCalledTimes");
		verdict(
			a,
			"toHaveBeenCalledTimes",
			mock.mock.calls.length === times,
			() =>
				`Mock: ${mock.getMockName()}\nExpected calls: ${a.negated ? "not " : ""}${times}\n${formatCalls(mock)}`,
		);
	},
	toHaveBeenCalledWith: (a, ...args: unknown[]) => {
		const count = select("#", ...args);
		const expected = [...args];
		const mock = requireMock(a, "toHaveBeenCalledWith", "...args");
		let pass = false;
		for (const call of mock.mock.calls) {
			if (callMatches(call, expected, count)) {
				pass = true;
				break;
			}
		}
		verdict(
			a,
			"toHaveBeenCalledWith",
			pass,
			() =>
				`Mock: ${mock.getMockName()}\nExpected: ${a.negated ? "no call with " : ""}${formatArgs(expected, count)}\n${formatCalls(mock)}`,
			"...args",
		);
	},
	toHaveBeenLastCalledWith: (a, ...args: unknown[]) => {
		const count = select("#", ...args);
		const expected = [...args];
		const mock = requireMock(a, "toHaveBeenLastCalledWith", "...args");
		const last = mock.mock.lastCall;
		const pass = last !== undefined && callMatches(last, expected, count);
		verdict(
			a,
			"toHaveBeenLastCalledWith",
			pass,
			() =>
				`Mock: ${mock.getMockName()}\nExpected last call: ${a.negated ? "not " : ""}${formatArgs(expected, count)}\n${formatCalls(mock)}`,
			"...args",
		);
	},
	toHaveBeenNthCalledWith: (a, nth: number, ...args: unknown[]) => {
		const count = select("#", ...args);
		const expected = [...args];
		const mock = requireMock(a, "toHaveBeenNthCalledWith", "nth, ...args");
		const call = mock.mock.calls[nth - 1];
		const pass = call !== undefined && callMatches(call, expected, count);
		verdict(
			a,
			"toHaveBeenNthCalledWith",
			pass,
			() =>
				`Mock: ${mock.getMockName()}\nExpected call ${nth}: ${a.negated ? "not " : ""}${formatArgs(expected, count)}\n${formatCalls(mock)}`,
			"nth, ...args",
		);
	},
	toHaveReturnedWith: (a, value: unknown) => {
		const mock = requireMock(a, "toHaveReturnedWith");
		let pass = false;
		const returned: unknown[] = [];
		for (const result of mock.mock.results) {
			if (result.type !== "return") continue;
			returned.push(result.value);
			if (deepDiff(result.value, value) === undefined) {
				pass = true;
				break;
			}
		}
		verdict(
			a,
			"toHaveReturnedWith",
			pass,
			() =>
				`Mock: ${mock.getMockName()}\nExpected: ${a.negated ? "not " : ""}${fmt(value)}\nReturned values: ${fmt(returned)}`,
		);
	},
};

const expectationMeta = {
	__index: (target: { assertion: Assertion }, key: unknown) => {
		if (key === "not") {
			const current = target.assertion;
			return createExpectation({
				value: current.value,
				negated: !current.negated,
				label: current.label,
			});
		}
		const matcher = matchers[key as string];
		if (matcher === undefined) {
			error(`expect(...).${tostring(key)} is not a luatest matcher`, 2);
		}
		return (...args: any[]) => matcher(target.assertion, ...args);
	},
};

function createExpectation(assertion: Assertion): Matchers {
	return setmetatable(
		{ assertion },
		expectationMeta as any,
	) as unknown as Matchers;
}

/**
 * Starts an assertion about `value`. `label`, when given, is printed first in the failure message
 * (useful inside loops: `expect(decoded, "case " + name).toEqual(expected)`).
 */
export function expect(value: unknown, label?: string): Matchers {
	return createExpectation({ value, negated: false, label });
}
