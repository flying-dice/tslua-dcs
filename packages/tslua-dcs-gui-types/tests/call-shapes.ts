// Every function declared for the GUI namespaces, called once from TypeScript exactly as a mod
// would call it. Each call goes through a spy on the double, so the test checks what the
// declarations make TypeScriptToLua emit:
// - a dot call (`DCS.setPause(true)`): the spy's first argument is not the namespace table, and the
//   doubles' guard raises if it were (see doubles/guard.ts);
// - the arguments in declaration order, optional ones omitted when not passed;
// - a TypeScript call site that type-checks against the declaration (this file compiles).
// The last test of each block checks that the list covers every function of the namespace, which is
// every function the declarations declare because the doubles implement the declared interfaces.
//
// This file deliberately has no `@noSelfInFile`: the call shapes come from the declarations alone.

import {
	afterEach,
	describe,
	expect,
	restoreAllMocks,
	spyOn,
	test,
} from "@flying-dice/tslua-luatest";
import type { ExportCameraRequest } from "../src";
import { doubles } from "./helpers";

interface Call {
	name: string;
	invoke: () => unknown;
	arguments_: unknown[];
}

function call(
	name: string,
	invoke: () => unknown,
	...arguments_: unknown[]
): Call {
	return { name, invoke, arguments_ };
}

function functionNames(namespace: object): string[] {
	const names: string[] = [];
	for (const [key, value] of pairs(namespace as LuaTable<string, unknown>))
		if (type(value) === "function") names.push(key);
	return names.sort();
}

function checkCalls(label: string, namespace: object, calls: Call[]): void {
	describe(`${label} call shapes`, () => {
		afterEach(() => {
			restoreAllMocks();
			doubles().reset();
		});

		for (const entry of calls)
			test(`${label}.${entry.name} is a dot call with the declared arguments`, () => {
				const spy = spyOn(
					namespace as Record<string, (...a: unknown[]) => unknown>,
					entry.name,
				);
				entry.invoke();
				expect(spy).toHaveBeenCalledTimes(1);
				expect(spy.mock.calls[0][0] === namespace).toBe(false);
				expect(spy).toHaveBeenCalledWith(...entry.arguments_);
				expect(spy.mock.calls[0].n).toBe(entry.arguments_.length);
			});

		test(`covers every function of ${label}`, () => {
			const listed = calls.map((entry) => entry.name).sort();
			expect(listed).toEqual(functionNames(namespace));
		});
	});
}

const request: ExportCameraRequest = {
	name: "CameraFree",
	id: 0,
	pos: {
		x: { x: 1, y: 0, z: 0 },
		y: { x: 0, y: 1, z: 0 },
		z: { x: 0, y: 0, z: 1 },
		p: { x: 1, y: 2, z: 3 },
	},
	fov: 60,
	valid_pos: true,
};
// Declared apart from the call, so they need the declared (self-less) function types.
const visitor: Parameters<typeof DCS.enumMissionPersistenceData>[0] = () => {};
const callbacks: Parameters<typeof DCS.setUserCallbacks>[0] = {
	onSimulationStart: () => {},
};

