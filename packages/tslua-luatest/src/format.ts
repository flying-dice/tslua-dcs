/** @noSelfInFile */

/**
 * Value formatting used by failure messages: binary-safe string previews, number formatting that
 * round-trips, and depth-limited table pretty-printing.
 */

/**
 * Options for {@link formatValue}.
 * @noSelf
 */
export interface FormatOptions {
	/** Nested tables deeper than this are shown as `{...}`. Default 3. */
	maxDepth?: number;
	/** Entries shown per table before `...` (N more). Default 20. */
	maxItems?: number;
	/** Bytes of a string shown before it is truncated. Default 120. */
	maxString?: number;
}

const DEFAULT_DEPTH = 3;
const DEFAULT_ITEMS = 20;
const DEFAULT_STRING = 120;

/** Bytes that are not printable ASCII (NUL, controls, DEL, >= 0x80). */
const NON_PRINTABLE = `[%z${string.char(1)}-${string.char(31)}${string.char(127)}-${string.char(255)}]`;
/** Bytes {@link escapeString} rewrites: non-printables plus `"` and `\`. */
const NEEDS_ESCAPE = `[%z${string.char(1)}-${string.char(31)}"\\${string.char(127)}-${string.char(255)}]`;

const NAMED_ESCAPES: Record<number, string> = {
	7: "\\a",
	8: "\\b",
	9: "\\t",
	10: "\\n",
	11: "\\v",
	12: "\\f",
	13: "\\r",
	34: '\\"',
	92: "\\\\",
};

/** True when every byte of `text` is printable ASCII (0x20-0x7e). */
export function isPrintable(text: string): boolean {
	const [found] = string.find(text, NON_PRINTABLE);
	return found === undefined;
}

/**
 * Escapes `text` as the body of a double-quoted Lua string literal. Printable ASCII is kept,
 * `"` and `\` are escaped, common controls use their named escape and every other byte
 * (controls, NUL, bytes >= 0x80) becomes a three-digit decimal escape such as `\000`.
 */
export function escapeString(text: string): string {
	const [escaped] = string.gsub(text, NEEDS_ESCAPE, (c: string) => {
		const byte = string.byte(c);
		return NAMED_ESCAPES[byte] ?? string.format("\\%03d", byte);
	});
	return escaped;
}

/** Quotes and escapes a string, truncating it after `maxString` bytes. */
export function formatString(text: string, maxString = DEFAULT_STRING): string {
	const length = text.length;
	if (length <= maxString) return `"${escapeString(text)}"`;
	return `"${escapeString(string.sub(text, 1, maxString))}"... (${length} bytes)`;
}

/** True for the number `nan` (the only value that is not equal to itself). */
export function isNaNValue(value: unknown): boolean {
	// biome-ignore lint/suspicious/noSelfCompare: NaN is the only value not equal to itself.
	return type(value) === "number" && value !== value;
}

/** Formats a number so that different numbers never print the same (`0.1 + 0.2` vs `0.3`). */
export function formatNumber(value: number): string {
	if (isNaNValue(value)) return "nan";
	if (value === math.huge) return "inf";
	if (value === -math.huge) return "-inf";
	const short = tostring(value);
	if (tonumber(short) === value) return short;
	return string.format("%.17g", value);
}

/** Hex dump of a string, e.g. `41 42 00`. */
export function toHex(text: string): string {
	const parts: string[] = [];
	for (let i = 1; i <= text.length; i++) {
		parts.push(string.format("%02x", string.byte(text, i)));
	}
	return table.concat(parts, " ");
}

/** The name of a TypeScriptToLua class instance (`Foo` for `new Foo()`), if any. */
export function className(value: object): string | undefined {
	const mt = getmetatable(value) as any;
	if (type(mt) !== "table") return undefined;
	const ctor = rawget(mt, "constructor");
	if (type(ctor) !== "table") return undefined;
	const name = rawget(ctor, "name");
	return type(name) === "string" ? (name as string) : undefined;
}

const IDENTIFIER = "^[%a_][%w_]*$";

/** Formats a table key the way it appears in a Lua table constructor or a path. */
export function formatKey(key: unknown): string {
	if (type(key) === "string") {
		const [found] = string.find(key as string, IDENTIFIER);
		if (found !== undefined) return key as string;
		return `[${formatString(key as string)}]`;
	}
	if (type(key) === "number") return `[${formatNumber(key as number)}]`;
	return `[${formatValue(key, { maxDepth: 0 })}]`;
}

function keyRank(key: unknown): number {
	const kind = type(key);
	if (kind === "number") return 1;
	if (kind === "string") return 2;
	if (kind === "boolean") return 3;
	return 4;
}

/** Table keys in a deterministic order: numbers ascending, then strings, booleans and the rest. */
export function sortedKeys(value: object): unknown[] {
	const keys: unknown[] = [];
	for (const [key] of pairs(value)) keys.push(key);
	table.sort(keys, (a, b) => {
		const ra = keyRank(a);
		const rb = keyRank(b);
		if (ra !== rb) return ra < rb;
		if (ra === 1 || ra === 2) return (a as any) < (b as any);
		return tostring(a) < tostring(b);
	});
	return keys;
}

