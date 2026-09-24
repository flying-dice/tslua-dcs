// The doubles are shared infrastructure (this package's suites and the _test package's example
// suites run on them), so their own behaviour is specified here: state coherence between getters
// and setters, fixtures, error paths, and the controller.

import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { doubles, isolate } from "./helpers";

describe("doubles: controller and guard", () => {
	isolate();

	test("reset restores the fixture state but keeps the namespace tables", () => {
		const before = DCS;
		DCS.setPause(true);
		doubles().state().missionName = "changed";
		doubles().reset();
		expect(DCS.getPause()).toBe(false);
		expect(DCS.getMissionName()).toBe("tslua-dcs test mission");
		expect(DCS).toBe(before);
	});

	test("the guard reports the namespace and function of a colon call", () => {
		const table = net as unknown as Record<
			string,
			(...a: unknown[]) => unknown
		>;
		expect(() => table.get_name(net, 1)).toThrow({
			includes: "net.get_name was called with ':'",
		});
	});

	test("the guard passes every argument and return value through", () => {
		const [x, y] = terrain.getClosestPointOnRoads("roads", 7, 0);
		expect([x, y]).toEqual([7, 640000]);
		log.write("S", 1, "%s|%s|%s", "a", "b", "c");
		expect(doubles().state().logRecords[0].message).toBe("a|b|c");
	});

	test("fire without handlers returns nothing", () => {
		expect(doubles().fire("onSimulationStart")).toEqual([]);
	});

	test("native calls record their arguments", () => {
		DCS.exitProcess();
		terrain.Create(1, "two");
		expect(doubles().state().nativeCalls).toEqual([
			{ name: "DCS.exitProcess", arguments_: [] },
			{ name: "terrain.Create", arguments_: [1, "two"] },
		]);
	});
});

