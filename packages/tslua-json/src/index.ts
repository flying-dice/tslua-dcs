/** @noSelfInFile */

/**
 * JSON ([RFC 8259](https://www.rfc-editor.org/rfc/rfc8259)) encoding and decoding,
 * written in TypeScript for TypeScriptToLua and compatible with Lua 5.1 (DCS World).
 *
 * Lua has one table type for both arrays and objects and no `null`, so a few
 * rules bridge the gap:
 *
 * - JSON `null` decodes to `undefined` (nil) by default: object keys holding
 *   `null` disappear and arrays get holes. Pass `{ nullValue: NULL }` to keep
 *   them as the {@link NULL} sentinel, which also encodes back to `null`.
 * - Decoded arrays and objects are marked, so an empty `[]` or `{}` re-encodes
 *   as itself. Tables you build are classified by their keys; an empty,
 *   unmarked table encodes as `[]` unless `emptyTable: "object"` is set or it
 *   is marked with {@link asObject}.
 * - Numbers are written exactly as JavaScript's `JSON.stringify` writes them
 *   (shortest round-trip form), so no precision is lost.
 *
 * @example
 * ```ts
 * import * as json from "@flying-dice/tslua-json";
 *
 * json.encode({ unit: "F-16C", alt: 7620.5 }); // '{"unit":"F-16C","alt":7620.5}' (key order may vary)
 * json.encode({ b: 1, a: [1, 2] }, { sortKeys: true, indent: 2 });
 * const value = json.decode<{ unit: string }>('{"unit":"F-16C"}');
 * ```
 *
 * @module
 */

declare const jsonNullBrand: unique symbol;

/** The type of the {@link NULL} sentinel. */
export interface JsonNull {
	readonly [jsonNullBrand]: true;
}

/** Any value that {@link encode} can represent without a `toJSON` method. */
export type JsonValue =
	| JsonNull
	| boolean
	| number
	| string
	| undefined
	| JsonValue[]
	| { [key: string]: JsonValue };

/** Options for {@link encode}. */
export interface EncodeOptions {
	/**
	 * Pretty-print with this indent: a number of spaces (clamped to 10) or a
	 * string (truncated to 10 characters), exactly like `JSON.stringify`'s
	 * `space` argument. Omitted, `0` or `""` produces compact output.
	 */
	indent?: number | string;
	/** Emit object keys in sorted (byte) order for deterministic output. Defaults to `false` (`pairs` order). */
	sortKeys?: boolean;
	/** How to encode an empty table that is not marked with {@link asArray}/{@link asObject}. Defaults to `"array"`. */
	emptyTable?: "array" | "object";
	/** Maximum nesting depth before encoding fails. Defaults to 512. */
	maxDepth?: number;
}

/** Options for {@link decode}. */
export interface DecodeOptions {
	/**
	 * The value JSON `null` decodes to. Defaults to `undefined` (nil), which
	 * removes object keys and leaves holes in arrays; pass {@link NULL} to keep them.
	 */
	nullValue?: unknown;
	/** Maximum nesting depth before decoding fails. Defaults to 512. */
	maxDepth?: number;
}

const DEFAULT_MAX_DEPTH = 512;

/** Largest magnitude below which every integer is exactly representable (2^53). */
const MAX_SAFE_MAGNITUDE = 9007199254740992;

/** False for NaN and ±Infinity: both make `n - n` NaN. */
function isFiniteNumber(n: number): boolean {
	return n - n === 0;
}

/** Smallest positive normal double; below it precision drops (subnormals). */
const MIN_NORMAL = 2.2250738585072014e-308;

// Marker metatables: decoded tables carry one, and asArray/asObject apply them.
const ARRAY_MT: LuaMetatable<object> = {};
const OBJECT_MT: LuaMetatable<object> = {};

/**
 * A sentinel for JSON `null`. It encodes as `null`, and {@link decode} returns
 * it for `null` when passed as `nullValue`. Read-only.
 */
export const NULL: JsonNull = setmetatable(
	{},
	{
		__tostring: () => "null",
		__newindex: () => error("json.NULL is read-only", 2),
	},
) as unknown as JsonNull;

