import { describe, test } from "@flying-dice/tslua-luatest";
import { decode, encode } from "../src";
import { assertEqual, createRandom, randomBytes } from "./helpers";

describe("Round trips (seeded random bytes)", () => {
	test("every length 0..600, both alphabets, with and without padding", () => {
		const random = createRandom(20260923);
		for (let length = 0; length <= 600; length++) {
			const data = randomBytes(random, length);
			const encoded = encode(data);
			assertEqual(
				encoded.length,
				4 * math.ceil(length / 3),
				`padded length for ${length}`,
			);
			assertEqual(
				decode(encoded),
				data,
				`standard round trip, length ${length}`,
			);
			assertEqual(
				decode(encode(data, { padding: false })),
				data,
				`unpadded round trip, length ${length}`,
			);
			assertEqual(
				decode(encode(data, { alphabet: "url" }), { alphabet: "url" }),
				data,
				`url round trip, length ${length}`,
			);
		}
	});

	test("1 MiB of random bytes", () => {
		const random = createRandom(42);
		const data = randomBytes(random, 1024 * 1024);
		const started = os.clock();
		const encoded = encode(data);
		const decoded = decode(encoded);
		print(
			string.format("      1 MiB encode+decode in %.2fs", os.clock() - started),
		);
		assertEqual(
			encoded.length,
			4 * math.ceil(data.length / 3),
			"encoded length",
		);
		assertEqual(decoded, data, "1 MiB round trip");
	});
});
