import { describe, expect, test } from "@flying-dice/tslua-luatest";

describe("Airbase examples", () => {
	test("getByName returns the documented airbase", () => {
		const base = Airbase.getByName("Batumi");
		expect(base !== undefined).toBe(true);
		if (!base) return;
		expect(base.getName()).toBe("Batumi");
		expect(type(base.getID())).toBe("number");
		expect(type(base.getCoalition())).toBe("number");
		expect(type(base.getCategory())).toBe("number");
		expect(type(base.getPoint())).toBe("table");
		expect(type(base.getPosition())).toBe("table");
		expect(type(base.getVelocity())).toBe("table");
		expect(type(base.getDesc())).toBe("table");
		expect(type(base.getAttributes())).toBe("table");
		expect(type(base.getRunways())).toBe("table");
		expect(type(base.getParking())).toBe("table");
		expect(type(base.getWarehouse())).toBe("table");
		expect(base.isExist()).toBe(true);
	});

	test("getDescByName returns descriptor data", () => {
		const descriptor = Airbase.getDescByName("Batumi");
		expect(descriptor === undefined || type(descriptor) === "table").toBe(true);
	});

	test("extended airbase exports have documented runtime shapes", () => {
		const base = Airbase.getByName("Batumi");
		if (!base) throw new Error("Batumi is required for the airbase examples");
		expect(type(base.getLife())).toBe("number");
		expect(type(base.getWorldID())).toBe("number");
		expect(type(base.getForcesName())).toBe("string");
		expect(type(base.getCommunicator) === "function").toBe(true);
		const nearest = Airbase.getNearest(base.getPoint(), coalition.side.BLUE);
		expect(nearest === undefined || type(nearest) === "table").toBe(true);
	});

	test("state-changing and platform-specific airbase exports are present", () => {
		const base = Airbase.getByName("Batumi");
		if (!base) throw new Error("Batumi is required for the airbase examples");
		for (const value of [
			base.autoCapture,
			base.autoCaptureIsOn,
			base.getCallsign,
			base.getCategoryEx,
			base.getCountry,
			base.getDispatcherTowerPos,
			base.getRadioSilentMode,
			base.getTypeName,
			base.getUnit,
			base.setCoalition,
			base.setRadioSilentMode,
		])
			expect(type(value)).toBe("function");
	});
});
