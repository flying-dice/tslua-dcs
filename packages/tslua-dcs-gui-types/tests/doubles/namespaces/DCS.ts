/** @noSelfInFile */

import type { DCSAvailableCoalition, l_DCS } from "../../../src";
import { dcsConstants } from "../constants";
import { copy, type DoubleContext } from "../context";
import type { AnyFunction, CallbackTable } from "../state";

/**
 * `DCS` double. Getters read `ctx.state()`, setters write it, and functions whose contract DCS
 * does not document (or that only drive UI) are recorded in `state.nativeCalls` and return nothing.
 */
export function createDCS(ctx: DoubleContext): l_DCS {
	const s = () => ctx.state();
	const recorded =
		(name: string) =>
		(...arguments_: unknown[]) =>
			ctx.native(`DCS.${name}`, arguments_);
	const unitSlot = (unitId: number | string) => {
		for (const [, slots] of pairs(s().slots))
			for (const slot of slots) if (slot.unitId === unitId) return slot;
		return undefined;
	};

	return {
		...dcsConstants,

		// Simulation state
		setPause: (paused) => {
			s().paused = paused;
		},
		getPause: () => s().paused,
		stopMission: () => {
			ctx.native("DCS.stopMission", []);
			s().missionLoaded = false;
		},
		exitProcess: recorded("exitProcess"),
		isMultiplayer: () => s().multiplayer,
		isServer: () => s().server,
		getModelTime: () => s().modelTime,
		getRealTime: () => s().realTime,
		setViewPause: (paused) => {
			s().viewPaused = paused;
		},
		isTrackPlaying: () => false,
		takeTrackControl: recorded("takeTrackControl"),

		// Mission
		getMissionOptions: () => copy(s().missionOptions),
		getMissionDescription: () => s().missionDescription,
		getCurrentMission: () => copy(s().currentMission),
		getMissionName: () => s().missionName,
		getMissionFilename: () => s().missionFilename,
		getMissionResult: (side) => s().missionResults[side],
		getMissionLoaded: () => s().missionLoaded,
		getMissionTheatre: () => s().missionTheatre,
		getPlayerBriefing: () => s().playerBriefing,
		getInstalledTheatres: () => copy(s().installedTheatres),
		getTheatreID: () => 1,
		startMission: (fileName) => {
			s().missionFilename = fileName;
			s().missionLoaded = true;
			return true;
		},
		restartMission: () => {
			ctx.native("DCS.restartMission", []);
			s().modelTime = 0;
		},
		saveMissionTo: (fileName) => {
			s().files[fileName] = {
				content: "PK",
				md5: "",
				modification: s().realTime,
			};
			return true;
		},
		exportToMiz: (fileName) => {
			s().files[fileName] = {
				content: "PK",
				md5: "",
				modification: s().realTime,
			};
			return true;
		},
		writeDebriefing: (text) => {
			s().debriefing.push(text);
		},
		setDebriefingShow: recorded("setDebriefingShow"),
		getMissionPersistenceData: (key) => copy(s().persistence[key]),
		enumMissionPersistenceData: (visitor) => {
			const keys: string[] = [];
			for (const [key] of pairs(s().persistence)) keys.push(key as string);
			keys.sort();
			// DCS calls the visitor as a plain Lua function, whatever the declaration says.
			const plain = visitor as unknown as AnyFunction;
			for (const key of keys) plain(copy(s().persistence[key]));
		},
		getGameDuration: () => 3600,
		getServerStartTime: () => 1700000000,
		getServerStartTimeRemain: () => 0,
		getGamePattern: () => "mission",
		getSimulatorMode: () => "sim",
		getGeneratedParams: () => ({}),
		getDynamicSpawnSettings: () => ({ enabled: false }),
		getFarpsAndCarriersMissionData: () => [],
		getATCradiosData: () => [],

		// Coalitions, slots and units
		getAvailableCoalitions: () => {
			const result: Record<number, DCSAvailableCoalition> = {};
			for (const [id, name] of pairs(s().coalitionNames))
				result[id as number] = { name: name as string };
			return result;
		},
		getAvailableSlots: (coalitionId) => {
			const slots = s().slots[coalitionId];
			return slots === undefined ? undefined : copy(slots);
		},
		getUnitProperty: (missionId, propertyId) => {
			const unit = s().units[missionId];
			if (unit === undefined) return undefined;
			const c = dcsConstants;
			if (propertyId === c.UNIT_RUNTIME_ID) return unit.runtimeId;
			if (propertyId === c.UNIT_MISSION_ID) return missionId;
			if (propertyId === c.UNIT_NAME) return unit.name;
			if (propertyId === c.UNIT_TYPE) return unit.type;
			if (propertyId === c.UNIT_CATEGORY) return unit.category;
			if (propertyId === c.UNIT_GROUP_MISSION_ID) return unit.groupMissionId;
			if (propertyId === c.UNIT_GROUPNAME) return unit.groupName;
			if (propertyId === c.UNIT_GROUPCATEGORY) return unit.groupCategory;
			if (propertyId === c.UNIT_CALLSIGN) return unit.callsign;
			if (propertyId === c.UNIT_HIDDEN) return unit.hidden;
			if (propertyId === c.UNIT_COALITION)
				return unit.coalition === 2 ? "blue" : "red";
			if (propertyId === c.UNIT_COUNTRY_ID) return unit.country;
			if (propertyId === c.UNIT_TASK) return unit.task;
			if (propertyId === c.UNIT_PLAYER_NAME) return unit.playerName;
			if (propertyId === c.UNIT_ROLE) return unit.role;
			if (propertyId === c.UNIT_INVISIBLE_MAP_ICON) return false;
			if (propertyId === c.UNIT_INVISIBLE_MAP_LABEL) return false;
			return undefined;
		},
		getUnitType: (missionId) => s().units[missionId]?.type ?? "",
		getUnitTypeAttribute: (typeId, attribute) =>
			s().unitTypes[typeId]?.[attribute],
		getPlayerCoalition: () => s().playerCoalition,
		setPlayerCoalition: (coalitionId) => {
			s().playerCoalition = coalitionId;
		},
		getPlayerUnit: () => s().playerUnit,
		setPlayerUnit: (unitId) => {
			s().playerUnit = unitId;
		},
		getPlayerUnitType: () => {
			const slot =
				s().playerUnit === undefined
					? undefined
					: unitSlot(s().playerUnit as number | string);
			return slot?.type;
		},
		getMainPilot: () => s().mainPilot,
		setMainPilot: (pilotId) => {
			s().mainPilot = pilotId;
		},
		hasMultipleSlots: (unitId) => type(unitId) === "string",
		isHumanSeatAvailable: (unitId) => unitSlot(unitId) !== undefined,
		isRoleAvailable: (unitId) => unitSlot(unitId) !== undefined,
		isSlotFlyable: (unitId) => unitSlot(unitId) !== undefined,
		isSupercarrierRoleAvailable: () => false,
		getHumanUnitInputName: (unitId) => unitSlot(unitId)?.type,
		getInputNameByUnitType: (unitType) => unitType,
		getUnitPositionByObjectId: () => ({ x: -281000, y: 1000, z: 647000 }),
		getModelNameByShapeTableIndex: (index) =>
			index === 1 ? "f-16c_bl_50" : undefined,
		getObjectLiveriesNames: (typeName) =>
			typeName === "F-16C_50" ? ["default", "usaf 35th fw"] : [],
		activateGroup: recorded("activateGroup"),
		add_dyn_group: recorded("add_dyn_group"),
		checkMultiplayerSpawnConflict: recorded("checkMultiplayerSpawnConflict"),
		create_client_aircraft: recorded("create_client_aircraft"),
		enter_with_dyngroup: recorded("enter_with_dyngroup"),
		spawnPlayer: recorded("spawnPlayer"),
		selfKillPilot: recorded("selfKillPilot"),
		preloadCockpit: (unitType) => s().unitTypes[unitType] !== undefined,

		// Airbases
		getAirdromesCoalition: () => copy(s().airdromeCoalitions),
		getAirdromesState: () => ({}),
		getAircraftAmountInAirportWarehouse: (airportId, aircraftType) =>
			s().warehouseAircraft[airportId]?.[aircraftType] ?? 0,
		getAirTankerID: () => undefined,
		getConquestAirbaseState: recorded("getConquestAirbaseState"),
		conquestCoalitionsScore: () => ({ red: 0, blue: 0 }),
		setCameraToAirdrome: recorded("setCameraToAirdrome"),

		// Hooks, logging, configuration
		setUserCallbacks: (callbacks) => {
			s().callbacks.push(callbacks as CallbackTable);
		},
		getLogHistory: (from) => {
			const history = s().logHistory;
			const entries = [];
			for (let index = math.max(from, 0); index < history.length; index++)
				entries.push(copy(history[index]));
			return $multi(entries, history.length);
		},
		getConfigValue: (path) => copy(s().config[path]),
		getUserOptions: () => copy(s().userOptions),
		reloadOptions: recorded("reloadOptions"),
		reloadUserScripts: recorded("reloadUserScripts"),
		getLocalizedStrings: (keys) => keys,
		getManualPath: (moduleId) =>
			`${s().currentdir}Mods\\aircraft\\${moduleId}\\Doc\\`,
		getTaintedCategories: () => [],
		getTaintedFiles: () => [],
		isMetricSystem: () => true,
		isSteamVersion: () => false,
		setNeedRestartApplication: recorded("setNeedRestartApplication"),
		updaterOperation: recorded("updaterOperation"),

		// Screen, view and input
		makeScreenShot: (name) => {
			s().screenshots.push(`${name}.${s().screenshotExtension}`);
		},
		setScreenShotExt: (extension) => {
			s().screenshotExtension = extension;
		},
		getCurrentFOV: () => s().fov.current,
		setCurrentFOV: (fieldOfView) => {
			s().fov.current = fieldOfView;
		},
		getDefaultFOV: () => s().fov.default,
		setDefaultFOV: (fieldOfView) => {
			s().fov.default = fieldOfView;
		},
		getMaxFPS: () => s().maxFps,
		setMaxFPS: (framesPerSecond) => {
			s().maxFps = framesPerSecond;
		},
		HMD_isActive: () => false,
		UIDeclutterOnOff: recorded("UIDeclutterOnOff"),
		UIRequestOverlayWidgetPosition: recorded("UIRequestOverlayWidgetPosition"),
		onShowDialog: recorded("onShowDialog"),
		onShowStatusBar: recorded("onShowStatusBar"),
		onUserLogin: recorded("onUserLogin"),
		openHomePage: recorded("openHomePage"),
		activateSteamOverlayToStore: recorded("activateSteamOverlayToStore"),
		dispatchAnalogAction: recorded("dispatchAnalogAction"),
		dispatchDigitalAction: recorded("dispatchDigitalAction"),
		lockAllKeyboardInput: recorded("lockAllKeyboardInput"),
		lockAllMouseInput: recorded("lockAllMouseInput"),
		lockKeyboardInput: recorded("lockKeyboardInput"),
		lockMouseInput: recorded("lockMouseInput"),
		unlockKeyboardInput: recorded("unlockKeyboardInput"),
		unlockMouseInput: recorded("unlockMouseInput"),
		setViewRearm: recorded("setViewRearm"),
		setViewRearmAnimationTime: recorded("setViewRearmAnimationTime"),
		setViewRearmPositionType: recorded("setViewRearmPositionType"),
		unsetViewRearm: recorded("unsetViewRearm"),
		toggleDTC: recorded("toggleDTC"),
		RCD_selectMenuItem: recorded("RCD_selectMenuItem"),
		sendRCD_Callback: recorded("sendRCD_Callback"),

		// Mission resources dialog
		getMissionResourcesDialogData: () => ({}),
		setMissionResourcesDialogData: recorded("setMissionResourcesDialogData"),
		setBoardNumResourcesDialogData: recorded("setBoardNumResourcesDialogData"),
		setLiveryNameResourcesDialogData: recorded(
			"setLiveryNameResourcesDialogData",
		),

		// Pilot statistics and achievements
		getPilotAchievements: () => [],
		getAchievementsUiInfo: () => ({}),
		getPilotStatistics: () => ({ flights: 0 }),
		getPilotsSummaryStatistics: () => [],
		refreshPilotStatistics: recorded("refreshPilotStatistics"),
		getInputProfiles: () => [],
		MACSavePSData: recorded("MACSavePSData"),

		// Last-man-standing game mode
		LMSGetRemainingTimeBeforeZoneShrink: () => 0,
		LMSRestart: recorded("LMSRestart"),
		LMSSetWaitForMinimalPlayers: recorded("LMSSetWaitForMinimalPlayers"),

		// Astronomy (the double's sky does not move)
		getSunAzimuthElevation: () => $multi(3.14, 0.9),
		getSunriseSunsetSecond: () => $multi(21600, 64800),
		getMoonAzimuthElevationPhase: () => $multi(1.2, 0.4, 0.5),
	};
}
