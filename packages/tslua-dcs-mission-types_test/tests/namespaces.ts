/**
 * Call shapes of the namespace declarations: every function of every namespace is called from
 * TypeScript exactly as mission code would call it. The doubles reject a colon call, so each call proves
 * the declaration compiles to `namespace.fn(...)`; spies additionally check that the arguments arrive in
 * order (a stray `self` would shift them) and multi-returns are destructured into every value.
 */
import type {
	l_Vec3,
	TriggerColor,
	WorldVolume,
} from "@flying-dice/tslua-dcs-mission-types";
import {
	anything,
	describe,
	expect,
	fn,
	spyOn,
	stringContaining,
	test,
} from "@flying-dice/tslua-luatest";
import { doubles, required, useFreshWorld } from "./helpers";

const origin: l_Vec3 = { x: 0, y: 0, z: 0 };
const batumi: l_Vec3 = { x: -356437, y: 10, z: 618211 };

describe("env", () => {
	useFreshWorld();

	test("info, warning and error log their message without a self argument", () => {
		const info = spyOn(env, "info");
		env.info("hello", false);
		env.warning("careful");
		env.error("broken", true);
		expect(info).toHaveBeenCalledWith("hello", false);
		expect(doubles.log()).toEqual([
			{ level: "info", message: "hello" },
			{ level: "warning", message: "careful" },
			{ level: "error", message: "broken" },
		]);
	});

	test("mission queries return the fixture mission", () => {
		expect(env.getMissionName()).toBe("tslua-dcs mission doubles");
		expect(env.getMode()).toBe(env.Mode.SIMULATION);
		expect(env.getValueDictByKey("DictKey_MissionName")).toBe(
			"tslua-dcs mission doubles",
		);
		expect(env.getValueDictByKey("missing")).toBe("missing");
	});

	test("setErrorMessageBoxEnabled and showTraining accept their arguments", () => {
		const enable = spyOn(env, "setErrorMessageBoxEnabled");
		env.setErrorMessageBoxEnabled(false);
		expect(enable).toHaveBeenCalledWith(false);
		expect(env.showTraining("intro")).toBeUndefined();
	});

	test("crash raises instead of terminating the process", () => {
		expect(() => env.crash()).toThrow("env.crash() was called");
	});
});

describe("timer", () => {
	useFreshWorld();

	test("time getters report model time, absolute time and mission start", () => {
		doubles.advanceTime(12.5);
		expect(timer.getTime()).toBe(12.5);
		expect(timer.getTime0()).toBe(43200);
		expect(timer.getAbsTime()).toBe(43212.5);
		expect(timer.getPause()).toBe(false);
		doubles.setPaused(true);
		expect(timer.getPause()).toBe(true);
	});

	test("scheduleFunction passes (argument, time) to the callback without self", () => {
		// The mock itself is scheduled, so it records exactly what the timer passes.
		const callback = fn<(this: void, argument: string, time: number) => number>(
			(_argument, time) => time + 10,
		);
		const id = timer.scheduleFunction(callback, "payload", 5);
		expect(id).toBeTypeOf("number");
		doubles.advanceTime(26);
		expect(callback).toHaveBeenCalledTimes(3);
		expect(callback).toHaveBeenNthCalledWith(1, "payload", 5);
		expect(callback).toHaveBeenNthCalledWith(2, "payload", 15);
		expect(callback).toHaveBeenNthCalledWith(3, "payload", 25);
	});

	test("setFunctionTime moves a function and removeFunction cancels it", () => {
		const callback = fn(() => undefined);
		const id = timer.scheduleFunction(() => callback(), undefined, 100);
		expect(timer.setFunctionTime(id, 10)).toBe(10);
		doubles.advanceTime(10);
		expect(callback).toHaveBeenCalledTimes(1);
		const second = timer.scheduleFunction(() => callback(), undefined, 20);
		timer.removeFunction(second);
		doubles.advanceTime(20);
		expect(callback).toHaveBeenCalledTimes(1);
	});
});