checkCalls("DCS", DCS, [
	call("setPause", () => DCS.setPause(true), true),
	call("getPause", () => DCS.getPause()),
	call("stopMission", () => DCS.stopMission()),
	call("exitProcess", () => DCS.exitProcess()),
	call("isMultiplayer", () => DCS.isMultiplayer()),
	call("isServer", () => DCS.isServer()),
	call("getModelTime", () => DCS.getModelTime()),
	call("getRealTime", () => DCS.getRealTime()),
	call("getMissionOptions", () => DCS.getMissionOptions()),
	call("getMissionDescription", () => DCS.getMissionDescription()),
	call("getAvailableCoalitions", () => DCS.getAvailableCoalitions()),
	call("getAvailableSlots", () => DCS.getAvailableSlots(2), 2),
	call("getCurrentMission", () => DCS.getCurrentMission()),
	call("getMissionName", () => DCS.getMissionName()),
	call("getMissionFilename", () => DCS.getMissionFilename()),
	call("getMissionResult", () => DCS.getMissionResult("blue"), "blue"),
	call(
		"getUnitProperty",
		() => DCS.getUnitProperty(21, DCS.UNIT_NAME),
		21,
		DCS.UNIT_NAME,
	),
	call("getUnitType", () => DCS.getUnitType(21), 21),
	call(
		"getUnitTypeAttribute",
		() => DCS.getUnitTypeAttribute("Su-27", "DisplayName"),
		"Su-27",
		"DisplayName",
	),
	call("writeDebriefing", () => DCS.writeDebriefing("done"), "done"),
	call("setUserCallbacks", () => DCS.setUserCallbacks(callbacks), callbacks),
	call("makeScreenShot", () => DCS.makeScreenShot("shot"), "shot"),
	call("getLogHistory", () => DCS.getLogHistory(0), 0),
	call(
		"getConfigValue",
		() => DCS.getConfigValue("graphics.width"),
		"graphics.width",
	),
	call("HMD_isActive", () => DCS.HMD_isActive()),
	call("LMSGetRemainingTimeBeforeZoneShrink", () =>
		DCS.LMSGetRemainingTimeBeforeZoneShrink(),
	),
	call("LMSRestart", () => DCS.LMSRestart()),
	call(
		"LMSSetWaitForMinimalPlayers",
		() => DCS.LMSSetWaitForMinimalPlayers(true),
		true,
	),
	call("MACSavePSData", () => DCS.MACSavePSData({ score: 1 }), { score: 1 }),
	call("RCD_selectMenuItem", () => DCS.RCD_selectMenuItem(1, "a"), 1, "a"),
	call("UIDeclutterOnOff", () => DCS.UIDeclutterOnOff(false), false),
	call(
		"UIRequestOverlayWidgetPosition",
		() => DCS.UIRequestOverlayWidgetPosition("w"),
		"w",
	),
	call("activateGroup", () => DCS.activateGroup(7), 7),
	call(
		"activateSteamOverlayToStore",
		() => DCS.activateSteamOverlayToStore("223750"),
		"223750",
	),
	call("add_dyn_group", () => DCS.add_dyn_group({ name: "g" }), { name: "g" }),
	call(
		"checkMultiplayerSpawnConflict",
		() => DCS.checkMultiplayerSpawnConflict({ name: "g" }),
		{ name: "g" },
	),
	call("conquestCoalitionsScore", () => DCS.conquestCoalitionsScore()),
	call(
		"create_client_aircraft",
		() => DCS.create_client_aircraft("F-16C_50"),
		"F-16C_50",
	),
	call(
		"dispatchAnalogAction",
		() => DCS.dispatchAnalogAction(2001, 0.5),
		2001,
		0.5,
	),
	call(
		"dispatchDigitalAction",
		() => DCS.dispatchDigitalAction(3001, true),
		3001,
		true,
	),
	call("enter_with_dyngroup", () => DCS.enter_with_dyngroup(1), 1),
	call(
		"enumMissionPersistenceData",
		() => DCS.enumMissionPersistenceData(visitor),
		visitor,
	),
	call("exportToMiz", () => DCS.exportToMiz("out.miz"), "out.miz"),
	call("getATCradiosData", () => DCS.getATCradiosData()),
	call("getAchievementsUiInfo", () => DCS.getAchievementsUiInfo()),
	call("getAirTankerID", () => DCS.getAirTankerID()),
	call(
		"getAircraftAmountInAirportWarehouse",
		() => DCS.getAircraftAmountInAirportWarehouse(21, "F-16C_50"),
		21,
		"F-16C_50",
	),
	call("getAirdromesCoalition", () => DCS.getAirdromesCoalition()),
	call("getAirdromesState", () => DCS.getAirdromesState()),
	call("getConquestAirbaseState", () => DCS.getConquestAirbaseState(21), 21),
	call("getCurrentFOV", () => DCS.getCurrentFOV()),
	call("getDefaultFOV", () => DCS.getDefaultFOV()),
	call("getDynamicSpawnSettings", () => DCS.getDynamicSpawnSettings()),
	call("getFarpsAndCarriersMissionData", () =>
		DCS.getFarpsAndCarriersMissionData(),
	),
	call("getGameDuration", () => DCS.getGameDuration()),
	call("getGamePattern", () => DCS.getGamePattern()),
	call("getGeneratedParams", () => DCS.getGeneratedParams()),
	call("getHumanUnitInputName", () => DCS.getHumanUnitInputName(21), 21),
	call(
		"getInputNameByUnitType",
		() => DCS.getInputNameByUnitType("F-16C_50"),
		"F-16C_50",
	),
	call("getInputProfiles", () => DCS.getInputProfiles()),
	call("getInstalledTheatres", () => DCS.getInstalledTheatres()),
	call("getLocalizedStrings", () => DCS.getLocalizedStrings(["OK"]), ["OK"]),
	call("getMainPilot", () => DCS.getMainPilot()),
	call("getManualPath", () => DCS.getManualPath("F-16C"), "F-16C"),
	call("getMaxFPS", () => DCS.getMaxFPS()),
	call("getMissionLoaded", () => DCS.getMissionLoaded()),
	call(
		"getMissionPersistenceData",
		() => DCS.getMissionPersistenceData("tslua-dcs"),
		"tslua-dcs",
	),
	call("getMissionResourcesDialogData", () =>
		DCS.getMissionResourcesDialogData(),
	),
	call("getMissionTheatre", () => DCS.getMissionTheatre()),
	call(
		"getModelNameByShapeTableIndex",
		() => DCS.getModelNameByShapeTableIndex(1),
		1,
	),
	call(
		"getMoonAzimuthElevationPhase",
		() => DCS.getMoonAzimuthElevationPhase({ year: 2024 }),
		{ year: 2024 },
	),
	call(
		"getObjectLiveriesNames",
		() => DCS.getObjectLiveriesNames("F-16C_50"),
		"F-16C_50",
	),
	call("getPilotAchievements", () => DCS.getPilotAchievements()),
	call("getPilotStatistics", () => DCS.getPilotStatistics("pilot"), "pilot"),
	call("getPilotsSummaryStatistics", () => DCS.getPilotsSummaryStatistics()),
	call("getPlayerBriefing", () => DCS.getPlayerBriefing()),
	call("getPlayerCoalition", () => DCS.getPlayerCoalition()),
	call("getPlayerUnit", () => DCS.getPlayerUnit()),
	call("getPlayerUnitType", () => DCS.getPlayerUnitType()),
	call("getServerStartTime", () => DCS.getServerStartTime()),
	call("getServerStartTimeRemain", () => DCS.getServerStartTimeRemain()),
	call("getSimulatorMode", () => DCS.getSimulatorMode()),
	call(
		"getSunAzimuthElevation",
		() => DCS.getSunAzimuthElevation(2024, 6, 15),
		2024,
		6,
		15,
	),
	call(
		"getSunriseSunsetSecond",
		() => DCS.getSunriseSunsetSecond(2024, 6, 15),
		2024,
		6,
		15,
	),
	call("getTaintedCategories", () => DCS.getTaintedCategories()),
	call("getTaintedFiles", () => DCS.getTaintedFiles()),
	call("getTheatreID", () => DCS.getTheatreID()),
	call(
		"getUnitPositionByObjectId",
		() => DCS.getUnitPositionByObjectId(16777472),
		16777472,
	),
	call("getUserOptions", () => DCS.getUserOptions()),
	call("hasMultipleSlots", () => DCS.hasMultipleSlots("22_1"), "22_1"),
	call("isHumanSeatAvailable", () => DCS.isHumanSeatAvailable(21, 1), 21, 1),
	call("isMetricSystem", () => DCS.isMetricSystem()),
	call("isRoleAvailable", () => DCS.isRoleAvailable(21, "pilot"), 21, "pilot"),
	call("isSlotFlyable", () => DCS.isSlotFlyable(21), 21),
	call("isSteamVersion", () => DCS.isSteamVersion()),
	call(
		"isSupercarrierRoleAvailable",
		() => DCS.isSupercarrierRoleAvailable(21, "LSO"),
		21,
		"LSO",
	),
	call("isTrackPlaying", () => DCS.isTrackPlaying()),
	call("lockAllKeyboardInput", () => DCS.lockAllKeyboardInput()),
	call("lockAllMouseInput", () => DCS.lockAllMouseInput()),
	call("lockKeyboardInput", () => DCS.lockKeyboardInput("Escape"), "Escape"),
	call("lockMouseInput", () => DCS.lockMouseInput(1), 1),
	call("unlockKeyboardInput", () => DCS.unlockKeyboardInput()),
	call("unlockMouseInput", () => DCS.unlockMouseInput()),
	call("onShowDialog", () => DCS.onShowDialog("options"), "options"),
	call("onShowStatusBar", () => DCS.onShowStatusBar(true), true),
	call("onUserLogin", () => DCS.onUserLogin("user"), "user"),
	call("openHomePage", () => DCS.openHomePage()),
	call("preloadCockpit", () => DCS.preloadCockpit("F-16C_50"), "F-16C_50"),
	call("refreshPilotStatistics", () => DCS.refreshPilotStatistics()),
	call("reloadOptions", () => DCS.reloadOptions()),
	call("reloadUserScripts", () => DCS.reloadUserScripts()),
	call("restartMission", () => DCS.restartMission()),
	call("saveMissionTo", () => DCS.saveMissionTo("saved.miz"), "saved.miz"),
	call("selfKillPilot", () => DCS.selfKillPilot()),
	call("sendRCD_Callback", () => DCS.sendRCD_Callback("cb"), "cb"),
	call(
		"setBoardNumResourcesDialogData",
		() => DCS.setBoardNumResourcesDialogData("010"),
		"010",
	),
	call("setCameraToAirdrome", () => DCS.setCameraToAirdrome(21), 21),
	call("setCurrentFOV", () => DCS.setCurrentFOV(90), 90),
	call("setDebriefingShow", () => DCS.setDebriefingShow(true), true),
	call("setDefaultFOV", () => DCS.setDefaultFOV(80), 80),
	call(
		"setLiveryNameResourcesDialogData",
		() => DCS.setLiveryNameResourcesDialogData("default"),
		"default",
	),
	call("setMainPilot", () => DCS.setMainPilot(3), 3),
	call("setMaxFPS", () => DCS.setMaxFPS(60), 60),
	call(
		"setMissionResourcesDialogData",
		() => DCS.setMissionResourcesDialogData({ fuel: 1 }),
		{ fuel: 1 },
	),
	call(
		"setNeedRestartApplication",
		() => DCS.setNeedRestartApplication(false),
		false,
	),
	call("setPlayerCoalition", () => DCS.setPlayerCoalition(2), 2),
	call("setPlayerUnit", () => DCS.setPlayerUnit("22_1"), "22_1"),
	call("setScreenShotExt", () => DCS.setScreenShotExt("jpg"), "jpg"),
	call("setViewPause", () => DCS.setViewPause(true), true),
	call("setViewRearm", () => DCS.setViewRearm(1), 1),
	call("setViewRearmAnimationTime", () => DCS.setViewRearmAnimationTime(2), 2),
	call("setViewRearmPositionType", () => DCS.setViewRearmPositionType(1), 1),
	call("unsetViewRearm", () => DCS.unsetViewRearm()),
	call("spawnPlayer", () => DCS.spawnPlayer(21), 21),
	call("startMission", () => DCS.startMission("next.miz"), "next.miz"),
	call("takeTrackControl", () => DCS.takeTrackControl()),
	call("toggleDTC", () => DCS.toggleDTC()),
	call("updaterOperation", () => DCS.updaterOperation("check", 1), "check", 1),
]);

