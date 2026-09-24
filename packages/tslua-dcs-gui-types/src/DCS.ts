import type { _DCS } from "./exports/DCS.export";

export interface DCSAvailableCoalition {
	name: string;
}

export interface DCSAvailableSlot {
	unitId: number | string;
	type: string;
	role: string;
	callsign: string;
	groupName: string;
	country: number;
}

export interface DCSLogEntry {
	abstime: number;
	level: number;
	subsystem: string;
	message: string;
}

type DCSConstants = {
	[K in keyof _DCS as _DCS[K] extends (...arguments_: never[]) => unknown
		? never
		: K]: _DCS[K];
};

/**
 * @version 2.9.1.48335
 * @noSelf
 * @see [Authoritative executable examples](https://github.com/flying-dice/tslua-dcs/blob/main/packages/tslua-dcs-gui-types_test/src/DCS_test.ts)
 **/
export interface l_DCS extends DCSConstants {
	/**
	 * Pauses or resumes the simulation; this is server-side only.
	 *
	 * @param paused Desired pause state.
	 * @returns Nothing.
	 * @example `DCS.setPause(true);`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:95
	 */
	setPause(paused: boolean): void;
	/**
	 * Reports whether the simulation is paused.
	 *
	 * @returns Pause state.
	 * @example `const paused = DCS.getPause();`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:99
	 */
	getPause(): boolean;
	/**
	 * Stops the current mission.
	 *
	 * @returns Nothing.
	 * @example `DCS.stopMission();`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:103
	 */
	stopMission(): void;
	/**
	 * Exits the DCS process.
	 *
	 * @returns Nothing.
	 * @example `DCS.exitProcess();`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:107
	 */
	exitProcess(): void;
	/**
	 * Reports whether DCS is running in multiplayer mode.
	 *
	 * @returns Multiplayer state.
	 * @example `const multiplayer = DCS.isMultiplayer();`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:111
	 */
	isMultiplayer(): boolean;
	/**
	 * Reports whether this instance is a server; single-player also returns true.
	 *
	 * @returns Server state.
	 * @example `const server = DCS.isServer();`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:115
	 */
	isServer(): boolean;
	/**
	 * Returns current simulation model time.
	 *
	 * @returns Seconds.
	 * @example `const modelTime = DCS.getModelTime();`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:119
	 */
	getModelTime(): number;
	/**
	 * Returns real time since application startup.
	 *
	 * @returns Seconds.
	 * @example `const uptime = DCS.getRealTime();`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:123
	 */
	getRealTime(): number;
	/**
	 * Returns `mission.options`.
	 *
	 * @returns Mission option table.
	 * @example `const options = DCS.getMissionOptions();`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:127
	 */
	getMissionOptions(): Record<string, unknown>;
	/**
	 * Returns the translated mission description.
	 *
	 * @returns Description text.
	 * @example `const briefing = DCS.getMissionDescription();`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:131
	 */
	getMissionDescription(): string;
	/**
	 * Returns coalitions having available player slots.
	 *
	 * @returns Records keyed by coalition ID.
	 * @example `const coalitions = DCS.getAvailableCoalitions();`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:135
	 */
	getAvailableCoalitions(): Record<number, DCSAvailableCoalition>;
	/**
	 * Returns available player slots for a coalition.
	 *
	 * DCS may return nothing when the requested coalition is unavailable in the
	 * current mission or UI state. Multi-seat `unitId` values may be strings of
	 * the form `unitID_seatID`.
	 *
	 * @param coalitionId Coalition ID returned by `getAvailableCoalitions`.
	 * @returns Available slots, or `undefined` when the coalition is unavailable.
	 * @example
	 * ```ts
	 * const slots = DCS.getAvailableSlots(2);
	 * if (slots) {
	 * 	for (const slot of slots) log.write("slots", log.INFO, slot.callsign);
	 * }
	 * ```
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:142
	 * @see %DCS_INSTALL_DIR%/Scripts/UI/BriefingDialog.lua:628
	 */
	getAvailableSlots(coalitionId: number): DCSAvailableSlot[] | undefined;
	/**
	 * Returns the loaded mission table; use `getMissionOptions` for authoritative options.
	 *
	 * @returns Mission data.
	 * @example `const mission = DCS.getCurrentMission();`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:148
	 */
	getCurrentMission(): Record<string, unknown>;
	/**
	 * Returns the current mission name.
	 *
	 * @returns Mission name.
	 * @example `const name = DCS.getMissionName();`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:152
	 */
	getMissionName(): string;
	/**
	 * Returns the current mission filename, or nothing on a multiplayer client.
	 *
	 * @returns Mission path when available.
	 * @example `const filename = DCS.getMissionFilename();`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:156
	 */
	getMissionFilename(): string | undefined;
	/**
	 * Returns the mission result for red or blue.
	 *
	 * @param side Coalition name.
	 * @returns Result from 0 through 100.
	 * @example `const result = DCS.getMissionResult("blue");`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:160
	 */
	getMissionResult(side: "red" | "blue"): number;
	/**
	 * Returns a unit property selected by one of the `DCS.UNIT_*` constants.
	 *
	 * @param missionId Unit mission ID.
	 * @param propertyId Property selector.
	 * @returns Property value when available.
	 * @example `const name = DCS.getUnitProperty(12, DCS.UNIT_NAME);`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:164
	 */
	getUnitProperty(
		missionId: number,
		propertyId: number,
	): string | number | boolean | undefined;
	/**
	 * Returns a unit type ID.
	 *
	 * @param missionId Unit mission ID.
	 * @returns Database type ID.
	 * @example `const typeId = DCS.getUnitType(12);`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:185
	 */
	getUnitType(missionId: number): string;
	/**
	 * Reads an attribute from a database unit type.
	 *
	 * @param typeId Database type ID.
	 * @param attribute Attribute name.
	 * @returns Attribute value when available.
	 * @example `const label = DCS.getUnitTypeAttribute("Ural", "DisplayName");`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:189
	 */
	getUnitTypeAttribute(typeId: string, attribute: string): unknown;
	/**
	 * Writes custom text to the mission debriefing file.
	 *
	 * @param text Text to append.
	 * @returns Nothing.
	 * @example `DCS.writeDebriefing("Mission script completed");`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:197
	 */
	writeDebriefing(text: string): void;
	/**
	 * Installs GameGUI callback handlers.
	 *
	 * DCS calls each handler as a plain Lua function with the hook's arguments, so the handlers take
	 * no `self` (`this: void`). A handler that must return several values (for example
	 * `onPlayerTryConnect` returning `false, reason`) needs an explicit `LuaMultiReturn` return type.
	 *
	 * @param callbacks Callback table; omitted callbacks remain unhandled.
	 * @returns Nothing.
	 * @example `DCS.setUserCallbacks({ onSimulationStart: () => log.info("Started") });`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:201
	 */
	setUserCallbacks(
		callbacks: Record<
			string,
			((this: void, ...args: unknown[]) => unknown) | undefined
		>,
	): void;
	/**
	 * Saves a screenshot with the supplied name.
	 *
	 * @param name Screenshot name.
	 * @returns Nothing.
	 * @example `DCS.makeScreenShot("mission-start");`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:207
	 */
	makeScreenShot(name: string): void;
	/**
	 * Returns log entries from an index and the next index to request.
	 *
	 * @param from Starting log index.
	 * @returns Log entries and next index.
	 * @example `const [entries, next] = DCS.getLogHistory(0);`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:211
	 */
	getLogHistory(from: number): LuaMultiReturn<[DCSLogEntry[], number]>;
	/**
	 * Reads a value from DCS configuration state.
	 *
	 * @param path Configuration path.
	 * @returns Stored value when present.
	 * @example `const value = DCS.getConfigValue("graphics.width");`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:221
	 */
	getConfigValue(path: string): unknown;

