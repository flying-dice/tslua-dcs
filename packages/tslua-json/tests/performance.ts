import { describe, test } from "@flying-dice/tslua-luatest";
import { decode, encode } from "../src";
import { assertEqual } from "./helpers";

describe("Large documents", () => {
	test("~1 MB of mixed data round-trips", () => {
		const units: unknown[] = [];
		for (let i = 1; i <= 5000; i++) {
			units.push({
				id: i,
				name: `Unit ${i} ✈ "quoted"`,
				position: { x: i * 1.25, y: -i / 3, z: i * 1000.5 },
				tags: ["air", "blue", i % 2 === 0 ? "even" : "odd"],
				alive: i % 3 !== 0,
			});
		}
		const started = os.clock();
		const text = encode({ units }, { sortKeys: true });
		const encodedAt = os.clock();
		const value = decode(text);
		const decodedAt = os.clock();
		print(
			string.format(
				"      %d bytes: encode %.2fs, decode %.2fs",
				text.length,
				encodedAt - started,
				decodedAt - encodedAt,
			),
		);
		assertEqual(encode(value, { sortKeys: true }), text, "round trip");
	});
});
