import type { l_DCS } from "@flying-dice/tslua-dcs-gui-types";
import { describe, expect, test } from "@flying-dice/tslua-luatest";

const checkedDcs: l_DCS = DCS;

describe("DCS examples", () => {
	test("time and state getters return documented values", () => {
		expect(type(checkedDcs.getPause())).toBe("boolean");
		expect(type(checkedDcs.getModelTime())).toBe("number");
		expect(type(checkedDcs.getRealTime())).toBe("number");
		expect(type(checkedDcs.isMultiplayer())).toBe("boolean");
		expect(type(checkedDcs.isServer())).toBe("boolean");
	});

	test("mission metadata is available", () => {
		expect(type(checkedDcs.getMissionName())).toBe("string");
		expect(type(checkedDcs.getMissionDescription())).toBe("string");
		expect(type(checkedDcs.getMissionOptions())).toBe("table");
		expect(type(checkedDcs.getCurrentMission())).toBe("table");
	});

	test("available slots are an array or absent", () => {
		const slots = checkedDcs.getAvailableSlots(2);
		expect(slots === undefined || type(slots) === "table").toBe(true);
	});

	test("safe GUI metadata getters return stable runtime kinds", () => {
		for (const value of [
			checkedDcs.getCurrentFOV(),
			checkedDcs.getDefaultFOV(),
			checkedDcs.getGameDuration(),
			checkedDcs.getMaxFPS(),
			checkedDcs.getServerStartTime(),
			checkedDcs.getServerStartTimeRemain(),
			checkedDcs.getTheatreID(),
		])
			expect(type(value)).toBe("number");
		for (const value of [
			checkedDcs.HMD_isActive(),
			checkedDcs.isMetricSystem(),
			checkedDcs.isSteamVersion(),
			checkedDcs.isTrackPlaying(),
		])
			expect(type(value)).toBe("boolean");
		expect(type(checkedDcs.getInstalledTheatres())).toBe("table");
		expect(type(checkedDcs.getMissionTheatre())).toBe("string");
		expect(type(checkedDcs.getUserOptions())).toBe("table");
	});

	test("every generated DCS control function has a runtime export", () => {
		for (const value of [
			checkedDcs.exitProcess,
			checkedDcs.getAvailableCoalitions,
			checkedDcs.getConfigValue,
			checkedDcs.getLogHistory,
			checkedDcs.getMissionFilename,
			checkedDcs.getMissionResult,
			checkedDcs.getUnitProperty,
			checkedDcs.getUnitType,
			checkedDcs.getUnitTypeAttribute,
			checkedDcs.makeScreenShot,
			checkedDcs.setPause,
			checkedDcs.setUserCallbacks,
			checkedDcs.stopMission,
			checkedDcs.writeDebriefing,
			checkedDcs.LMSGetRemainingTimeBeforeZoneShrink,
			checkedDcs.LMSRestart,
			checkedDcs.LMSSetWaitForMinimalPlayers,
			checkedDcs.MACSavePSData,
			checkedDcs.RCD_selectMenuItem,
			checkedDcs.UIDeclutterOnOff,
			checkedDcs.UIRequestOverlayWidgetPosition,
			checkedDcs.activateGroup,
			checkedDcs.activateSteamOverlayToStore,
			checkedDcs.add_dyn_group,
			checkedDcs.checkMultiplayerSpawnConflict,
			checkedDcs.conquestCoalitionsScore,
			checkedDcs.create_client_aircraft,
			checkedDcs.dispatchAnalogAction,
			checkedDcs.dispatchDigitalAction,
			checkedDcs.enter_with_dyngroup,
			checkedDcs.enumMissionPersistenceData,
			checkedDcs.exportToMiz,
			checkedDcs.getATCradiosData,
			checkedDcs.getAchievementsUiInfo,
			checkedDcs.getAirTankerID,
			checkedDcs.getAircraftAmountInAirportWarehouse,
			checkedDcs.getAirdromesCoalition,
			checkedDcs.getAirdromesState,
			checkedDcs.getConquestAirbaseState,
			checkedDcs.getDynamicSpawnSettings,
			checkedDcs.getFarpsAndCarriersMissionData,
			checkedDcs.getGamePattern,
			checkedDcs.getGeneratedParams,
			checkedDcs.getHumanUnitInputName,
			checkedDcs.getInputNameByUnitType,
			checkedDcs.getInputProfiles,
			checkedDcs.getLocalizedStrings,
			checkedDcs.getMainPilot,
			checkedDcs.getManualPath,
			checkedDcs.getMissionLoaded,
			checkedDcs.getMissionPersistenceData,
			checkedDcs.getMissionResourcesDialogData,
			checkedDcs.getModelNameByShapeTableIndex,
			checkedDcs.getMoonAzimuthElevationPhase,
			checkedDcs.getObjectLiveriesNames,
			checkedDcs.getPilotAchievements,
			checkedDcs.getPilotStatistics,
			checkedDcs.getPilotsSummaryStatistics,
			checkedDcs.getPlayerBriefing,
			checkedDcs.getPlayerCoalition,
			checkedDcs.getPlayerUnit,
			checkedDcs.getPlayerUnitType,
			checkedDcs.getSimulatorMode,
			checkedDcs.getSunAzimuthElevation,
			checkedDcs.getSunriseSunsetSecond,
			checkedDcs.getTaintedCategories,
			checkedDcs.getTaintedFiles,
			checkedDcs.getUnitPositionByObjectId,
			checkedDcs.hasMultipleSlots,
			checkedDcs.isHumanSeatAvailable,
			checkedDcs.isRoleAvailable,
			checkedDcs.isSlotFlyable,
			checkedDcs.isSupercarrierRoleAvailable,
			checkedDcs.lockAllKeyboardInput,
			checkedDcs.lockAllMouseInput,
			checkedDcs.lockKeyboardInput,
			checkedDcs.lockMouseInput,
			checkedDcs.onShowDialog,
			checkedDcs.onShowStatusBar,
			checkedDcs.onUserLogin,
			checkedDcs.openHomePage,
			checkedDcs.preloadCockpit,
			checkedDcs.refreshPilotStatistics,
			checkedDcs.reloadOptions,
			checkedDcs.reloadUserScripts,
			checkedDcs.restartMission,
			checkedDcs.saveMissionTo,
			checkedDcs.selfKillPilot,
			checkedDcs.sendRCD_Callback,
			checkedDcs.setBoardNumResourcesDialogData,
			checkedDcs.setCameraToAirdrome,
			checkedDcs.setCurrentFOV,
			checkedDcs.setDebriefingShow,
			checkedDcs.setDefaultFOV,
			checkedDcs.setLiveryNameResourcesDialogData,
			checkedDcs.setMainPilot,
			checkedDcs.setMaxFPS,
			checkedDcs.setMissionResourcesDialogData,
			checkedDcs.setNeedRestartApplication,
			checkedDcs.setPlayerCoalition,
			checkedDcs.setPlayerUnit,
			checkedDcs.setScreenShotExt,
			checkedDcs.setViewPause,
			checkedDcs.setViewRearm,
			checkedDcs.setViewRearmAnimationTime,
			checkedDcs.setViewRearmPositionType,
			checkedDcs.spawnPlayer,
			checkedDcs.startMission,
			checkedDcs.takeTrackControl,
			checkedDcs.toggleDTC,
			checkedDcs.unlockKeyboardInput,
			checkedDcs.unlockMouseInput,
			checkedDcs.unsetViewRearm,
			checkedDcs.updaterOperation,
		])
			expect(type(value)).toBe("function");
	});
});