checkCalls("Export", Export, [
	call("GetClickableElements", () => Export.GetClickableElements()),
	call("GetDevice", () => Export.GetDevice(0), 0),
	call("GetIndicator", () => Export.GetIndicator(4), 4),
	call("LoCreateCameraRequest", () => Export.LoCreateCameraRequest()),
	call(
		"LoCreateUserBookmarkRequest",
		() => Export.LoCreateUserBookmarkRequest("Tower"),
		"Tower",
	),
	call("LoForceCamera", () => Export.LoForceCamera(request), request),
	call(
		"LoGeoCoordinatesToLoCoordinates",
		() => Export.LoGeoCoordinatesToLoCoordinates(41.5997, 41.6103),
		41.5997,
		41.6103,
	),
	call("LoGetADIPitchBankYaw", () => Export.LoGetADIPitchBankYaw()),
	call("LoGetAccelerationUnits", () => Export.LoGetAccelerationUnits()),
	call(
		"LoGetAircraftDrawArgumentValue",
		() => Export.LoGetAircraftDrawArgumentValue(0),
		0,
	),
	call(
		"LoGetAltitude",
		() => Export.LoGetAltitude(-317948, 636639),
		-317948,
		636639,
	),
	call("LoGetAltitudeAboveGroundLevel", () =>
		Export.LoGetAltitudeAboveGroundLevel(),
	),
	call("LoGetAltitudeAboveSeaLevel", () => Export.LoGetAltitudeAboveSeaLevel()),
	call("LoGetAngleOfAttack", () => Export.LoGetAngleOfAttack()),
	call("LoGetAngleOfSideSlip", () => Export.LoGetAngleOfSideSlip()),
	call("LoGetAngularVelocity", () => Export.LoGetAngularVelocity()),
	call("LoGetBasicAtmospherePressure", () =>
		Export.LoGetBasicAtmospherePressure(),
	),
	call("LoGetCameraPosition", () => Export.LoGetCameraPosition()),
	call("LoGetControlPanel_HSI", () => Export.LoGetControlPanel_HSI()),
	call("LoGetEngineInfo", () => Export.LoGetEngineInfo()),
	call("LoGetF15_TWS_Contacts", () => Export.LoGetF15_TWS_Contacts()),
	call("LoGetFMData", () => Export.LoGetFMData()),
	call("LoGetGlideDeviation", () => Export.LoGetGlideDeviation()),
	call(
		"LoGetHeightWithObjects",
		() => Export.LoGetHeightWithObjects(1, 2),
		1,
		2,
	),
	call("LoGetHelicopterFMData", () => Export.LoGetHelicopterFMData()),
	call("LoGetInAir", () => Export.LoGetInAir()),
	call("LoGetIndicatedAirSpeed", () => Export.LoGetIndicatedAirSpeed()),
	call("LoGetLocalPlayer", () => Export.LoGetLocalPlayer()),
	call("LoGetLockedTargetInformation", () =>
		Export.LoGetLockedTargetInformation(),
	),
	call("LoGetMCPState", () => Export.LoGetMCPState()),
	call("LoGetMachNumber", () => Export.LoGetMachNumber()),
	call("LoGetMagneticYaw", () => Export.LoGetMagneticYaw()),
	call("LoGetMechInfo", () => Export.LoGetMechInfo()),
	call("LoGetMissionStartTime", () => Export.LoGetMissionStartTime()),
	call("LoGetModelTime", () => Export.LoGetModelTime()),
	call("LoGetNameByType", () => Export.LoGetNameByType(1, 1, 1, 5), 1, 1, 1, 5),
	call("LoGetNavigationInfo", () => Export.LoGetNavigationInfo()),
	call("LoGetObjectById", () => Export.LoGetObjectById(16777472), 16777472),
	call("LoGetPayloadInfo", () => Export.LoGetPayloadInfo()),
	call("LoGetPilotName", () => Export.LoGetPilotName()),
	call("LoGetPlayerPlaneId", () => Export.LoGetPlayerPlaneId()),
	call("LoGetPlayerUnitId", () => Export.LoGetPlayerUnitId()),
	call("LoGetPlayers", () => Export.LoGetPlayers()),
	call("LoGetRadarAltimeter", () => Export.LoGetRadarAltimeter()),
	call("LoGetRadioBeaconsStatus", () => Export.LoGetRadioBeaconsStatus()),
	call("LoGetRoute", () => Export.LoGetRoute()),
	call("LoGetSelfData", () => Export.LoGetSelfData()),
	call("LoGetShakeAmplitude", () => Export.LoGetShakeAmplitude()),
	call("LoGetSideDeviation", () => Export.LoGetSideDeviation()),
	call("LoGetSightingSystemInfo", () => Export.LoGetSightingSystemInfo()),
	call("LoGetSlipBallPosition", () => Export.LoGetSlipBallPosition()),
	call("LoGetSnares", () => Export.LoGetSnares()),
	call("LoGetTWSInfo", () => Export.LoGetTWSInfo()),
	call("LoGetTargetInformation", () => Export.LoGetTargetInformation()),
	call("LoGetTrueAirSpeed", () => Export.LoGetTrueAirSpeed()),
	call("LoGetUserBookmarks", () => Export.LoGetUserBookmarks()),
	call("LoGetVectorVelocity", () => Export.LoGetVectorVelocity()),
	call("LoGetVectorWindVelocity", () => Export.LoGetVectorWindVelocity()),
	call("LoGetVersionInfo", () => Export.LoGetVersionInfo()),
	call("LoGetVerticalVelocity", () => Export.LoGetVerticalVelocity()),
	call(
		"LoGetWindAtPoint",
		() => Export.LoGetWindAtPoint(0, 1000, 0, true),
		0,
		1000,
		0,
		true,
	),
	call("LoGetWingInfo", () => Export.LoGetWingInfo()),
	call("LoGetWingTargets", () => Export.LoGetWingTargets()),
	call(
		"LoGetWorldObjects",
		() => Export.LoGetWorldObjects("airdromes"),
		"airdromes",
	),
	call("LoIsObjectExportAllowed", () => Export.LoIsObjectExportAllowed()),
	call("LoIsOwnshipExportAllowed", () => Export.LoIsOwnshipExportAllowed()),
	call("LoIsSensorExportAllowed", () => Export.LoIsSensorExportAllowed()),
	call(
		"LoLoCoordinatesToGeoCoordinates",
		() => Export.LoLoCoordinatesToGeoCoordinates(-317948, 636639),
		-317948,
		636639,
	),
	call(
		"LoSendForceCamera",
		() => Export.LoSendForceCamera(2, request),
		2,
		request,
	),
	call(
		"LoSetAllowRemoteForceCameraRequests",
		() => Export.LoSetAllowRemoteForceCameraRequests(true),
		true,
	),
	call(
		"LoSetCameraPosition",
		() => Export.LoSetCameraPosition(request.pos),
		request.pos,
	),
	call("LoSetCommand", () => Export.LoSetCommand(3001, 1), 3001, 1),
	call("LoSimulationOnActivePause", () => Export.LoSimulationOnActivePause()),
	call("LoSimulationOnPause", () => Export.LoSimulationOnPause()),
]);

