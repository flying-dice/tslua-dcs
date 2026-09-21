import type { _Export } from "./exports/Export.export";

/**
 * Three-dimensional vector used by the DCS export environment.
 */
export interface ExportVec3 {
	x: number;
	y: number;
	z: number;
}

/**
 * World position and orientation returned by export functions.
 */
export interface ExportPosition {
	/**
	 * Forward orientation vector.
	 */
	x: ExportVec3;
	/**
	 * Up orientation vector.
	 */
	y: ExportVec3;
	/**
	 * Right orientation vector.
	 */
	z: ExportVec3;
	/**
	 * Position in metres.
	 */
	p: ExportVec3;
}

/**
 * Camera request accepted by the force-camera export functions.
 */
export interface ExportCameraRequest {
	/**
	 * DCS camera mode, such as `CameraCockpit` or `CameraFree`.
	 */
	name: string;
	/**
	 * Runtime object ID; for `CameraFree`, this is the padlock object.
	 */
	id: number;
	/**
	 * Camera transform. Ignored by `LoForceCamera` when `valid_pos` is false.
	 */
	pos: ExportPosition;
	/**
	 * Field of view in degrees; `-1` tells DCS not to change it.
	 */
	fov: number;
	/**
	 * Whether `LoForceCamera` should apply `pos`.
	 */
	valid_pos: boolean;
}

/**
 * A user-defined external-view camera bookmark.
 */
export interface ExportCameraBookmark {
	name: string;
	pos: ExportPosition;
	fov: number;
}

/**
 * Multiplayer player identity exposed to the camera export API.
 */
export interface ExportPlayer {
	host_id: number;
	name: string;
}

/**
 * Four-level identifier from `Scripts/database/wsTypes.lua`.
 */
export interface ExportTypeId {
	level1: number;
	level2: number;
	level3: number;
	level4: number;
}

export interface ExportLatLongAlt {
	Lat: number;
	Long: number;
	Alt: number;
}

export interface ExportObjectFlags {
	RadarActive: boolean;
	Human: boolean;
	Jamming: boolean;
	IRJamming: boolean;
	Born: boolean;
	AI_ON: boolean;
	Invisible: boolean;
	Static: boolean;
}

/**
 * Object record returned by `LoGetObjectById` and `LoGetWorldObjects`.
 */
export interface ExportObject {
	Name: string;
	Type: ExportTypeId;
	Country: number;
	Coalition: string;
	CoalitionID: number;
	LatLongAlt: ExportLatLongAlt;
	Heading: number;
	Pitch: number;
	Bank: number;
	Position: ExportVec3;
	UnitName?: string;
	GroupName?: string;
	Flags: ExportObjectFlags;
}

export interface ExportHSI {
	ADF_raw: number;
	RMI_raw: number;
	Heading_raw: number;
	HeadingPointer: number;
	Course: number;
	BearingPointer: number;
	CourseDeviation: number;
}

export interface ExportEnginePair {
	left: number;
	right: number;
}

export interface ExportEngineInfo {
	RPM: ExportEnginePair;
	Temperature: ExportEnginePair;
	HydraulicPressure: ExportEnginePair;
	FuelConsumption: ExportEnginePair;
	fuel_internal: number;
	fuel_external: number;
}

export interface ExportWaypoint {
	this_point_num: number;
	world_point: ExportVec3;
	speed_req: number;
	estimated_time: number;
	next_point_num: number;
	point_action: string;
}

export interface ExportRoute {
	goto_point: ExportWaypoint;
	route: ExportWaypoint[];
}

export interface ExportNavigationInfo {
	SystemMode: { master: string; submode: string };
	Requirements: {
		roll: number;
		pitch: number;
		speed: number;
		vertical_speed: number;
		altitude: number;
	};
	ACS: { mode: string; autothrust: number };
}

