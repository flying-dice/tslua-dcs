import type { l_Vec3 } from "@flying-dice/tslua-dcs-mission-types";
import { describe, expect, test } from "@flying-dice/tslua-luatest";

const latitude = 41.6103;
const longitude = 41.5997;

describe("coord examples", () => {
	test("LLtoLO and LOtoLL round trip", () => {
		const point = coord.LLtoLO(latitude, longitude, 250);
		const [actualLatitude, actualLongitude, altitude] = coord.LOtoLL(point);
		expect(math.abs(actualLatitude - latitude) < 0.0001).toBe(true);
		expect(math.abs(actualLongitude - longitude) < 0.0001).toBe(true);
		expect(math.abs(altitude - 250) < 0.1).toBe(true);
	});

	test("LLtoMGRS and MGRStoLL round trip", () => {
		const grid = coord.LLtoMGRS(latitude, longitude);
		const [actualLatitude, actualLongitude] = coord.MGRStoLL(grid);
		expect(math.abs(actualLatitude - latitude) < 0.0001).toBe(true);
		expect(math.abs(actualLongitude - longitude) < 0.0001).toBe(true);
	});

	test("LOtoLL accepts a documented Vec3", () => {
		const point: l_Vec3 = { x: 0, y: 1000, z: 0 };
		const [actualLatitude, actualLongitude, altitude] = coord.LOtoLL(point);
		expect(type(actualLatitude)).toBe("number");
		expect(type(actualLongitude)).toBe("number");
		expect(altitude).toBe(1000);
	});
});
