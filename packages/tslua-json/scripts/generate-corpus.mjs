/**
 * Generates tests/corpus.ts: JSON test vectors whose expected values come from
 * Node's JSON.parse / JSON.stringify, an implementation independent of the one
 * under test. Every classification below is checked against Node first, so a
 * mistake in this list fails generation instead of silently weakening a test.
 *
 * Deterministic (seeded PRNG), so regenerating yields an identical file:
 *   npm run generate:corpus --workspace=@flying-dice/tslua-json
 *
 * Text is stored hex-encoded so arbitrary bytes survive the trip through a
 * TypeScript source file into Lua.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "tests", "corpus.ts");
const hex = (text) => Buffer.from(text, "utf8").toString("hex");

function mulberry32(seed) {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
const random = mulberry32(0x1503);
const pick = (items) => items[Math.floor(random() * items.length)];

/**
 * JSON.stringify output with object keys sorted by UTF-8 byte order (what
 * sortKeys does in Lua). Serialised by hand because JavaScript objects always
 * enumerate integer-like keys ("3") first, so re-inserting keys in sorted order
 * cannot control the output. Scalars and keys still go through JSON.stringify.
 */
function canonical(value, indent = 0) {
	const unit = typeof indent === "number" ? " ".repeat(indent) : indent;
	const write = (v, depth) => {
		const inner = unit ? `\n${unit.repeat(depth + 1)}` : "";
		const outer = unit ? `\n${unit.repeat(depth)}` : "";
		if (Array.isArray(v)) {
			if (v.length === 0) return "[]";
			return `[${v.map((item) => inner + write(item, depth + 1)).join(",")}${outer}]`;
		}
		if (v !== null && typeof v === "object") {
			const keys = Object.keys(v).sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
			if (keys.length === 0) return "{}";
			const separator = unit ? ": " : ":";
			return `{${keys.map((k) => inner + JSON.stringify(k) + separator + write(v[k], depth + 1)).join(",")}${outer}}`;
		}
		return JSON.stringify(v);
	};
	return write(value, 0);
}

// ---------------------------------------------------------------------------
// Hand-written documents that must parse (JSONTestSuite "y_" style).
// ---------------------------------------------------------------------------
const ACCEPT = {
	"empty array": "[]",
	"empty object": "{}",
	"empty string": '""',
	"top-level true": "true",
	"top-level false": "false",
	"top-level null": "null",
	"top-level number": "42",
	"top-level string": '"hello"',
	"whitespace around": " \t\r\n [ 1 , 2 ] \n",
	"nested empties": '{"a":[],"b":{},"c":[[]],"d":[{}]}',
	"array of nulls": "[null,null,null]",
	"null values in object": '{"a":null,"b":1,"c":null}',
	"trailing null in array": "[1,null]",
	"leading null in array": "[null,1]",
	"duplicate keys keep last": '{"a":1,"a":2}',
	"empty key": '{"":0}',
	"keys needing escapes": '{"\\n":1,"a\\"b":2,"\\u0000":3}',
	"all simple escapes": '"\\"\\\\\\/\\b\\f\\n\\r\\t"',
	"unicode escapes": '"\\u0041\\u00e9\\u20AC\\uFFFF"',
	"surrogate pair": '"\\uD83D\\uDE00"',
	"surrogate pair lowercase": '"\\ud834\\udd1e"',
	"escaped NUL": '"a\\u0000b"',
	"raw UTF-8": '"héllo wörld ✈ Ж 日本 🚀"',
	"DEL is allowed raw": `"a${String.fromCharCode(0x7f)}b"`,
	"zero": "0",
	"negative zero": "-0",
	"negative zero float": "-0.0",
	"int": "123",
	"negative int": "-123",
	"fraction": "3.14",
	"exponent": "1e3",
	"exponent upper": "1E3",
	"exponent plus": "1e+3",
	"exponent minus": "1e-3",
	"fraction exponent": "-1.5e-10",
	"zero exponent": "0e0",
	"small": "5e-324",
	"max double": "1.7976931348623157e308",
	"max safe integer": "9007199254740991",
	"2^53": "9007199254740992",
	"2^53 + 1 (rounds)": "9007199254740993",
	"big integer": "123456789012345678901234567890",
	"0.1": "0.1",
	"0.1 + 0.2 result": "0.30000000000000004",
	"1e21": "1e21",
	"1e-7": "1e-7",
	"1e-6": "0.000001",
	"deep-ish nesting": `${"[".repeat(100)}${"]".repeat(100)}`,
	"object in array in object": '{"list":[{"id":1,"tags":["a","b"]},{"id":2,"tags":[]}]}',
	"DCS-like payload": '{"unit":{"name":"Enfield11","type":"F-16C_50","coalition":2,"position":{"x":-281713.5,"y":6096.0,"z":647387.25},"alive":true,"fuel":0.73}}',
};

