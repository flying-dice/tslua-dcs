/**
 * Call shapes of the class declarations. DCS objects are tables whose metatable is the class table, so
 * instance methods must compile to `object:method(...)` and static functions to `Class.fn(...)`. The
 * doubles reject both mistakes, and spies on the class tables check that a colon call passes the
 * receiver first, followed by the declared arguments in order.
 */
import type {
	l_Airbase,
	l_Group,
	l_Object,
	l_StaticObject,
	l_Unit,
} from "@flying-dice/tslua-dcs-mission-types";
import {
	anything,
	describe,
	expect,
	spyOn,
	test,
} from "@flying-dice/tslua-luatest";
import { DcsObject, doubles, near, required, useFreshWorld } from "./helpers";

/** A class table by global name, typed loosely so spies can target instance methods. */
function classTable(
	name: string,
): Record<string, (...args: unknown[]) => unknown> {
	return (
		_G as unknown as Record<
			string,
			Record<string, (...args: unknown[]) => unknown>
		>
	)[name];
}

const unit = (name = "Enfield-1-1") =>
	required(Unit.getByName(name), `unit ${name}`);
const group = (name = "Enfield-1") =>
	required(Group.getByName(name), `group ${name}`);
const base = (name = "Batumi") =>
	required(Airbase.getByName(name), `airbase ${name}`);
const staticObject = (name = "Blue Hangar") =>
	required(StaticObject.getByName(name), `static ${name}`);