/** Returns `true` if `value` is the {@link NULL} sentinel. */
export function isNull(value: unknown): value is JsonNull {
	return rawequal(value, NULL);
}

function markTable<T extends object>(
	value: T,
	mt: LuaMetatable<object>,
	fn: string,
): T {
	if (type(value) !== "table") {
		throw new Error(`json.${fn}: expected a table, got ${type(value)}`);
	}
	const current = getmetatable(value);
	if (current !== undefined && current !== ARRAY_MT && current !== OBJECT_MT) {
		throw new Error(
			`json.${fn}: the table already has a metatable (class instances cannot be re-marked)`,
		);
	}
	setmetatable(value, mt);
	return value;
}

/** Marks a table so it always encodes as a JSON array, even when empty. Returns the same table. */
export function asArray<T extends object>(value: T): T {
	return markTable(value, ARRAY_MT, "asArray");
}

/** Marks a table so it always encodes as a JSON object, even when empty. Returns the same table. */
export function asObject<T extends object>(value: T): T {
	return markTable(value, OBJECT_MT, "asObject");
}

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------

/**
 * Formats a finite number exactly as ECMAScript's Number::toString does
 * (the algorithm `JSON.stringify` uses): the shortest digits that round-trip,
 * laid out in plain or exponential notation by the same thresholds.
 */
function formatNumber(value: number): string {
	if (value === 0) return "0"; // also -0, as in JavaScript
	if (
		value === math.floor(value) &&
		value > -MAX_SAFE_MAGNITUDE &&
		value < MAX_SAFE_MAGNITUDE
	) {
		return string.format("%.0f", value);
	}

	// %.{p-1}e gives p significant digits, correctly rounded; the first p that
	// round-trips is the shortest. A normal double carries more than 15 digits
	// of precision, so if 15 digits round-trip then any shorter form is those 15
	// digits with trailing zeros (stripped below); only 16 and 17 need trying
	// after. Subnormals carry fewer digits, so for them every precision is tried.
	let scientific: string;
	if (math.abs(value) < MIN_NORMAL) {
		scientific = string.format("%.16e", value);
		for (let precision = 0; precision < 16; precision++) {
			const candidate = string.format(`%.${precision}e`, value);
			if (tonumber(candidate) === value) {
				scientific = candidate;
				break;
			}
		}
	} else {
		scientific = string.format("%.14e", value);
		if (tonumber(scientific) !== value) {
			scientific = string.format("%.15e", value);
			if (tonumber(scientific) !== value)
				scientific = string.format("%.16e", value);
		}
	}

	const [sign, lead, fraction, exponentText] = string.match(
		scientific,
		"^(-?)(%d)%.?(%d*)e([-+]%d+)$",
	);
	const [digits] = string.gsub(lead + fraction, "0+$", "");
	const k = digits.length;
	const n = (tonumber(exponentText) as number) + 1; // position of the decimal point

	let body: string;
	if (k <= n && n <= 21) {
		body = digits + string.rep("0", n - k);
	} else if (0 < n && n <= 21) {
		body = `${string.sub(digits, 1, n)}.${string.sub(digits, n + 1)}`;
	} else if (-6 < n && n <= 0) {
		body = `0.${string.rep("0", -n)}${digits}`;
	} else {
		const exponent = n - 1;
		const mantissa =
			k === 1 ? digits : `${string.sub(digits, 1, 1)}.${string.sub(digits, 2)}`;
		body = `${mantissa}e${exponent < 0 ? "-" : "+"}${math.abs(exponent)}`;
	}
	return sign + body;
}

// ---------------------------------------------------------------------------
// Encoding
// ---------------------------------------------------------------------------

const STRING_ESCAPES = new LuaTable<string, string>();
for (let code = 0; code < 32; code++) {
	STRING_ESCAPES.set(string.char(code), string.format("\\u%04x", code));
}
STRING_ESCAPES.set('"', '\\"');
STRING_ESCAPES.set("\\", "\\\\");
STRING_ESCAPES.set("\b", "\\b");
STRING_ESCAPES.set("\f", "\\f");
STRING_ESCAPES.set("\n", "\\n");
STRING_ESCAPES.set("\r", "\\r");
STRING_ESCAPES.set("\t", "\\t");