	/**
	 * Returns whether a head-mounted display is active.
	 *
	 * @example `const active = DCS.HMD_isActive();`
	 * @see %DCS_INSTALL_DIR%/Scripts/UI/ViewportEditor.lua
	 */
	HMD_isActive(): boolean;
	/**
	 * Returns seconds remaining before the Last Man Standing zone shrinks.
	 *
	 * @example `const seconds = DCS.LMSGetRemainingTimeBeforeZoneShrink();`
	 */
	LMSGetRemainingTimeBeforeZoneShrink(): number;
	/**
	 * Restarts the Last Man Standing game mode.
	 *
	 * @returns Nothing.
	 */
	LMSRestart(): void;
	/**
	 * Configures whether Last Man Standing waits for its minimum player count.
	 */
	LMSSetWaitForMinimalPlayers(wait: boolean): void;
	/**
	 * TODO: Modern Air Combat pilot-statistics payload is native and not described in installed Lua sources.
	 */
	MACSavePSData(data: unknown): unknown;
	/**
	 * TODO: radio-command-dialog menu selection payload is a private UI contract.
	 */
	RCD_selectMenuItem(...arguments_: unknown[]): unknown;
	/**
	 * Toggles UI decluttering.
	 *
	 * @example `DCS.UIDeclutterOnOff(true);`
	 */
	UIDeclutterOnOff(enabled: boolean): void;
	/**
	 * TODO: overlay-widget positioning uses a private UI payload not defined in installed scripts.
	 */
	UIRequestOverlayWidgetPosition(...arguments_: unknown[]): unknown;

