import { describe, test } from "@flying-dice/tslua-luatest";
import { decode, encode, NULL } from "../src";
import { ACCEPT, NUMBERS, RANDOM_DOCUMENTS, REJECT } from "./corpus";
import { assertEqual, assertThrows, fromHex } from "./helpers";

// Every expected value here was produced by Node's JSON.parse/JSON.stringify.
// Decoding with nullValue: NULL and re-encoding with sortKeys must reproduce
// Node's canonical (key-sorted) output byte for byte.

describe(`Node oracle: documents that must parse (${ACCEPT.length})`, () => {
	test("decode + encode reproduces Node's canonical compact output", () => {
		for (const [label, input, compact] of ACCEPT) {
			const value = decode(fromHex(input), { nullValue: NULL });
			assertEqual(encode(value, { sortKeys: true }), fromHex(compact), label);
		}
	});

	test("decode + encode reproduces Node's canonical indent-2 output", () => {
		for (const [label, input, , pretty] of ACCEPT) {
			const value = decode(fromHex(input), { nullValue: NULL });
			assertEqual(
				encode(value, { sortKeys: true, indent: 2 }),
				fromHex(pretty),
				label,
			);
		}
	});
});

describe(`Node oracle: documents that must be rejected (${REJECT.length})`, () => {
	test("decode throws a json.decode error for each", () => {
		for (const [label, input] of REJECT) {
			assertThrows(() => decode(fromHex(input)), "json.decode: ", label);
		}
	});
});

describe(`Node oracle: random documents (${RANDOM_DOCUMENTS.length})`, () => {
	test("decode + encode reproduces Node's canonical output", () => {
		for (const [label, input, compact] of RANDOM_DOCUMENTS) {
			const value = decode(fromHex(input), { nullValue: NULL });
			assertEqual(encode(value, { sortKeys: true }), fromHex(compact), label);
		}
	});

	test("encode output decodes back to the same document", () => {
		for (const [label, , compact] of RANDOM_DOCUMENTS) {
			const text = fromHex(compact);
			const again = encode(
				decode(encode(decode(text, { nullValue: NULL })), { nullValue: NULL }),
				{
					sortKeys: true,
				},
			);
			assertEqual(again, text, label);
		}
	});
});

describe(`Node oracle: number formatting (${NUMBERS.length})`, () => {
	test("each number re-encodes exactly as JavaScript writes it", () => {
		for (const text of NUMBERS) {
			assertEqual(encode(decode(text)), text, `number ${text}`);
		}
	});

	test("each number decodes to the same double as tonumber", () => {
		for (const text of NUMBERS) {
			assertEqual(decode(text), tonumber(text), `number ${text}`);
		}
	});
});