describe("trigger.action", () => {
	useFreshWorld();
	const red: TriggerColor = [1, 0, 0, 1];
	const fill: TriggerColor = [1, 0, 0, 0.2];

	test("outText variants deliver text, time and recipient in order", () => {
		const outText = spyOn(trigger.action, "outText");
		trigger.action.outText("all", 10, true);
		trigger.action.outTextForCoalition(coalition.side.BLUE, "blue", 5);
		trigger.action.outTextForCountry(2, "usa", 6);
		trigger.action.outTextForGroup(1, "group", 7);
		trigger.action.outTextForUnit(1, "unit", 8, false);
		expect(outText).toHaveBeenCalledWith("all", 10, true);
		expect(doubles.messages()).toEqual([
			{ kind: "outText", text: "all", displayTime: 10, clearView: true },
			{ kind: "outTextForCoalition", target: 2, text: "blue", displayTime: 5 },
			{ kind: "outTextForCountry", target: 2, text: "usa", displayTime: 6 },
			{ kind: "outTextForGroup", target: 1, text: "group", displayTime: 7 },
			{
				kind: "outTextForUnit",
				target: 1,
				text: "unit",
				displayTime: 8,
				clearView: false,
			},
		]);
	});

	test("user flags round-trip through trigger.misc.getUserFlag", () => {
		trigger.action.setUserFlag("alpha", 73);
		trigger.action.setUserFlag(5, true);
		expect(trigger.misc.getUserFlag("alpha")).toBe(73);
		expect(trigger.misc.getUserFlag(5)).toBe(1);
		expect(trigger.misc.getUserFlag("never-set")).toBe(0);
	});

	test("group actions receive the group object", () => {
		const group = required(Group.getByName("Uzi-1"), "group Uzi-1");
		trigger.action.deactivateGroup(group);
		expect(required(group.getUnit(1), "unit").isActive()).toBe(false);
		trigger.action.activateGroup(group);
		expect(required(group.getUnit(1), "unit").isActive()).toBe(true);
		const setAITask = spyOn(trigger.action, "setAITask");
		trigger.action.setGroupAIOn(group);
		trigger.action.setGroupAIOff(group);
		trigger.action.groupStopMoving(group);
		trigger.action.groupContinueMoving(group);
		trigger.action.setAITask(group, 2);
		trigger.action.pushAITask(group, 3);
		expect(setAITask).toHaveBeenCalledWith(group, 2);
		expect(doubles.effects().map((effect) => effect.kind)).toEqual([
			"setGroupAIOn",
			"setGroupAIOff",
			"groupStopMoving",
			"groupContinueMoving",
			"setAITask",
			"pushAITask",
		]);
	});

	test("effects, sounds and radio calls are recorded with their arguments", () => {
		trigger.action.explosion(batumi, 100);
		trigger.action.smoke(batumi, trigger.smokeColor.Green);
		trigger.action.effectSmokeBig(batumi, 1, 0.5, "fire");
		trigger.action.effectSmokeStop("fire");
		trigger.action.illuminationBomb(batumi, 1000);
		trigger.action.signalFlare(batumi, trigger.flareColor.Red, 90);
		trigger.action.ctfColorTag("Enfield-1-1", 1, 0);
		trigger.action.radioTransmission(
			"sound.ogg",
			batumi,
			0,
			true,
			124e6,
			100,
			"atc",
		);
		trigger.action.stopRadioTransmission("atc");
		trigger.action.outSound("a.ogg");
		trigger.action.outSoundForCoalition(1, "b.ogg");
		trigger.action.outSoundForCountry(2, "c.ogg");
		trigger.action.outSoundForGroup(1, "d.ogg");
		trigger.action.outSoundForUnit(1, "e.ogg");
		trigger.action.outSoundStop();
		trigger.action.setUnitInternalCargo("Enfield-1-1", 500);
		trigger.action.userEvent(7);
		trigger.action.addOtherCommand("Go", "flag", 1);
		trigger.action.addOtherCommandForCoalition(2, "Go", "flag", 1);
		trigger.action.addOtherCommandForGroup(1, "Go", "flag", 1);
		trigger.action.removeOtherCommand("Go");
		trigger.action.removeOtherCommandForCoalition(2, "Go");
		trigger.action.removeOtherCommandForGroup(1, "Go");
		const effects = doubles.effects();
		expect(effects).toHaveLength(23);
		expect(effects[0]).toEqual({ kind: "explosion", args: [batumi, 100] });
		expect(effects[7]).toEqual({
			kind: "radioTransmission",
			args: ["sound.ogg", batumi, 0, true, 124e6, 100, "atc"],
		});
		expect(effects[22]).toEqual({
			kind: "removeOtherCommandForGroup",
			args: [1, "Go"],
		});
	});

	test("marks are created, listed by world.getMarkPanels and removed", () => {
		trigger.action.markToAll(1, "all", batumi, true, "msg");
		trigger.action.markToCoalition(2, "blue", batumi, coalition.side.BLUE);
		trigger.action.markToGroup(3, "group", batumi, 1, false);
		const panels = world.getMarkPanels();
		expect(panels).toHaveLength(3);
		expect(panels[1]).toEqual({
			idx: 2,
			time: 0,
			text: "blue",
			pos: batumi,
			coalition: 2,
			groupID: -1,
		});
		trigger.action.removeMark(2);
		expect(world.getMarkPanels().map((panel) => panel.idx)).toEqual([1, 3]);
	});

	test("markup shapes accept their full argument lists and can be changed", () => {
		const end = { x: batumi.x + 100, y: 10, z: batumi.z + 100 };
		trigger.action.lineToAll(-1, 10, batumi, end, red, 1, true, "line");
		trigger.action.arrowToAll(-1, 11, batumi, end, red, fill, 2, true, "arrow");
		trigger.action.circleToAll(
			-1,
			12,
			batumi,
			50,
			red,
			fill,
			3,
			false,
			"circle",
		);
		trigger.action.rectToAll(-1, 13, batumi, end, red, fill, 4);
		trigger.action.quadToAll(
			-1,
			14,
			batumi,
			end,
			origin,
			batumi,
			red,
			fill,
			5,
			true,
			"quad",
		);
		trigger.action.textToAll(-1, 15, batumi, red, fill, 14, true, "label");
		trigger.action.markupToAll(7, -1, 16, batumi, end, origin, red, fill, 1);
		trigger.action.setMarkupColor(12, fill);
		trigger.action.setMarkupColorFill(12, red);
		trigger.action.setMarkupRadius(12, 75);
		trigger.action.setMarkupTypeLine(12, 6);
		trigger.action.setMarkupText(15, "renamed");
		trigger.action.setMarkupFontSize(15, 20);
		trigger.action.setMarkupPositionStart(10, origin);
		trigger.action.setMarkupPositionEnd(10, batumi);
		const marks = doubles.marks();
		expect(marks.map((mark) => mark.shape)).toEqual([
			"line",
			"arrow",
			"circle",
			"rect",
			"quad",
			"text",
			"freeform",
		]);
		expect(marks[0].points).toEqual([origin, batumi]);
		expect(marks[2].radius).toBe(75);
		expect(marks[2].color).toEqual(fill);
		expect(marks[2].fillColor).toEqual(red);
		expect(marks[2].lineType).toBe(6);
		expect(marks[4].points).toHaveLength(4);
		expect(marks[5].text).toBe("renamed");
		expect(marks[5].fontSize).toBe(20);
		expect(marks[6].points).toEqual([batumi, end, origin]);
	});
});