	/**
	 * Activates a mission group by mission identifier.
	 *
	 * @example `DCS.activateGroup(groupId);`
	 */
	activateGroup(groupId: number): void;
	/**
	 * Opens the Steam store overlay for a product.
	 *
	 * @example `DCS.activateSteamOverlayToStore(productId);`
	 */
	activateSteamOverlayToStore(productId: string): void;
	/**
	 * TODO: dynamic-group mission payload is version-dependent; use mission scripting `coalition.addGroup` where possible.
	 */
	add_dyn_group(definition: unknown): unknown;
	/**
	 * TODO: dynamic-spawn conflict result schema is native and version-dependent.
	 */
	checkMultiplayerSpawnConflict(definition: unknown): unknown;
	/**
	 * Returns conquest-mode coalition scores. TODO: score table keys vary with game mode.
	 */
	conquestCoalitionsScore(): Record<string, number>;
	/**
	 * TODO: client-aircraft creation payload is native and version-dependent.
	 */
	create_client_aircraft(...arguments_: unknown[]): unknown;
	/**
	 * Dispatches an analog input action.
	 *
	 * @param actionId Native input action identifier.
	 * @param value Normalized analog value.
	 */
	dispatchAnalogAction(actionId: number, value: number): void;
	/**
	 * Dispatches a digital input action.
	 *
	 * @param actionId Native input action identifier.
	 * @param value Press/release state.
	 */
	dispatchDigitalAction(actionId: number, value: boolean | number): void;
	/**
	 * TODO: dynamic-group entry payload is a private multiplayer UI contract.
	 */
	enter_with_dyngroup(...arguments_: unknown[]): unknown;
	/**
	 * Enumerates mission-persistence records through a native callback.
	 *
	 * @param visitor Called for every record, as a plain Lua function (no `self`).
	 */
	enumMissionPersistenceData(
		visitor: (this: void, record: unknown) => void,
	): void;
	/**
	 * Exports current mission data to a `.miz` file.
	 *
	 * @example `DCS.exportToMiz(fileName);`
	 */
	exportToMiz(fileName: string): boolean | undefined;