describe("doubles: DCS", () => {
	isolate();

	test("setters and getters share state", () => {
		DCS.setPause(true);
		DCS.setCurrentFOV(95);
		DCS.setDefaultFOV(70);
		DCS.setMaxFPS(60);
		DCS.setPlayerCoalition(2);
		DCS.setPlayerUnit(21);
		DCS.setMainPilot("pilot-2");
		DCS.setViewPause(true);
		expect(DCS.getPause()).toBe(true);
		expect(DCS.getCurrentFOV()).toBe(95);
		expect(DCS.getDefaultFOV()).toBe(70);
		expect(DCS.getMaxFPS()).toBe(60);
		expect(DCS.getPlayerCoalition()).toBe(2);
		expect(DCS.getPlayerUnit()).toBe(21);
		expect(DCS.getPlayerUnitType()).toBe("F-16C_50");
		expect(DCS.getMainPilot()).toBe("pilot-2");
		expect(Export.LoSimulationOnActivePause()).toBe(true);
	});

	test("mission lifecycle", () => {
		expect(DCS.getMissionLoaded()).toBe(true);
		DCS.stopMission();
		expect(DCS.getMissionLoaded()).toBe(false);
		expect(DCS.startMission("C:\\m.miz")).toBe(true);
		expect(DCS.getMissionFilename()).toBe("C:\\m.miz");
		DCS.restartMission();
		expect(DCS.getModelTime()).toBe(0);
		expect(DCS.saveMissionTo("C:\\saved.miz")).toBe(true);
		expect(DCS.exportToMiz("C:\\export.miz")).toBe(true);
		expect(lfs.attributes("C:\\saved.miz", "mode")).toBe("file");
		expect(lfs.attributes("C:\\export.miz", "mode")).toBe("file");
	});

	test("mission metadata", () => {
		expect(DCS.getMissionDescription()).toContain("Fixture mission");
		expect(DCS.getMissionTheatre()).toBe("Caucasus");
		expect(DCS.getMissionOptions()).toHaveProperty("difficulty.labels", true);
		expect(DCS.getCurrentMission()).toHaveProperty(
			"mission.theatre",
			"Caucasus",
		);
		expect(DCS.getMissionResult("red")).toBe(0);
		expect(DCS.getPlayerBriefing()).toBe("Defend Kobuleti.");
		expect(DCS.getInstalledTheatres()).toContain("Syria");
	});

	test("getters return copies, so callers cannot change the state", () => {
		const options = DCS.getMissionOptions() as {
			difficulty: { labels: boolean };
		};
		options.difficulty.labels = false;
		expect(DCS.getMissionOptions()).toHaveProperty("difficulty.labels", true);
	});

	test("coalitions and slots", () => {
		expect(DCS.getAvailableCoalitions()).toEqual({
			1: { name: "Red" },
			2: { name: "Blue" },
		});
		expect(DCS.getAvailableSlots(2)).toHaveLength(2);
		expect(DCS.getAvailableSlots(0)).toBeUndefined();
		expect(DCS.hasMultipleSlots("22_1")).toBe(true);
		expect(DCS.hasMultipleSlots(21)).toBe(false);
		expect(DCS.isSlotFlyable(21)).toBe(true);
		expect(DCS.isSlotFlyable(99)).toBe(false);
		expect(DCS.isHumanSeatAvailable("22_1")).toBe(true);
		expect(DCS.isRoleAvailable(11, "pilot")).toBe(true);
		expect(DCS.getHumanUnitInputName(21)).toBe("F-16C_50");
		expect(DCS.getPlayerUnitType()).toBeUndefined();
	});

	test("unit properties are selected by the UNIT_* constants", () => {
		expect(DCS.getUnitProperty(21, DCS.UNIT_NAME)).toBe("Viper 1-1");
		expect(DCS.getUnitProperty(21, DCS.UNIT_TYPE)).toBe("F-16C_50");
		expect(DCS.getUnitProperty(21, DCS.UNIT_RUNTIME_ID)).toBe(16777472);
		expect(DCS.getUnitProperty(21, DCS.UNIT_MISSION_ID)).toBe(21);
		expect(DCS.getUnitProperty(21, DCS.UNIT_COALITION)).toBe("blue");
		expect(DCS.getUnitProperty(11, DCS.UNIT_COALITION)).toBe("red");
		expect(DCS.getUnitProperty(21, DCS.UNIT_GROUPNAME)).toBe("Viper 1-1 group");
		expect(DCS.getUnitProperty(21, DCS.UNIT_HIDDEN)).toBe(false);
		expect(DCS.getUnitProperty(21, DCS.UNIT_PLAYER_NAME)).toBeUndefined();
		expect(DCS.getUnitProperty(21, -1)).toBeUndefined();
		expect(DCS.getUnitProperty(99, DCS.UNIT_NAME)).toBeUndefined();
		for (const property of [
			DCS.UNIT_CATEGORY,
			DCS.UNIT_GROUP_MISSION_ID,
			DCS.UNIT_GROUPCATEGORY,
			DCS.UNIT_CALLSIGN,
			DCS.UNIT_COUNTRY_ID,
			DCS.UNIT_TASK,
			DCS.UNIT_ROLE,
			DCS.UNIT_INVISIBLE_MAP_ICON,
			DCS.UNIT_INVISIBLE_MAP_LABEL,
		])
			expect(DCS.getUnitProperty(21, property)).toBeDefined();
		expect(DCS.getUnitType(21)).toBe("F-16C_50");
		expect(DCS.getUnitType(99)).toBe("");
		expect(DCS.getUnitTypeAttribute("Su-27", "DisplayName")).toBe("Su-27");
		expect(DCS.getUnitTypeAttribute("Nope", "DisplayName")).toBeUndefined();
	});

	test("log history grows with log writes and pages from an index", () => {
		log.info("third");
		const [entries, next] = DCS.getLogHistory(2);
		expect(entries).toEqual([
			{
				abstime: 1234.5,
				level: log.INFO,
				subsystem: "LuaGUI",
				message: "third",
			},
		]);
		expect(next).toBe(3);
		const [none, same] = DCS.getLogHistory(3);
		expect(none).toEqual([]);
		expect(same).toBe(3);
		const [all] = DCS.getLogHistory(-5);
		expect(all).toHaveLength(3);
	});

	test("debriefing, screenshots and configuration", () => {
		DCS.writeDebriefing("line 1");
		DCS.setScreenShotExt("jpg");
		DCS.makeScreenShot("start");
		expect(doubles().state().debriefing).toEqual(["line 1"]);
		expect(doubles().state().screenshots).toEqual(["start.jpg"]);
		expect(DCS.getConfigValue("graphics.width")).toBe(1920);
		expect(DCS.getConfigValue("missing")).toBeUndefined();
		expect(DCS.getUserOptions()).toHaveProperty("graphics.height", 1080);
		expect(DCS.getMissionPersistenceData("tslua-dcs")).toEqual({ counter: 1 });
	});

	test("airbases and warehouses", () => {
		expect(DCS.getAirdromesCoalition()).toEqual({ 21: 2, 22: 1 });
		expect(DCS.getAircraftAmountInAirportWarehouse(21, "F-16C_50")).toBe(4);
		expect(DCS.getAircraftAmountInAirportWarehouse(21, "Su-27")).toBe(0);
		expect(DCS.getAircraftAmountInAirportWarehouse(99, "F-16C_50")).toBe(0);
		expect(DCS.getAirTankerID()).toBeUndefined();
		expect(DCS.conquestCoalitionsScore()).toEqual({ red: 0, blue: 0 });
	});

	test("the remaining fixture getters return their documented kinds", () => {
		expect(DCS.getModelNameByShapeTableIndex(1)).toBe("f-16c_bl_50");
		expect(DCS.getModelNameByShapeTableIndex(2)).toBeUndefined();
		expect(DCS.getObjectLiveriesNames("F-16C_50")).toContain("default");
		expect(DCS.getObjectLiveriesNames("Nope")).toEqual([]);
		expect(DCS.preloadCockpit("F-16C_50")).toBe(true);
		expect(DCS.preloadCockpit("Nope")).toBe(false);
		expect(DCS.getManualPath("F-16C")).toContain("F-16C");
		expect(DCS.getLocalizedStrings("key")).toBe("key");
		expect(DCS.getInputNameByUnitType("F-16C_50")).toBe("F-16C_50");
		expect(DCS.getUnitPositionByObjectId(1)).toEqual({
			x: -281000,
			y: 1000,
			z: 647000,
		});
		expect(DCS.getGamePattern()).toBe("mission");
		expect(DCS.getSimulatorMode()).toBe("sim");
	});
});

