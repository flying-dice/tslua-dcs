import { describe, expect, test } from "@flying-dice/tslua-luatest";

describe("coalition examples", () => {
	test("getGroups returns an array", () => {
		expect(type(coalition.getGroups(coalition.side.BLUE))).toBe("table");
	});

	test("getAirbases returns an array", () => {
		expect(type(coalition.getAirbases(coalition.side.BLUE))).toBe("table");
	});

	test("getStaticObjects returns an array", () => {
		expect(type(coalition.getStaticObjects(coalition.side.BLUE))).toBe("table");
	});

	test("getPlayers returns an array", () => {
		expect(type(coalition.getPlayers(coalition.side.BLUE))).toBe("table");
	});

	test("getRefPoints returns an array or nothing", () => {
		const points = coalition.getRefPoints(coalition.side.BLUE);
		expect(points === undefined || type(points) === "table").toBe(true);
	});

	test("getMainRefPoint returns a point or nothing", () => {
		const point = coalition.getMainRefPoint(coalition.side.BLUE);
		expect(point === undefined || type(point) === "table").toBe(true);
	});

	test("getCountryCoalition returns a side", () => {
		const side = coalition.getCountryCoalition(2);
		expect(type(side)).toBe("number");
	});

	test("schema-private coalition exports remain explicitly discoverable", () => {
		for (const value of [
			coalition.add_dyn_group,
			coalition.remove_dyn_group,
			coalition.checkChooseCargo,
			coalition.checkDescent,
			coalition.getAllDescents,
			coalition.getDescentsOnBoard,
		])
			expect(type(value)).toBe("function");
	});

	test("spawn and service-provider exports are present", () => {
		for (const value of [
			coalition.addGroup,
			coalition.addRefPoint,
			coalition.addStaticObject,
			coalition.getServiceProviders,
		])
			expect(type(value)).toBe("function");
	});
});
