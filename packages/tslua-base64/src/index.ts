/** @noSelfInFile */

/**
 * Base64 encoding and decoding ([RFC 4648](https://www.rfc-editor.org/rfc/rfc4648)),
 * written in TypeScript for TypeScriptToLua and compatible with Lua 5.1 (DCS World).
 *
 * Lua strings are byte strings, so any binary data (including `\0` and bytes
 * above 127) round-trips unchanged. Nothing here relies on bitwise operators,
 * `bit32` or `utf8`, which Lua 5.1 does not provide.
 *
 * @example
 * ```ts
 * import * as base64 from "@flying-dice/tslua-base64";
 *
 * base64.encode("return 1 + 1"); // "cmV0dXJuIDEgKyAx"
 * base64.decode("cmV0dXJuIDEgKyAx"); // "return 1 + 1"
 * base64.encode(string.char(0xfb, 0xff), { alphabet: "url", padding: false }); // "-_8"
 * ```
 *
 * @module
 */

/**
 * The 64-character alphabet to use.
 *
 * - `"standard"`: `A–Z a–z 0–9 + /` (RFC 4648 §4)
 * - `"url"`: `A–Z a–z 0–9 - _`, safe in URLs and file names (RFC 4648 §5)
 */
export type Base64Alphabet = "standard" | "url";

/** Options for {@link encode}. */
export interface EncodeOptions {
	/** The alphabet to encode with. Defaults to `"standard"`. */
	alphabet?: Base64Alphabet;
	/** Whether to append `=` padding to a multiple of 4 characters. Defaults to `true`. */
	padding?: boolean;
}

/** Options for {@link decode} and {@link tryDecode}. */
export interface DecodeOptions {
	/** The alphabet the input uses. Defaults to `"standard"`. */
	alphabet?: Base64Alphabet;
}

const STANDARD_CHARS =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const URL_CHARS =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const PAD_BYTE = 61; // "="
const PAD_CHAR = "=";

/**
 * Bytes read per `string.byte` call. A multiple of 3 (whole encode groups) and
 * small enough to stay well inside Lua 5.1's C stack limit (LUAI_MAXCSTACK = 8000).
 */
const CHUNK_SIZE = 3 * 1024;

interface Alphabet {
	/** Sextet value (0–63) → character byte. */
	readonly toChar: LuaTable<number, number>;
	/** Character byte → sextet value (0–63). */
	readonly toValue: LuaTable<number, number>;
}

function buildAlphabet(chars: string): Alphabet {
	const toChar = new LuaTable<number, number>();
	const toValue = new LuaTable<number, number>();
	for (let value = 0; value < 64; value++) {
		const code = string.byte(chars, value + 1);
		toChar.set(value, code);
		toValue.set(code, value);
	}
	return { toChar, toValue };
}

const STANDARD = buildAlphabet(STANDARD_CHARS);
const URL_SAFE = buildAlphabet(URL_CHARS);

function resolveAlphabet(
	name: Base64Alphabet | undefined,
	fn: string,
): Alphabet {
	if (name === undefined || name === "standard") return STANDARD;
	if (name === "url") return URL_SAFE;
	throw new Error(`base64.${fn}: unknown alphabet '${tostring(name)}'`);
}

function assertString(value: unknown, fn: string): asserts value is string {
	if (typeof value !== "string") {
		throw new Error(`base64.${fn}: expected a string, got ${type(value)}`);
	}
}

/**
 * Encodes a (byte) string as Base64.
 *
 * @param data - The bytes to encode. Any Lua string is valid input.
 * @param options - Alphabet and padding options.
 * @returns The Base64 text.
 * @throws If `data` is not a string or `options.alphabet` is unknown.
 */
export function encode(data: string, options?: EncodeOptions): string {
	assertString(data, "encode");
	const toChar = resolveAlphabet(options?.alphabet, "encode").toChar;
	const padding = options?.padding !== false;

	const length = data.length;
	const wholeGroupsEnd = length - (length % 3);
	const parts: string[] = [];

	for (let start = 1; start <= wholeGroupsEnd; start += CHUNK_SIZE) {
		const stop = math.min(start + CHUNK_SIZE - 1, wholeGroupsEnd);
		const bytes = [...string.byte(data, start, stop)];
		for (let i = 0; i < bytes.length; i += 3) {
			const group = bytes[i] * 65536 + bytes[i + 1] * 256 + bytes[i + 2];
			parts.push(
				string.char(
					toChar.get(math.floor(group / 262144)),
					toChar.get(math.floor(group / 4096) % 64),
					toChar.get(math.floor(group / 64) % 64),
					toChar.get(group % 64),
				),
			);
		}
	}

	const remainder = length - wholeGroupsEnd;
	if (remainder === 1) {
		const a = string.byte(data, length);
		parts.push(
			string.char(toChar.get(math.floor(a / 4)), toChar.get((a % 4) * 16)),
		);
		if (padding) parts.push(PAD_CHAR + PAD_CHAR);
	} else if (remainder === 2) {
		const [a, b] = string.byte(data, length - 1, length);
		const group = a * 256 + b;
		parts.push(
			string.char(
				toChar.get(math.floor(group / 1024)),
				toChar.get(math.floor(group / 16) % 64),
				toChar.get((group % 16) * 4),
			),
		);
		if (padding) parts.push(PAD_CHAR);
	}

	return table.concat(parts);
}

