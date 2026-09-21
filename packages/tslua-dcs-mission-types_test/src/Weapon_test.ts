import { describe, expect, test } from "@flying-dice/tslua-luatest";

describe("Weapon examples", () => {
	test("event-only weapon getters are exported", () => {
		for (const value of [
			Weapon.getCategory,
			Weapon.getCategoryEx,
			Weapon.getCoalition,
			Weapon.getCountry,
			Weapon.getDesc,
			Weapon.getForcesName,
			Weapon.getLauncher,
			Weapon.getTarget,
		])
			expect(type(value)).toBe("function");
	});
});