export interface ExportTarget {
	ID: number;
	type: ExportTypeId;
	country: number;
	position: ExportPosition;
	velocity: ExportVec3;
	distance: number;
	convergence_velocity: number;
	mach: number;
	delta_psi: number;
	fim: number;
	fin: number;
	flags: number;
	reflection: number;
	course: number;
	isjamming: boolean;
	start_of_lock: number;
	forces: ExportVec3;
	updates_number: number;
	jammer_burned: boolean;
}

export interface ExportEmitter {
	ID: number;
	Type: ExportTypeId;
	Power: number;
	Azimuth: number;
	Priority: number;
	SignalType:
		| "scan"
		| "lock"
		| "missile_radio_guided"
		| "track_while_scan"
		| string;
}

export interface ExportTWSInfo {
	Mode: 0 | 1 | 2;
	Emitters: ExportEmitter[];
}

export interface ExportPayloadStation {
	container: boolean;
	weapon: ExportTypeId;
	count: number;
}

export interface ExportPayloadInfo {
	CurrentStation: number;
	Stations: ExportPayloadStation[];
	Cannon: { shells: number };
}

export interface ExportMechanismState {
	status: number;
	value: number;
}

export interface ExportMechanizationInfo {
	gear: ExportMechanismState & {
		main: {
			left: { rod: number };
			right: { rod: number };
			nose: { rod: number };
		};
	};
	flaps: ExportMechanismState;
	speedbrakes: ExportMechanismState;
	refuelingboom: ExportMechanismState;
	airintake: ExportMechanismState;
	noseflap: ExportMechanismState;
	parachute: ExportMechanismState;
	wheelbrakes: ExportMechanismState;
	hook: ExportMechanismState;
	wing: ExportMechanismState;
	canopy: ExportMechanismState;
	controlsurfaces: {
		elevator: ExportEnginePair;
		eleron: ExportEnginePair;
		rudder: ExportEnginePair;
	};
}

export interface ExportRadioBeaconsStatus {
	airfield_near: boolean;
	airfield_far: boolean;
	course_deviation_beacon_lock: boolean;
	glideslope_deviation_beacon_lock: boolean;
}

export interface ExportWingmanInfo {
	wingmen_id: number;
	wingmen_position: ExportPosition;
	current_target: number;
	ordered_target: number;
	current_task: string;
	ordered_task: string;
}

export interface ExportSnares {
	chaff: number;
	flare: number;
}

export interface ExportVersionInfo {
	ProductName: string;
	FileVersion: [number, number, number, number];
	ProductVersion: [number, number, number, number];
}

export interface ExportHelicopterFMData {
	G_factor: ExportVec3;
	speed: ExportVec3;
	acceleration: ExportVec3;
	angular_speed: ExportVec3;
	angular_acceleration: ExportVec3;
	yaw: number;
	pitch: number;
	roll: number;
}

/**
 * Device objects are module-specific; known methods and fields vary by cockpit.
 */
export interface ExportCockpitDevice {
	[key: string]: unknown;
}

/**
 * Indicator objects are module-specific and may expose viewport helpers.
 */
export interface ExportIndicator {
	/**
	 * Assigns this indicator to a dedicated viewport rectangle.
	 *
	 * This optional callback is supplied only by indicators that support
	 * rendering into an exported viewport.
	 *
	 * @param x Left edge of the viewport in pixels.
	 * @param y Top edge of the viewport in pixels.
	 * @param width Viewport width in pixels.
	 * @param height Viewport height in pixels.
	 * @returns Nothing.
	 * @example
	 * ```ts
	 * indicator.assign_dedicated_viewport?.(0, 0, 512, 512);
	 * ```
	 */
	assign_dedicated_viewport?(
		x: number,
		y: number,
		width: number,
		height: number,
	): void;
	[key: string]: unknown;
}

export interface ExportClickableElement {
	name?: string;
	device_id?: number;
	command?: number;
	[key: string]: unknown;
}

/**
 * Geographic coordinates returned by the DCS Export API.
 */
export interface ExportGeoCoordinates {
	/**
	 * Latitude in decimal degrees.
	 */
	latitude: number;
	/**
	 * Longitude in decimal degrees.
	 */
	longitude: number;
}