/** Length of the array part `1..n` when the table is a pure sequence, otherwise undefined. */
export function sequenceLength(value: object): number | undefined {
	let count = 0;
	for (const [_] of pairs(value)) count++;
	for (let i = 1; i <= count; i++) {
		if (rawget(value as any, i) === undefined) return undefined;
	}
	return count;
}

function formatTable(
	value: object,
	depth: number,
	options: Required<FormatOptions>,
	seen: LuaTable<object, boolean>,
): string {
	const name = className(value);
	const prefix = name !== undefined ? `${name} ` : "";
	if (seen.get(value)) return `${prefix}<cycle>`;
	if (depth >= options.maxDepth) return `${prefix}{...}`;
	seen.set(value, true);
	const parts: string[] = [];
	const length = sequenceLength(value);
	let shown = 0;
	let total = 0;
	if (length !== undefined) {
		total = length;
		for (let i = 1; i <= length && shown < options.maxItems; i++) {
			parts.push(
				formatInner(rawget(value as any, i), depth + 1, options, seen),
			);
			shown++;
		}
	} else {
		const keys = sortedKeys(value);
		total = keys.length;
		for (const key of keys) {
			if (shown >= options.maxItems) break;
			const item = formatInner(
				rawget(value as any, key as any),
				depth + 1,
				options,
				seen,
			);
			parts.push(`${formatKey(key)} = ${item}`);
			shown++;
		}
	}
	seen.delete(value);
	if (total > shown) parts.push(`... (${total - shown} more)`);
	if (parts.length === 0) return `${prefix}{}`;
	return `${prefix}{ ${table.concat(parts, ", ")} }`;
}

function formatInner(
	value: unknown,
	depth: number,
	options: Required<FormatOptions>,
	seen: LuaTable<object, boolean>,
): string {
	const kind = type(value);
	if (kind === "nil") return "nil";
	if (kind === "string")
		return formatString(value as string, options.maxString);
	if (kind === "number") return formatNumber(value as number);
	if (kind === "boolean") return tostring(value);
	if (kind === "table") {
		const mt = getmetatable(value as object) as any;
		if (type(mt) === "table" && rawget(mt, "__luatest_format") !== undefined) {
			return (rawget(mt, "__luatest_format") as (v: unknown) => string)(value);
		}
		return formatTable(value as object, depth, options, seen);
	}
	return `<${tostring(value)}>`;
}

/**
 * Pretty-prints any Lua value for a failure message. Strings are quoted and escaped (binary safe),
 * tables are printed as Lua table constructors with sorted keys, limited in depth and width, and
 * cycles are shown as `<cycle>`. Functions, userdata and threads print as `<function: 0x...>`.
 */
export function formatValue(
	value: unknown,
	options: FormatOptions = {},
): string {
	const resolved: Required<FormatOptions> = {
		maxDepth: options.maxDepth ?? DEFAULT_DEPTH,
		maxItems: options.maxItems ?? DEFAULT_ITEMS,
		maxString: options.maxString ?? DEFAULT_STRING,
	};
	return formatInner(value, 0, resolved, new LuaTable());
}

/** 1-based index of the first byte where `a` and `b` differ, or undefined when equal. */
export function firstDifference(a: string, b: string): number | undefined {
	if (a === b) return undefined;
	const limit = math.min(a.length, b.length);
	let index = 1;
	while (index <= limit && string.byte(a, index) === string.byte(b, index))
		index++;
	return index;
}

const WINDOW_BEFORE = 16;
const WINDOW_AFTER = 32;

function window(text: string, from: number, to: number): string {
	const slice = string.sub(text, from, to);
	const head = from > 1 ? "..." : "";
	const tail = to < text.length ? "..." : "";
	const hex = isPrintable(slice) ? "" : `\n      hex: ${toHex(slice)}`;
	return `${head}"${escapeString(slice)}"${tail}${hex}`;
}

/**
 * Describes where two strings first differ: the byte offset (1-based), both lengths and an
 * escaped window of each string around the difference (with a hex dump when a window contains
 * non-printable bytes). Returns undefined when the strings are equal.
 */
export function describeStringDifference(
	expected: string,
	received: string,
): string | undefined {
	const index = firstDifference(expected, received);
	if (index === undefined) return undefined;
	const from = math.max(1, index - WINDOW_BEFORE);
	const to = index + WINDOW_AFTER;
	return [
		`strings differ at byte ${index} (expected ${expected.length} bytes, received ${received.length} bytes)`,
		`  expected bytes ${from}..${math.min(to, expected.length)}: ${window(expected, from, to)}`,
		`  received bytes ${from}..${math.min(to, received.length)}: ${window(received, from, to)}`,
	].join("\n");
}