checkCalls("net", net, [
	call("banlist_add", () => net.banlist_add(1, 60, "spam"), 1, 60, "spam"),
	call(
		"banlist_add_by_ucid",
		() => net.banlist_add_by_ucid("abc", 60),
		"abc",
		60,
	),
	call("banlist_get", () => net.banlist_get()),
	call("banlist_remove", () => net.banlist_remove("abc"), "abc"),
	call("check_ic_requirements", () => net.check_ic_requirements({ level: 1 }), {
		level: 1,
	}),
	call("check_password", () => net.check_password("pw", "hash"), "pw", "hash"),
	call(
		"dostring_in",
		() => net.dostring_in("mission", "return 1"),
		"mission",
		"return 1",
	),
	call("force_player_slot", () => net.force_player_slot(1, 2, 21), 1, 2, 21),
	call("get_chat_history", () => net.get_chat_history(0), 0),
	call("get_coalition", () => net.get_coalition(1), 1),
	call("get_default_server_settings", () => net.get_default_server_settings()),
	call("get_my_player_id", () => net.get_my_player_id()),
	call("get_name", () => net.get_name(1), 1),
	call("get_player_info", () => net.get_player_info(1, "ucid"), 1, "ucid"),
	call("get_player_list", () => net.get_player_list()),
	call("get_server_host", () => net.get_server_host()),
	call("get_server_id", () => net.get_server_id()),
	call("get_server_settings", () => net.get_server_settings()),
	call("get_server_uptime", () => net.get_server_uptime()),
	call("get_session_history", () => net.get_session_history()),
	call("get_slot", () => net.get_slot(1), 1),
	call("get_stat", () => net.get_stat(1, net.PS_PING), 1, net.PS_PING),
	call("hash_password", () => net.hash_password("pw"), "pw"),
	call(
		"is_loopback_address",
		() => net.is_loopback_address("127.0.0.1"),
		"127.0.0.1",
	),
	call(
		"is_private_address",
		() => net.is_private_address("10.0.0.1"),
		"10.0.0.1",
	),
	call("json2lua", () => net.json2lua("[1]"), "[1]"),
	call("kick", () => net.kick(1, "bye"), 1, "bye"),
	call("load_mission", () => net.load_mission("m.miz"), "m.miz"),
	call("load_next_mission", () => net.load_next_mission()),
	call("log", () => net.log("hello"), "hello"),
	call("lua2json", () => net.lua2json(true), true),
	call("missionlist_append", () => net.missionlist_append("m.miz"), "m.miz"),
	call("missionlist_clear", () => net.missionlist_clear()),
	call("missionlist_delete", () => net.missionlist_delete(1), 1),
	call("missionlist_get", () => net.missionlist_get()),
	call("missionlist_get_installed_theatres", () =>
		net.missionlist_get_installed_theatres(),
	),
	call("missionlist_move", () => net.missionlist_move(1, 2), 1, 2),
	call("missionlist_run", () => net.missionlist_run(2), 2),
	call("missionlist_set_loop", () => net.missionlist_set_loop(true), true),
	call(
		"missionlist_set_shuffle",
		() => net.missionlist_set_shuffle(false),
		false,
	),
	call("recv_chat", () => net.recv_chat("notice", 2), "notice", 2),
	call("resetJoinCooldownEndForAll", () => net.resetJoinCooldownEndForAll()),
	call(
		"resetJoinCooldownEndForPlayer",
		() => net.resetJoinCooldownEndForPlayer(1),
		1,
	),
	call("restart", () => net.restart()),
	call("screenshot_del", () => net.screenshot_del(1, "k"), 1, "k"),
	call("screenshot_request", () => net.screenshot_request(1), 1),
	call("send_chat", () => net.send_chat("hi", true), "hi", true),
	call(
		"send_chat_to",
		() => net.send_chat_to("hi", net.CHAT_TEAM),
		"hi",
		net.CHAT_TEAM,
	),
	call("send_rpc_error", () => net.send_rpc_error(1, "e"), 1, "e"),
	call("send_rpc_request", () => net.send_rpc_request(1, "m"), 1, "m"),
	call("send_rpc_result", () => net.send_rpc_result(1, "r"), 1, "r"),
	call("serverinfo_get", () => net.serverinfo_get(1), 1),
	call("serverinfo_request", () => net.serverinfo_request(1), 1),
	call("serverlist_get", () => net.serverlist_get()),
	call("serverlist_reset", () => net.serverlist_reset()),
	call("serverlist_search", () => net.serverlist_search("tslua"), "tslua"),
	call("set_coalition", () => net.set_coalition(2, "pw"), 2, "pw"),
	call("set_name", () => net.set_name(1, "Pilot 2"), 1, "Pilot 2"),
	call("set_slot", () => net.set_slot(2, 21), 2, 21),
	call("spawn_player", () => net.spawn_player(1), 1),
	call("start_client", () => net.start_client("127.0.0.1"), "127.0.0.1"),
	call("start_server", () => net.start_server({ port: 10308 }), {
		port: 10308,
	}),
	call("stop_game", () => net.stop_game()),
	call("stop_network", () => net.stop_network()),
	call("trace", () => net.trace("packet"), "packet"),
]);

