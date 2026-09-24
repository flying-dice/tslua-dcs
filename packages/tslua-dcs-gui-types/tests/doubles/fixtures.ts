/** @noSelfInFile */

/**
 * Deterministic fixture data for the DCS GUI doubles. Every function returns a fresh copy, so tests
 * can mutate what they receive without affecting later tests.
 */

import type {
	ExportCameraBookmark,
	ExportClickableElement,
	ExportCockpitDevice,
	ExportEngineInfo,
	ExportHelicopterFMData,
	ExportHSI,
	ExportMechanizationInfo,
	ExportNavigationInfo,
	ExportObject,
	ExportPayloadInfo,
	ExportPosition,
	ExportRadioBeaconsStatus,
	ExportRoute,
	ExportSnares,
	ExportTarget,
	ExportTWSInfo,
	ExportVec3,
	ExportWingmanInfo,
	l_db,
} from "../../src";

export function vec3(x: number, y: number, z: number): ExportVec3 {
	return { x, y, z };
}

/** An identity orientation at `p`. */
export function position(p: ExportVec3): ExportPosition {
	return { x: vec3(1, 0, 0), y: vec3(0, 1, 0), z: vec3(0, 0, 1), p };
}

export function worldObject(
	name: string,
	coalitionId: number,
	point: ExportVec3,
	human = false,
): ExportObject {
	return {
		Name: name,
		UnitName: name,
		GroupName: `${name} group`,
		Type: { level1: 1, level2: 1, level3: 1, level4: 5 },
		Country: coalitionId === 2 ? 2 : 0,
		Coalition: coalitionId === 2 ? "Enemies" : "Allies",
		CoalitionID: coalitionId,
		LatLongAlt: { Lat: 41.6103, Long: 41.5997, Alt: point.y },
		Heading: 1.5,
		Pitch: 0,
		Bank: 0,
		Position: point,
		Flags: {
			RadarActive: false,
			Human: human,
			Jamming: false,
			IRJamming: false,
			Born: true,
			AI_ON: !human,
			Invisible: false,
			Static: false,
		},
	};
}

/**
 * Everything the ownship-dependent `Export.Lo*` functions return while a player aircraft exists
 * (`guiDoubles.state().ownship`). Without an ownship those functions return `undefined`.
 */
export interface OwnshipFixture {
	self: ExportObject;
	unitId: number;
	pilotName: string;
	altitudeAboveSeaLevel: number;
	altitudeAboveGroundLevel: number;
	radarAltimeter: number;
	indicatedAirSpeed: number;
	trueAirSpeed: number;
	machNumber: number;
	verticalVelocity: number;
	angleOfAttack: number;
	angleOfSideSlip: number;
	slipBallPosition: number;
	magneticYaw: number;
	glideDeviation: number;
	sideDeviation: number;
	shakeAmplitude: number;
	basicAtmospherePressure: number;
	pitchBankYaw: [number, number, number];
	accelerationUnits: ExportVec3;
	angularVelocity: ExportVec3;
	vectorVelocity: ExportVec3;
	vectorWindVelocity: ExportVec3;
	inAir: boolean;
	engine: ExportEngineInfo;
	mech: ExportMechanizationInfo;
	navigation: ExportNavigationInfo;
	hsi: ExportHSI;
	route: ExportRoute;
	payload: ExportPayloadInfo;
	snares: ExportSnares;
	radioBeacons: ExportRadioBeaconsStatus;
	targets: ExportTarget[];
	lockedTargets: ExportTarget[];
	tws: ExportTWSInfo;
	f15TwsContacts: unknown[];
	wingmen: ExportWingmanInfo[];
	wingTargets: ExportVec3[];
	mcpState: Record<string, boolean>;
	fmData: Record<string, unknown>;
	helicopterFmData: ExportHelicopterFMData | undefined;
	sightingSystem: Record<string, unknown>;
	devices: Record<number, ExportCockpitDevice>;
	clickable: Record<string, ExportClickableElement>;
	indicatorIds: number[];
}