describe("trigger.misc", () => {
	useFreshWorld();

	test("getZone returns the fixture zone and undefined for unknown zones", () => {
		const zone = required(trigger.misc.getZone("Batumi Zone"), "zone");
		expect(zone.radius).toBe(3000);
		expect(zone.point).toEqual({ x: -356437, y: 0, z: 618211 });
		expect(zone.properties).toEqual([{ key: "purpose", value: "fixture" }]);
		expect(trigger.misc.getZone("nowhere")).toBeUndefined();
	});

	test("addZone and addTrigger take one definition argument", () => {
		const addTrigger = spyOn(trigger.misc, "addTrigger");
		trigger.misc.addZone({ name: "New Zone", radius: 10, point: origin });
		trigger.misc.addTrigger({ id: 1 });
		expect(addTrigger).toHaveBeenCalledWith({ id: 1 });
		expect(required(trigger.misc.getZone("New Zone"), "new zone").radius).toBe(
			10,
		);
	});
});

describe("world", () => {
	useFreshWorld();

	test("event handlers receive events through handler:onEvent(event)", () => {
		const seen: number[] = [];
		const handler = {
			onEvent(event: { id: number }) {
				expect(this).toBe(handler);
				seen.push(event.id);
			},
		};
		world.addEventHandler(handler);
		world.addEventHandler(handler);
		world.onEvent({ id: world.event.S_EVENT_MISSION_START, time: 0 });
		world.removeEventHandler(handler);
		world.onEvent({ id: world.event.S_EVENT_MISSION_END, time: 1 });
		expect(seen).toEqual([world.event.S_EVENT_MISSION_START]);
	});

	test("getPlayer and getAirbases return fixture objects", () => {
		expect(required(world.getPlayer(), "player").getPlayerName()).toBe(
			"Maverick",
		);
		expect(world.getAirbases().map((base) => base.getName())).toEqual([
			"Batumi",
			"Kobuleti",
			"Senaki-Kolkhi",
		]);
	});

	test("searchObjects calls the handler with (object, data) and counts visits", () => {
		const volume: WorldVolume = {
			id: world.VolumeType.SPHERE,
			params: { point: batumi, radius: 2000 },
		};
		const visits: string[] = [];
		const count = world.searchObjects(
			[1, 3],
			volume,
			(object, data: string) => {
				visits.push(`${data}:${object.getName()}`);
				return true;
			},
			"seen",
		);
		expect(count).toBe(2);
		expect(visits).toEqual(["seen:Uzi-1-1", "seen:Blue Hangar"]);
		const stopped = world.searchObjects(3, volume, () => false);
		expect(stopped).toBe(1);
		const box: WorldVolume = {
			id: world.VolumeType.BOX,
			params: {
				min: { x: -346000, y: 0, z: 624000 },
				max: { x: -344000, y: 100, z: 626000 },
			},
		};
		expect(world.searchObjects(1, box, () => true)).toBe(2);
		expect(() =>
			world.searchObjects(
				1,
				{ id: world.VolumeType.PYRAMID, params: {} },
				() => true,
			),
		).toThrow("supports SPHERE and BOX");
	});

	test("removeJunk validates the volume and removes nothing", () => {
		expect(
			world.removeJunk({
				id: world.VolumeType.SPHERE,
				params: { point: origin, radius: 1 },
			}),
		).toBe(0);
	});

	test("persistence handlers and storage callbacks are called without self", () => {
		world.setPersistenceHandler("score", () => ({ blue: 10 }));
		world.setPersistenceHandler("time", () => 42);
		const stored: unknown[] = [];
		world.runPersistenceHandlers((name, value) => stored.push([name, value]));
		expect(stored).toEqual([
			["score", { blue: 10 }],
			["time", 42],
		]);
		doubles.setPersistenceData("score", { blue: 3 });
		expect(world.getPersistenceData("score")).toEqual({ blue: 3 });
		expect(world.getPersistenceData("nothing")).toBeUndefined();
		const passthrough = spyOn(world, "setPersistencePassthrough");
		world.setPersistencePassthrough((...args) => args.length);
		expect(passthrough).toHaveBeenCalledWith(anything());
	});

	test("world.weather functions are dot calls (regression: missing @noSelf)", () => {
		const setThickness = spyOn(world.weather, "setFogThickness");
		world.weather.setFogThickness(250);
		world.weather.setFogVisibilityDistance(1500);
		world.weather.setFogAnimation([
			[0, 1500, 250],
			[600, 5000, 100],
		]);
		expect(setThickness).toHaveBeenCalledWith(250);
		expect(world.weather.getFogThickness()).toBe(250);
		expect(world.weather.getFogVisibilityDistance()).toBe(1500);
	});
});