// ---------------------------------------------------------------------------
// Hand-written documents that must be rejected (JSONTestSuite "n_" style).
// ---------------------------------------------------------------------------
const REJECT = {
	"empty input": "",
	"only whitespace": "  \n\t ",
	"BOM": "\ufeff{}",
	"trailing comma in array": "[1,]",
	"trailing comma in object": '{"a":1,}',
	"leading comma": "[,1]",
	"double comma": "[1,,2]",
	"missing comma": "[1 2]",
	"missing colon": '{"a" 1}',
	"missing value": '{"a":}',
	"unquoted key": "{a:1}",
	"single-quoted string": "['a']",
	"single-quoted key": "{'a':1}",
	"numeric key": "{1:1}",
	"unclosed array": "[1,2",
	"unclosed object": '{"a":1',
	"unclosed string": '"abc',
	"unclosed nested": '[{"a":[1,2]}',
	"extra closing bracket": "[1]]",
	"extra closing brace": "{}}",
	"mismatched brackets": "[1}",
	"two values": "1 2",
	"trailing garbage": '{"a":1}x',
	"comment line": "[1] // c",
	"comment block": "/* c */ [1]",
	"leading zero": "01",
	"negative leading zero": "-01",
	"leading zeros in fraction position": "[00.5]",
	"plus sign": "+1",
	"bare minus": "-",
	"minus then space": "- 1",
	"trailing dot": "1.",
	"leading dot": ".5",
	"dot exponent": "1.e3",
	"empty exponent": "1e",
	"exponent sign only": "1e+",
	"hex number": "0x10",
	"NaN": "NaN",
	"Infinity": "Infinity",
	"negative Infinity": "-Infinity",
	"True capitalised": "True",
	"nul": "nul",
	"truth": "truth",
	"tru": "tru",
	"undefined": "undefined",
	"unescaped newline in string": '"a\nb"',
	"unescaped tab in string": '"a\tb"',
	"unescaped NUL in string": '"a\u0000b"',
	"unescaped 0x1F in string": `"a${String.fromCharCode(0x1f)}b"`,
	"invalid escape": '"\\x41"',
	"invalid escape a": '"\\a"',
	"escaped apostrophe": "\"\\'\"",
	"short unicode escape": '"\\u12"',
	"non-hex unicode escape": '"\\u12G4"',
	"backslash at end": '"abc\\',
	"object as key": '{{}:1}',
	"array as key": "{[]:1}",
	"colon in array": "[1:2]",
	"comma instead of colon": '{"a",1}',
	"space inside number": "[1 000]",
	"non-breaking space whitespace": "[\u00a01]",
	"vertical tab whitespace": "[\u000b1]",
	"form feed whitespace": "[\f1]",
};

const acceptRows = [];
for (const [label, text] of Object.entries(ACCEPT)) {
	const value = JSON.parse(text); // throws if the list is wrong
	acceptRows.push([label, hex(text), hex(canonical(value)), hex(canonical(value, 2))]);
}

const rejectRows = [];
for (const [label, text] of Object.entries(REJECT)) {
	let accepted = false;
	try {
		JSON.parse(text);
		accepted = true;
	} catch {}
	if (accepted) throw new Error(`Node accepts REJECT case: ${label}`);
	rejectRows.push([label, hex(text)]);
}

// ---------------------------------------------------------------------------
// Random documents.
// ---------------------------------------------------------------------------
const view = new DataView(new ArrayBuffer(8));
function randomDouble() {
	switch (Math.floor(random() * 6)) {
		case 0:
			return Math.floor(random() * 2000) - 1000;
		case 1:
			return Math.round((random() - 0.5) * 1e6) / 100;
		case 2:
			return (random() - 0.5) * 10 ** Math.floor(random() * 40 - 20);
		case 3:
			return Math.floor((random() - 0.5) * 2 ** 53);
		default: {
			// Arbitrary finite bit patterns: exercises every exponent and subnormals.
			let value;
			do {
				view.setUint32(0, Math.floor(random() * 2 ** 32));
				view.setUint32(4, Math.floor(random() * 2 ** 32));
				value = view.getFloat64(0);
			} while (!Number.isFinite(value));
			return value;
		}
	}
}