function target(id: number): ExportTarget {
	return {
		ID: id,
		type: { level1: 1, level2: 1, level3: 1, level4: 3 },
		country: 2,
		position: position(vec3(12000, 3000, 500)),
		velocity: vec3(-200, 0, 0),
		distance: 18000,
		convergence_velocity: 400,
		mach: 0.9,
		delta_psi: 0.1,
		fim: 0.02,
		fin: 0.01,
		flags: 0,
		reflection: 5,
		course: 3.1,
		isjamming: false,
		start_of_lock: 12,
		forces: vec3(0, 1, 0),
		updates_number: 3,
		jammer_burned: false,
	};
}

/** An F-16C in level flight at 1 000 m, 250 m/s, over the Caucasus fixture terrain. */
export function ownshipFixture(): OwnshipFixture {
	const point = vec3(-281000, 1000, 647000);
	const mechanism = (value: number) => ({ status: value > 0 ? 1 : 0, value });
	return {
		self: worldObject("Viper 1-1", 2, point, true),
		unitId: 16777472,
		pilotName: "Viper 1-1",
		altitudeAboveSeaLevel: 1000,
		altitudeAboveGroundLevel: 880,
		radarAltimeter: 880,
		indicatedAirSpeed: 236,
		trueAirSpeed: 250,
		machNumber: 0.74,
		verticalVelocity: 0,
		angleOfAttack: 0.05,
		angleOfSideSlip: 0,
		slipBallPosition: 0,
		magneticYaw: 1.52,
		glideDeviation: 0,
		sideDeviation: 0,
		shakeAmplitude: 0,
		basicAtmospherePressure: 674,
		pitchBankYaw: [0.02, -0.01, 1.5],
		accelerationUnits: vec3(0, 1, 0),
		angularVelocity: vec3(0, 0, 0),
		vectorVelocity: vec3(250, 0, 0),
		vectorWindVelocity: vec3(-3, 0, 2),
		inAir: true,
		engine: {
			RPM: { left: 92, right: 0 },
			Temperature: { left: 720, right: 0 },
			HydraulicPressure: { left: 3000, right: 3000 },
			FuelConsumption: { left: 0.8, right: 0 },
			fuel_internal: 0.85,
			fuel_external: 0,
		},
		mech: {
			gear: {
				...mechanism(0),
				main: { left: { rod: 0 }, right: { rod: 0 }, nose: { rod: 0 } },
			},
			flaps: mechanism(0),
			speedbrakes: mechanism(0),
			refuelingboom: mechanism(0),
			airintake: mechanism(0),
			noseflap: mechanism(0),
			parachute: mechanism(0),
			wheelbrakes: mechanism(0),
			hook: mechanism(0),
			wing: mechanism(0),
			canopy: mechanism(0),
			controlsurfaces: {
				elevator: { left: 0, right: 0 },
				eleron: { left: 0, right: 0 },
				rudder: { left: 0, right: 0 },
			},
		},
		navigation: {
			SystemMode: { master: "NAV", submode: "ROUTE" },
			Requirements: {
				roll: 0,
				pitch: 0,
				speed: 250,
				vertical_speed: 0,
				altitude: 1000,
			},
			ACS: { mode: "FOLLOW_ROUTE", autothrust: 0 },
		},
		hsi: {
			ADF_raw: 0,
			RMI_raw: 0,
			Heading_raw: 1.52,
			HeadingPointer: 1.52,
			Course: 1.6,
			BearingPointer: 1.55,
			CourseDeviation: 0,
		},
		route: {
			goto_point: {
				this_point_num: 2,
				world_point: vec3(-270000, 1000, 660000),
				speed_req: 250,
				estimated_time: 60,
				next_point_num: 3,
				point_action: "Turning Point",
			},
			route: [
				{
					this_point_num: 1,
					world_point: point,
					speed_req: 250,
					estimated_time: 0,
					next_point_num: 2,
					point_action: "Turning Point",
				},
			],
		},
		payload: {
			CurrentStation: 1,
			Stations: [
				{
					container: false,
					weapon: { level1: 4, level2: 4, level3: 7, level4: 24 },
					count: 1,
				},
			],
			Cannon: { shells: 510 },
		},
		snares: { chaff: 60, flare: 60 },
		radioBeacons: {
			airfield_near: false,
			airfield_far: false,
			course_deviation_beacon_lock: false,
			glideslope_deviation_beacon_lock: false,
		},
		targets: [target(101)],
		lockedTargets: [target(101)],
		tws: {
			Mode: 1,
			Emitters: [
				{
					ID: 101,
					Type: { level1: 1, level2: 1, level3: 1, level4: 3 },
					Power: 0.6,
					Azimuth: 0.2,
					Priority: 150,
					SignalType: "scan",
				},
			],
		},
		f15TwsContacts: [],
		wingmen: [
			{
				wingmen_id: 16777728,
				wingmen_position: position(vec3(-281100, 1000, 646900)),
				current_target: 0,
				ordered_target: 0,
				current_task: "Follow",
				ordered_task: "Follow",
			},
		],
		wingTargets: [],
		mcpState: { LeftEngineFailure: false, RightEngineFailure: false },
		fmData: { V: 250 },
		helicopterFmData: undefined,
		sightingSystem: { radar_on: true, laser_on: false },
		devices: { 0: { name: "main" }, 17: { name: "UFC" } },
		clickable: {
			PNT_MASTER_ARM: { name: "Master Arm", device_id: 22, command: 3001 },
		},
		indicatorIds: [4, 5],
	};
}