describe("coalition", () => {
	useFreshWorld();

	test("queries filter the fixture world by side and category", () => {
		const blue = coalition.side.BLUE;
		expect(coalition.getGroups(blue).map((group) => group.getName())).toEqual([
			"Enfield-1",
			"Uzi-1",
		]);
		expect(
			coalition
				.getGroups(blue, Group.Category.GROUND)
				.map((group) => group.getName()),
		).toEqual(["Uzi-1"]);
		expect(
			coalition.getAirbases(coalition.side.RED).map((base) => base.getName()),
		).toEqual(["Senaki-Kolkhi"]);
		expect(
			coalition.getStaticObjects(blue).map((object) => object.getName()),
		).toEqual(["Blue Hangar", "Ammo Crate"]);
		expect(coalition.getPlayers(blue).map((unit) => unit.getName())).toEqual([
			"Enfield-1-1",
		]);
		expect(
			coalition.getServiceProviders(blue, coalition.service.AWACS),
		).toEqual([]);
		expect(coalition.getCountryCoalition(2)).toBe(blue);
		expect(coalition.getCountryCoalition(0)).toBe(coalition.side.RED);
		expect(coalition.getCountryCoalition(99)).toBe(coalition.side.NEUTRAL);
	});

	test("reference points can be listed and added", () => {
		expect(
			required(coalition.getMainRefPoint(coalition.side.BLUE), "bullseye").name,
		).toBe("Bullseye");
		coalition.addRefPoint(coalition.side.NEUTRAL, {
			callsign: 5,
			type: 0,
			point: origin,
		});
		expect(coalition.getRefPoints(coalition.side.NEUTRAL)).toEqual([
			{ callsign: 5, type: 0, point: origin },
		]);
		expect(coalition.getRefPoints(coalition.side.BLUE)).toHaveLength(1);
	});

	test("addGroup spawns units, fires birth events and replaces a group of the same name", () => {
		const births: string[] = [];
		world.addEventHandler({
			onEvent(event) {
				if (event.id === world.event.S_EVENT_BIRTH)
					births.push((event.initiator as { getName(): string }).getName());
			},
		});
		const data = {
			name: "Spawned",
			task: "Ground Nothing",
			units: [
				{
					name: "Spawned-1",
					type: "M-818",
					x: 0,
					y: 0,
					heading: 0,
					skill: "Average",
				},
				{
					name: "Spawned-2",
					type: "M-818",
					x: 10,
					y: 10,
					heading: 0,
					skill: "Average",
				},
			],
		};
		const group = coalition.addGroup(2, Group.Category.GROUND, data);
		expect(group.getSize()).toBe(2);
		expect(group.getCoalition()).toBe(coalition.side.BLUE);
		expect(births).toEqual(["Spawned-1", "Spawned-2"]);
		const replacement = coalition.addGroup(0, Group.Category.GROUND, data);
		expect(group.isExist()).toBe(false);
		expect(replacement.getCoalition()).toBe(coalition.side.RED);
		expect(Group.getByName("Spawned")).toBe(replacement);
		expect(() => coalition.addGroup(2, 2, { units: [] })).toThrow(
			"needs a name",
		);
	});

	test("addStaticObject spawns statics and cargo", () => {
		const hangar = coalition.addStaticObject(2, {
			name: "New Hangar",
			type: "Hangar A",
			x: 1,
			y: 2,
		});
		expect(hangar.getPoint()).toEqual({ x: 1, y: 0, z: 2 });
		expect(StaticObject.getByName("New Hangar")).toBe(hangar);
		const cargo = coalition.addStaticObject(2, {
			name: "Crate",
			type: "ammo_cargo",
			canCargo: true,
			mass: 250,
		});
		expect(cargo.getCargoWeight()).toBe(250);
		expect(cargo.getCategory()).toBe(6);
	});

	test("schema-private helpers accept any arguments and return nothing", () => {
		expect(coalition.add_dyn_group({})).toBeUndefined();
		expect(coalition.remove_dyn_group("x")).toBeUndefined();
		expect(coalition.checkChooseCargo()).toBeUndefined();
		expect(coalition.checkDescent()).toBeUndefined();
		expect(coalition.getAllDescents()).toBeUndefined();
		expect(coalition.getDescentsOnBoard()).toBeUndefined();
	});
});