/**
 * Global functions available to DCS `Export.lua` scripts.
 *
 * @remarks Export availability functions reflect the server's anti-cheat/export
 * settings. Ownship and sensor functions can also return `undefined` when there
 * is no player aircraft or supported cockpit device. Experimental functions can
 * change between DCS releases.
 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:500
 * @version 2.9.29.27468
 * @noSelf
 */
export interface l_Export extends _Export {
	/**
	 * Creates a force-camera request from the current camera.
	 *
	 * @returns Current camera request, or `undefined` when no camera/player context is available.
	 * @example `const request = Export.LoCreateCameraRequest(); if (request) Export.LoForceCamera(request);`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:238
	 */
	LoCreateCameraRequest(): ExportCameraRequest | undefined;

	/**
	 * Applies a force-camera request locally.
	 *
	 * @param request Camera mode, target and optional transform.
	 * @returns Nothing.
	 * @example `const request = Export.LoCreateCameraRequest(); if (request) Export.LoForceCamera(request);`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:243
	 */
	LoForceCamera(request: ExportCameraRequest): void;

	/**
	 * Returns camera bookmarks for the current camera and unit type.
	 *
	 * @returns Bookmarks, or `undefined` when the camera has none.
	 * @example `const bookmarks = Export.LoGetUserBookmarks() ?? [];`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:269
	 */
	LoGetUserBookmarks(): ExportCameraBookmark[] | undefined;

	/**
	 * Creates a force-camera request for a named user bookmark.
	 *
	 * @param name Bookmark name returned by `LoGetUserBookmarks`.
	 * @returns Camera request, or `undefined` when the bookmark is absent.
	 * @example `const request = Export.LoCreateUserBookmarkRequest("Overhead");`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:293
	 */
	LoCreateUserBookmarkRequest(name: string): ExportCameraRequest | undefined;

	/**
	 * Returns the local multiplayer player's host ID and name.
	 *
	 * @returns Local player identity, or `undefined` outside multiplayer.
	 * @example `const localPlayer = Export.LoGetLocalPlayer();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:346
	 */
	LoGetLocalPlayer(): ExportPlayer | undefined;

	/**
	 * Returns all connected multiplayer players.
	 *
	 * @returns Player identities, or `undefined` outside multiplayer.
	 * @example `const players = Export.LoGetPlayers() ?? [];`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:347
	 */
	LoGetPlayers(): ExportPlayer[] | undefined;

	/**
	 * Enables or disables processing remote force-camera requests locally. It is disabled by default.
	 *
	 * @param allowed Whether remote requests may control this client's camera.
	 * @returns Nothing.
	 * @example `Export.LoSetAllowRemoteForceCameraRequests(true);`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:348
	 */
	LoSetAllowRemoteForceCameraRequests(allowed: boolean): void;

	/**
	 * Sends a force-camera request to another host, or to every other host when `hostId` is zero.
	 *
	 * @param hostId Destination multiplayer host ID; use `0` to broadcast.
	 * @param request Camera request to send.
	 * @returns Nothing.
	 * @example `Export.LoSendForceCamera(0, Export.LoCreateCameraRequest());`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:349
	 */
	LoSendForceCamera(hostId: number, request: ExportCameraRequest): void;
	/**
	 * Reports whether world-object export is permitted.
	 *
	 * @returns `true` when object data may be read.
	 * @example `if (LoIsObjectExportAllowed()) objects = LoGetWorldObjects();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:429
	 */
	LoIsObjectExportAllowed(): boolean;

	/**
	 * Returns body-axis acceleration in G units.
	 *
	 * @returns `{x, y, z}` acceleration, or `undefined` without ownship data.
	 * @example `const loadFactor = LoGetAccelerationUnits()?.y;`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:442
	 */
	LoGetAccelerationUnits(): ExportVec3 | undefined;

