import { describe, expect, test } from "@flying-dice/tslua-luatest";

describe("land examples", () => {
	test("findPathOnRoads returns route points", () => {
		const route = land.findPathOnRoads("roads", 0, 0, 10000, 10000);
		expect(type(route)).toBe("table");
	});

	test("getHeight returns a number", () => {
		const elevation = land.getHeight({ x: 1000, y: 2000 });
		expect(type(elevation)).toBe("number");
	});

	test("getClosestPointOnRoads returns two numbers", () => {
		const [roadX, roadY] = land.getClosestPointOnRoads("roads", 1000, 2000);
		expect(type(roadX)).toBe("number");
		expect(type(roadY)).toBe("number");
	});

	test("surface height and seabed are numeric", () => {
		const [elevation, depth] = land.getSurfaceHeightWithSeabed({ x: 0, y: 0 });
		expect(type(elevation)).toBe("number");
		expect(type(depth)).toBe("number");
	});

	test("surface type is numeric", () => {
		const surfaceType = land.getSurfaceType({ x: 0, y: 0 });
		expect(type(surfaceType)).toBe("number");
	});

	test("getIP returns a point or no intersection", () => {
		const impact = land.getIP(
			{ x: 0, y: 1000, z: 0 },
			{ x: 0, y: -1, z: 0 },
			2000,
		);
		expect(impact === undefined || type(impact) === "table").toBe(true);
	});

	test("isVisible returns a boolean", () => {
		const visible = land.isVisible(
			{ x: 0, y: 1000, z: 0 },
			{ x: 1000, y: 1000, z: 1000 },
		);
		expect(type(visible)).toBe("boolean");
	});

	test("profile returns sample points", () => {
		const profile = land.profile(
			{ x: 0, y: 1000, z: 0 },
			{ x: 1000, y: 1000, z: 1000 },
		);
		expect(type(profile)).toBe("table");
	});
});