describe("Unit", () => {
	useFreshWorld();

	test("static lookups are dot calls", () => {
		const getByName = spyOn(classTable("Unit"), "getByName");
		const player = unit();
		expect(getByName).toHaveBeenCalledWith("Enfield-1-1");
		expect(Unit.getByName("nobody")).toBeUndefined();
		expect(required(Unit.getDescByName("F-16C_50"), "desc").displayName).toBe(
			"F-16CM bl.50",
		);
		expect(Unit.getDescByName("unknown type")).toBeUndefined();
		expect(Unit.getByName(player.getName())).toBe(player);
	});

	test("instance methods are colon calls with the unit as receiver", () => {
		const hasAttribute = spyOn(classTable("Unit"), "hasAttribute");
		const player = unit();
		expect(player.hasAttribute("Planes")).toBe(true);
		expect(player.hasAttribute("Tanks")).toBe(false);
		expect(hasAttribute).toHaveBeenCalledWith(player, "Planes");
		const drawArgument = spyOn(classTable("Unit"), "getDrawArgumentValue");
		expect(player.getDrawArgumentValue(3)).toBe(0);
		expect(drawArgument).toHaveBeenCalledWith(player, 3);
	});

	test("identity, ownership and descriptors", () => {
		const player = unit();
		expect(player.getName()).toBe("Enfield-1-1");
		expect(player.getTypeName()).toBe("F-16C_50");
		expect(player.getID()).toBe(1);
		expect(player.getObjectID()).toBeTypeOf("number");
		expect(player.getCallsign()).toBe("Enfield11");
		expect(player.getNumber()).toBe(1);
		expect(player.getPlayerName()).toBe("Maverick");
		expect(unit("Enfield-1-2").getPlayerName()).toBeUndefined();
		expect(player.getCoalition()).toBe(coalition.side.BLUE);
		expect(player.getCountry()).toBe(2);
		expect(player.getForcesName()).toBe("USA");
		expect(player.getCategory()).toBe(1);
		expect(player.getCategoryEx()).toBe(Unit.Category.AIRPLANE);
		expect(player.getGroup()).toBe(group());
		expect(player.getDesc().attributes.Planes).toBe(true);
		expect(player.getAttributes()).toEqual(player.getDesc().attributes);
	});

	test("state: position, motion, fuel and life", () => {
		const player = unit();
		expect(player.getPoint()).toEqual({ x: -350000, y: 6000, z: 620000 });
		const position = player.getPosition();
		expect(position.p).toEqual(player.getPoint());
		expect(near(position.y, { x: 0, y: 1, z: 0 })).toBe(true);
		expect(position.x.x).toBeCloseTo(math.cos(0.5), 6);
		expect(player.getVelocity()).toEqual({ x: 150, y: 0, z: 0 });
		expect(player.inAir()).toBe(true);
		expect(player.getFuel()).toBe(0.75);
		expect(player.getFuelLowState()).toBe(0);
		expect(player.getLife()).toBe(20);
		expect(player.getLife0()).toBe(20);
		expect(player.isExist()).toBe(true);
		expect(player.isActive()).toBe(true);
		expect(player.isAlive()).toBe(true);
		expect(player.isDead()).toBe(false);
		expect(player.isBroken()).toBe(false);
		expect(player.isEffective()).toBe(true);
		doubles.setLife(player, 5);
		expect(player.isBroken()).toBe(true);
		expect(player.isEffective()).toBe(false);
		doubles.setLife(player, 0);
		expect(player.isDead()).toBe(true);
		expect(player.isAlive()).toBe(false);
	});

	test("getRadar returns both values of its multi-return", () => {
		const [active, target] = unit().getRadar();
		expect(active).toBe(false);
		expect(target).toBeUndefined();
	});

	test("sensors, ammo and emission", () => {
		const player = unit();
		const truck = unit("Uzi-1-1");
		expect(player.hasSensors()).toBe(true);
		expect(player.hasSensors(Unit.SensorType.RADAR)).toBe(true);
		expect(player.hasSensors(Unit.SensorType.IRST)).toBe(false);
		expect(truck.hasSensors()).toBe(false);
		const sensors = required(player.getSensors(), "sensors");
		expect(sensors[Unit.SensorType.RADAR][0].typeName).toBe("AN/APG-68");
		expect(truck.getSensors()).toBeUndefined();
		expect(required(player.getAmmo(), "ammo")[0].count).toBe(511);
		expect(truck.getAmmo()).toBeUndefined();
		player.enableEmission(false);
		expect(player.getController()).toBeTypeOf("table");
	});

	test("airbase, cargo and carrier queries", () => {
		const truck = unit("Uzi-1-1");
		expect(required(truck.getAirbase(), "airbase").getName()).toBe("Batumi");
		expect(unit().getAirbase()).toBeUndefined();
		expect(unit("Red Armor-1").getAirbase()).toBeUndefined();
		expect(truck.getNearestCargos()?.map((cargo) => cargo.getName())).toEqual([
			"Ammo Crate",
		]);
		expect(truck.getNearestCargosForAircraft()).toEqual([]);
		expect(truck.getCargosOnBoard()).toEqual([]);
		expect(truck.getDescentCapacity()).toBe(0);
		expect(truck.getDescentOnBoard()).toBeUndefined();
		expect(truck.getSeats()).toBeUndefined();
		expect(truck.hasCarrier()).toBe(false);
		expect(truck.canShipLanding()).toBe(false);
		expect(truck.checkOpenRamp()).toBe(false);
		truck.openRamp();
		expect(truck.getCommunicator()).toBeUndefined();
	});

	test("schema-private methods take the unit as receiver", () => {
		const truck = unit("Uzi-1-1");
		const load = spyOn(classTable("Unit"), "LoadOnBoard");
		truck.LoadOnBoard("cargo");
		expect(load).toHaveBeenCalledWith(truck, "cargo");
		expect(truck.UnloadCargo()).toBeUndefined();
		expect(truck.OldCarrierMenuShow()).toBeUndefined();
		expect(truck.disembarking()).toBeUndefined();
		expect(truck.markDisembarkingTask()).toBeUndefined();
		expect(truck.vtolableLA()).toBeUndefined();
	});

	test("destroy removes the unit from the world and its group", () => {
		const wingman = unit("Enfield-1-2");
		wingman.destroy();
		expect(wingman.isExist()).toBe(false);
		expect(Unit.getByName("Enfield-1-2")).toBeUndefined();
		expect(group().getSize()).toBe(1);
		expect(group().getInitialSize()).toBe(2);
		expect(() => wingman.getName()).toThrow("does not exist");
	});
});

