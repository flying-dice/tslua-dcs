import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { staticFixture } from "./fixtures";

describe("StaticObject examples", () => {
	test("static lookup and getters return documented values when available", () => {
		const object = staticFixture();
		if (!object) return;
		expect(StaticObject.getByName(object.getName())).toEqual(object);
		expect(type(object.getID())).toBe("number");
		expect(type(object.getLife())).toBe("number");
		expect(type(object.getCountry())).toBe("number");
		expect(type(object.getCoalition())).toBe("number");
		expect(type(object.getDesc())).toBe("table");
		const cargoName = object.getCargoDisplayName();
		expect(cargoName === undefined || type(cargoName) === "string").toBe(true);
	});

	test("extended static exports are present when a static exists", () => {
		const object = staticFixture();
		if (!object) return;
		expect(type(object.chooseCargo)).toBe("function");
		expect(type(object.getForcesName)).toBe("function");
		for (const value of [
			object.getCargoWeight,
			object.getDrawArgumentValue,
			object.getTypeName,
			StaticObject.getDescByName,
		])
			expect(type(value)).toBe("function");
	});
});
