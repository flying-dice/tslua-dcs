/**
 * Declared in last position by index.ts, so it runs after every other suite: each function the doubles
 * implement (and, through `satisfies Double<...>`, each function the declarations declare) must have
 * been called from TypeScript at least once, i.e. its call shape has been checked.
 */
import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { doubles } from "./helpers";

describe("call-shape coverage", () => {
	test("every declared function was called through the doubles", () => {
		const uncalled = doubles
			.surface()
			.filter((path) => doubles.calls(path) === 0);
		expect(uncalled).toEqual([]);
		expect(doubles.surface().length).toBeGreaterThan(300);
	});
});
