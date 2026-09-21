import type {
	WorldVolume,
	l_Object,
} from "@flying-dice/tslua-dcs-mission-types";
import { describe, expect, test } from "@flying-dice/tslua-luatest";

describe("world examples", () => {
	test("getAirbases and getMarkPanels return arrays", () => {
		expect(type(world.getAirbases())).toBe("table");
		expect(type(world.getMarkPanels())).toBe("table");
	});

	test("getPlayer returns a unit or nothing", () => {
		const player = world.getPlayer();
		expect(player === undefined || type(player) === "table").toBe(true);
	});

	test("searchObjects count matches callback visits", () => {
		const volume: WorldVolume = {
			id: world.VolumeType.SPHERE,
			params: { point: { x: 0, y: 0, z: 0 }, radius: 1000 },
		};
		const found: l_Object[] = [];
		const count = world.searchObjects(1, volume, (object) => {
			found.push(object);
			return true;
		});
		expect(count).toBe(found.length);
	});

	test("weather getters return numbers", () => {
		expect(type(world.weather.getFogThickness())).toBe("number");
		expect(type(world.weather.getFogVisibilityDistance())).toBe("number");
	});

	test("event, persistence, junk, and weather mutation exports are present", () => {
		for (const value of [
			world.addEventHandler,
			world.getPersistenceData,
			world.onEvent,
			world.removeEventHandler,
			world.removeJunk,
			world.runPersistenceHandlers,
			world.setPersistenceHandler,
			world.setPersistencePassthrough,
			world.weather.setFogAnimation,
			world.weather.setFogThickness,
			world.weather.setFogVisibilityDistance,
		])
			expect(type(value)).toBe("function");
	});
});