	/**
	 * Reads one exported object.
	 *
	 * @param objectId Runtime world-object ID.
	 * @returns Object data, or `undefined` when unavailable.
	 * @example `const object = LoGetObjectById(LoGetPlayerPlaneId());`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:595
	 */
	LoGetObjectById(objectId: number): ExportObject | undefined;

	/**
	 * Returns the view camera transform.
	 *
	 * @returns Camera position/orientation in metres.
	 * @example `const altitude = LoGetCameraPosition().p.y;`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:635
	 */
	LoGetCameraPosition(): ExportPosition;

	/**
	 * Returns ownship Mach number.
	 *
	 * @returns Mach number, or `undefined` without ownship data.
	 * @example `const mach = LoGetMachNumber();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:444
	 */
	LoGetMachNumber(): number | undefined;

	/**
	 * Returns aircraft-dependent navigation and ACS state.
	 *
	 * @returns Navigation data, or `undefined` when unsupported.
	 * @example `const mode = LoGetNavigationInfo()?.SystemMode.master;`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:489
	 */
	LoGetNavigationInfo(): ExportNavigationInfo | undefined;

	/**
	 * Returns HSI bearings, heading, course, and deviation in radians.
	 *
	 * @returns Current HSI state, or `undefined` without supported ownship data.
	 * @example `const course = LoGetControlPanel_HSI()?.Course;`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:451
	 */
	LoGetControlPanel_HSI(): ExportHSI | undefined;

	/**
	 * Returns normalized slip-ball position from `-1` to `1`.
	 *
	 * @returns Slip value, or `undefined` without ownship data.
	 * @example `const slip = LoGetSlipBallPosition();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:449
	 */
	LoGetSlipBallPosition(): number | undefined;

	/**
	 * Reports whether active-pause mode is enabled.
	 *
	 * @returns Active-pause state.
	 * @example `const activePause = LoSimulationOnActivePause();`
	 */
	LoSimulationOnActivePause(): boolean;

	/**
	 * Returns ADI pitch, bank, and yaw in radians. Without ownship data each value is `undefined`.
	 *
	 * @returns Three Lua values.
	 * @example `const [pitch, bank, yaw] = LoGetADIPitchBankYaw();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:445
	 */
	LoGetADIPitchBankYaw(): LuaMultiReturn<
		[number | undefined, number | undefined, number | undefined]
	>;

	/**
	 * Returns engine, hydraulics, fuel-flow, and fuel data.
	 *
	 * @returns Current engine information, or `undefined` without ownship data.
	 * @example `const leftRpm = LoGetEngineInfo()?.RPM.left;`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:462
	 */
	LoGetEngineInfo(): ExportEngineInfo | undefined;

	/**
	 * Returns the player's display name.
	 *
	 * @returns Pilot name, or `undefined` without a player.
	 * @example `const pilot = LoGetPilotName();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:435
	 */
	LoGetPilotName(): string | undefined;

	/**
	 * Returns ownship sideslip angle in radians.
	 *
	 * @returns Sideslip angle, or `undefined` without ownship data.
	 * @example `const beta = LoGetAngleOfSideSlip();`
	 */
	LoGetAngleOfSideSlip(): number | undefined;

	/**
	 * Returns legacy F-15 TWS contacts. DCS publishes no stable record schema.
	 *
	 * @returns Contact records, or `undefined` when unsupported.
	 * @example `const contacts = LoGetF15_TWS_Contacts() ?? [];`
	 */
	LoGetF15_TWS_Contacts(): unknown[] | undefined;

	/**
	 * Returns ownship using the object-export schema regardless of world-object export settings.
	 *
	 * @returns Ownship, or `undefined` without a player aircraft.
	 * @example `const ownshipName = Export.LoGetSelfData()?.Name;`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:631
	 */
	LoGetSelfData(): ExportObject | undefined;

	/**
	 * Returns mission start time in seconds.
	 *
	 * @returns Start time.
	 * @example `const start = LoGetMissionStartTime();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:434
	 */
	LoGetMissionStartTime(): number;

