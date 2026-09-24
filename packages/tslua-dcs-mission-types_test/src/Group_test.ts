import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { groupFixture } from "./fixtures";

describe("Group examples", () => {
	test("group lookup and getters return documented values", () => {
		const group = groupFixture();
		expect(Group.getByName(group.getName())).toEqual(group);
		expect(type(group.getID())).toBe("number");
		expect(type(group.getCoalition())).toBe("number");
		expect(type(group.getCategory())).toBe("number");
		expect(type(group.getSize())).toBe("number");
		expect(type(group.getInitialSize())).toBe("number");
		expect(type(group.getUnits())).toBe("table");
		expect(type(group.getController())).toBe("table");
		expect(group.isExist()).toBe(true);
	});

	test("extended group exports are present", () => {
		const group = groupFixture();
		expect(type(group.getCategoryEx())).toBe("number");
		expect(type(group.embarking)).toBe("function");
		expect(type(group.markGroup)).toBe("function");
	});

	test("state-changing group exports are present", () => {
		const group = groupFixture();
		for (const value of [
			group.activate,
			group.destroy,
			group.enableEmission,
			group.getUnit,
		])
			expect(type(value)).toBe("function");
	});
});