describe("coord", () => {
	test("LOtoLL returns latitude, longitude and altitude", () => {
		const [latitude, longitude, altitude] = coord.LOtoLL({
			x: 0,
			y: 123,
			z: 0,
		});
		expect(latitude).toBeCloseTo(45.129497, 6);
		expect(longitude).toBeCloseTo(34.265515, 6);
		expect(altitude).toBe(123);
	});

	test("LLtoLO inverts LOtoLL", () => {
		const point = coord.LLtoLO(41.6103, 41.5997, 250);
		const [latitude, longitude, altitude] = coord.LOtoLL(point);
		expect(latitude).toBeCloseTo(41.6103, 8);
		expect(longitude).toBeCloseTo(41.5997, 8);
		expect(altitude).toBe(250);
	});

	test("LLtoMGRS and MGRStoLL round trip to the metre", () => {
		const grid = coord.LLtoMGRS(41.6103, 41.5997);
		expect(grid).toEqual({
			UTMZone: "37T",
			MGRSDigraph: "GG",
			Easting: integer(grid.Easting),
			Northing: integer(grid.Northing),
		});
		const [latitude, longitude] = coord.MGRStoLL(grid);
		expect(latitude).toBeCloseTo(41.6103, 4);
		expect(longitude).toBeCloseTo(41.5997, 4);
	});
});