	/**
	 * Returns vertical velocity in metres per second.
	 *
	 * @returns Climb/descent rate, or `undefined` without ownship data.
	 * @example `const climbRate = LoGetVerticalVelocity();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:443
	 */
	LoGetVerticalVelocity(): number | undefined;

	/**
	 * Converts longitude/latitude to local DCS coordinates.
	 *
	 * @param longitude Decimal degrees.
	 * @param latitude Decimal degrees.
	 * @returns Local point in metres.
	 * @example `const point = LoGeoCoordinatesToLoCoordinates(41.5997, 41.6103);`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:835
	 */
	LoGeoCoordinatesToLoCoordinates(
		longitude: number,
		latitude: number,
	): ExportVec3;

	/**
	 * Returns target positions assigned to wingmen.
	 *
	 * @returns World-space points, or `undefined` without sensor data.
	 * @example `const targets = LoGetWingTargets() ?? [];`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:841
	 */
	LoGetWingTargets(): ExportVec3[] | undefined;

	/**
	 * Returns contacts detected by the targeting system.
	 *
	 * @returns Current target records, or `undefined` without sensor data.
	 * @example `const targets = Export.LoGetTargetInformation() ?? [];`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:647
	 */
	LoGetTargetInformation(): ExportTarget[] | undefined;

	/**
	 * Returns threat-warning mode and emitters.
	 *
	 * @returns Current TWS state, or `undefined` without sensor data.
	 * @example `const threats = Export.LoGetTWSInfo()?.Emitters ?? [];`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:735
	 */
	LoGetTWSInfo(): ExportTWSInfo | undefined;

	/**
	 * Returns radar-altimeter height in metres.
	 *
	 * @returns Radar altitude, or `undefined` without ownship data.
	 * @example `const height = LoGetRadarAltimeter();`
	 */
	LoGetRadarAltimeter(): number | undefined;

	/**
	 * Returns gear, flaps, canopy, and control-surface state.
	 *
	 * @returns Mechanization state, or `undefined` without ownship data.
	 * @example `const gear = LoGetMechInfo()?.gear.value;`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:766
	 */
	LoGetMechInfo(): ExportMechanizationInfo | undefined;

	/**
	 * Returns angular velocity in radians per second.
	 *
	 * @returns Body angular rates, or `undefined` without ownship data.
	 * @example `const rates = LoGetAngularVelocity();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:839
	 */
	LoGetAngularVelocity(): ExportVec3 | undefined;

	/**
	 * Returns normalized lateral deviation from `-1` to `1`.
	 *
	 * @returns Deviation, or `undefined` without ownship data.
	 * @example `const deviation = LoGetSideDeviation();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:448
	 */
	LoGetSideDeviation(): number | undefined;

	/**
	 * Reports whether sensor/target export is permitted.
	 *
	 * @returns Permission state.
	 * @example `if (LoIsSensorExportAllowed()) inspectTargets();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:430
	 */
	LoIsSensorExportAllowed(): boolean;

	/**
	 * Returns indicated airspeed in metres per second.
	 *
	 * @returns IAS, or `undefined` without ownship data.
	 * @example `const ias = LoGetIndicatedAirSpeed();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:437
	 */
	LoGetIndicatedAirSpeed(): number | undefined;

	/**
	 * Returns main-control-panel warning/failure flags.
	 *
	 * @returns Boolean map keyed by DCS flag name, or `undefined` without ownship data.
	 * @example `const warning = LoGetMCPState()?.MasterWarning;`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:565
	 */
	LoGetMCPState(): Record<string, boolean> | undefined;

	/**
	 * Reports whether simulation is paused.
	 *
	 * @returns Pause state.
	 * @example `const paused = LoSimulationOnPause();`
	 */
	LoSimulationOnPause(): boolean;

	/**
	 * Returns targets currently locked by ownship.
	 *
	 * @returns Locked-target records, or `undefined` without sensor data.
	 * @example `const primary = Export.LoGetLockedTargetInformation()?.[0];`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:648
	 */
	LoGetLockedTargetInformation(): ExportTarget[] | undefined;