// `%c` also matches DEL (0x7F), which has no entry above and so is kept as-is.
const STRING_ESCAPE_PATTERN = '[%c"\\]';

function quoteString(value: string): string {
	const [special] = string.find(value, STRING_ESCAPE_PATTERN);
	if (special === undefined) return `"${value}"`;
	const [escaped] = string.gsub(
		value,
		STRING_ESCAPE_PATTERN,
		STRING_ESCAPES as unknown as Record<string, string>,
	);
	return `"${escaped}"`;
}

interface EncodeState {
	/** Output fragments, appended at `count` (a counter is cheaper than `#`). */
	readonly parts: LuaTable<number, string>;
	count: number;
	readonly indent: string;
	readonly sortKeys: boolean;
	readonly emptyAsObject: boolean;
	readonly maxDepth: number;
	/** Tables on the current path, for cycle detection. */
	readonly active: LuaTable<object, boolean>;
	/** The key at each depth of the current path (depth 1 is the root), for error messages. */
	readonly path: LuaTable<number, string | number>;
}

function emit(state: EncodeState, fragment: string): void {
	state.count++;
	state.parts.set(state.count, fragment);
}

const IDENTIFIER_PATTERN = "^[%a_$][%w_$]*$";

function formatPath(state: EncodeState, depth: number): string {
	const segments: string[] = ["$"];
	for (let level = 2; level <= depth; level++) {
		const segment = state.path.get(level);
		if (typeof segment === "number") {
			segments.push(`[${segment}]`);
		} else if (string.find(segment, IDENTIFIER_PATTERN)[0] !== undefined) {
			segments.push(`.${segment}`);
		} else {
			segments.push(`[${quoteString(segment)}]`);
		}
	}
	return table.concat(segments);
}

function encodeFailure(
	state: EncodeState,
	depth: number,
	message: string,
): never {
	throw new Error(`json.encode: ${message} at ${formatPath(state, depth)}`);
}

/** Returns the array length for an array-shaped table, or `undefined` for an object. */
function arrayLength(
	state: EncodeState,
	value: object,
	depth: number,
): number | undefined {
	const mt = getmetatable(value);
	if (mt === OBJECT_MT) return undefined;

	let count = 0;
	let maxIndex = 0;
	let allIndices = true;
	let allStrings = true;
	for (const [key] of pairs(value as LuaTable<AnyNotNil, unknown>)) {
		count++;
		if (typeof key === "number" && key > 0 && key === math.floor(key)) {
			if (key > maxIndex) maxIndex = key;
		} else {
			allIndices = false;
			if (typeof key !== "string") allStrings = false;
		}
	}

	if (mt === ARRAY_MT) {
		if (!allIndices)
			encodeFailure(
				state,
				depth,
				"a table marked as an array has non-index keys",
			);
		return maxIndex;
	}
	if (count === 0) return state.emptyAsObject ? undefined : 0;
	if (allIndices) {
		// Holes encode as null (as in JavaScript), but refuse pathological sparsity.
		if (maxIndex > count * 2 + 16) {
			encodeFailure(
				state,
				depth,
				`array is too sparse (${count} values, highest index ${maxIndex})`,
			);
		}
		return maxIndex;
	}
	if (allStrings) return undefined;
	return encodeFailure(
		state,
		depth,
		"cannot encode a table with keys that are not strings or positive integers",
	);
}

function objectKey(state: EncodeState, depth: number, key: unknown): string {
	if (typeof key === "string") return key;
	if (typeof key === "number" && isFiniteNumber(key)) return formatNumber(key);
	return encodeFailure(
		state,
		depth,
		`cannot encode an object key of type ${type(key)}`,
	);
}