function integer(value: number): number {
	expect(math.floor(value)).toBe(value);
	return value;
}

describe("land", () => {
	test("heights and surface types distinguish sea and land", () => {
		expect(land.getHeight({ x: -400000, y: 0 })).toBe(0);
		expect(land.getHeight({ x: batumi.x, y: batumi.z })).toBeGreaterThan(0);
		expect(land.getSurfaceType({ x: -400000, y: 0 })).toBe(
			land.SurfaceType.WATER,
		);
		expect(land.getSurfaceType({ x: -350500, y: 500 })).toBe(
			land.SurfaceType.LAND,
		);
		expect(land.getSurfaceType({ x: -350000, y: 500 })).toBe(
			land.SurfaceType.ROAD,
		);
		const [seaHeight, depth] = land.getSurfaceHeightWithSeabed({
			x: -400000,
			y: 0,
		});
		expect([seaHeight, depth]).toEqual([0, 50]);
		const [landHeight, landDepth] = land.getSurfaceHeightWithSeabed({
			x: batumi.x,
			y: batumi.z,
		});
		expect(landHeight).toBe(land.getHeight({ x: batumi.x, y: batumi.z }));
		expect(landDepth).toBe(0);
	});

	test("getIP finds the ground along a ray, or nothing within range", () => {
		const hit = required(
			land.getIP(
				{ x: batumi.x, y: 1000, z: batumi.z },
				{ x: 0, y: -1, z: 0 },
				2000,
			),
			"hit",
		);
		expect(hit.y).toBe(land.getHeight({ x: hit.x, y: hit.z }));
		expect(
			land.getIP(
				{ x: batumi.x, y: 1000, z: batumi.z },
				{ x: 0, y: -1, z: 0 },
				100,
			),
		).toBeUndefined();
		expect(land.getIP(batumi, origin, 100)).toBeUndefined();
	});

	test("isVisible and profile sample the terrain between two points", () => {
		const high = { x: batumi.x, y: 1000, z: batumi.z };
		const far = { x: batumi.x + 5000, y: 1000, z: batumi.z };
		expect(land.isVisible(high, far)).toBe(true);
		expect(land.isVisible({ x: batumi.x, y: -10, z: batumi.z }, far)).toBe(
			false,
		);
		const profile = land.profile(high, far);
		expect(profile).toHaveLength(11);
		expect(profile[0].y).toBe(land.getHeight({ x: batumi.x, y: batumi.z }));
	});

	test("road helpers snap to the 1 km road grid and return two numbers", () => {
		expect(land.findPathOnRoads("roads", 1200, 2900, 5100, 7000)).toEqual([
			{ x: 1000, y: 3000 },
			{ x: 5000, y: 3000 },
			{ x: 5000, y: 7000 },
		]);
		const [roadX, roadY] = land.getClosestPointOnRoads("roads", 1100, 2600);
		expect([roadX, roadY]).toEqual([1000, 2600]);
		const [railX, railY] = land.getClosestPointOnRoads("railroads", 1400, 2950);
		expect([railX, railY]).toEqual([1400, 3000]);
	});
});

describe("atmosphere", () => {
	test("getTemperatureAndPressure returns both values of the standard atmosphere", () => {
		const [temperature, pressure] =
			atmosphere.getTemperatureAndPressure(origin);
		expect(temperature).toBeCloseTo(288.15, 2);
		expect(pressure).toBeCloseTo(101325, 0);
		const [high] = atmosphere.getTemperatureAndPressure({
			x: 0,
			y: 20000,
			z: 0,
		});
		expect(high).toBeCloseTo(216.65, 2);
	});

	test("wind grows with altitude and turbulence adds gusts", () => {
		expect(atmosphere.getWind(origin)).toEqual({ x: 3, y: 0, z: 4 });
		expect(atmosphere.getWind({ x: 0, y: 3000, z: 0 })).toEqual({
			x: 6,
			y: 0,
			z: 8,
		});
		const gusty = atmosphere.getWindWithTurbulence({ x: 100, y: 0, z: 57 });
		expect(gusty.x).not.toBe(3);
	});
});