describe("doubles: Export", () => {
	isolate();

	test("ownship functions return nothing without a player aircraft", () => {
		expect(Export.LoGetSelfData()).toBeUndefined();
		expect(Export.LoGetEngineInfo()).toBeUndefined();
		expect(Export.LoGetTargetInformation()).toBeUndefined();
		expect(Export.LoGetInAir()).toBe(false);
		expect(Export.GetDevice(0)).toBeUndefined();
		expect(Export.GetIndicator(4)).toBeUndefined();
	});

	test("ownship functions read the ownship fixture", () => {
		doubles().state().ownship = doubles().ownshipFixture();
		expect(Export.LoGetSelfData()?.Name).toBe("Viper 1-1");
		expect(Export.LoGetPlayerPlaneId()).toBe(16777472);
		expect(Export.LoGetTrueAirSpeed()).toBe(250);
		expect(Export.LoGetEngineInfo()?.RPM.left).toBe(92);
		expect(Export.LoGetMechInfo()?.gear.main.nose.rod).toBe(0);
		expect(Export.LoGetRoute()?.goto_point.this_point_num).toBe(2);
		expect(Export.LoGetPayloadInfo()?.Cannon.shells).toBe(510);
		expect(Export.LoGetTWSInfo()?.Emitters[0].SignalType).toBe("scan");
		expect(Export.LoGetInAir()).toBe(true);
		expect(Export.GetDevice(17)).toEqual({ name: "UFC" });
		expect(Export.GetDevice(3)).toBeUndefined();
		expect(Export.GetClickableElements()?.PNT_MASTER_ARM.command).toBe(3001);
		expect(Export.GetIndicator(9)).toBeUndefined();
		expect(Export.LoGetHelicopterFMData()).toBeUndefined();
	});

	test("permissions hide ownship and sensor data", () => {
		doubles().state().ownship = doubles().ownshipFixture();
		doubles().state().exportPermissions = {
			objects: false,
			sensors: false,
			ownship: false,
		};
		expect(Export.LoIsOwnshipExportAllowed()).toBe(false);
		expect(Export.LoGetSelfData()).toBeUndefined();
		expect(Export.LoGetTargetInformation()).toBeUndefined();
		expect(Export.LoGetInAir()).toBe(false);
		expect(Export.LoGetADIPitchBankYaw()).toEqual([]);
		expect(Export.LoGetWorldObjects()).toEqual({});
		expect(Export.LoGetObjectById(16777472)).toBeUndefined();
	});

	test("world objects by category and id", () => {
		expect(Export.LoGetWorldObjects("airdromes")[5000021].Name).toBe(
			"Kobuleti",
		);
		expect(Export.LoGetWorldObjects("ballistic")).toEqual({});
		expect(Export.LoGetObjectById(5000021)?.Name).toBe("Kobuleti");
		expect(Export.LoGetObjectById(1)).toBeUndefined();
		expect(Export.LoGetNameByType(1, 1, 1, 3)).toBe("Su-27");
		expect(Export.LoGetNameByType(9, 9, 9, 9)).toBeUndefined();
	});

	test("coordinates match the terrain double", () => {
		const point = Export.LoGeoCoordinatesToLoCoordinates(41.5997, 41.6103);
		expect(point).toEqual({ x: -317948, y: 18, z: 636639 });
		const geo = Export.LoLoCoordinatesToGeoCoordinates(point.x, point.z);
		expect(geo.latitude).toBeCloseTo(41.6103, 9);
		expect(geo.longitude).toBeCloseTo(41.5997, 9);
		expect(Export.LoGetAltitude(point.x, point.z)).toBe(
			terrain.GetHeight(point.x, point.z),
		);
		expect(Export.LoGetHeightWithObjects(point.x, point.z)).toBe(18);
	});

	test("wind scales with height above ground, sea level or radio altitude", () => {
		const [x1] = Export.LoGetWindAtPoint(-317948, 18, 636639);
		expect(x1).toBe(-3);
		const [x2, , , ground] = Export.LoGetWindAtPoint(
			-317948,
			1000,
			636639,
			true,
		);
		expect(x2).toBe(-6);
		expect(ground).toBe(18);
	});

	test("camera requests and bookmarks", () => {
		const request = Export.LoCreateCameraRequest();
		expect(request?.name).toBe("CameraFree");
		const bookmark = Export.LoCreateUserBookmarkRequest("Runway 27");
		expect(bookmark?.fov).toBe(45);
		expect(Export.LoCreateUserBookmarkRequest("Nope")).toBeUndefined();
		if (bookmark !== undefined) Export.LoForceCamera(bookmark);
		expect(Export.LoGetCameraPosition().p).toEqual({
			x: -282000,
			y: 20,
			z: 645000,
		});
		expect(DCS.getCurrentFOV()).toBe(45);
		if (bookmark !== undefined)
			Export.LoForceCamera({
				...bookmark,
				valid_pos: false,
				fov: -1,
				pos: { ...bookmark.pos, p: { x: 0, y: 0, z: 0 } },
			});
		expect(Export.LoGetCameraPosition().p.x).toBe(-282000);
		expect(DCS.getCurrentFOV()).toBe(45);
		Export.LoSetCameraPosition({
			...Export.LoGetCameraPosition(),
			p: { x: 1, y: 2, z: 3 },
		});
		expect(Export.LoGetCameraPosition().p).toEqual({ x: 1, y: 2, z: 3 });
		Export.LoSetAllowRemoteForceCameraRequests(true);
		expect(doubles().state().remoteForceCameraAllowed).toBe(true);
		expect(Export.LoGetUserBookmarks()).toHaveLength(2);
	});

	test("commands, draw arguments, players and version", () => {
		Export.LoSetCommand(3001);
		Export.LoSetCommand(2001, 0.5);
		expect(doubles().state().commands).toEqual([
			{ command: 3001 },
			{ command: 2001, value: 0.5 },
		]);
		expect(Export.LoGetAircraftDrawArgumentValue(0)).toBe(1);
		expect(Export.LoGetAircraftDrawArgumentValue(99)).toBe(0);
		expect(Export.LoGetLocalPlayer()).toEqual({ host_id: 1, name: "Pilot" });
		expect(Export.LoGetPlayers()).toHaveLength(1);
		expect(Export.LoGetVersionInfo().ProductVersion).toEqual([2, 9, 29, 27468]);
		expect(Export.LoGetMissionStartTime()).toBe(43200);
		expect(Export.LoGetModelTime()).toBe(DCS.getModelTime());
		DCS.setPause(true);
		expect(Export.LoSimulationOnPause()).toBe(true);
	});
});