checkCalls("lfs", lfs, [
	call(
		"add_location",
		() => lfs.add_location("Tracks", "C:\\Tracks\\"),
		"Tracks",
		"C:\\Tracks\\",
	),
	call(
		"attributes",
		() => lfs.attributes(lfs.writedir(), "mode"),
		lfs.writedir(),
		"mode",
	),
	call("chdir", () => lfs.chdir(lfs.tempdir()), lfs.tempdir()),
	call("create_lockfile", () => lfs.create_lockfile("lock"), "lock"),
	call("currentdir", () => lfs.currentdir()),
	call("del_location", () => lfs.del_location("My Missions"), "My Missions"),
	call("dir", () => lfs.dir(lfs.writedir()), lfs.writedir()),
	call("locations", () => lfs.locations()),
	call("md5sum", () => lfs.md5sum("x"), "x"),
	call(
		"mkdir",
		() => lfs.mkdir(`${lfs.tempdir()}made`),
		`${lfs.tempdir()}made`,
	),
	call("normpath", () => lfs.normpath("a/./b"), "a/./b"),
	call("realpath", () => lfs.realpath("Scripts"), "Scripts"),
	call(
		"rmdir",
		() => lfs.rmdir(`${lfs.tempdir()}missing`),
		`${lfs.tempdir()}missing`,
	),
	call("tempdir", () => lfs.tempdir()),
	call("writedir", () => lfs.writedir()),
]);

