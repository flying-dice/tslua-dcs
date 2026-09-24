// How the declarations compile beyond plain dot calls: multiple return values, callbacks that DCS
// invokes, iterators, overloads, optional parameters and object methods. Each test compiles a
// snippet written as a mod would write it and checks the Lua behaviour through the doubles.
//
// The "controls" compile the same calls against deliberately wrong declarations, proving that the
// doubles detect the two classic declaration bugs (a missing @noSelf and a missing LuaMultiReturn).

import {
	anything,
	describe,
	expect,
	fn,
	spyOn,
	test,
} from "@flying-dice/tslua-luatest";
import type { DCSLogEntry } from "../src";
import { doubles, isolate } from "./helpers";

describe("multiple return values (LuaMultiReturn)", () => {
	isolate();

	test("DCS.getLogHistory returns the entries and the next index as two values", () => {
		const [entries, next] = DCS.getLogHistory(1);
		expect(entries).toEqual([
			{ abstime: 1, level: 8, subsystem: "SCRIPTING", message: "hooks loaded" },
		]);
		expect(next).toBe(2);
	});

	test("the second value can be requested on its own", () => {
		const next = DCS.getLogHistory(0)[1];
		expect(next).toBe(2);
	});

	test("DCS astronomy functions return two and three values", () => {
		const [azimuth, elevation] = DCS.getSunAzimuthElevation();
		expect([azimuth, elevation]).toEqual([3.14, 0.9]);
		const [sunrise, sunset] = DCS.getSunriseSunsetSecond();
		expect([sunrise, sunset]).toEqual([21600, 64800]);
		const [moonAzimuth, moonElevation, phase] =
			DCS.getMoonAzimuthElevationPhase({});
		expect([moonAzimuth, moonElevation, phase]).toEqual([1.2, 0.4, 0.5]);
	});

	test("Export.LoGetWindAtPoint returns four numbers, not a vector table", () => {
		doubles().state().wind = { x: 2, y: 0, z: -4 };
		const [windX, windY, windZ, terrainHeight] = Export.LoGetWindAtPoint(
			-317948,
			1018,
			636639,
		);
		expect([windX, windY, windZ]).toEqual([4, 0, -8]);
		expect(terrainHeight).toBe(18);
	});

	test("Export.LoGetADIPitchBankYaw returns three values, all nil without an ownship", () => {
		const [pitch, bank, yaw] = Export.LoGetADIPitchBankYaw();
		expect([pitch, bank, yaw]).toEqual([]);
		doubles().state().ownship = doubles().ownshipFixture();
		const [ownPitch, ownBank, ownYaw] = Export.LoGetADIPitchBankYaw();
		expect([ownPitch, ownBank, ownYaw]).toEqual([0.02, -0.01, 1.5]);
	});

	test("lfs.mkdir/rmdir/chdir return true, or nil and a message", () => {
		const path = `${lfs.tempdir()}tslua`;
		const [created, createError] = lfs.mkdir(path);
		expect(created).toBe(true);
		expect(createError).toBeUndefined();
		const [again, againError] = lfs.mkdir(path);
		expect(again).toBeUndefined();
		expect(againError).toBe("File exists");
		const [changed] = lfs.chdir(path);
		expect(changed).toBe(true);
		expect(lfs.currentdir()).toBe(`${path}\\`);
		const [removed] = lfs.rmdir(path);
		expect(removed).toBe(true);
		const [missing, missingError] = lfs.chdir(path);
		expect(missing).toBeUndefined();
		expect(missingError).toContain("No such file or directory");
	});

	test("net.get_chat_history and net.get_slot return two values", () => {
		net.send_chat("ready", true);
		const [history, last] = net.get_chat_history(0);
		expect(history).toEqual([{ from: 1, to: net.CHAT_ALL, message: "ready" }]);
		expect(last).toBe(1);
		net.force_player_slot(1, 2, 21);
		const [side, slot] = net.get_slot(1);
		expect([side, slot]).toEqual([2, 21]);
	});

	test("terrain conversions return two values that round trip", () => {
		const [x, y] = terrain.convertLatLonToMeters(41.7, 41.8);
		const [latitude, longitude] = terrain.convertMetersToLatLon(x, y);
		expect(latitude).toBeCloseTo(41.7, 9);
		expect(longitude).toBeCloseTo(41.8, 9);
		const [mgrsX, mgrsY] = terrain.convertMGRStoMeters(
			terrain.GetMGRScoordinates(x, y),
		);
		expect(math.abs(mgrsX - x) < 1).toBe(true);
		expect(math.abs(mgrsY - y) < 1).toBe(true);
	});

	test("the remaining terrain multi-returns yield two numbers each", () => {
		for (const [a, b] of [
			terrain.GetSurfaceHeightWithSeabed(-317948, 600000),
			terrain.FindNearestPoint(0, 639990, 100),
			terrain.getClosestPointOnRoads("railroads", 5, 0),
			terrain.getClosestValidPoint("sea", 5, 650000),
			terrain.getTempratureRangeByDate(1, 1),
			terrain.getObjectPosition(1),
		] as Array<[number, number]>) {
			expect(type(a)).toBe("number");
			expect(type(b)).toBe("number");
		}
	});

	test("control: without LuaMultiReturn the same call reads the wrong values", () => {
		/** @noSelf */
		interface WrongDCS {
			getLogHistory(from: number): [DCSLogEntry[], number];
		}
		const [entries, next] = (DCS as unknown as WrongDCS).getLogHistory(0);
		// The tuple is destructured from the first Lua value (the entry list) instead.
		expect(entries).toEqual(DCS.getLogHistory(0)[0][0]);
		expect(next).not.toBe(2);
	});
});