describe("Group", () => {
	useFreshWorld();

	test("lookups, identity and composition", () => {
		const flight = group();
		expect(Group.getByName("Enfield-1")).toBe(flight);
		expect(Group.getByName("nobody")).toBeUndefined();
		expect(flight.getName()).toBe("Enfield-1");
		expect(flight.getID()).toBe(1);
		expect(flight.getCoalition()).toBe(coalition.side.BLUE);
		expect(flight.getCategory()).toBe(Group.Category.AIRPLANE);
		expect(flight.getCategoryEx()).toBe(Group.Category.AIRPLANE);
		expect(flight.getSize()).toBe(2);
		expect(flight.getInitialSize()).toBe(2);
		expect(flight.getUnits().map((member) => member.getName())).toEqual([
			"Enfield-1-1",
			"Enfield-1-2",
		]);
		expect(flight.getUnit(2)).toBe(unit("Enfield-1-2"));
		expect(flight.getUnit(3)).toBeUndefined();
		expect(flight.isExist()).toBe(true);
	});

	test("getUnit passes the index after the receiver", () => {
		const getUnit = spyOn(classTable("Group"), "getUnit");
		const flight = group();
		flight.getUnit(1);
		expect(getUnit).toHaveBeenCalledWith(flight, 1);
	});

	test("controller, activation, emission and destruction", () => {
		const armor = group("Red Armor");
		const controller = armor.getController();
		expect(controller).toBe(armor.getController());
		expect(controller).not.toBe(unit("Red Armor-1").getController());
		armor.activate();
		armor.enableEmission(false);
		expect(armor.embarking()).toBeUndefined();
		expect(armor.markGroup()).toBeUndefined();
		armor.destroy();
		expect(armor.isExist()).toBe(false);
		expect(Unit.getByName("Red Armor-1")).toBeUndefined();
		expect(() => armor.getName()).toThrow("does not exist");
	});
});

describe("StaticObject", () => {
	useFreshWorld();

	test("lookups and getters", () => {
		const hangar = staticObject();
		expect(StaticObject.getByName("Blue Hangar")).toBe(hangar);
		expect(StaticObject.getByName("nothing")).toBeUndefined();
		expect(required(StaticObject.getDescByName("Hangar A"), "desc").life).toBe(
			100,
		);
		expect(StaticObject.getDescByName("nothing")).toBeUndefined();
		expect(hangar.getName()).toBe("Blue Hangar");
		expect(hangar.getTypeName()).toBe("Hangar A");
		expect(hangar.getID()).toBe(50);
		expect(hangar.getLife()).toBe(100);
		expect(hangar.getCountry()).toBe(2);
		expect(hangar.getCoalition()).toBe(coalition.side.BLUE);
		expect(hangar.getForcesName()).toBe("USA");
		expect(hangar.getCategory()).toBe(3);
		expect(hangar.getDesc().typeName).toBe("Hangar A");
		expect(hangar.getAttributes()).toEqual({ Buildings: true, All: true });
		expect(hangar.hasAttribute("Buildings")).toBe(true);
		expect(hangar.getPoint()).toEqual({ x: -356300, y: 10, z: 618100 });
		expect(hangar.getPosition().p).toEqual(hangar.getPoint());
		expect(hangar.getVelocity()).toEqual({ x: 0, y: 0, z: 0 });
		expect(hangar.inAir()).toBe(false);
		expect(hangar.getDrawArgumentValue(1)).toBe(0);
		expect(hangar.isExist()).toBe(true);
	});

	test("cargo statics report their cargo data", () => {
		const crate = staticObject("Ammo Crate");
		expect(crate.getCargoDisplayName()).toBe("Ammo");
		expect(crate.getCargoWeight()).toBe(500);
		expect(staticObject().getCargoDisplayName()).toBeUndefined();
		expect(staticObject().getCargoWeight()).toBe(0);
		const choose = spyOn(classTable("StaticObject"), "chooseCargo");
		crate.chooseCargo(true);
		expect(choose).toHaveBeenCalledWith(crate, true);
	});

	test("destroy", () => {
		const hangar = staticObject();
		hangar.destroy();
		expect(hangar.isExist()).toBe(false);
		expect(StaticObject.getByName("Blue Hangar")).toBeUndefined();
	});
});