checkCalls("log", log, [
	call("alert", () => log.alert("a %d", 1), "a %d", 1),
	call("backup", () => log.backup("x"), "x"),
	call("debug", () => log.debug("d"), "d"),
	call("error", () => log.error("e %s", "x"), "e %s", "x"),
	call("info", () => log.info("i"), "i"),
	call(
		"set_output",
		() => log.set_output("mod", "Mod", log.ALL, log.FULL),
		"mod",
		"Mod",
		log.ALL,
		log.FULL,
	),
	call("set_output_rules", () => log.set_output_rules({}), {}),
	call("warning", () => log.warning("w"), "w"),
	call(
		"write",
		() => log.write("Mod", log.INFO, "v%d", 2),
		"Mod",
		log.INFO,
		"v%d",
		2,
	),
]);

checkCalls("terrain", terrain, [
	call("Create", () => terrain.Create("x"), "x"),
	call("FindNearestPoint", () => terrain.FindNearestPoint(1, 2, 3), 1, 2, 3),
	call(
		"FindOptimalPath",
		() => terrain.FindOptimalPath(1, 2, 3, 4),
		1,
		2,
		3,
		4,
	),
	call("GetHeight", () => terrain.GetHeight(1, 2), 1, 2),
	call(
		"GetMGRScoordinates",
		() => terrain.GetMGRScoordinates(-317948, 636639),
		-317948,
		636639,
	),
	call("GetSeasons", () => terrain.GetSeasons()),
	call(
		"GetSurfaceHeightWithSeabed",
		() => terrain.GetSurfaceHeightWithSeabed(1, 2),
		1,
		2,
	),
	call("GetSurfaceType", () => terrain.GetSurfaceType(1, 2), 1, 2),
	call("GetTerrainConfig", () => terrain.GetTerrainConfig<string>("id"), "id"),
	call(
		"Init",
		() => terrain.Init("cfg.lua", "me", { year: 2024 }),
		"cfg.lua",
		"me",
		{ year: 2024 },
	),
	call(
		"InitLight",
		() => terrain.InitLight("cfg.lua", "me", { year: 2024 }),
		"cfg.lua",
		"me",
		{ year: 2024 },
	),
	call("Release", () => terrain.Release()),
	call(
		"convertLatLonToMeters",
		() => terrain.convertLatLonToMeters(41.6, 41.5),
		41.6,
		41.5,
	),
	call(
		"convertMGRStoMeters",
		() => terrain.convertMGRStoMeters("37T GJ 36639 82052"),
		"37T GJ 36639 82052",
	),
	call(
		"convertMetersToLatLon",
		() => terrain.convertMetersToLatLon(1, 2),
		1,
		2,
	),
	call(
		"findPathOnRoads",
		() => terrain.findPathOnRoads("railroads", 1, 2, 3, 4),
		"railroads",
		1,
		2,
		3,
		4,
	),
	call("getBeacons", () => terrain.getBeacons()),
	call(
		"getClosestPointOnRoads",
		() => terrain.getClosestPointOnRoads("roads", 1, 2),
		"roads",
		1,
		2,
	),
	call(
		"getClosestValidPoint",
		() => terrain.getClosestValidPoint("land", 1, 2),
		"land",
		1,
		2,
	),
	call("getCrossParam", () => terrain.getCrossParam(1), 1),
	call("getObjectPosition", () => terrain.getObjectPosition(5), 5),
	call("getObjectsAtMapPoint", () => terrain.getObjectsAtMapPoint(1, 2), 1, 2),
	call("getRadio", () => terrain.getRadio()),
	call(
		"getRunwayHeading",
		() => terrain.getRunwayHeading("kobuleti.rn"),
		"kobuleti.rn",
	),
	call(
		"getRunwayList",
		() => terrain.getRunwayList("kobuleti.rn"),
		"kobuleti.rn",
	),
	call(
		"getStandList",
		() => terrain.getStandList("kobuleti.rn", ["WIDTH"]),
		"kobuleti.rn",
		["WIDTH"],
	),
	call("getTechSkinByDate", () => terrain.getTechSkinByDate(15, 6), 15, 6),
	call(
		"getTempratureRangeByDate",
		() => terrain.getTempratureRangeByDate(15, 1),
		15,
		1,
	),
	call("getTerrainShpare", () => terrain.getTerrainShpare(1), 1),
	call(
		"isVisible",
		() => terrain.isVisible(1, 2, 3, 4, 5, 6),
		1,
		2,
		3,
		4,
		5,
		6,
	),
]);