describe("doubles: net", () => {
	isolate();

	test("dostring_in evaluates in a per-environment sandbox", () => {
		expect(net.dostring_in("mission", "x = 41 return x + 1")).toBe("42");
		expect(net.dostring_in("mission", "return x")).toBe("41");
		expect(net.dostring_in("gui", "return x")).toBe("");
		expect(net.dostring_in("export", "local y = 1")).toBe("");
		expect(net.dostring_in("mission", "return {}")).toMatch("^table:");
		expect(net.dostring_in("nowhere", "return 1")).toBeUndefined();
		expect(net.dostring_in("mission", "error('boom')")).toBeUndefined();
		expect(net.dostring_in("mission", "return (")).toBeUndefined();
		expect(
			rawget(_G as unknown as Record<string, unknown>, "x"),
		).toBeUndefined();
	});

	test("lua2json and json2lua round trip", () => {
		const value = {
			ready: true,
			count: 2,
			list: [1, "two", false],
			nested: { text: 'a"b\\c\n' },
		};
		const json = net.lua2json(value);
		expect(json).toBe(
			'{"count":2,"list":[1,"two",false],"nested":{"text":"a\\"b\\\\c\\n"},"ready":true}',
		);
		expect(net.json2lua(json)).toEqual(value);
		expect(net.lua2json([])).toBe("[]");
		expect(net.lua2json(1.5)).toBe("1.5");
		expect(net.lua2json("\u0001")).toBe('"\\u0001"');
		const decoded = net.json2lua(
			' {"a" : [ 1 , -2.5e2 , null , "\\u00e9\\/" ] , "b":{}} ',
		) as {
			a: unknown[];
			b: unknown;
		};
		expect(decoded.a[0]).toBe(1);
		expect(decoded.a[1]).toBe(-250);
		expect(decoded.a[2]).toBeUndefined();
		expect(decoded.a[3]).toBe("\u00e9/");
		expect(decoded.b).toEqual({});
	});

	test("lua2json and json2lua reject what JSON cannot express", () => {
		expect(() => net.lua2json(() => {})).toThrow("cannot encode a function");
		expect(() => net.lua2json(math.huge)).toThrow("non-finite");
		const cyclic: Record<string, unknown> = {};
		cyclic.self = cyclic;
		expect(() => net.lua2json(cyclic)).toThrow("cyclic");
		for (const bad of [
			"[1,",
			"{1:2}",
			'{"a" 1}',
			"tru",
			'"open',
			'"\\x"',
			'"\\u12"',
			"1 2",
			"[1 2]",
			"#",
			'{"a":1 "b"}',
		])
			expect(() => net.json2lua(bad), bad).toThrow("json2lua:");
	});

	test("players, slots and statistics", () => {
		expect(net.get_player_list()).toEqual([1]);
		expect(net.get_my_player_id()).toBe(1);
		expect(net.get_server_id()).toBe(1);
		expect(net.get_name(1)).toBe("Pilot");
		expect(net.get_name(5)).toBeUndefined();
		expect(net.get_coalition(5)).toBe(0);
		expect(net.get_slot(5)).toEqual([0, ""]);
		doubles().state().playerStats[1][net.PS_PING] = 35;
		expect(net.get_stat(1, net.PS_PING)).toBe(35);
		expect(net.get_stat(1, net.PS_SCORE)).toBe(0);
		expect(net.get_stat(9, net.PS_SCORE)).toBe(0);
		expect(net.set_slot(2, 21)).toBe(true);
		expect(net.get_player_info(1, "slot")).toBe(21);
		expect(net.set_coalition(1)).toBe(true);
		expect(net.get_player_info(1, "side")).toBe(1);
		expect(net.get_player_info(1, "slot")).toBe("");
		expect(net.force_player_slot(9, 1, 1)).toBe(false);
		net.set_name(1, "Renamed");
		net.set_name(9, "Nobody");
		expect(net.get_name(1)).toBe("Renamed");
		expect(net.get_server_host()).toBeUndefined();
		expect(net.get_server_uptime()).toBe(120);
		expect(net.resetJoinCooldownEndForPlayer(1)).toBe(true);
		expect(net.resetJoinCooldownEndForPlayer(9)).toBe(false);
	});

	test("set_slot and set_coalition fail without a local player", () => {
		doubles().state().players = [];
		expect(net.set_slot(2, 21)).toBeUndefined();
		expect(net.set_coalition(2)).toBeUndefined();
	});

	test("chat routing", () => {
		net.send_chat("all", true);
		net.send_chat("team", false);
		net.send_chat_to("direct", 7);
		net.recv_chat("incoming", 7);
		const [history, last] = net.get_chat_history(1);
		expect(history).toEqual([
			{ from: 1, to: net.CHAT_TEAM, message: "team" },
			{ from: 1, to: 7, message: "direct" },
			{ from: 7, to: 1, message: "incoming" },
		]);
		expect(last).toBe(4);
	});

	test("addresses and passwords", () => {
		expect(net.is_loopback_address("127.0.0.1")).toBe(true);
		expect(net.is_loopback_address("::1")).toBe(true);
		expect(net.is_loopback_address("localhost")).toBe(true);
		expect(net.is_loopback_address("10.0.0.1")).toBe(false);
		for (const address of [
			"10.1.2.3",
			"172.16.0.1",
			"172.31.255.255",
			"192.168.1.1",
		])
			expect(net.is_private_address(address), address).toBe(true);
		for (const address of [
			"172.15.0.1",
			"172.32.0.1",
			"8.8.8.8",
			"127.0.0.1",
			"example",
		])
			expect(net.is_private_address(address), address).toBe(false);
		const hash = net.hash_password("secret");
		expect(net.check_password("secret", hash)).toBe(true);
		expect(net.check_password("wrong", hash)).toBe(false);
		expect(net.check_ic_requirements({})).toBe(true);
	});

	test("kick and bans", () => {
		expect(net.banlist_add(1, 60, "spam")).toBe(true);
		expect(net.banlist_add(9, 60)).toBe(false);
		expect(net.banlist_add_by_ucid("ffff", 30)).toBe(true);
		expect(net.banlist_get()).toEqual([
			{
				ucid: "0123456789abcdef0123456789abcdef",
				ipaddr: "127.0.0.1",
				name: "Pilot",
				reason: "spam",
				banned_from: 1234.5,
				banned_until: 1294.5,
			},
			{
				ucid: "ffff",
				ipaddr: "",
				name: "",
				reason: "",
				banned_from: 1234.5,
				banned_until: 1264.5,
			},
		]);
		expect(net.banlist_remove("ffff")).toBe(true);
		expect(net.banlist_remove("ffff")).toBe(false);
		expect(net.kick(1, "bye")).toBe(true);
		expect(net.kick(1)).toBe(false);
		expect(net.get_player_list()).toEqual([]);
	});

	test("mission list", () => {
		expect(net.missionlist_append("C:\\third.miz")).toBe(true);
		expect(net.missionlist_move(3, 1)).toBe(true);
		expect(net.missionlist_move(0, 1)).toBe(false);
		expect(net.missionlist_get().missionList[0]).toBe("C:\\third.miz");
		expect(net.missionlist_delete(1)).toBe(true);
		expect(net.missionlist_delete(9)).toBe(false);
		expect(net.missionlist_run(2)).toBe(true);
		expect(DCS.getMissionFilename()).toContain("second.miz");
		expect(net.missionlist_run(5)).toBe(false);
		expect(net.load_next_mission()).toBe(false);
		net.missionlist_set_loop(true);
		net.missionlist_set_shuffle(true);
		expect(net.load_next_mission()).toBe(true);
		expect(net.missionlist_get()).toEqual({
			listLoop: true,
			listShuffle: true,
			current: 1,
			missionList: [
				"C:\\Users\\Pilot\\Saved Games\\DCS\\Missions\\tslua-dcs.miz",
				"C:\\Users\\Pilot\\Saved Games\\DCS\\Missions\\second.miz",
			],
		});
		expect(net.load_mission("C:\\other.miz")).toBe(true);
		expect(DCS.getMissionFilename()).toBe("C:\\other.miz");
		expect(net.missionlist_clear()).toBe(true);
		expect(net.missionlist_get().missionList).toEqual([]);
		expect(net.missionlist_get_installed_theatres()).toContain("Caucasus");
	});

	test("server settings and lifecycle", () => {
		expect(net.get_server_settings()).toHaveProperty("port", 10308);
		expect(net.get_default_server_settings()).toHaveProperty(
			"name",
			"DCS Server",
		);
		expect(net.get_session_history()).toEqual([]);
		doubles().state().multiplayer = true;
		net.stop_network();
		expect(DCS.isMultiplayer()).toBe(false);
		net.stop_game();
		expect(DCS.getMissionLoaded()).toBe(false);
		net.restart();
		expect(DCS.getModelTime()).toBe(0);
		net.log("normal");
		net.trace("lossless");
		expect(doubles().state().logRecords).toEqual([
			{ subsystem: "LuaNET", level: 8, message: "normal" },
			{ subsystem: "LuaNET.trace", level: 8, message: "lossless" },
		]);
	});
});