describe("missionCommands", () => {
	useFreshWorld();

	test("menu callbacks receive their argument (regression: callbacks took a self argument)", () => {
		const received: unknown[] = [];
		const root = missionCommands.addSubMenu("Tools");
		expect(root).toEqual(["Tools"]);
		const path = missionCommands.addCommand(
			"Report",
			root,
			(argument: string) => received.push(argument),
			"ready",
		);
		expect(path).toEqual(["Tools", "Report"]);
		doubles.selectMenuCommand(["Tools", "Report"]);
		expect(received).toEqual(["ready"]);
	});

	test("env.info can be used directly as a menu callback, as documented", () => {
		missionCommands.addCommand(
			"Log",
			undefined,
			env.info,
			"logged from the menu",
		);
		doubles.selectMenuCommand(["Log"]);
		expect(doubles.log()).toEqual([
			{ level: "info", message: "logged from the menu" },
		]);
	});

	test("coalition and group menus are scoped and removable", () => {
		const hits: number[] = [];
		const blue = missionCommands.addSubMenuForCoalition(2, "Blue");
		missionCommands.addCommandForCoalition(
			2,
			"Ping",
			blue,
			(value: number) => hits.push(value),
			2,
		);
		const group = missionCommands.addSubMenuForGroup(1, "Flight");
		missionCommands.addCommandForGroup(
			1,
			"Ping",
			group,
			(value: number) => hits.push(value),
			1,
		);
		doubles.selectMenuCommand(["Blue", "Ping"], "coalition:2");
		doubles.selectMenuCommand(["Flight", "Ping"], "group:1");
		expect(hits).toEqual([2, 1]);
		expect(() => doubles.selectMenuCommand(["Blue", "Ping"])).toThrow(
			"no F10 command",
		);
		missionCommands.removeItemForCoalition(2, blue);
		missionCommands.removeItemForGroup(1, undefined);
		expect(doubles.menu()).toEqual([]);
	});

	test("removeItem removes a submenu with its children and doAction is a dot call", () => {
		const menu = missionCommands.addSubMenu("Menu");
		missionCommands.addCommand("A", menu, () => undefined, undefined);
		missionCommands.addCommand("B", undefined, () => undefined, undefined);
		missionCommands.removeItem(menu);
		expect(doubles.menu()).toEqual([
			{ path: ["B"], scope: "all", kind: "command" },
		]);
		const doAction = spyOn(missionCommands, "doAction");
		missionCommands.doAction(4);
		expect(doAction).toHaveBeenCalledWith(4);
	});
});