function describeByte(code: number): string {
	return code >= 33 && code <= 126
		? `'${string.char(code)}'`
		: string.format("byte 0x%02X", code);
}

/**
 * Decodes Base64 text, returning the bytes or an error message.
 * Kept separate so {@link decode} and {@link tryDecode} share one implementation.
 */
function decodeText(
	text: string,
	toValue: LuaTable<number, number>,
): LuaMultiReturn<[string | undefined, string | undefined]> {
	const length = text.length;
	const parts: string[] = [];
	let group = 0;
	let groupSize = 0;
	let padCount = 0;

	for (let start = 1; start <= length; start += CHUNK_SIZE) {
		const stop = math.min(start + CHUNK_SIZE - 1, length);
		const bytes = [...string.byte(text, start, stop)];
		for (let i = 0; i < bytes.length; i++) {
			const code = bytes[i];
			// Whitespace is ignored anywhere (line-wrapped MIME/PEM style input).
			if (code === 32 || code === 9 || code === 10 || code === 13) continue;

			const position = start + i;
			if (code === PAD_BYTE) {
				padCount++;
				if (padCount > 2)
					return $multi(undefined, `too much padding at position ${position}`);
				continue;
			}

			const value = toValue.get(code);
			if (value === undefined) {
				return $multi(
					undefined,
					`invalid character ${describeByte(code)} at position ${position}`,
				);
			}
			if (padCount > 0) {
				return $multi(
					undefined,
					`unexpected character after padding at position ${position}`,
				);
			}

			group = group * 64 + value;
			groupSize++;
			if (groupSize === 4) {
				parts.push(
					string.char(
						math.floor(group / 65536),
						math.floor(group / 256) % 256,
						group % 256,
					),
				);
				group = 0;
				groupSize = 0;
			}
		}
	}

	if (groupSize === 1) {
		return $multi(
			undefined,
			"truncated input: a single trailing character cannot encode a byte",
		);
	}
	if (padCount > 0 && groupSize + padCount !== 4) {
		return $multi(undefined, "incorrect padding");
	}
	if (groupSize === 2) {
		// 12 bits: the top 8 are the byte, the low 4 are discarded.
		parts.push(string.char(math.floor(group / 16)));
	} else if (groupSize === 3) {
		// 18 bits: the top 16 are two bytes, the low 2 are discarded.
		parts.push(
			string.char(math.floor(group / 1024), math.floor(group / 4) % 256),
		);
	}

	return $multi(table.concat(parts), undefined);
}

/**
 * Decodes Base64 text back into the original (byte) string.
 *
 * Input rules:
 * - Whitespace (space, tab, CR, LF) is ignored anywhere.
 * - Padding is optional (`"Zg"` and `"Zg=="` both decode to `"f"`), but when
 *   present it must be correct and only at the end.
 * - Any character outside the selected alphabet is an error — including
 *   `-`/`_` in `"standard"` and `+`/`/` in `"url"`.
 * - Unused low bits in the final character are ignored, as most decoders do.
 *
 * @param text - The Base64 text.
 * @param options - The alphabet the input uses.
 * @returns The decoded bytes.
 * @throws If the input is not valid Base64; the message names the problem and
 * its 1-based byte position.
 */
export function decode(text: string, options?: DecodeOptions): string {
	assertString(text, "decode");
	const [result, error] = decodeText(
		text,
		resolveAlphabet(options?.alphabet, "decode").toValue,
	);
	if (result === undefined) {
		throw new Error(`base64.decode: ${error}`);
	}
	return result;
}

/**
 * Like {@link decode}, but returns `undefined` instead of throwing when the
 * input is not a string or is not valid Base64.
 *
 * @param text - The Base64 text.
 * @param options - The alphabet the input uses.
 * @returns The decoded bytes, or `undefined` if the input is invalid.
 * @throws Only if `options.alphabet` is unknown (a programming error).
 */
export function tryDecode(
	text: string,
	options?: DecodeOptions,
): string | undefined {
	const alphabet = resolveAlphabet(options?.alphabet, "tryDecode");
	if (typeof text !== "string") return undefined;
	const [result] = decodeText(text, alphabet.toValue);
	return result;
}