describe("Airbase", () => {
	useFreshWorld();

	test("static lookups, including getNearest by coalition", () => {
		const batumi = base();
		expect(Airbase.getByName("Nowhere")).toBeUndefined();
		expect(
			required(Airbase.getDescByName("Batumi"), "desc").attributes.Airfields,
		).toBe(true);
		expect(Airbase.getDescByName("Nowhere")).toBeUndefined();
		expect(Airbase.getNearest(batumi.getPoint(), coalition.side.BLUE)).toBe(
			batumi,
		);
		expect(Airbase.getNearest(batumi.getPoint(), coalition.side.RED)).toBe(
			base("Senaki-Kolkhi"),
		);
		expect(
			Airbase.getNearest(batumi.getPoint(), coalition.side.NEUTRAL),
		).toBeUndefined();
		const getNearest = spyOn(classTable("Airbase"), "getNearest");
		Airbase.getNearest(batumi.getPoint(), 2);
		expect(getNearest).toHaveBeenCalledWith(batumi.getPoint(), 2);
	});

	test("identity and object getters", () => {
		const batumi = base();
		expect(batumi.getName()).toBe("Batumi");
		expect(batumi.getTypeName()).toBe("Batumi");
		expect(batumi.getID()).toBe(22);
		expect(batumi.getWorldID()).toBeTypeOf("number");
		expect(batumi.getCallsign()).toBe("Batumi");
		expect(batumi.getCoalition()).toBe(coalition.side.BLUE);
		expect(batumi.getCountry()).toBe(16);
		expect(batumi.getForcesName()).toBe("Georgia");
		expect(batumi.getCategory()).toBe(4);
		expect(batumi.getCategoryEx()).toBe(Airbase.Category.AIRDROME);
		expect(batumi.getDesc().displayName).toBe("Batumi");
		expect(batumi.getAttributes()).toEqual({ Airfields: true });
		expect(batumi.hasAttribute("Airfields")).toBe(true);
		expect(batumi.getLife()).toBe(3600);
		expect(batumi.getPoint()).toEqual({ x: -356437, y: 10, z: 618211 });
		expect(batumi.getPosition().p).toEqual(batumi.getPoint());
		expect(batumi.getVelocity()).toEqual({ x: 0, y: 0, z: 0 });
		expect(batumi.inAir()).toBe(false);
		expect(batumi.isExist()).toBe(true);
		expect(batumi.getUnit()).toBeUndefined();
		expect(batumi.getCommunicator()).toBeUndefined();
	});

	test("parking, runways and tower", () => {
		const batumi = base();
		expect(batumi.getParking()).toHaveLength(4);
		const free = batumi.getParking(true);
		expect(free).toHaveLength(3);
		expect(free[0].Term_Index).toBe(2);
		expect(batumi.getRunways()[0].length).toBe(2400);
		expect(required(batumi.getDispatcherTowerPos(), "tower").pos.y).toBe(30);
	});

	test("capture, coalition and radio settings", () => {
		const batumi = base();
		expect(batumi.autoCaptureIsOn()).toBe(true);
		batumi.autoCapture(false);
		expect(batumi.autoCaptureIsOn()).toBe(false);
		batumi.setCoalition(coalition.side.RED);
		expect(batumi.getCoalition()).toBe(coalition.side.RED);
		expect(batumi.getRadioSilentMode()).toBe(false);
		batumi.setRadioSilentMode(true);
		expect(batumi.getRadioSilentMode()).toBe(true);
		const setCoalition = spyOn(classTable("Airbase"), "setCoalition");
		batumi.setCoalition(2);
		expect(setCoalition).toHaveBeenCalledWith(batumi, 2);
		batumi.destroy();
		expect(batumi.isExist()).toBe(false);
	});
});