describe("net", () => {
	useFreshWorld();

	test("lua2json and json2lua round trip values", () => {
		const json = net.lua2json({
			ready: true,
			count: 2,
			list: [1, "two"],
			nested: { a: 0.5 },
		});
		expect(json).toBe(
			'{"count":2,"list":[1,"two"],"nested":{"a":0.5},"ready":true}',
		);
		expect(net.json2lua(json)).toEqual({
			ready: true,
			count: 2,
			list: [1, "two"],
			nested: { a: 0.5 },
		});
		expect(net.lua2json('a"b\n')).toBe('"a\\"b\\n"');
		expect(net.json2lua('"\\u0041\\t"')).toBe("A\t");
		expect(net.json2lua("[]")).toEqual([]);
		expect(net.json2lua('{"a":null}')).toEqual({});
		expect(() => net.json2lua("[1,]")).toThrow("net.json2lua");
		expect(() => net.lua2json(() => 1)).toThrow("cannot encode a function");
	});

	test("dostring_in runs code and returns its result as text", () => {
		expect(net.dostring_in("mission", "return 'tslua-dcs'")).toBe("tslua-dcs");
		expect(net.dostring_in("gui", "return 1 + 1")).toBe("2");
		expect(net.dostring_in("mission", "local x = 1")).toBe("");
		expect(net.dostring_in("mission", "error('boom', 0)")).toBe("error: boom");
		expect(net.dostring_in("mission", "return +")).toMatch("^error: ");
	});

	test("addresses are classified", () => {
		expect(net.is_loopback_address("127.0.0.1")).toBe(true);
		expect(net.is_loopback_address("8.8.8.8")).toBe(false);
		for (const address of [
			"10.0.0.1",
			"192.168.1.1",
			"172.16.0.1",
			"172.31.255.255",
		])
			expect(net.is_private_address(address), address).toBe(true);
		for (const address of ["172.32.0.1", "8.8.8.8", "172.15.0.1"])
			expect(net.is_private_address(address), address).toBe(false);
	});

	test("player queries return the fixture players", () => {
		expect(net.get_player_list()).toEqual([1, 2]);
		expect(net.get_my_player_id()).toBe(1);
		expect(net.get_server_id()).toBe(1);
		expect(required(net.get_player_info(2), "player 2").name).toBe("Maverick");
		expect(net.get_player_info(2, "ping")).toBe(42);
		expect(net.get_player_info(9)).toBeUndefined();
		expect(net.get_name(2)).toBe("Maverick");
		const [sideId, slotId] = net.get_slot(2);
		expect([sideId, slotId]).toEqual([2, "1"]);
		expect(net.get_stat(2, net.PS_SCORE)).toBe(0);
		expect(net.get_coalition(2)).toBe(2);
		expect(net.get_server_host()).toBe("127.0.0.1");
	});

	test("player management changes the fixture players", () => {
		expect(net.force_player_slot(2, 1, "5")).toBe(true);
		expect(net.get_coalition(2)).toBe(1);
		expect(net.force_player_slot(9, 1, "5")).toBe(false);
		expect(net.set_slot(2, "7")).toBe(true);
		expect(net.set_coalition(1)).toBe(true);
		expect(net.get_coalition(1)).toBe(1);
		net.set_name(2, "Goose");
		expect(net.get_name(2)).toBe("Goose");
		expect(net.resetJoinCooldownEndForPlayer(2)).toBe(true);
		expect(net.resetJoinCooldownEndForAll()).toBe(true);
		expect(net.kick(1, "no")).toBe(false);
		expect(net.kick(2, "bye")).toBe(true);
		expect(net.get_player_list()).toEqual([1]);
	});

	test("chat and logging record their text", () => {
		net.send_chat("hello all", true);
		net.send_chat_to("psst", 2);
		net.recv_chat("incoming", 2);
		net.log("net line");
		net.trace("trace line");
		expect(doubles.chat()).toEqual([
			{ message: "hello all" },
			{ message: "psst", to: 2 },
			{ message: "incoming", from: 2 },
		]);
		expect(doubles.log()).toEqual([
			{ level: "net", message: "net line" },
			{ level: "trace", message: "trace line" },
		]);
		const log = spyOn(net, "log");
		net.log("spied");
		expect(log).toHaveBeenCalledWith(stringContaining("spied"));
	});
});

describe("constant tables", () => {
	test("enumerations used by mission code are present", () => {
		expect(AI.Skill.EXCELLENT).toBe("Excellent");
		expect(AI.Option.Air.id.ROE).toBe(0);
		expect(AI.Option.Air.val.ROE.WEAPON_HOLD).toBe(4);
		expect(AI.Option.Ground.val.ALARM_STATE.RED).toBe(2);
		expect(AI.Task.WaypointType.TURNING_POINT).toBe("Turning Point");
		expect(radio.modulation.FM).toBe(1);
		expect(coalition.side).toEqual({ NEUTRAL: 0, RED: 1, BLUE: 2 });
		expect(world.event.S_EVENT_SHOT).toBe(1);
		expect(world.event.S_EVENT_BIRTH).toBe(15);
		expect(world.BirthPlace.wsBirthPlace_RunWay).toBe(4);
		expect(trigger.smokeColor.Blue).toBe(4);
		expect(env.Mode.SIMULATION).toBe(3);
		expect(net.CHAT_ALL).toBe(0);
		expect(Unit.Category.HELICOPTER).toBe(1);
		expect(Airbase.Category.SHIP).toBe(2);
		expect(Group.Category.TRAIN).toBe(4);
		expect(Weapon.Category.BOMB).toBe(3);
		expect(Weapon.flag.AnyWeapon).toBeTypeOf("number");
	});
});