	/**
	 * Sends an input command. Analog values normally range from `-1` to `1`; discrete commands omit `value`.
	 *
	 * @param command DCS command number.
	 * @param value Optional analog value.
	 * @returns Nothing.
	 * @example `LoSetCommand(2001, 0.25);`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:854
	 */
	LoSetCommand(command: number, value?: number): void;

	/**
	 * Returns barometric altitude above sea level in metres.
	 *
	 * @returns ASL altitude, or `undefined` without ownship data.
	 * @example `const altitude = LoGetAltitudeAboveSeaLevel();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:439
	 */
	LoGetAltitudeAboveSeaLevel(): number | undefined;

	/**
	 * Returns surface height including world objects. The function can be unavailable outside a supported simulation context.
	 *
	 * @param x Local northing in metres.
	 * @param z Local easting in metres.
	 * @returns Surface height, or `undefined` when unavailable.
	 * @example `const surface = Export.LoGetHeightWithObjects(point.x, point.z) ?? Export.LoGetAltitude(point.x, point.z);`
	 */
	LoGetHeightWithObjects(x: number, z: number): number | undefined;

	/**
	 * Reports whether ownship is airborne.
	 *
	 * @returns In-air state.
	 * @example `const airborne = LoGetInAir();`
	 */
	LoGetInAir(): boolean;

	/**
	 * Sets the view camera transform.
	 *
	 * @param position Desired camera transform.
	 * @returns Nothing.
	 * @example `LoSetCameraPosition(LoGetCameraPosition());`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:844
	 */
	LoSetCameraPosition(position: ExportPosition): void;

	/**
	 * Returns the player's runtime plane ID.
	 *
	 * @returns Object ID, or `undefined` without a player aircraft.
	 * @example `const id = LoGetPlayerPlaneId();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:436
	 */
	LoGetPlayerPlaneId(): number | undefined;

	/**
	 * Returns the current route and next waypoint.
	 *
	 * @returns Route, or `undefined` when unavailable.
	 * @example `const next = LoGetRoute()?.goto_point;`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:474
	 */
	LoGetRoute(): ExportRoute | undefined;

	/**
	 * Returns cockpit/camera shake amplitude.
	 *
	 * @returns Shake amplitude, or `undefined` without ownship data.
	 * @example `const shake = LoGetShakeAmplitude();`
	 */
	LoGetShakeAmplitude(): number | undefined;

	/**
	 * Returns angle of attack in radians.
	 *
	 * @returns AOA, or `undefined` without ownship data.
	 * @example `const alpha = LoGetAngleOfAttack();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:441
	 */
	LoGetAngleOfAttack(): number | undefined;

	/**
	 * Returns ownship wind velocity in world axes, metres per second.
	 *
	 * @returns Wind vector, or `undefined` without ownship data.
	 * @example `const wind = LoGetVectorWindVelocity();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:840
	 */
	LoGetVectorWindVelocity(): ExportVec3 | undefined;

	/**
	 * Returns simulation model time in seconds.
	 *
	 * @returns Model time.
	 * @example `const now = LoGetModelTime();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:433
	 */
	LoGetModelTime(): number;

	/**
	 * Returns a module-specific cockpit indicator.
	 *
	 * @param indicatorId Indicator ID.
	 * @returns Indicator, or `undefined`.
	 * @example `const mfd = GetIndicator(1);`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:62
	 */
	GetIndicator(indicatorId: number): ExportIndicator | undefined;

	/**
	 * Returns normalized glideslope deviation from `-1` to `1`.
	 *
	 * @returns Deviation, or `undefined` without ownship data.
	 * @example `const glide = LoGetGlideDeviation();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:447
	 */
	LoGetGlideDeviation(): number | undefined;

	/**
	 * Returns magnetic heading in radians.
	 *
	 * @returns Heading, or `undefined` without ownship data.
	 * @example `const heading = LoGetMagneticYaw();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:446
	 */
	LoGetMagneticYaw(): number | undefined;