describe("dot calls (@noSelf)", () => {
	isolate();

	test("control: a namespace declared without @noSelf compiles to a colon call and is rejected", () => {
		interface WithSelf {
			getPause(): boolean;
		}
		const withSelf = DCS as unknown as WithSelf;
		expect(() => withSelf.getPause()).toThrow(
			"DCS.getPause was called with ':'",
		);
	});

	test("a colon call reaching a spy records the namespace as the first argument", () => {
		const spy = spyOn(DCS, "getMissionName");
		interface WithSelf {
			getMissionName(): string;
		}
		// The guard sits below the spy, so the spy records the call before the guard rejects it.
		expect(() => (DCS as unknown as WithSelf).getMissionName()).toThrow(
			"was called with ':'",
		);
		expect(spy).toHaveBeenCalledWith(DCS);
	});

	test("functions taken off a namespace keep working as plain values", () => {
		const getName = DCS.getMissionName;
		expect(getName()).toBe("tslua-dcs test mission");
		const names = ["a", "b"].map((name) => net.hash_password(name));
		expect(names).toEqual(["hash:61", "hash:62"]);
	});
});

describe("callbacks DCS invokes (DCS.setUserCallbacks)", () => {
	isolate();

	test("handlers written as arrow functions receive the hook arguments without a self", () => {
		const connected: Array<[number, string]> = [];
		DCS.setUserCallbacks({
			onPlayerConnect: (id, name) => {
				connected.push([id as number, name as string]);
			},
		});
		guiDoubles?.fire("onPlayerConnect", 2, "Wingman");
		expect(connected).toEqual([[2, "Wingman"]]);
	});

	test("function expressions and method shorthand in the callback table are plain functions too", () => {
		const seen: unknown[] = [];
		DCS.setUserCallbacks({
			// biome-ignore lint/complexity/useArrowFunction: this test is about function expressions.
			onSimulationStart: function () {
				seen.push("start");
			},
			onSimulationStop() {
				seen.push("stop");
			},
		});
		doubles().fire("onSimulationStart");
		doubles().fire("onSimulationStop");
		expect(seen).toEqual(["start", "stop"]);
	});

	test("a mock handler records the exact arguments DCS passes", () => {
		const onPlayerTrySendChat = fn();
		DCS.setUserCallbacks({ onPlayerTrySendChat });
		doubles().fire("onPlayerTrySendChat", 3, "hello", true);
		expect(onPlayerTrySendChat).toHaveBeenCalledWith(3, "hello", true);
		expect(onPlayerTrySendChat.mock.calls[0].n).toBe(3);
	});

	test("every registration receives the hook, in registration order", () => {
		const order: string[] = [];
		DCS.setUserCallbacks({
			onMissionLoadEnd: () => {
				order.push("first");
			},
		});
		DCS.setUserCallbacks({
			onMissionLoadEnd: () => {
				order.push("second");
			},
			onSimulationFrame: () => {},
		});
		doubles().fire("onMissionLoadEnd");
		expect(order).toEqual(["first", "second"]);
		expect(doubles().handlers("onMissionLoadEnd")).toHaveLength(2);
		expect(doubles().handlers("onSimulationFrame")).toHaveLength(1);
		expect(doubles().handlers("onGameEvent")).toHaveLength(0);
	});

	test("a handler's multiple return values reach DCS, and they end the dispatch", () => {
		const later = fn();
		DCS.setUserCallbacks({
			// The callback type returns `unknown`, so a multi-value return needs an explicit
			// LuaMultiReturn annotation for TypeScriptToLua to accept $multi.
			onPlayerTryConnect: (_address, name): LuaMultiReturn<[boolean, string]> =>
				$multi(false, `no ${name as string}`),
		});
		DCS.setUserCallbacks({ onPlayerTryConnect: later });
		const [allowed, reason] = doubles().fire(
			"onPlayerTryConnect",
			"10.0.0.2",
			"Bob",
			"ucid",
			4,
		);
		expect(allowed).toBe(false);
		expect(reason).toBe("no Bob");
		expect(later).not.toHaveBeenCalled();
	});

	test("handlers returning nothing let the dispatch continue", () => {
		const first = fn();
		const second = fn().mockReturnValue(true);
		DCS.setUserCallbacks({ onPlayerTryChangeSlot: first });
		DCS.setUserCallbacks({ onPlayerTryChangeSlot: second });
		const [result] = doubles().fire("onPlayerTryChangeSlot", 2, 2, 21);
		expect(result).toBe(true);
		expect(first).toHaveBeenCalledWith(2, 2, 21);
		expect(second).toHaveBeenCalledWith(2, 2, 21);
	});

	test("reset forgets registered callbacks", () => {
		DCS.setUserCallbacks({ onSimulationStart: () => {} });
		doubles().reset();
		expect(doubles().handlers("onSimulationStart")).toEqual([]);
	});

	test("DCS.enumMissionPersistenceData calls the visitor once per record, without a self", () => {
		doubles().state().persistence = { a: { n: 1 }, b: { n: 2 } };
		const records: unknown[] = [];
		DCS.enumMissionPersistenceData((record) => records.push(record));
		expect(records).toEqual([{ n: 1 }, { n: 2 }]);
	});
});