	/**
	 * Returns ATC radio metadata. Its nested fields are theatre-defined.
	 */
	getATCradiosData(): unknown[];
	/**
	 * Returns UI metadata for achievements.
	 */
	getAchievementsUiInfo(): unknown;
	/**
	 * Returns the active tanker object identifier, or nothing.
	 */
	getAirTankerID(): number | undefined;
	/**
	 * Returns the aircraft stock count for an airport warehouse.
	 */
	getAircraftAmountInAirportWarehouse(
		airportId: number,
		aircraftType: string,
	): number;
	/**
	 * Returns airdrome coalition assignments.
	 */
	getAirdromesCoalition(): Record<number, number>;
	/**
	 * Returns current airdrome state records.
	 */
	getAirdromesState(): Record<number, unknown>;
	/**
	 * Returns conquest-mode state for an airbase.
	 */
	getConquestAirbaseState(airbaseId: number): unknown;
	/**
	 * Returns the current camera field of view in degrees.
	 *
	 * @example `const fov = DCS.getCurrentFOV();`
	 */
	getCurrentFOV(): number;
	/**
	 * Returns the configured default field of view in degrees.
	 */
	getDefaultFOV(): number;
	/**
	 * Returns dynamic-spawn settings. Fields are version-dependent.
	 */
	getDynamicSpawnSettings(): Record<string, unknown>;
	/**
	 * Returns mission data for FARPs and carriers.
	 */
	getFarpsAndCarriersMissionData(): unknown[];
	/**
	 * Returns elapsed game duration in seconds.
	 */
	getGameDuration(): number;
	/**
	 * Returns the active game-pattern identifier.
	 */
	getGamePattern(): string | number;
	/**
	 * Returns generated mission parameters.
	 */
	getGeneratedParams(): Record<string, unknown>;
	/**
	 * Returns the human-readable input profile name for a unit.
	 */
	getHumanUnitInputName(unitId: number | string): string | undefined;
	/**
	 * Returns the input profile name for a database unit type.
	 */
	getInputNameByUnitType(unitType: string): string | undefined;
	/**
	 * Returns installed input-profile records.
	 */
	getInputProfiles(): unknown[];
	/**
	 * Returns installed theatre identifiers.
	 *
	 * @example `const theatres = DCS.getInstalledTheatres();`
	 */
	getInstalledTheatres(): string[];
	/**
	 * Returns localized strings requested by a private UI key set. TODO: request/result schema varies by UI caller.
	 */
	getLocalizedStrings(keys: unknown): unknown;
	/**
	 * Returns the selected main-pilot identifier.
	 */
	getMainPilot(): number | string | undefined;
	/**
	 * Returns the path to the installed manual for a module.
	 */
	getManualPath(moduleId: string): string | undefined;
	/**
	 * Returns the configured frame-rate cap.
	 */
	getMaxFPS(): number;
	/**
	 * Reports whether a mission has finished loading. Warning: DCS 2.9.27-2.9.29 can ACCESS_VIOLATION when this is called with a mission loaded; the verification corpus checks only export presence.
	 */
	getMissionLoaded(): boolean;
	/**
	 * Returns one mission-persistence record. TODO: key/value schemas are mission-defined.
	 */
	getMissionPersistenceData(key: string): unknown;
	/**
	 * Returns the mission-resource dialog model.
	 */
	getMissionResourcesDialogData(): unknown;
	/**
	 * Returns the active mission theatre identifier.
	 */
	getMissionTheatre(): string;
	/**
	 * Returns a model name for a shape-table index.
	 */
	getModelNameByShapeTableIndex(index: number): string | undefined;
	/**
	 * Returns moon azimuth, elevation, and phase for a date/time. TODO: date parameter is an engine-native table.
	 */
	getMoonAzimuthElevationPhase(
		date: unknown,
	): LuaMultiReturn<[number, number, number]>;
	/**
	 * Returns livery names available to an object type.
	 */
	getObjectLiveriesNames(typeName: string): string[];
	/**
	 * Returns pilot-achievement records.
	 */
	getPilotAchievements(): unknown[];
	/**
	 * Returns statistics for one pilot.
	 */
	getPilotStatistics(pilotId?: string | number): unknown;
	/**
	 * Returns summary statistics for all pilots.
	 */
	getPilotsSummaryStatistics(): unknown[];
	/**
	 * Returns the translated player briefing.
	 */
	getPlayerBriefing(): string;
	/**
	 * Returns the selected player's coalition.
	 */
	getPlayerCoalition(): number;
	/**
	 * Returns the selected player unit mission identifier.
	 */
	getPlayerUnit(): number | string | undefined;
	/**
	 * Returns the selected player unit's database type.
	 */
	getPlayerUnitType(): string | undefined;
	/**
	 * Returns the server start time as an absolute timestamp.
	 */
	getServerStartTime(): number;
	/**
	 * Returns seconds remaining before configured server start.
	 */
	getServerStartTimeRemain(): number;
	/**
	 * Returns the simulator-mode identifier.
	 */
	getSimulatorMode(): string | number;
	/**
	 * Returns sun azimuth and elevation. TODO: date/location parameter schema is native.
	 */
	getSunAzimuthElevation(
		...arguments_: unknown[]
	): LuaMultiReturn<[number, number]>;
	/**
	 * Returns sunrise and sunset seconds for a date/location. TODO: parameter schema is native.
	 */
	getSunriseSunsetSecond(
		...arguments_: unknown[]
	): LuaMultiReturn<[number, number]>;
	/**
	 * Returns integrity-check taint categories.
	 */
	getTaintedCategories(): string[];
	/**
	 * Returns integrity-check tainted-file records.
	 */
	getTaintedFiles(): unknown[];
	/**
	 * Returns the numeric ID of the active theatre.
	 */
	getTheatreID(): number;
	/**
	 * Returns position data for a runtime object ID.
	 */
	getUnitPositionByObjectId(objectId: number): unknown;
	/**
	 * Returns current user options.
	 */
	getUserOptions(): Record<string, unknown>;

