import { describe, test } from "@flying-dice/tslua-luatest";
import { decode, encode } from "../src";
import { assertEqual } from "./helpers";

// RFC 4648 §10 test vectors.
const VECTORS: [string, string][] = [
	["", ""],
	["f", "Zg=="],
	["fo", "Zm8="],
	["foo", "Zm9v"],
	["foob", "Zm9vYg=="],
	["fooba", "Zm9vYmE="],
	["foobar", "Zm9vYmFy"],
];

describe("RFC 4648 test vectors", () => {
	for (const [plain, encoded] of VECTORS) {
		test(`"${plain}" <-> "${encoded}"`, () => {
			assertEqual(encode(plain), encoded, "encode");
			assertEqual(decode(encoded), plain, "decode");
		});
	}

	test("the README example", () => {
		assertEqual(encode("return 1 + 1"), "cmV0dXJuIDEgKyAx", "encode");
		assertEqual(decode("cmV0dXJuIDEgKyAx"), "return 1 + 1", "decode");
	});

	test("url alphabet uses - and _ where standard uses + and /", () => {
		const data = string.char(0xfb, 0xff, 0xbf);
		assertEqual(encode(data), "+/+/", "standard");
		assertEqual(encode(data, { alphabet: "url" }), "-_-_", "url");
		assertEqual(
			encode(string.char(0xfb, 0xff), { alphabet: "url", padding: false }),
			"-_8",
			"doc example",
		);
	});

	test("binary data with NUL and high bytes survives", () => {
		const data = string.char(0, 0, 0, 255, 128, 0, 10, 13);
		assertEqual(encode(data), "AAAA/4AACg0=", "encode");
		assertEqual(decode(encode(data)), data, "round trip");
	});

	test("non-canonical trailing bits are accepted", () => {
		assertEqual(decode("Zh=="), "f", "Zh== decodes like Zg==");
		assertEqual(decode("Zm9="), "fo", "Zm9= decodes like Zm8=");
	});
});