function encodeValue(
	state: EncodeState,
	input: unknown,
	depth: number,
	key: string | number,
): void {
	let value = input;
	let valueType = type(value);

	// Like JavaScript, a toJSON method replaces the value before serialisation.
	if (valueType === "table" && !rawequal(value, NULL)) {
		const toJSON = (value as { toJSON?: unknown }).toJSON;
		if (toJSON !== undefined && type(toJSON) === "function") {
			value = (toJSON as (this: void, self: unknown, key: string) => unknown)(
				value,
				typeof key === "number" ? tostring(key) : key,
			);
			valueType = type(value);
		}
	}

	if (valueType === "string") {
		emit(state, quoteString(value as string));
	} else if (valueType === "number") {
		const n = value as number;
		if (!isFiniteNumber(n)) {
			encodeFailure(
				state,
				depth,
				`cannot encode ${tostring(n)} (JSON has no NaN or Infinity)`,
			);
		}
		emit(state, formatNumber(n));
	} else if (valueType === "boolean") {
		emit(state, value ? "true" : "false");
	} else if (value === undefined || rawequal(value, NULL)) {
		emit(state, "null");
	} else if (valueType === "table") {
		encodeTable(state, value as object, depth);
	} else {
		encodeFailure(state, depth, `cannot encode a value of type ${valueType}`);
	}
}

function encodeTable(state: EncodeState, value: object, depth: number): void {
	if (depth > state.maxDepth)
		encodeFailure(
			state,
			depth,
			`nesting is deeper than maxDepth (${state.maxDepth})`,
		);
	if (state.active.get(value))
		encodeFailure(state, depth, "circular reference");
	state.active.set(value, true);

	const length = arrayLength(state, value, depth);
	const pretty = state.indent !== "";
	const innerIndent = pretty
		? `
${string.rep(state.indent, depth)}`
		: "";
	const outerIndent = pretty
		? `
${string.rep(state.indent, depth - 1)}`
		: "";
	const items = value as LuaTable<AnyNotNil, unknown>;
	const childDepth = depth + 1;

	if (length !== undefined) {
		if (length === 0) {
			emit(state, "[]");
		} else {
			emit(state, "[");
			for (let index = 1; index <= length; index++) {
				if (index > 1) emit(state, ",");
				if (pretty) emit(state, innerIndent);
				state.path.set(childDepth, index - 1);
				encodeValue(state, items.get(index), childDepth, index - 1);
			}
			if (pretty) emit(state, outerIndent);
			emit(state, "]");
		}
	} else {
		const separator = pretty ? ": " : ":";
		let first = true;
		const member = (name: string, item: unknown) => {
			emit(state, first ? "{" : ",");
			first = false;
			if (pretty) emit(state, innerIndent);
			emit(state, quoteString(name));
			emit(state, separator);
			state.path.set(childDepth, name);
			encodeValue(state, item, childDepth, name);
		};

		if (state.sortKeys) {
			const names: string[] = [];
			const originals = new LuaTable<string, AnyNotNil>();
			for (const [key] of pairs(items)) {
				const name = objectKey(state, depth, key);
				names.push(name);
				originals.set(name, key);
			}
			table.sort(names);
			for (const name of names) member(name, items.get(originals.get(name)));
		} else {
			for (const [key, item] of pairs(items))
				member(objectKey(state, depth, key), item);
		}

		if (first) {
			emit(state, "{}");
		} else {
			if (pretty) emit(state, outerIndent);
			emit(state, "}");
		}
	}

	state.active.set(value, undefined as unknown as boolean);
}

function resolveIndent(indent: number | string | undefined): string {
	if (typeof indent === "number") {
		return string.rep(" ", math.max(0, math.min(10, math.floor(indent))));
	}
	if (typeof indent === "string") return string.sub(indent, 1, 10);
	return "";
}

/**
 * Encodes a value as JSON text.
 *
 * - `undefined`/nil and {@link NULL} encode as `null`; booleans, numbers and
 *   strings as themselves (strings are treated as UTF-8 and passed through).
 * - A table whose keys are all 1..n (holes allowed) is an array. One with
 *   string keys is an object; any positive integer keys beside them are written
 *   as strings, as `JSON.stringify({ 1: "a", b: 2 })` does. Tables marked by
 *   {@link asArray}/{@link asObject} or produced by {@link decode} keep their kind.
 * - A `toJSON(key)` method, if present, supplies the value to encode.
 *
 * @throws For functions, userdata, threads, NaN, ±Infinity, circular
 * references, keys that are neither strings nor positive integers, overly
 * sparse arrays and nesting beyond
 * `maxDepth`. The message includes the path to the offending value (with
 * 0-based array indices), e.g. `json.encode: cannot encode a value of type function at $.handlers[2]`.
 */