	/**
	 * Returns basic atmospheric pressure in mmHg.
	 *
	 * @returns Pressure, or `undefined` without ownship data.
	 * @example `const pressure = LoGetBasicAtmospherePressure();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:450
	 */
	LoGetBasicAtmospherePressure(): number | undefined;

	/**
	 * Returns radio-navigation beacon locks.
	 *
	 * @returns Beacon status, or `undefined` without ownship data.
	 * @example `const ils = LoGetRadioBeaconsStatus();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:783
	 */
	LoGetRadioBeaconsStatus(): ExportRadioBeaconsStatus | undefined;

	/**
	 * Returns the player's unit ID.
	 *
	 * @returns Numeric unit ID, or `undefined` without a player unit.
	 * @example `const id = Export.LoGetPlayerUnitId();`
	 */
	LoGetPlayerUnitId(): number | undefined;

	/**
	 * Returns remaining chaff and flares.
	 *
	 * @returns Countermeasure counts, or `undefined` without ownship data.
	 * @example `const flares = LoGetSnares()?.flare;`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:842
	 */
	LoGetSnares(): ExportSnares | undefined;

	/**
	 * Returns selected station, station stores, and cannon rounds.
	 *
	 * @returns Payload, or `undefined`.
	 * @example `const rounds = Export.LoGetPayloadInfo()?.Cannon.shells;`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:750
	 */
	LoGetPayloadInfo(): ExportPayloadInfo | undefined;

	/**
	 * Returns wingman positions, targets, and tasks.
	 *
	 * @returns Wingman records, or `undefined` without ownship data.
	 * @example `const wingmen = LoGetWingInfo() ?? [];`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:791
	 */
	LoGetWingInfo(): ExportWingmanInfo[] | undefined;

	/**
	 * Returns world objects keyed by runtime ID.
	 *
	 * @param category Object set; defaults to `"units"`.
	 * @returns Exported objects.
	 * @example `const bases = LoGetWorldObjects("airdromes");`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:624
	 */
	LoGetWorldObjects(
		category?: "units" | "ballistic" | "airdromes",
	): Record<number, ExportObject>;

	/**
	 * Returns the wind vector and absolute terrain height at a world point.
	 *
	 * DCS returns four Lua numbers rather than an `ExportVec3` table. Set
	 * `isRadioAltitude` when `y` is height above the terrain instead of height
	 * above sea level.
	 *
	 * @param x North/south local coordinate in metres.
	 * @param y Height in metres, interpreted according to `isRadioAltitude`.
	 * @param z East/west local coordinate in metres.
	 * @param isRadioAltitude Whether `y` is height above terrain. Defaults to false.
	 * @returns Wind velocity components `x`, `y`, and `z` in metres per second,
	 * followed by absolute terrain height in metres.
	 * @example
	 * ```ts
	 * const [windX, windY, windZ, terrainHeight] = Export.LoGetWindAtPoint(
	 * 	0,
	 * 	1000,
	 * 	0,
	 * 	false,
	 * );
	 * ```
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:562
	 * @see https://forum.dcs.world/topic/165136-logetwindatpoint-in-exportlua/
	 * @see https://wiki.hoggitworld.com/view/DCS_Export_Script
	 */
	LoGetWindAtPoint(
		x: number,
		y: number,
		z: number,
		isRadioAltitude?: boolean,
	): LuaMultiReturn<[number, number, number, number]>;

	/**
	 * Returns aircraft-specific fixed-wing flight-model data. DCS publishes no stable schema.
	 *
	 * @returns FM table, or `undefined`.
	 * @example `const fm = LoGetFMData();`
	 */
	LoGetFMData(): Record<string, unknown> | undefined;

	/**
	 * Returns DCS product and four-part versions.
	 *
	 * @returns Version data.
	 * @example `const version = LoGetVersionInfo().ProductVersion;`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:34
	 */
	LoGetVersionInfo(): ExportVersionInfo;

