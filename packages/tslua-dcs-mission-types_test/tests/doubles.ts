/**
 * Behaviour of the doubles themselves: the call-shape guards, the control API and determinism.
 */
import type { l_Object, l_Unit } from "@flying-dice/tslua-dcs-mission-types";
import { describe, expect, fn, test } from "@flying-dice/tslua-luatest";
import { fixtureNames } from "../doubles/fixtures";
import { doubles, required, useFreshWorld } from "./helpers";

const player = () => required(Unit.getByName("Enfield-1-1"), "player");

describe("call-shape guards", () => {
	useFreshWorld();

	test("a colon call on a namespace function is rejected", () => {
		const weather = world.weather as unknown as {
			getFogThickness(this: object): number;
		};
		expect(() => weather.getFogThickness()).toThrow(
			"world.weather.getFogThickness was called with ':' but DCS namespace functions are called with '.'",
		);
		const action = trigger.action as unknown as {
			outText(this: object, text: string, seconds: number): void;
		};
		expect(() => action.outText("x", 1)).toThrow(
			"trigger.action.outText was called with ':'",
		);
	});

	test("a dot call on an instance method is rejected", () => {
		const unit = player() as unknown as { getName(this: void): string };
		expect(() => unit.getName()).toThrow(
			"Unit.getName is an instance method: call it as object:getName(...) on a Unit (got nil as self)",
		);
	});

	test("a colon call on a static function is rejected", () => {
		const table = Unit as unknown as {
			getByName(this: object, name: string): l_Unit;
		};
		expect(() => table.getByName("Enfield-1-1")).toThrow(
			"Unit.getByName is static and must be called with '.', not ':'",
		);
		const unit = player() as unknown as {
			getByName(this: object, name: string): l_Unit;
		};
		expect(() => unit.getByName("Enfield-1-1")).toThrow(
			"Unit.getByName is static",
		);
	});

	test("an instance of another class is rejected as self", () => {
		const unitTable = (
			_G as unknown as Record<
				string,
				Record<string, (this: void, self: unknown) => unknown>
			>
		).Unit;
		const flight = required(Group.getByName("Enfield-1"), "group");
		expect(() => unitTable.getName(flight)).toThrow(
			"got a Group instance as self",
		);
		expect(() => unitTable.getName(unitTable)).toThrow(
			"got the Unit class table as self",
		);
		expect(() => unitTable.getName("text")).toThrow("got string as self");
	});

	test("subclass instances are accepted by base-class functions", () => {
		const objectTable = (
			_G as unknown as Record<
				string,
				Record<string, (this: void, self: unknown) => unknown>
			>
		).Object;
		expect(objectTable.getName(player() as unknown as l_Object)).toBe(
			"Enfield-1-1",
		);
		const weaponTable = (
			_G as unknown as Record<
				string,
				Record<string, (this: void, self: unknown) => unknown>
			>
		).Weapon;
		expect(() => weaponTable.getName(player())).toThrow(
			"Weapon.getName is an instance method",
		);
	});
});

describe("dcsDoubles control API", () => {
	useFreshWorld();

	test("reset restores the fixture world", () => {
		player().destroy();
		trigger.action.setUserFlag("f", 1);
		trigger.action.markToAll(1, "m", { x: 0, y: 0, z: 0 });
		env.info("line");
		doubles.advanceTime(100);
		doubles.reset();
		expect(player().isExist()).toBe(true);
		expect(trigger.misc.getUserFlag("f")).toBe(0);
		expect(world.getMarkPanels()).toEqual([]);
		expect(doubles.log()).toEqual([]);
		expect(timer.getTime()).toBe(0);
		expect(doubles.effects()).toEqual([]);
	});

	test("the fixture world is deterministic across resets", () => {
		const snapshot = () => ({
			groups: coalition.getGroups(2).map((group) => group.getName()),
			points: coalition
				.getGroups(2)
				.map((group) => group.getUnits().map((unit) => unit.getPoint())),
			statics: coalition.getStaticObjects(1).map((object) => object.getName()),
			ids: coalition.getGroups(1).map((group) => group.getID()),
		});
		const first = snapshot();
		doubles.reset();
		expect(snapshot()).toEqual(first);
		expect(env.getMissionName()).toBe(fixtureNames.missionName);
		expect(_APP_VERSION).toBe(fixtureNames.appVersion);
	});

	test("a failing scheduled function is logged, removed and re-raised", () => {
		const fail = fn(() => {
			error("scheduled failure", 0);
		});
		timer.scheduleFunction(() => fail(), undefined, 1);
		expect(() => doubles.advanceTime(5)).toThrow({
			exact: "scheduled failure",
		});
		expect(doubles.log()[0]).toEqual({
			level: "error",
			message: "scheduled function 1 failed: scheduled failure",
		});
		doubles.advanceTime(5);
		expect(fail).toHaveBeenCalledTimes(1);
	});

	test("a function rescheduled into the past runs on the next frame, not in a loop", () => {
		const tick = fn(() => 0);
		timer.scheduleFunction(() => tick(), undefined, 1);
		doubles.advanceTime(1.0035);
		expect(tick).toHaveBeenCalledTimes(4);
	});

	test("functions due at the same time run in scheduling order", () => {
		const order: string[] = [];
		timer.scheduleFunction(
			() => {
				order.push("second");
				return undefined;
			},
			undefined,
			2,
		);
		timer.scheduleFunction(
			() => {
				order.push("first");
				return undefined;
			},
			undefined,
			1,
		);
		timer.scheduleFunction(
			() => {
				order.push("third");
				return undefined;
			},
			undefined,
			2,
		);
		doubles.advanceTime(3);
		expect(order).toEqual(["first", "second", "third"]);
	});

	test("errors in event handlers propagate to the dispatcher", () => {
		world.addEventHandler({
			onEvent() {
				error("handler failed", 0);
			},
		});
		expect(() => doubles.dispatchEvent({ id: 1, time: 0 })).toThrow(
			"handler failed",
		);
	});

	test("selectMenuCommand refuses submenus and unknown paths", () => {
		missionCommands.addSubMenu("Only a submenu");
		expect(() => doubles.selectMenuCommand(["Only a submenu"])).toThrow(
			"no F10 command",
		);
		expect(() => doubles.selectMenuCommand(["missing"])).toThrow(
			"no F10 command",
		);
	});

	test("launchWeapon requires an existing launcher", () => {
		const unit = player();
		unit.destroy();
		expect(() =>
			doubles.launchWeapon({ typeName: "AIM_120C", launcher: unit }),
		).toThrow("the launcher does not exist");
	});

	test("setLogEcho prints log lines", () => {
		const print = fn();
		const original = _G.print;
		_G.print = (...args: unknown[]) => print(...args);
		try {
			doubles.setLogEcho(true);
			env.warning("echoed");
			doubles.setLogEcho(false);
			env.warning("silent");
		} finally {
			_G.print = original;
		}
		expect(print).toHaveBeenCalledTimes(1);
		expect(print).toHaveBeenCalledWith("[warning] echoed");
	});

	test("surface lists every function path and calls counts them", () => {
		const surface = doubles.surface();
		expect(surface).toContain("Unit.getName");
		expect(surface).toContain("trigger.action.outText");
		expect(surface).toContain("world.weather.setFogThickness");
		expect(surface).not.toContain("dcsDoubles.reset");
		const before = doubles.calls("env.getMode");
		env.getMode();
		expect(doubles.calls("env.getMode")).toBe(before + 1);
		expect(doubles.calls("not.a.function")).toBe(0);
	});
});
