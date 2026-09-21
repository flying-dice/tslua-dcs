import type { l_terrain } from "@flying-dice/tslua-dcs-gui-types";
import { describe, expect, test } from "@flying-dice/tslua-luatest";

const checkedTerrain: l_terrain = terrain;

describe("terrain examples", () => {
	test("convertLatLonToMeters returns local coordinates", () => {
		const [x, y] = checkedTerrain.convertLatLonToMeters(41.6103, 41.5997);
		expect(type(x)).toBe("number");
		expect(type(y)).toBe("number");
		expect(x !== y).toBe(true);
	});

	test("GetHeight returns terrain elevation", () => {
		const [x, y] = checkedTerrain.convertLatLonToMeters(41.6103, 41.5997);
		const elevation = checkedTerrain.GetHeight(x, y);
		expect(type(elevation)).toBe("number");
	});

	test("coordinate formats round trip", () => {
		const [x, y] = checkedTerrain.convertLatLonToMeters(41.6103, 41.5997);
		const [latitude, longitude] = checkedTerrain.convertMetersToLatLon(x, y);
		expect(type(latitude)).toBe("number");
		expect(type(longitude)).toBe("number");
		const mgrs = checkedTerrain.GetMGRScoordinates(x, y);
		expect(type(mgrs)).toBe("string");
		const [mgrsX, mgrsY] = checkedTerrain.convertMGRStoMeters(mgrs);
		expect(type(mgrsX)).toBe("number");
		expect(type(mgrsY)).toBe("number");
	});

	test("surface queries return documented values", () => {
		const [x, y] = checkedTerrain.convertLatLonToMeters(41.6103, 41.5997);
		const [height, depth] = checkedTerrain.GetSurfaceHeightWithSeabed(x, y);
		expect(type(height)).toBe("number");
		expect(type(depth)).toBe("number");
		expect(type(checkedTerrain.GetSurfaceType(x, y))).toBe("string");
		expect(
			type(
				checkedTerrain.isVisible(
					x,
					height + 100,
					y,
					x + 10,
					height + 100,
					y + 10,
				),
			),
		).toBe("boolean");
	});

	test("road and path queries return coordinates", () => {
		const [x, y] = checkedTerrain.convertLatLonToMeters(41.6103, 41.5997);
		const optimal = checkedTerrain.FindOptimalPath(x, y, x + 1000, y + 1000);
		const roadPath = checkedTerrain.findPathOnRoads(
			"roads",
			x,
			y,
			x + 1000,
			y + 1000,
		);
		expect(type(optimal)).toBe("table");
		expect(type(roadPath)).toBe("table");
		const [nearestX, nearestY] = checkedTerrain.FindNearestPoint(x, y, 40000);
		const [roadX, roadY] = checkedTerrain.getClosestPointOnRoads("roads", x, y);
		const [landX, landY] = checkedTerrain.getClosestValidPoint("land", x, y);
		for (const value of [nearestX, nearestY, roadX, roadY, landX, landY])
			expect(type(value)).toBe("number");
	});

	test("theatre metadata follows installed DCS callsites", () => {
		expect(type(checkedTerrain.GetTerrainConfig<string>("id"))).toBe("string");
		expect(type(checkedTerrain.GetSeasons())).toBe("table");
		expect(type(checkedTerrain.getTechSkinByDate(15, 6))).toBe("string");
		const [minimum, maximum] = checkedTerrain.getTempratureRangeByDate(15, 6);
		expect(type(minimum)).toBe("number");
		expect(type(maximum)).toBe("number");
		expect(type(checkedTerrain.getBeacons())).toBe("table");
		expect(
			checkedTerrain.getRadio() === undefined ||
				type(checkedTerrain.getRadio()) === "table",
		).toBe(true);
	});

	test("stateful and schema-private terrain exports are present", () => {
		for (const value of [
			checkedTerrain.Create,
			checkedTerrain.Init,
			checkedTerrain.InitLight,
			checkedTerrain.Release,
			checkedTerrain.getCrossParam,
			checkedTerrain.getObjectPosition,
			checkedTerrain.getObjectsAtMapPoint,
			checkedTerrain.getRunwayHeading,
			checkedTerrain.getRunwayList,
			checkedTerrain.getStandList,
			checkedTerrain.getTerrainShpare,
		])
			expect(type(value)).toBe("function");
	});
});