const STRING_POOL = [
	"",
	"a",
	"hello world",
	"quote\"inside",
	"back\\slash",
	"slash/",
	"tab\there",
	"newline\nhere",
	"\u0001\u001f\u007f",
	"é",
	"✈",
	"日本語",
	"🚀🛩️",
	"mixed ascii and ünïcödé",
	"null",
	"true",
	"1e10",
];
function randomString() {
	if (random() < 0.5) return pick(STRING_POOL);
	const length = Math.floor(random() * 12);
	let s = "";
	for (let i = 0; i < length; i++) {
		const r = random();
		if (r < 0.7) s += String.fromCharCode(32 + Math.floor(random() * 95));
		else if (r < 0.8) s += String.fromCharCode(Math.floor(random() * 32));
		else if (r < 0.9) s += String.fromCharCode(0xa0 + Math.floor(random() * 0x700));
		else s += String.fromCodePoint(0x1f300 + Math.floor(random() * 0x300));
	}
	return s;
}

function randomValue(depth) {
	const r = random();
	if (depth > 5 || r < 0.45) {
		return pick([() => null, () => true, () => false, randomDouble, randomDouble, randomString, randomString])();
	}
	if (r < 0.72) {
		const length = Math.floor(random() * 6);
		return Array.from({ length }, () => randomValue(depth + 1));
	}
	const object = {};
	const size = Math.floor(random() * 6);
	for (let i = 0; i < size; i++) object[randomString()] = randomValue(depth + 1);
	return object;
}

const randomRows = [];
for (let i = 0; i < 250; i++) {
	const value = randomValue(0);
	const compact = JSON.stringify(value);
	const pretty = JSON.stringify(value, null, pick([2, 4, "\t"]));
	randomRows.push([`random ${i}`, hex(random() < 0.5 ? compact : pretty), hex(canonical(value))]);
}

// ---------------------------------------------------------------------------
// Numbers: JavaScript's own formatting of each value is the expected text.
// ---------------------------------------------------------------------------
const numberRows = [];
const seen = new Set();
const addNumber = (value) => {
	const text = JSON.stringify(value);
	if (!seen.has(text)) {
		seen.add(text);
		numberRows.push(text);
	}
};
for (const value of [
	0, 1, -1, 0.5, 0.1, 0.2, 0.3, 0.1 + 0.2, 1 / 3, 2 / 3, Math.PI, Math.E, 100, 1e6, 1e15, 1e16, 1e17, 1e20, 1e21,
	1e22, 1.5e300, -1.5e-300, 5e-324, 2.2250738585072014e-308, Number.MAX_VALUE, Number.MIN_VALUE,
	Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER, 2 ** 53, 2 ** 53 + 2, 2 ** 60, 2 ** 64, 1e-6, 1e-7, 1.23e-6,
	1.23e-7, 123456.789, 7620.5, -281713.5, 6096, 0.73, 12345678901234567890, 4.35, 0.000001, 1234.5678e10,
]) {
	addNumber(value);
}
// Powers of two and their neighbouring doubles: the rounding interval is
// asymmetric at a power of two, which is where shortest-digit searches that
// only try the correctly rounded candidate go wrong (e.g. 2^-24).
const bits = new DataView(new ArrayBuffer(8));
const nextDouble = (value, direction) => {
	bits.setFloat64(0, value);
	bits.setBigUint64(0, bits.getBigUint64(0) + BigInt(direction));
	return bits.getFloat64(0);
};
for (let exponent = -1074; exponent <= 1023; exponent++) {
	const power = 2 ** exponent;
	for (const value of [power, nextDouble(power, 1), exponent > -1074 ? nextDouble(power, -1) : power]) {
		addNumber(value);
		addNumber(-value);
	}
}
while (numberRows.length < 14000) addNumber(randomDouble());

writeFileSync(
	out,
	`// Generated by scripts/generate-corpus.mjs from Node's JSON.parse/JSON.stringify. Do not edit by hand.
// Text is hex-encoded UTF-8.

/** [label, input, canonical compact output, canonical indent-2 output] for documents Node accepts. */
export const ACCEPT: [string, string, string, string][] = [
${acceptRows.map((row) => `\t${JSON.stringify(row)},`).join("\n")}
];

/** [label, input] for documents Node rejects. */
export const REJECT: [string, string][] = [
${rejectRows.map((row) => `\t${JSON.stringify(row)},`).join("\n")}
];

/** [label, input, canonical compact output] for random documents. */
export const RANDOM_DOCUMENTS: [string, string, string][] = [
${randomRows.map((row) => `\t${JSON.stringify(row)},`).join("\n")}
];

/** Numbers as JavaScript writes them; decoding then encoding must reproduce each exactly. */
export const NUMBERS: string[] = [
${numberRows.map((text) => `\t${JSON.stringify(text)},`).join("\n")}
];
`,
);
console.log(
	`Wrote ${acceptRows.length} accept, ${rejectRows.length} reject, ${randomRows.length} random documents and ${numberRows.length} numbers to ${out}`,
);