describe("iterators, overloads and optional parameters", () => {
	isolate();

	test("lfs.dir compiles to a generic for over the iterator (LuaIterable)", () => {
		const names: string[] = [];
		for (const name of lfs.dir(lfs.writedir())) names.push(name);
		expect(names).toEqual([".", "..", "Logs", "Missions", "Scripts"]);
	});

	test("lfs.attributes returns the table, or one field when asked", () => {
		const attributes = lfs.attributes(lfs.writedir());
		expect(attributes?.mode).toBe("directory");
		expect(lfs.attributes(`${lfs.writedir()}Logs\\dcs.log`, "size")).toBe(12);
		expect(lfs.attributes(`${lfs.writedir()}nothing`)).toBeUndefined();
		expect(lfs.attributes(`${lfs.writedir()}nothing`, "mode")).toBeUndefined();
	});

	test("net.get_player_info returns the record, or one attribute when asked", () => {
		expect(net.get_player_info(1)).toEqual(
			playerRecord({ id: 1, name: "Pilot" }),
		);
		expect(net.get_player_info(1, "name")).toBe("Pilot");
		expect(net.get_player_info(99)).toBeUndefined();
	});

	test("omitted optional parameters arrive as nil", () => {
		const recv = spyOn(net, "recv_chat");
		net.recv_chat("server notice");
		expect(recv.mock.calls[0].n).toBe(1);
		expect(doubles().state().chat[0]).toEqual({
			from: 0,
			to: 1,
			message: "server notice",
		});
		const objects = spyOn(Export, "LoGetWorldObjects");
		const units = Export.LoGetWorldObjects();
		expect(objects.mock.calls[0].n).toBe(0);
		expect(units[16777472]?.Name).toBe("Viper 1-1");
	});

	test("rest parameters are passed as separate Lua arguments", () => {
		log.write("Mod", log.INFO, "%s=%d (%s)", "count", 3, "ok");
		expect(doubles().state().logRecords).toEqual([
			{ subsystem: "Mod", level: log.INFO, message: "count=3 (ok)" },
		]);
		DCS.updaterOperation("install", "F-16C", 2);
		expect(doubles().state().nativeCalls).toEqual([
			{ name: "DCS.updaterOperation", arguments_: ["install", "F-16C", 2] },
		]);
	});

	test("generic terrain.GetTerrainConfig returns the configured value", () => {
		expect(terrain.GetTerrainConfig<string>("id")).toBe("Caucasus");
		expect(terrain.GetTerrainConfig<number>("SummerTimeDelta")).toBe(4);
	});
});

describe("object methods", () => {
	isolate();

	test("ExportIndicator.assign_dedicated_viewport is declared as a method, so it is a colon call", () => {
		doubles().state().ownship = doubles().ownshipFixture();
		const indicator = Export.GetIndicator(4);
		expect(indicator).toBeDefined();
		indicator?.assign_dedicated_viewport?.(0, 0, 512, 256);
		expect(doubles().state().nativeCalls).toEqual([
			{
				name: "ExportIndicator.assign_dedicated_viewport",
				arguments_: [anything(), 0, 0, 512, 256],
			},
		]);
		expect(doubles().state().nativeCalls[0].arguments_[0]).toHaveProperty(
			"id",
			4,
		);
	});
});

function playerRecord(subset: Record<string, unknown>) {
	return {
		side: 0,
		slot: "",
		ping: 0,
		ipaddr: "127.0.0.1",
		ucid: "0123456789abcdef0123456789abcdef",
		...subset,
	};
}