export function bookmarksFixture(): ExportCameraBookmark[] {
	return [
		{ name: "Tower", pos: position(vec3(-281000, 50, 647000)), fov: 60 },
		{ name: "Runway 27", pos: position(vec3(-282000, 20, 645000)), fov: 45 },
	];
}

export function dbFixture(): l_db {
	return {
		Units: {
			Cars: {
				Car: [
					{
						type: "Ural-375",
						Name: "Ural-375",
						DisplayName: "Truck Ural-375",
						DisplayNameShort: "Ural",
						ThreatRangeMin: 0,
						ThreatRange: 0,
						tags: ["Truck"],
						category: "Unarmed",
					},
				],
			},
			Planes: {
				Plane: [
					{
						type: "F-16C_50",
						Name: "F-16C_50",
						DisplayName: "F-16CM bl.50",
						MaxFuelWeight: "3249",
						M_fuel_max: 3249,
						V_max_sea_level: 408,
						V_max_h: 588,
						V_land: 71,
						V_take_off: 64,
						H_max: 15240,
						DefaultTask: { WorldID: 11, OldID: "CAP", Name: "CAP" },
						Tasks: [{ WorldID: 11, OldID: "CAP", Name: "CAP" }],
						Pylons: [
							{
								Number: 1,
								Type: 0,
								Order: 1,
								Launchers: [{ CLSID: "{AIM-9X}" }],
							},
						],
					},
				],
				Tasks: [{ WorldID: 11, OldID: "CAP", Name: "CAP" }],
			},
			Helicopters: { Helicopter: [] },
			Fortifications: { Fortification: [] },
			Warehouses: { Warehouse: [] },
			Heliports: { Heliport: [] },
			Cargos: { Cargo: [] },
		},
		Weapons: {
			ByCLSID: {
				"{AIM-9X}": {
					Elements: [],
					Picture: "aim9x.png",
					displayName: "AIM-9X",
					Count: 1,
					Weight: 85,
					attribute: [4, 4, 7, 136],
					CLSID: "{AIM-9X}",
				},
			},
		},
	};
}