export function encode(value: unknown, options?: EncodeOptions): string {
	const state: EncodeState = {
		parts: new LuaTable<number, string>(),
		count: 0,
		indent: resolveIndent(options?.indent),
		sortKeys: options?.sortKeys === true,
		emptyAsObject: options?.emptyTable === "object",
		maxDepth: options?.maxDepth ?? DEFAULT_MAX_DEPTH,
		active: new LuaTable<object, boolean>(),
		path: new LuaTable<number, string | number>(),
	};
	encodeValue(state, value, 1, "");
	return table.concat(state.parts as unknown as string[]);
}

// ---------------------------------------------------------------------------
// Decoding
// ---------------------------------------------------------------------------

interface DecodeState {
	readonly text: string;
	pos: number;
	readonly nullValue: unknown;
	readonly maxDepth: number;
}

// Characters that end a run of plain string content: quote, backslash, and
// the control characters 0x00–0x1F that JSON requires to be escaped.
const STRING_STOP_PATTERN = `["\\%z${string.char(1)}-${string.char(31)}]`;
const WHITESPACE_PATTERN = "^[ \t\n\r]*";
const DIGITS_PATTERN = "^%d+";
const HEX4_PATTERN = "^%x%x%x%x$";

const SIMPLE_ESCAPES = new LuaTable<number, string>();
SIMPLE_ESCAPES.set(34, '"');
SIMPLE_ESCAPES.set(92, "\\");
SIMPLE_ESCAPES.set(47, "/");
SIMPLE_ESCAPES.set(98, "\b");
SIMPLE_ESCAPES.set(102, "\f");
SIMPLE_ESCAPES.set(110, "\n");
SIMPLE_ESCAPES.set(114, "\r");
SIMPLE_ESCAPES.set(116, "\t");

function describeAt(text: string, position: number): string {
	const code = string.byte(text, position);
	if (code === undefined) return "end of input";
	return code >= 32 && code <= 126
		? `'${string.char(code)}'`
		: string.format("byte 0x%02X", code);
}

function decodeFailure(
	state: DecodeState,
	message: string,
	position: number = state.pos,
): never {
	const before = string.sub(state.text, 1, position - 1);
	const [, newlines] = string.gsub(before, "\n", "");
	const [lineStart] = string.match(before, ".*\n()");
	const column =
		position - ((lineStart as unknown as number | undefined) ?? 1) + 1;
	throw new Error(
		`json.decode: ${message} at line ${newlines + 1} column ${column}`,
	);
}

function skipWhitespace(state: DecodeState): void {
	const [, finish] = string.find(state.text, WHITESPACE_PATTERN, state.pos);
	state.pos = (finish as number) + 1;
}

function codepointToUtf8(codepoint: number): string {
	if (codepoint < 0x80) return string.char(codepoint);
	if (codepoint < 0x800) {
		return string.char(
			0xc0 + math.floor(codepoint / 0x40),
			0x80 + (codepoint % 0x40),
		);
	}
	if (codepoint < 0x10000) {
		return string.char(
			0xe0 + math.floor(codepoint / 0x1000),
			0x80 + (math.floor(codepoint / 0x40) % 0x40),
			0x80 + (codepoint % 0x40),
		);
	}
	return string.char(
		0xf0 + math.floor(codepoint / 0x40000),
		0x80 + (math.floor(codepoint / 0x1000) % 0x40),
		0x80 + (math.floor(codepoint / 0x40) % 0x40),
		0x80 + (codepoint % 0x40),
	);
}

function readHex4(state: DecodeState, at: number): number | undefined {
	const hex = string.sub(state.text, at, at + 3);
	if (string.find(hex, HEX4_PATTERN)[0] === undefined) return undefined;
	return tonumber(hex, 16);
}

