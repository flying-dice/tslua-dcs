import { describe, test } from "@flying-dice/tslua-luatest";
import { decode, encode, tryDecode } from "../src";
import { CORPUS } from "./corpus";
import { assertEqual, fromHex } from "./helpers";

/** Re-wraps Base64 text at `width` columns with `newline`, as MIME/PEM producers do. */
function wrap(text: string, width: number, newline: string): string {
	const lines: string[] = [];
	for (let i = 1; i <= text.length; i += width) {
		lines.push(string.sub(text, i, i + width - 1));
	}
	return table.concat(lines, newline);
}

function stripPadding(text: string): string {
	const [stripped] = string.gsub(text, "=+$", "");
	return stripped;
}

describe(`Node Buffer oracle corpus (${CORPUS.length} vectors)`, () => {
	test("encode matches standard padded output", () => {
		for (const [label, hex, standard] of CORPUS) {
			assertEqual(encode(fromHex(hex)), standard, `encode ${label}`);
		}
	});

	test("encode matches url-safe unpadded output", () => {
		for (const [label, hex, , url] of CORPUS) {
			assertEqual(
				encode(fromHex(hex), { alphabet: "url", padding: false }),
				url,
				`encode url ${label}`,
			);
		}
	});

	test("encode url-safe padded equals url output plus padding", () => {
		for (const [label, hex, standard, url] of CORPUS) {
			const padded = url + string.rep("=", standard.length - url.length);
			assertEqual(
				encode(fromHex(hex), { alphabet: "url" }),
				padded,
				`encode url padded ${label}`,
			);
		}
	});

	test("encode standard unpadded strips only the padding", () => {
		for (const [label, hex, standard] of CORPUS) {
			assertEqual(
				encode(fromHex(hex), { padding: false }),
				stripPadding(standard),
				`encode unpadded ${label}`,
			);
		}
	});

	test("decode restores the bytes from standard padded input", () => {
		for (const [label, hex, standard] of CORPUS) {
			assertEqual(decode(standard), fromHex(hex), `decode ${label}`);
		}
	});

	test("decode restores the bytes from standard unpadded input", () => {
		for (const [label, hex, standard] of CORPUS) {
			assertEqual(
				decode(stripPadding(standard)),
				fromHex(hex),
				`decode unpadded ${label}`,
			);
		}
	});

	test("decode restores the bytes from url-safe input", () => {
		for (const [label, hex, , url] of CORPUS) {
			assertEqual(
				decode(url, { alphabet: "url" }),
				fromHex(hex),
				`decode url ${label}`,
			);
		}
	});

	test("decode ignores MIME (76/CRLF) and PEM (64/LF) line wrapping", () => {
		for (const [label, hex, standard] of CORPUS) {
			assertEqual(
				decode(wrap(standard, 76, "\r\n")),
				fromHex(hex),
				`decode mime ${label}`,
			);
			assertEqual(
				decode(wrap(standard, 64, "\n")),
				fromHex(hex),
				`decode pem ${label}`,
			);
		}
	});

	test("tryDecode agrees with decode on valid input", () => {
		for (const [label, hex, standard] of CORPUS) {
			assertEqual(tryDecode(standard), fromHex(hex), `tryDecode ${label}`);
		}
	});
});