	/**
	 * Reports whether the selected unit has multiple crew slots.
	 */
	hasMultipleSlots(unitId: number | string): boolean;
	/**
	 * Reports whether a human seat is available.
	 */
	isHumanSeatAvailable(unitId: number | string, seatId?: number): boolean;
	/**
	 * Reports whether the UI is configured for metric units.
	 */
	isMetricSystem(): boolean;
	/**
	 * Reports whether a role is available for a unit. TODO: role identifier values are module-defined.
	 */
	isRoleAvailable(unitId: number | string, role: unknown): boolean;
	/**
	 * Reports whether a mission slot can be flown.
	 */
	isSlotFlyable(unitId: number | string): boolean;
	/**
	 * Reports whether this is the Steam distribution.
	 */
	isSteamVersion(): boolean;
	/**
	 * Reports whether a Supercarrier role is available. TODO: role identifier values are module-defined.
	 */
	isSupercarrierRoleAvailable(unitId: number | string, role: unknown): boolean;
	/**
	 * Reports whether DCS is currently replaying a track.
	 */
	isTrackPlaying(): boolean;

	/**
	 * Locks all keyboard input from the simulation UI. Pair with `unlockKeyboardInput`.
	 */
	lockAllKeyboardInput(): void;
	/**
	 * Locks all mouse input from the simulation UI. Pair with `unlockMouseInput`.
	 */
	lockAllMouseInput(): void;
	/**
	 * Locks one keyboard input. TODO: native key descriptor schema is UI-internal.
	 */
	lockKeyboardInput(key: unknown): void;
	/**
	 * Locks one mouse input. TODO: native button descriptor schema is UI-internal.
	 */
	lockMouseInput(button: unknown): void;
	/**
	 * Releases keyboard-input locks.
	 */
	unlockKeyboardInput(): void;
	/**
	 * Releases mouse-input locks.
	 */
	unlockMouseInput(): void;
	/**
	 * Notifies DCS that a dialog's visibility changed. TODO: dialog identifiers are private UI values.
	 */
	onShowDialog(...arguments_: unknown[]): unknown;
	/**
	 * Notifies DCS that status-bar visibility changed.
	 */
	onShowStatusBar(visible: boolean): void;
	/**
	 * Notifies UI scripts of user login. TODO: login payload schema is private.
	 */
	onUserLogin(...arguments_: unknown[]): unknown;
	/**
	 * Opens DCS's configured home page in the system browser.
	 */
	openHomePage(): void;