describe("doubles: lfs", () => {
	isolate();

	test("directories are in memory and never touch the disk", () => {
		const path = `${lfs.writedir()}Scripts\\Hooks`;
		expect(lfs.attributes(path)).toBeUndefined();
		const [created] = lfs.mkdir(path);
		expect(created).toBe(true);
		const names: string[] = [];
		for (const name of lfs.dir(`${lfs.writedir()}Scripts`)) names.push(name);
		expect(names).toEqual([".", "..", "Hooks"]);
		const [notEmpty, notEmptyError] = lfs.rmdir(`${lfs.writedir()}Scripts`);
		expect(notEmpty).toBeUndefined();
		expect(notEmptyError).toBe("Directory not empty");
		const [noParent, noParentError] = lfs.mkdir(`${lfs.writedir()}a\\b`);
		expect(noParent).toBeUndefined();
		expect(noParentError).toBe("No such file or directory");
		const [missing, missingError] = lfs.rmdir(`${lfs.writedir()}a`);
		expect(missing).toBeUndefined();
		expect(missingError).toBe("No such file or directory");
		const [overFile] = lfs.mkdir(`${lfs.writedir()}Logs\\dcs.log`);
		expect(overFile).toBeUndefined();
	});

	test("dir lists files and fails for a missing directory", () => {
		const names: string[] = [];
		for (const name of lfs.dir(`${lfs.writedir()}Logs/`)) names.push(name);
		expect(names).toEqual([".", "..", "dcs.log"]);
		expect(() => lfs.dir(`${lfs.writedir()}missing`)).toThrow(
			"No such file or directory",
		);
	});

	test("attributes of files and directories", () => {
		const file = lfs.attributes(`${lfs.writedir()}Logs\\dcs.log`);
		expect(file).toEqual(attributesRecord("file", 12, 1700000100, "rw-rw-rw-"));
		expect(lfs.attributes(lfs.writedir(), "permissions")).toBe("rwxrwxrwx");
		expect(lfs.attributes(lfs.writedir().slice(0, -1), "mode")).toBe(
			"directory",
		);
	});

	test("normpath and realpath", () => {
		expect(lfs.normpath("C:/Games//DCS/./Scripts/../Mods/")).toBe(
			"C:\\Games\\DCS\\Mods\\",
		);
		expect(lfs.normpath("C:")).toBe("C:\\");
		expect(lfs.normpath("a/../../b")).toBe("b");
		expect(lfs.realpath("Scripts/../Mods")).toBe(`${lfs.currentdir()}Mods`);
		expect(lfs.realpath("D:/x")).toBe("D:\\x");
	});

	test("locations and md5sum", () => {
		lfs.add_location("Tracks", "C:\\Tracks\\");
		expect(lfs.locations()).toHaveLength(3);
		expect(lfs.del_location("C:\\Tracks\\")).toBe(true);
		expect(lfs.del_location("My Missions")).toBe(true);
		expect(lfs.del_location("nope")).toBe(false);
		expect(lfs.locations()).toEqual([
			{ name: "Saved Games", path: lfs.writedir() },
		]);
		expect(lfs.md5sum(`${lfs.writedir()}Logs\\dcs.log`)).toBe(
			"5d41402abc4b2a76b9719d911017c592",
		);
		expect(lfs.md5sum(`${lfs.writedir()}nothing`)).toBeUndefined();
	});
});