	/**
	 * Returns altitude above ground in metres.
	 *
	 * @returns AGL altitude, or `undefined` without ownship data.
	 * @example `const agl = LoGetAltitudeAboveGroundLevel();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:440
	 */
	LoGetAltitudeAboveGroundLevel(): number | undefined;

	/**
	 * Returns a normalized external-model draw argument.
	 *
	 * @param argument Argument index.
	 * @returns Current value.
	 * @example `const value = LoGetAircraftDrawArgumentValue(0);`
	 */
	LoGetAircraftDrawArgumentValue(argument: number): number;

	/**
	 * Returns helicopter FM vectors and attitude.
	 *
	 * @returns FM data, or `undefined` when unsupported.
	 * @example `const pitch = LoGetHelicopterFMData()?.pitch;`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:1225
	 */
	LoGetHelicopterFMData(): ExportHelicopterFMData | undefined;

	/**
	 * Returns true airspeed in metres per second.
	 *
	 * @returns TAS, or `undefined` without ownship data.
	 * @example `const tas = LoGetTrueAirSpeed();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:438
	 */
	LoGetTrueAirSpeed(): number | undefined;

	/**
	 * Reports whether ownship export is permitted.
	 *
	 * @returns Permission state.
	 * @example `const allowed = LoIsOwnshipExportAllowed();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:431
	 */
	LoIsOwnshipExportAllowed(): boolean;

	/**
	 * Converts local X/Z coordinates to latitude/longitude. DCS returns one table, not multiple Lua values.
	 *
	 * @param x Local northing.
	 * @param z Local easting.
	 * @returns Geographic coordinate record.
	 * @example `const { latitude, longitude } = Export.LoLoCoordinatesToGeoCoordinates(point.x, point.z);`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:836
	 */
	LoLoCoordinatesToGeoCoordinates(x: number, z: number): ExportGeoCoordinates;

	/**
	 * Returns ownship world-axis velocity in metres per second.
	 *
	 * @returns Velocity, or `undefined` without ownship data.
	 * @example `const velocity = LoGetVectorVelocity();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:838
	 */
	LoGetVectorVelocity(): ExportVec3 | undefined;

	/**
	 * Returns aircraft-dependent radar/optical sight state. DCS publishes no stable cross-module schema.
	 *
	 * @returns Sight table, or `undefined`.
	 * @example `const sight = LoGetSightingSystemInfo();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:686
	 */
	LoGetSightingSystemInfo(): Record<string, unknown> | undefined;

	/**
	 * Returns module-defined clickable cockpit elements.
	 *
	 * @returns Elements keyed by name, or `undefined` without a supported cockpit.
	 * @example `const elements = GetClickableElements() ?? {};`
	 */
	GetClickableElements(): Record<string, ExportClickableElement> | undefined;

	/**
	 * Returns a module-specific cockpit device.
	 *
	 * @param deviceId Device ID.
	 * @returns Device, or `undefined`.
	 * @example `const device = GetDevice(0);`
	 */
	GetDevice(deviceId: number): ExportCockpitDevice | undefined;

	/**
	 * Returns terrain altitude at local X/Z coordinates.
	 *
	 * @param x Local northing.
	 * @param z Local easting.
	 * @returns Altitude in metres.
	 * @example `const altitude = LoGetAltitude(point.x, point.z);`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:633
	 */
	LoGetAltitude(x: number, z: number): number;

	/**
	 * Resolves a four-level world type to a name.
	 *
	 * @param level1 First classification.
	 * @param level2 Second classification.
	 * @param level3 Third classification.
	 * @param level4 Fourth classification.
	 * @returns Name, or `undefined`.
	 * @example `const name = LoGetNameByType(1, 1, 1, 1);`
	 * @see %DCS_INSTALL_DIR%/Scripts/Export.lua:645
	 */
	LoGetNameByType(
		level1: number,
		level2: number,
		level3: number,
		level4: number,
	): string | undefined;
}