describe("Warehouse", () => {
	useFreshWorld();

	test("static functions are dot calls", () => {
		const warehouse = base().getWarehouse();
		expect(Warehouse.getByName("Batumi")).toBe(warehouse);
		expect(Warehouse.getByName("Ammo Crate")).toBe(
			Warehouse.getCargoAsWarehouse(staticObject("Ammo Crate")),
		);
		expect(Warehouse.getByName("Nowhere")).toBeUndefined();
		expect(Warehouse.getCargoAsWarehouse(staticObject())).toBeUndefined();
		expect(Warehouse.getResourceMap()["weapons.bombs.GBU_31"]).toBe(true);
	});

	test("items and liquids", () => {
		const warehouse = base().getWarehouse();
		const addItem = spyOn(classTable("Warehouse"), "addItem");
		warehouse.addItem("weapons.bombs.GBU_31", 3);
		expect(addItem).toHaveBeenCalledWith(warehouse, "weapons.bombs.GBU_31", 3);
		expect(warehouse.getItemCount("weapons.bombs.GBU_31")).toBe(15);
		warehouse.removeItem("weapons.bombs.GBU_31", 20);
		expect(warehouse.getItemCount("weapons.bombs.GBU_31")).toBe(0);
		warehouse.setItem([4, 4, 7, 32], 2);
		expect(warehouse.getItemCount([4, 4, 7, 32])).toBe(2);
		warehouse.addLiquid(0, 500);
		expect(warehouse.getLiquidAmount(0)).toBe(100500);
		warehouse.removeLiquid(1, 10000);
		expect(warehouse.getLiquidAmount(1)).toBe(0);
		warehouse.setLiquidAmount(3, 7);
		expect(warehouse.getLiquidAmount(3)).toBe(7);
		expect(warehouse.getLiquidAmount(2)).toBe(0);
		const inventory = warehouse.getInventory();
		expect(inventory.aircraft).toEqual({ "F-16C_50": 4 });
		expect(inventory.weapon).toEqual({
			"weapons.bombs.GBU_31": 0,
			"4.4.7.32": 2,
		});
		expect(inventory.liquids[3]).toBe(7);
		expect(warehouse.getOwner()).toBe(base() as unknown as l_Object);
	});
});

describe("Controller", () => {
	useFreshWorld();

	test("tasks are pushed, popped, set and reset", () => {
		const controller = group("Uzi-1").getController();
		const pushTask = spyOn(classTable("Controller"), "pushTask");
		expect(controller.hasTask()).toBe(false);
		const task = { id: "Hold", params: {} };
		controller.pushTask(task);
		expect(pushTask).toHaveBeenCalledWith(controller, task);
		expect(controller.hasTask()).toBe(true);
		controller.popTask();
		expect(controller.hasTask()).toBe(false);
		controller.setTask({ id: "Mission", params: { route: {} } });
		expect(controller.hasTask()).toBe(true);
		controller.resetTask();
		expect(controller.hasTask()).toBe(false);
	});

	test("commands, options, altitude and speed", () => {
		const controller = group().getController();
		const setOption = spyOn(classTable("Controller"), "setOption");
		controller.setCommand({ id: "SetFrequency", params: { frequency: 251e6 } });
		expect(
			controller.setOption(
				AI.Option.Air.id.ROE,
				AI.Option.Air.val.ROE.WEAPON_HOLD,
			),
		).toBe(true);
		expect(setOption).toHaveBeenCalledWith(controller, 0, 4);
		controller.setOnOff(false);
		controller.setAltitude(5000, true, "BARO");
		controller.setSpeed(200, false);
	});

	test("detection reports enemies within range", () => {
		const blueTrucks = group("Uzi-1").getController();
		const blueFlight = group().getController();
		const enemy = unit("Red Armor-1");
		expect(blueTrucks.getDetectedTargets()).toEqual([]);
		const targets = blueFlight.getDetectedTargets(Controller.Detection.RADAR);
		expect(targets.map((target) => target.object.getName())).toEqual([
			"Red Armor-1",
			"Red Armor-2",
		]);
		const [
			detected,
			visible,
			lastTime,
			typeKnown,
			distanceKnown,
			lastPosition,
			lastVelocity,
		] = blueFlight.isTargetDetected(
			enemy as unknown as l_Object,
			Controller.Detection.VISUAL,
		);
		expect([detected, visible, lastTime, typeKnown, distanceKnown]).toEqual([
			true,
			true,
			0,
			true,
			true,
		]);
		expect(lastPosition).toEqual(enemy.getPoint());
		expect(lastVelocity).toEqual({ x: 0, y: 0, z: 0 });
		const [notDetected] = blueTrucks.isTargetDetected(
			enemy as unknown as l_Object,
		);
		expect(notDetected).toBe(false);
		expect(
			blueFlight.knowTarget(enemy as unknown as l_Object, true, false),
		).toBe(true);
	});
});

