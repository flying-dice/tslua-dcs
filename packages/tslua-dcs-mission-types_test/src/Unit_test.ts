import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { unitFixture } from "./fixtures";

describe("Unit examples", () => {
	test("unit lookup and getters return documented values", () => {
		const unit = unitFixture();
		expect(Unit.getByName(unit.getName())).toEqual(unit);
		const id = unit.getID();
		expect(type(id) === "number" || type(id) === "string").toBe(true);
		expect(type(unit.getObjectID())).toBe("number");
		expect(type(unit.getCoalition())).toBe("number");
		expect(type(unit.getCountry())).toBe("number");
		expect(type(unit.getCategory())).toBe("number");
		expect(type(unit.getCategoryEx())).toBe("number");
		expect(type(unit.getCallsign())).toBe("string");
		expect(type(unit.getNumber())).toBe("number");
		expect(type(unit.getFuel())).toBe("number");
		expect(type(unit.getLife())).toBe("number");
		expect(type(unit.getLife0())).toBe("number");
		expect(type(unit.getDesc())).toBe("table");
		expect(type(unit.getController())).toBe("table");
		expect(type(unit.isActive())).toBe("boolean");
		const [radarActive, radarTarget] = unit.getRadar();
		expect(type(radarActive)).toBe("boolean");
		expect(radarTarget === undefined || type(radarTarget) === "table").toBe(
			true,
		);
	});

	test("extended unit state helpers return documented shapes", () => {
		const unit = unitFixture();
		for (const value of [
			unit.isAlive(),
			unit.isDead(),
			unit.isBroken(),
			unit.isEffective(),
			unit.checkOpenRamp(),
		])
			expect(type(value)).toBe("boolean");
		expect(type(unit.getFuelLowState())).toBe("number");
		for (const value of [unit.hasCarrier(), unit.canShipLanding()])
			expect(value === undefined || type(value) === "boolean").toBe(true);
		expect(
			unit.getAirbase() === undefined || type(unit.getAirbase()) === "table",
		).toBe(true);
		expect(type(Unit.getDescByName(unit.getTypeName()))).toBe("table");
	});

	test("schema-private unit exports remain explicitly discoverable", () => {
		const unit = unitFixture();
		for (const value of [
			unit.LoadOnBoard,
			unit.OldCarrierMenuShow,
			unit.UnloadCargo,
			unit.disembarking,
			unit.getCargosOnBoard,
			unit.getCommunicator,
			unit.getDescentOnBoard,
			unit.getNearestCargosForAircraft,
			unit.getSeats,
			unit.markDisembarkingTask,
			unit.openRamp,
			unit.vtolableLA,
			unit.enableEmission,
			unit.getAmmo,
			unit.getDescentCapacity,
			unit.getDrawArgumentValue,
			unit.getForcesName,
			unit.getGroup,
			unit.getNearestCargos,
			unit.getPlayerName,
			unit.getSensors,
			unit.hasSensors,
		])
			expect(type(value)).toBe("function");
	});
});