describe("doubles: log", () => {
	isolate();

	test("level shortcuts format their message and use the GUI subsystem", () => {
		log.alert("a %d", 1);
		log.error("e");
		log.warning("w %s", "x");
		log.debug("d %.1f", 1.25);
		expect(doubles().state().logRecords).toEqual([
			{ subsystem: "LuaGUI", level: log.ALERT, message: "a 1" },
			{ subsystem: "LuaGUI", level: log.ERROR, message: "e" },
			{ subsystem: "LuaGUI", level: log.WARNING, message: "w x" },
			{ subsystem: "LuaGUI", level: log.DEBUG, message: "d 1.2" },
		]);
	});

	test("a message without values is written verbatim, a bad format raises", () => {
		log.info("100% done");
		expect(doubles().state().logRecords[0].message).toBe("100% done");
		expect(() => log.info("%d", "not a number")).toThrow("bad argument");
	});

	test("the level masks combine like flags", () => {
		for (const level of [
			log.ALERT,
			log.ERROR,
			log.WARNING,
			log.INFO,
			log.DEBUG,
		])
			expect(math.floor(log.ALL / level) % 2).toBe(1);
		expect(math.floor(log.ALL / log.TRACE) % 2).toBe(0);
		expect(math.floor(log.ALL_LEVELS / log.TRACE) % 2).toBe(1);
	});

	test("set_output opens, reconfigures and closes an output", () => {
		log.set_output("my-mod", "MyMod", log.ALL, log.FULL);
		expect(doubles().state().logOutputs["my-mod"]).toEqual({
			subsystem: "MyMod",
			levelMask: log.ALL,
			outputMode: log.FULL,
		});
		log.set_output("my-mod", "", 0, 0);
		expect(doubles().state().logOutputs["my-mod"]).toBeUndefined();
		log.set_output_rules({ rule: 1 });
		log.backup("file");
		expect(doubles().state().nativeCalls).toEqual([
			{ name: "log.set_output_rules", arguments_: [{ rule: 1 }] },
			{ name: "log.backup", arguments_: ["file"] },
		]);
	});
});