describe("Weapon", () => {
	useFreshWorld();

	test("weapons launched through the doubles expose their launcher and target", () => {
		const shooter = unit();
		const enemy = unit("Red Armor-1");
		const shots: unknown[] = [];
		world.addEventHandler({
			onEvent(event) {
				if (event.id === world.event.S_EVENT_SHOT) shots.push(event.weapon);
			},
		});
		const weapon = doubles.launchWeapon({
			typeName: "AIM_120C",
			launcher: shooter,
			target: enemy,
		});
		expect(shots).toEqual([weapon]);
		expect(weapon.getLauncher()).toBe(shooter);
		expect(weapon.getTarget()).toBe(enemy as unknown as l_Object);
		expect(weapon.getTypeName()).toBe("AIM_120C");
		expect(weapon.getName()).toMatch("^AIM_120C#");
		expect(weapon.getCategory()).toBe(2);
		expect(weapon.getCategoryEx()).toBe(Weapon.Category.MISSILE);
		expect(weapon.getCoalition()).toBe(coalition.side.BLUE);
		expect(weapon.getCountry()).toBe(2);
		expect(weapon.getForcesName()).toBe("USA");
		expect(weapon.getDesc().displayName).toBe("AIM-120C AMRAAM");
		expect(weapon.getAttributes()).toEqual({ Missiles: true, All: true });
		expect(weapon.hasAttribute("Missiles")).toBe(true);
		expect(weapon.getPoint()).toEqual(shooter.getPoint());
		expect(weapon.getPosition().p).toEqual(shooter.getPoint());
		expect(weapon.getVelocity()).toEqual({ x: 600, y: 0, z: 0 });
		expect(weapon.inAir()).toBe(true);
		expect(weapon.isExist()).toBe(true);
		weapon.destroy();
		expect(weapon.isExist()).toBe(false);
		const unguided = doubles.launchWeapon({ typeName: "M61", launcher: enemy });
		expect(unguided.getTarget()).toBeUndefined();
		enemy.destroy();
		expect(unguided.getLauncher()).toBeUndefined();
	});
});

describe("Object (base class functions)", () => {
	useFreshWorld();

	test("Object.fn(object, ...) accepts any world object", () => {
		const truck = unit("Uzi-1-1") as unknown as l_Object;
		const hangar = staticObject() as unknown as l_Object;
		const batumi = base() as unknown as l_Object;
		expect(DcsObject.getName(truck)).toBe("Uzi-1-1");
		expect(DcsObject.getName(hangar)).toBe("Blue Hangar");
		expect(DcsObject.getTypeName(batumi)).toBe("Batumi");
		expect(DcsObject.getCategory(truck)).toBe(DcsObject.Category.UNIT);
		expect(DcsObject.getPoint(hangar)).toEqual({
			x: -356300,
			y: 10,
			z: 618100,
		});
		expect(DcsObject.getPosition(hangar).p).toEqual({
			x: -356300,
			y: 10,
			z: 618100,
		});
		expect(DcsObject.getVelocity(truck)).toEqual({ x: 0, y: 0, z: 0 });
		expect(DcsObject.inAir(truck)).toBe(false);
		expect(DcsObject.hasAttribute(truck, "Trucks")).toBe(true);
		expect(DcsObject.getAttributes(batumi)).toEqual({ Airfields: true });
		expect(DcsObject.isExist(truck)).toBe(true);
		DcsObject.destroy(hangar);
		expect(DcsObject.isExist(hangar)).toBe(false);
	});

	test("members inherited from Object are reachable from subclasses", () => {
		const truck = unit("Uzi-1-1") as unknown as l_Object;
		const cancel = spyOn(classTable("Object"), "cancelChoosingCargo");
		expect(truck.cancelChoosingCargo()).toBeUndefined();
		expect(cancel).toHaveBeenCalledWith(truck);
	});
});

describe("instance identity", () => {
	useFreshWorld();

	test("every lookup of the same object returns the same table", () => {
		const fromGroup: l_Group = required(unit().getGroup(), "group");
		expect(fromGroup).toBe(group());
		const bases: l_Airbase[] = world.getAirbases();
		expect(bases[0]).toBe(base());
		const statics: l_StaticObject[] = coalition.getStaticObjects(2);
		expect(statics[0]).toBe(staticObject());
		const members: l_Unit[] = group().getUnits();
		expect(members[0]).toBe(unit());
		expect(members).toContain(unit("Enfield-1-2"));
		expect(members).toEqual([anything(), anything()]);
	});
});
