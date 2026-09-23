/** @noSelfInFile */

import { formatKey, formatValue, isNaNValue, sortedKeys } from "./format";

/**
 * An asymmetric matcher: a value that can stand in for an expected value inside `toEqual`,
 * `toHaveBeenCalledWith`, `toContainEqual` and `toHaveProperty`. Create them with
 * {@link anything} and {@link any}.
 * @noSelf
 */
export interface AsymmetricMatcher {
	/** Returns true when `received` is accepted. */
	readonly matches: (received: unknown) => boolean;
	/** How the matcher prints in failure messages. */
	readonly description: string;
}

const asymmetricMeta = {
	__luatest_format: (matcher: AsymmetricMatcher) => matcher.description,
	__tostring: (matcher: AsymmetricMatcher) => matcher.description,
};

/** Creates a custom {@link AsymmetricMatcher}. */
export function asymmetric(
	description: string,
	matches: (received: unknown) => boolean,
): AsymmetricMatcher {
	return setmetatable(
		{ matches, description },
		asymmetricMeta as any,
	) as AsymmetricMatcher;
}

/** True when `value` is an {@link AsymmetricMatcher}. */
export function isAsymmetric(value: unknown): value is AsymmetricMatcher {
	return (
		type(value) === "table" &&
		getmetatable(value as object) === (asymmetricMeta as any)
	);
}

/** Matches anything except `nil`. */
export function anything(): AsymmetricMatcher {
	return asymmetric("anything()", (received) => received !== undefined);
}

/**
 * Matches a value by Lua type name (`"string"`, `"number"`, `"table"`, `"function"`, `"boolean"`,
 * `"userdata"`, `"thread"`) or, when given a TypeScriptToLua class, by `instanceof`.
 */
export function any(
	expected: string | (abstract new (...args: any[]) => unknown),
): AsymmetricMatcher {
	if (type(expected) === "string") {
		return asymmetric(
			`any(${expected as string})`,
			(received) => type(received) === expected,
		);
	}
	const name = rawget(expected as any, "name");
	return asymmetric(`any(${tostring(name ?? "class")})`, (received) =>
		isInstanceOf(received, expected),
	);
}

/** Matches a string containing `fragment` (plain text). */
export function stringContaining(fragment: string): AsymmetricMatcher {
	return asymmetric(
		`stringContaining(${formatValue(fragment)})`,
		(received) => {
			if (type(received) !== "string") return false;
			const [found] = string.find(received as string, fragment, 1, true);
			return found !== undefined;
		},
	);
}

/** Matches a string against a Lua pattern. */
export function stringMatching(pattern: string): AsymmetricMatcher {
	return asymmetric(`stringMatching(${formatValue(pattern)})`, (received) => {
		if (type(received) !== "string") return false;
		const [found] = string.find(received as string, pattern);
		return found !== undefined;
	});
}

/** Matches a table that has at least the given keys, each deeply equal (recursive subset). */
export function objectContaining(subset: object): AsymmetricMatcher {
	return asymmetric(`objectContaining(${formatValue(subset)})`, (received) => {
		if (type(received) !== "table") return false;
		for (const [key, value] of pairs(subset)) {
			if (deepDiff(rawget(received as any, key), value) !== undefined)
				return false;
		}
		return true;
	});
}

/** `instanceof` for TypeScriptToLua classes; false for anything that is not a table. */
export function isInstanceOf(value: unknown, ctor: unknown): boolean {
	if (type(value) !== "table" || type(ctor) !== "table") return false;
	return value instanceof (ctor as any);
}

/**
 * Where and why two values differ.
 * @noSelf
 */
export interface Difference {
	/** Path from the root, e.g. `.list[2].name`; empty for the root value. */
	path: string;
	/** The expected value at `path` (undefined when missing). */
	expected: unknown;
	/** The received value at `path` (undefined when missing). */
	received: unknown;
	/** A short reason such as `"values differ"` or `"unexpected key"`. */
	reason: string;
}

type Seen = LuaTable<object, LuaTable<object, boolean>>;

function pathOf(path: string, key: unknown): string {
	const formatted = formatKey(key);
	return string.sub(formatted, 1, 1) === "["
		? `${path}${formatted}`
		: `${path}.${formatted}`;
}

function diff(
	received: unknown,
	expected: unknown,
	strict: boolean,
	path: string,
	seen: Seen,
): Difference | undefined {
	if (isAsymmetric(expected)) {
		return expected.matches(received)
			? undefined
			: {
					path,
					expected,
					received,
					reason: `does not match ${expected.description}`,
				};
	}
	if (rawequal(received, expected)) return undefined;
	if (isNaNValue(received) && isNaNValue(expected)) return undefined;
	const receivedType = type(received);
	const expectedType = type(expected);
	if (receivedType !== expectedType) {
		return {
			path,
			expected,
			received,
			reason: `expected a ${expectedType}, received a ${receivedType}`,
		};
	}
	if (receivedType !== "table")
		return { path, expected, received, reason: "values differ" };

	const r = received as object;
	const e = expected as object;
	let pairsSeen = seen.get(r);
	if (pairsSeen?.get(e)) return undefined; // already being compared higher up: assume equal
	if (pairsSeen === undefined) {
		pairsSeen = new LuaTable();
		seen.set(r, pairsSeen);
	}
	pairsSeen.set(e, true);

	if (strict && getmetatable(r) !== getmetatable(e)) {
		return { path, expected, received, reason: "metatables (classes) differ" };
	}
	for (const key of sortedKeys(e)) {
		const expectedValue = rawget(e as any, key as any);
		const receivedValue = rawget(r as any, key as any);
		const childPath = pathOf(path, key);
		if (receivedValue === undefined && !isAsymmetric(expectedValue)) {
			return {
				path: childPath,
				expected: expectedValue,
				received: undefined,
				reason: "missing key",
			};
		}
		const child = diff(receivedValue, expectedValue, strict, childPath, seen);
		if (child !== undefined) return child;
	}
	for (const key of sortedKeys(r)) {
		if (rawget(e as any, key as any) === undefined) {
			return {
				path: pathOf(path, key),
				expected: undefined,
				received: rawget(r as any, key as any),
				reason: "unexpected key",
			};
		}
	}
	return undefined;
}

/**
 * Deep structural comparison. Returns undefined when `received` equals `expected`, otherwise the
 * first {@link Difference} (keys are visited in sorted order, so the result is deterministic).
 *
 * - Non-tables compare with `rawequal`, except that `nan` equals `nan`.
 * - Tables compare key by key with `rawget` (metamethods are ignored); table keys compare by identity.
 * - Cycles are safe: a pair of tables already under comparison is assumed equal.
 * - `strict` additionally requires identical metatables, so a class instance never equals a plain
 *   table with the same fields.
 * - Asymmetric matchers in `expected` are applied to the received value.
 */
export function deepDiff(
	received: unknown,
	expected: unknown,
	strict = false,
): Difference | undefined {
	return diff(received, expected, strict, "", new LuaTable());
}

/** True when {@link deepDiff} finds no difference. */
export function deepEqual(
	received: unknown,
	expected: unknown,
	strict = false,
): boolean {
	return deepDiff(received, expected, strict) === undefined;
}