/** Parses a string starting at the opening quote; leaves `pos` after the closing quote. */
function parseString(state: DecodeState): string {
	const text = state.text;
	let start = state.pos + 1;
	let parts: string[] | undefined;

	while (true) {
		const [stop] = string.find(text, STRING_STOP_PATTERN, start);
		if (stop === undefined)
			decodeFailure(state, "unterminated string", state.pos);
		const code = string.byte(text, stop);

		if (code === 34) {
			state.pos = stop + 1;
			const tail = string.sub(text, start, stop - 1);
			if (parts === undefined) return tail;
			parts.push(tail);
			return table.concat(parts);
		}
		if (code !== 92)
			decodeFailure(state, "unescaped control character in string", stop);

		parts ??= [];
		parts.push(string.sub(text, start, stop - 1));
		const escapeCode = string.byte(text, stop + 1);
		const simple =
			escapeCode === undefined ? undefined : SIMPLE_ESCAPES.get(escapeCode);
		if (simple !== undefined) {
			parts.push(simple);
			start = stop + 2;
		} else if (escapeCode === 117) {
			// \uXXXX, combining a UTF-16 surrogate pair into one code point.
			let codepoint = readHex4(state, stop + 2);
			if (codepoint === undefined)
				decodeFailure(state, "invalid \\u escape", stop);
			start = stop + 6;
			if (codepoint >= 0xd800 && codepoint <= 0xdbff) {
				const low =
					string.sub(text, start, start + 1) === "\\u"
						? readHex4(state, start + 2)
						: undefined;
				if (low !== undefined && low >= 0xdc00 && low <= 0xdfff) {
					codepoint = 0x10000 + (codepoint - 0xd800) * 0x400 + (low - 0xdc00);
					start += 6;
				} else {
					codepoint = 0xfffd; // unpaired high surrogate
				}
			} else if (codepoint >= 0xdc00 && codepoint <= 0xdfff) {
				codepoint = 0xfffd; // unpaired low surrogate
			}
			parts.push(codepointToUtf8(codepoint));
		} else {
			decodeFailure(
				state,
				`invalid escape ${describeAt(text, stop + 1)}`,
				stop,
			);
		}
	}
}

function parseNumber(state: DecodeState): number {
	const text = state.text;
	const start = state.pos;
	let i = start;
	if (string.byte(text, i) === 45) i++; // "-"

	const first = string.byte(text, i);
	if (first === 48) {
		i++;
		const next = string.byte(text, i);
		if (next !== undefined && next >= 48 && next <= 57)
			decodeFailure(state, "leading zeros are not allowed", start);
	} else if (first !== undefined && first >= 49 && first <= 57) {
		const [, finish] = string.find(text, DIGITS_PATTERN, i);
		i = (finish as number) + 1;
	} else {
		decodeFailure(
			state,
			`invalid number (unexpected ${describeAt(text, i)})`,
			i,
		);
	}

	if (string.byte(text, i) === 46) {
		// "."
		const [, finish] = string.find(text, DIGITS_PATTERN, i + 1);
		if (finish === undefined)
			decodeFailure(state, "expected a digit after the decimal point", i + 1);
		i = finish + 1;
	}

	const exponent = string.byte(text, i);
	if (exponent === 101 || exponent === 69) {
		// "e" / "E"
		i++;
		const sign = string.byte(text, i);
		if (sign === 43 || sign === 45) i++;
		const [, finish] = string.find(text, DIGITS_PATTERN, i);
		if (finish === undefined)
			decodeFailure(state, "expected a digit in the exponent", i);
		i = finish + 1;
	}

	state.pos = i;
	return tonumber(string.sub(text, start, i - 1)) as number;
}

function parseLiteral(
	state: DecodeState,
	literal: string,
	value: unknown,
): unknown {
	if (
		string.sub(state.text, state.pos, state.pos + literal.length - 1) !==
		literal
	) {
		decodeFailure(state, `unexpected ${describeAt(state.text, state.pos)}`);
	}
	state.pos += literal.length;
	return value;
}