	/**
	 * Preloads a cockpit by database unit type.
	 */
	preloadCockpit(unitType: string): boolean | undefined;
	/**
	 * Recomputes pilot statistics.
	 */
	refreshPilotStatistics(): void;
	/**
	 * Reloads user option files.
	 */
	reloadOptions(): void;
	/**
	 * Reloads hook/user scripts.
	 *
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md
	 */
	reloadUserScripts(): void;
	/**
	 * Restarts the current mission.
	 */
	restartMission(): void;
	/**
	 * Saves the active mission to a `.miz` path.
	 */
	saveMissionTo(fileName: string): boolean | undefined;
	/**
	 * Self-kills the active player pilot.
	 */
	selfKillPilot(): void;
	/**
	 * TODO: radio-command-dialog callback payload is UI-private.
	 */
	sendRCD_Callback(...arguments_: unknown[]): unknown;
	/**
	 * Sets the board number in the mission-resource dialog model.
	 */
	setBoardNumResourcesDialogData(boardNumber: string | number): void;
	/**
	 * Moves the camera to an airdrome identifier.
	 */
	setCameraToAirdrome(airdromeId: number): void;
	/**
	 * Sets the current camera field of view in degrees.
	 */
	setCurrentFOV(fieldOfView: number): void;
	/**
	 * Controls whether the debriefing UI is shown.
	 */
	setDebriefingShow(visible: boolean): void;
	/**
	 * Sets the default camera field of view in degrees.
	 */
	setDefaultFOV(fieldOfView: number): void;
	/**
	 * Sets the livery name in the mission-resource dialog model.
	 */
	setLiveryNameResourcesDialogData(liveryName: string): void;
	/**
	 * Selects the main pilot identifier.
	 */
	setMainPilot(pilotId: number | string): void;
	/**
	 * Sets the frame-rate cap.
	 */
	setMaxFPS(framesPerSecond: number): void;
	/**
	 * Replaces mission-resource dialog data. TODO: UI model schema is version-dependent.
	 */
	setMissionResourcesDialogData(data: unknown): void;
	/**
	 * Sets the application-restart-required flag.
	 */
	setNeedRestartApplication(required: boolean): void;
	/**
	 * Sets the selected player's coalition.
	 */
	setPlayerCoalition(coalitionId: number): void;
	/**
	 * Sets the selected player unit.
	 */
	setPlayerUnit(unitId: number | string): void;
	/**
	 * Changes the screenshot file extension.
	 */
	setScreenShotExt(extension: string): void;
	/**
	 * Pauses or resumes external view motion.
	 */
	setViewPause(paused: boolean): void;
	/**
	 * Enables the rearming view. TODO: native view payload is UI-private.
	 */
	setViewRearm(...arguments_: unknown[]): unknown;
	/**
	 * Sets rearming-view animation time in seconds.
	 */
	setViewRearmAnimationTime(seconds: number): void;
	/**
	 * Sets rearming-view position mode.
	 */
	setViewRearmPositionType(positionType: number): void;
	/**
	 * Disables the rearming view.
	 */
	unsetViewRearm(): void;
	/**
	 * Spawns the selected player. TODO: dynamic-spawn payload is version-dependent.
	 */
	spawnPlayer(...arguments_: unknown[]): unknown;
	/**
	 * Starts a mission file.
	 */
	startMission(fileName: string): boolean | undefined;
	/**
	 * Takes interactive control during track replay.
	 */
	takeTrackControl(): void;
	/**
	 * Toggles the data-transfer-cartridge UI.
	 */
	toggleDTC(): void;
	/**
	 * Runs an updater operation. TODO: updater operation names/options are private and version-dependent.
	 */
	updaterOperation(operation: string, ...arguments_: unknown[]): unknown;
}