describe("doubles: terrain", () => {
	isolate();

	test("heights, surfaces and the coastline", () => {
		expect(terrain.GetHeight(-317948, 636639)).toBe(18);
		expect(terrain.GetHeight(-217948, 636639)).toBe(118);
		expect(terrain.GetHeight(-500000, 636639)).toBe(1);
		expect(terrain.GetHeight(0, 600000)).toBe(0);
		expect(terrain.GetSurfaceType(0, 600000)).toBe("sea");
		expect(terrain.GetSurfaceType(0, 629500)).toBe("shallowWater");
		expect(terrain.GetSurfaceType(0, 640003)).toBe("road");
		expect(terrain.GetSurfaceType(0, 650000)).toBe("land");
		expect(terrain.GetSurfaceHeightWithSeabed(0, 600000)).toEqual([0, 50]);
		expect(terrain.GetSurfaceHeightWithSeabed(-317948, 636639)).toEqual([
			18, 0,
		]);
	});

	test("line of sight is blocked by rising ground", () => {
		expect(terrain.isVisible(-317948, 100, 636639, -300000, 100, 636639)).toBe(
			true,
		);
		expect(terrain.isVisible(-317948, 30, 636639, -200000, 30, 636639)).toBe(
			false,
		);
	});

	test("paths and the road network", () => {
		expect(terrain.FindOptimalPath(1, 2, 3, 4)).toEqual([
			{ x: 1, y: 2 },
			{ x: 3, y: 4 },
		]);
		expect(terrain.findPathOnRoads("roads", 1, 2, 3, 4)).toEqual([
			{ x: 1, y: 640000 },
			{ x: 3, y: 640000 },
		]);
		expect(terrain.FindNearestPoint(5, 639000, 2000)).toEqual([5, 640000]);
		expect(terrain.FindNearestPoint(5, 600000, 2000)).toEqual([5, 600000]);
		expect(terrain.getClosestPointOnRoads("railroads", 5, 0)).toEqual([
			5, 641000,
		]);
		expect(terrain.getClosestValidPoint("road", 5, 0)).toEqual([5, 640000]);
		expect(terrain.getClosestValidPoint("land", 5, 650000)).toEqual([
			5, 650000,
		]);
		expect(terrain.getClosestValidPoint("land", 5, 600000)).toEqual([
			5, 630000,
		]);
		expect(terrain.getClosestValidPoint("sea", 5, 650000)).toEqual([5, 628000]);
	});

	test("MGRS formatting and parsing", () => {
		expect(terrain.GetMGRScoordinates(-317948, 636639)).toBe(
			"37T GJ 36639 82052",
		);
		expect(terrain.convertMGRStoMeters("37T GJ 36639 82052")).toEqual([
			-317948, 636639,
		]);
		expect(() => terrain.convertMGRStoMeters("not mgrs")).toThrow(
			"malformed MGRS",
		);
	});

	test("seasons and temperatures by month", () => {
		expect(
			[1, 4, 7, 10, 12].map((month) => terrain.getTechSkinByDate(1, month)),
		).toEqual(["winter", "spring", "summer", "autumn", "winter"]);
		expect(terrain.getTempratureRangeByDate(1, 1)).toEqual([-5, 8]);
		expect(terrain.getTempratureRangeByDate(1, 7)).toEqual([18, 32]);
		expect(terrain.getTempratureRangeByDate(1, 4)).toEqual([6, 20]);
		expect(terrain.GetSeasons()).toHaveLength(4);
	});

	test("airdrome data", () => {
		expect(terrain.getRunwayList("kobuleti.rn")[0]).toHaveProperty(
			"name",
			"07",
		);
		expect(terrain.getRunwayHeading("kobuleti.rn")).toBe(1.22);
		expect(terrain.getStandList("kobuleti.rn")[1]).toHaveProperty(
			"SHELTER",
			true,
		);
		expect(terrain.getStandList("kobuleti.rn", ["WIDTH"])).toEqual([
			{ id: 1, x: -317900, y: 636600, WIDTH: 20 },
			{ id: 2, x: -317880, y: 636620, WIDTH: 25 },
		]);
		expect(terrain.getBeacons()[0]).toHaveProperty("callsign", "KBL");
		expect(terrain.getRadio()).toBeDefined();
		expect(terrain.getObjectsAtMapPoint(0, 0)).toEqual([]);
		expect(terrain.GetTerrainConfig<unknown>("missing")).toBeUndefined();
	});

	test("Init, InitLight and Release switch the terrain service", () => {
		terrain.Release();
		expect(doubles().state().terrainInitialized).toBe(false);
		expect(terrain.InitLight("cfg", "gen", {})).toBe(true);
		expect(doubles().state().terrainInitialized).toBe(true);
		expect(terrain.Init("cfg", "me", {})).toBe(true);
		expect(
			doubles()
				.state()
				.nativeCalls.map((call) => call.name),
		).toEqual(["terrain.Release", "terrain.InitLight", "terrain.Init"]);
	});
});

function attributesRecord(
	mode: string,
	size: number,
	modification: number,
	permissions: string,
) {
	return {
		mode,
		size,
		modification,
		permissions,
		dev: 2,
		ino: 0,
		nlink: 1,
		uid: 0,
		gid: 0,
		rdev: 2,
		access: 1700000000,
		change: 1700000000,
		blocks: 0,
		blksize: 0,
	};
}