function parseArray(state: DecodeState, depth: number): unknown[] {
	if (depth > state.maxDepth)
		decodeFailure(state, `nesting is deeper than maxDepth (${state.maxDepth})`);
	const result = new LuaTable<number, unknown>();
	setmetatable(result, ARRAY_MT);
	state.pos++;
	skipWhitespace(state);
	if (string.byte(state.text, state.pos) === 93) {
		state.pos++;
		return result as unknown as unknown[];
	}

	let index = 0;
	while (true) {
		index++;
		result.set(index, parseValue(state, depth + 1));
		skipWhitespace(state);
		const next = string.byte(state.text, state.pos);
		if (next === 44) {
			state.pos++;
		} else if (next === 93) {
			state.pos++;
			return result as unknown as unknown[];
		} else {
			decodeFailure(
				state,
				`expected ',' or ']' but found ${describeAt(state.text, state.pos)}`,
			);
		}
	}
}

function parseObject(
	state: DecodeState,
	depth: number,
): Record<string, unknown> {
	if (depth > state.maxDepth)
		decodeFailure(state, `nesting is deeper than maxDepth (${state.maxDepth})`);
	const result = new LuaTable<string, unknown>();
	setmetatable(result, OBJECT_MT);
	state.pos++;
	skipWhitespace(state);
	if (string.byte(state.text, state.pos) === 125) {
		state.pos++;
		return result as unknown as Record<string, unknown>;
	}

	while (true) {
		skipWhitespace(state);
		if (string.byte(state.text, state.pos) !== 34) {
			decodeFailure(
				state,
				`expected a string key but found ${describeAt(state.text, state.pos)}`,
			);
		}
		const key = parseString(state);
		skipWhitespace(state);
		if (string.byte(state.text, state.pos) !== 58) {
			decodeFailure(
				state,
				`expected ':' but found ${describeAt(state.text, state.pos)}`,
			);
		}
		state.pos++;
		result.set(key, parseValue(state, depth + 1));
		skipWhitespace(state);
		const next = string.byte(state.text, state.pos);
		if (next === 44) {
			state.pos++;
		} else if (next === 125) {
			state.pos++;
			return result as unknown as Record<string, unknown>;
		} else {
			decodeFailure(
				state,
				`expected ',' or '}' but found ${describeAt(state.text, state.pos)}`,
			);
		}
	}
}

function parseValue(state: DecodeState, depth: number): unknown {
	skipWhitespace(state);
	const code = string.byte(state.text, state.pos);
	if (code === 123) return parseObject(state, depth);
	if (code === 91) return parseArray(state, depth);
	if (code === 34) return parseString(state);
	if (code === 116) return parseLiteral(state, "true", true);
	if (code === 102) return parseLiteral(state, "false", false);
	if (code === 110) return parseLiteral(state, "null", state.nullValue);
	if (code === 45 || (code !== undefined && code >= 48 && code <= 57))
		return parseNumber(state);
	return decodeFailure(
		state,
		`unexpected ${describeAt(state.text, state.pos)}`,
	);
}

/**
 * Parses JSON text.
 *
 * Strict RFC 8259: no comments, trailing commas, single quotes, leading zeros,
 * `NaN`/`Infinity` or unescaped control characters. `\uXXXX` escapes become
 * UTF-8, surrogate pairs are combined and unpaired surrogates become U+FFFD.
 * Duplicate keys keep the last value. Numbers too large for a double become
 * ±`math.huge`, as in JavaScript.
 *
 * @typeParam T - The expected shape. This is not checked at runtime.
 * @param text - The JSON text.
 * @param options - `nullValue` and `maxDepth`.
 * @throws If the text is not valid JSON; the message gives the line and column,
 * e.g. `json.decode: expected ',' or '}' but found ']' at line 3 column 7`.
 */
export function decode<T = unknown>(text: string, options?: DecodeOptions): T {
	if (typeof text !== "string") {
		throw new Error(`json.decode: expected a string, got ${type(text)}`);
	}
	const state: DecodeState = {
		text,
		pos: 1,
		nullValue: options?.nullValue,
		maxDepth: options?.maxDepth ?? DEFAULT_MAX_DEPTH,
	};
	const value = parseValue(state, 1);
	skipWhitespace(state);
	if (state.pos <= text.length) {
		decodeFailure(
			state,
			`unexpected ${describeAt(text, state.pos)} after the JSON value`,
		);
	}
	return value as T;
}
