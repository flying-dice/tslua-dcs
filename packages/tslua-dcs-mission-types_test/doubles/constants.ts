/**
 * Enumeration tables of the mission environment. Values follow the Hoggit wiki where it documents them;
 * the remaining values are fixture values that only need to be distinct. Code under test should use the
 * names (`coalition.side.BLUE`), never the numbers.
 */

/** `{ [names[i]]: first + i }` for a list of names. */
function enumeration<const T extends readonly string[]>(
	names: T,
	first: number,
): Record<T[number], number> {
	const result = {} as Record<T[number], number>;
	names.forEach((name: T[number], index) => {
		result[name] = first + index;
	});
	return result;
}

export const side = { NEUTRAL: 0, RED: 1, BLUE: 2 };

export const country = { RUSSIA: 0, USA: 2, GEORGIA: 16 };

export const countryNames: Record<number, string> = {
	0: "Russia",
	2: "USA",
	16: "Georgia",
};

export const objectCategory = {
	VOID: 0,
	UNIT: 1,
	WEAPON: 2,
	STATIC: 3,
	BASE: 4,
	SCENERY: 5,
	CARGO: 6,
};

export const unitCategory = {
	AIRPLANE: 0,
	HELICOPTER: 1,
	GROUND_UNIT: 2,
	SHIP: 3,
	STRUCTURE: 4,
};

export const groupCategory = {
	AIRPLANE: 0,
	HELICOPTER: 1,
	GROUND: 2,
	SHIP: 3,
	TRAIN: 4,
};

export const airbaseCategory = { AIRDROME: 0, HELIPAD: 1, SHIP: 2 };

export const weaponCategory = {
	SHELL: 0,
	MISSILE: 1,
	ROCKET: 2,
	BOMB: 3,
	TORPEDO: 4,
};

export const guidanceType = {
	INS: 1,
	IR: 2,
	RADAR_ACTIVE: 3,
	RADAR_SEMI_ACTIVE: 4,
	RADAR_PASSIVE: 5,
	TV: 6,
	LASER: 7,
	TELE: 8,
};

export const missileCategory = {
	AAM: 1,
	SAM: 2,
	BM: 3,
	ANTI_SHIP: 4,
	CRUISE: 5,
	OTHER: 6,
};

export const warheadType = { AP: 0, HE: 1, SHAPED_EXPLOSIVE: 2 };

const weaponFlagNames = [
	"NoWeapon",
	"LGB",
	"TvGB",
	"SNSGB",
	"HEBomb",
	"Penetrator",
	"NapalmBomb",
	"FAEBomb",
	"ClusterBomb",
	"Dispencer",
	"CandleBomb",
	"ParachuteBomb",
	"GuidedBomb",
	"AnyUnguidedBomb",
	"AnyBomb",
	"LightRocket",
	"MarkerRocket",
	"CandleRocket",
	"HeavyRocket",
	"AnyRocket",
	"AntiRadarMissile",
	"AntiShipMissile",
	"AntiTankMissile",
	"FireAndForgetASM",
	"LaserASM",
	"TeleASM",
	"CruiseMissile",
	"AntiRadarMissile2",
	"GuidedASM",
	"TacticASM",
	"AnyASM",
	"SRAAM",
	"MRAAM",
	"LRAAM",
	"IR_AAM",
	"SAR_AAM",
	"AR_AAM",
	"AnyAAM",
	"AnyMissile",
	"AnyAutonomousMissile",
	"GUN_POD",
	"BuiltInCannon",
	"Cannons",
	"SmokeShell",
	"IlluminationShell",
	"MarkerShell",
	"SubmunitionDispenserShell",
	"GuidedShell",
	"ConventionalShell",
	"AnyShell",
	"Torpedo",
	"AnyTorpedo",
	"Decoys",
	"MarkerWeapon",
	"ArmWeapon",
	"GuidedWeapon",
	"UnguidedWeapon",
	"AnyAGWeapon",
	"AnyAAWeapon",
	"AnyWeapon",
	"AllWeapon",
] as const;

/** `Weapon.flag`: distinct fixture numbers (DCS uses 64-bit masks that Lua numbers cannot all hold). */
export const weaponFlag = enumeration(weaponFlagNames, 0);

export const detection = {
	VISUAL: 1,
	OPTIC: 2,
	RADAR: 4,
	IRST: 8,
	RWR: 16,
	DLINK: 32,
};

export const sensorType = { OPTIC: 0, RADAR: 1, IRST: 2, RWR: 3 };
export const opticType = { TV: 0, LLTV: 1, IR: 2 };
export const radarType = { AS: 0, SS: 1 };
export const refuelingSystem = { BOOM_AND_RECEPTACLE: 0, PROBE_AND_DROGUE: 1 };

export const surfaceType = {
	LAND: 1,
	SHALLOW_WATER: 2,
	WATER: 3,
	ROAD: 4,
	RUNWAY: 5,
};

export const volumeType = { SEGMENT: 0, BOX: 1, SPHERE: 2, PYRAMID: 3 };

export const birthPlace = {
	wsBirthPlace_Air: 1,
	wsBirthPlace_Ship: 3,
	wsBirthPlace_RunWay: 4,
	wsBirthPlace_Park: 5,
	wsBirthPlace_Heliport_Hot: 9,
	wsBirthPlace_Heliport_Cold: 10,
	wsBirthPlace_Ship_Cold: 11,
	wsBirthPlace_Ship_Hot: 12,
};

const eventNames = [
	"S_EVENT_INVALID",
	"S_EVENT_SHOT",
	"S_EVENT_HIT",
	"S_EVENT_TAKEOFF",
	"S_EVENT_LAND",
	"S_EVENT_CRASH",
	"S_EVENT_EJECTION",
	"S_EVENT_REFUELING",
	"S_EVENT_DEAD",
	"S_EVENT_PILOT_DEAD",
	"S_EVENT_BASE_CAPTURED",
	"S_EVENT_MISSION_START",
	"S_EVENT_MISSION_END",
	"S_EVENT_TOOK_CONTROL",
	"S_EVENT_REFUELING_STOP",
	"S_EVENT_BIRTH",
	"S_EVENT_HUMAN_FAILURE",
	"S_EVENT_DETAILED_FAILURE",
	"S_EVENT_ENGINE_STARTUP",
	"S_EVENT_ENGINE_SHUTDOWN",
	"S_EVENT_PLAYER_ENTER_UNIT",
	"S_EVENT_PLAYER_LEAVE_UNIT",
	"S_EVENT_PLAYER_COMMENT",
	"S_EVENT_SHOOTING_START",
	"S_EVENT_SHOOTING_END",
	"S_EVENT_MARK_ADDED",
	"S_EVENT_MARK_CHANGE",
	"S_EVENT_MARK_REMOVED",
	"S_EVENT_KILL",
	"S_EVENT_SCORE",
	"S_EVENT_UNIT_LOST",
	"S_EVENT_LANDING_AFTER_EJECTION",
	"S_EVENT_PARATROOPER_LENDING",
	"S_EVENT_DISCARD_CHAIR_AFTER_EJECTION",
	"S_EVENT_WEAPON_ADD",
	"S_EVENT_TRIGGER_ZONE",
	"S_EVENT_LANDING_QUALITY_MARK",
	"S_EVENT_BDA",
	"S_EVENT_AI_ABORT_MISSION",
	"S_EVENT_DAYNIGHT",
	"S_EVENT_FLIGHT_TIME",
	"S_EVENT_PLAYER_SELF_KILL_PILOT",
	"S_EVENT_PLAYER_CAPTURE_AIRFIELD",
	"S_EVENT_EMERGENCY_LANDING",
	"S_EVENT_UNIT_CREATE_TASK",
	"S_EVENT_UNIT_DELETE_TASK",
	"S_EVENT_SIMULATION_START",
	"S_EVENT_WEAPON_REARM",
	"S_EVENT_WEAPON_DROP",
	"S_EVENT_UNIT_TASK_COMPLETE",
	"S_EVENT_UNIT_TASK_STAGE",
	"S_EVENT_MAC_EXTRA_SCORE",
	"S_EVENT_MISSION_RESTART",
	"S_EVENT_MISSION_WINNER",
	"S_EVENT_RUNWAY_TAKEOFF",
	"S_EVENT_RUNWAY_TOUCH",
	"S_EVENT_MAC_LMS_RESTART",
	"S_EVENT_SIMULATION_FREEZE",
	"S_EVENT_SIMULATION_UNFREEZE",
	"S_EVENT_HUMAN_AIRCRAFT_REPAIR_START",
	"S_EVENT_HUMAN_AIRCRAFT_REPAIR_FINISH",
	"S_EVENT_GROUP_CHANGE_OPTION",
	"S_EVENT_MAX",
] as const;

/** `world.event`: S_EVENT_INVALID = 0, S_EVENT_SHOT = 1, ... in DCS order. */
export const worldEvent = enumeration(eventNames, 0);

export const smokeColor = { Green: 0, Red: 1, White: 2, Orange: 3, Blue: 4 };
export const flareColor = { Green: 0, Red: 1, White: 2, Yellow: 3 };
export const modulation = { AM: 0, FM: 1 };

export const envMode = {
	INIT: 0,
	USER: 1,
	START: 2,
	SIMULATION: 3,
	STOP: 4,
	FINISH: 5,
};

export const coalitionService = {
	ATC: 0,
	AWACS: 1,
	TANKER: 2,
	FAC: 3,
	MAX: 4,
};

export const netConstants = {
	CHAT_ALL: 0,
	CHAT_TEAM: 1,
	ERR_THATS_OKAY: 0,
	ERR_INVALID_ADDRESS: 1,
	ERR_CONNECT_FAILED: 2,
	ERR_WRONG_VERSION: 3,
	ERR_PROTOCOL_ERROR: 4,
	ERR_TAINTED_CLIENT: 5,
	ERR_INVALID_PASSWORD: 6,
	ERR_BANNED: 7,
	ERR_BAD_CALLSIGN: 8,
	ERR_TIMEOUT: 9,
	ERR_KICKED: 10,
	ERR_REFUSED: 11,
	ERR_DENIED_TRIAL_ONLY: 12,
	ERR_NOT_ALLOWED: 13,
	ERR_SERVER_FULL: 14,
	GAME_MODE_MISSION: 0,
	GAME_MODE_CONQUEST: 1,
	GAME_MODE_TEAM_DEATH_MATCH: 2,
	GAME_MODE_LAST_MAN_STANDING: 3,
	PS_PING: 0,
	PS_CRASH: 1,
	PS_CAR: 2,
	PS_PLANE: 3,
	PS_SHIP: 4,
	PS_SCORE: 5,
	PS_LAND: 6,
	PS_EJECT: 7,
	RESUME_MANUAL: 0,
	RESUME_ON_LOAD: 1,
	RESUME_WITH_CLIENTS: 2,
};

export const ai = {
	Skill: {
		AVERAGE: "Average",
		GOOD: "Good",
		HIGH: "High",
		EXCELLENT: "Excellent",
		PLAYER: "Player",
		CLIENT: "Client",
	},
	Task: {
		AltitudeType: { BARO: "BARO", RADIO: "RADIO" },
		Designation: {
			NO: "No",
			WP: "WP",
			IR_POINTER: "IR-Pointer",
			LASER: "Laser",
			AUTO: "Auto",
		},
		OrbitPattern: { CIRCLE: "Circle", RACE_TRACK: "Race-Track" },
		TurnMethod: { FLY_OVER_POINT: "Fly Over Point", FIN_POINT: "Fin Point" },
		VehicleFormation: {
			OFF_ROAD: "Off Road",
			ON_ROAD: "On Road",
			RANK: "Rank",
			CONE: "Cone",
			DIAMOND: "Diamond",
			VEE: "Vee",
			ECHELON_LEFT: "EchelonL",
			ECHELON_RIGHT: "EchelonR",
		},
		WaypointType: {
			TAKEOFF: "TakeOff",
			TAKEOFF_PARKING: "TakeOffParking",
			TAKEOFF_PARKING_HOT: "TakeOffParkingHot",
			TURNING_POINT: "Turning Point",
			LAND: "Land",
		},
		WeaponExpend: {
			ONE: "One",
			TWO: "Two",
			FOUR: "Four",
			QUARTER: "Quarter",
			HALF: "Half",
			ALL: "All",
		},
	},
	Option: {
		Air: {
			id: {
				NO_OPTION: -1,
				ROE: 0,
				REACTION_ON_THREAT: 1,
				RADAR_USING: 3,
				FLARE_USING: 4,
				FORMATION: 5,
				RTB_ON_BINGO: 6,
				SILENCE: 7,
				RTB_ON_OUT_OF_AMMO: 10,
				ECM_USING: 13,
				PROHIBIT_AA: 14,
				PROHIBIT_JETT: 15,
				PROHIBIT_AB: 16,
				PROHIBIT_AG: 17,
				MISSILE_ATTACK: 18,
				PROHIBIT_WP_PASS_REPORT: 19,
				OPTION_RADIO_USAGE_CONTACT: 21,
				OPTION_RADIO_USAGE_ENGAGE: 22,
				OPTION_RADIO_USAGE_KILL: 23,
				JETT_TANKS_IF_EMPTY: 25,
				FORCED_ATTACK: 26,
				PREFER_VERTICAL: 32,
				ALLOW_FORMATION_SIDE_SWAP: 35,
				LANDING_OPTIONS: 36,
				DISENGAGE_AND_RTB: 37,
				ALLOW_LINE_UP_RW: 38,
			},
			val: {
				ROE: {
					WEAPON_FREE: 0,
					OPEN_FIRE_WEAPON_FREE: 1,
					OPEN_FIRE: 2,
					RETURN_FIRE: 3,
					WEAPON_HOLD: 4,
				},
				REACTION_ON_THREAT: {
					NO_REACTION: 0,
					PASSIVE_DEFENCE: 1,
					EVADE_FIRE: 2,
					BYPASS_AND_ESCAPE: 3,
					ALLOW_ABORT_MISSION: 4,
				},
				RADAR_USING: {
					NEVER: 0,
					FOR_ATTACK_ONLY: 1,
					FOR_SEARCH_IF_REQUIRED: 2,
					FOR_CONTINUOUS_SEARCH: 3,
				},
				FLARE_USING: {
					NEVER: 0,
					AGAINST_FIRED_MISSILE: 1,
					WHEN_FLYING_IN_SAM_WEZ: 2,
					WHEN_FLYING_NEAR_ENEMIES: 3,
				},
				ECM_USING: {
					NEVER_USE: 0,
					USE_IF_ONLY_LOCK_BY_RADAR: 1,
					USE_IF_DETECTED_LOCK_BY_RADAR: 2,
					ALWAYS_USE: 3,
				},
				MISSILE_ATTACK: {
					MAX_RANGE: 0,
					NEZ_RANGE: 1,
					HALF_WAY_RMAX_NEZ: 2,
					TARGET_THREAT_EST: 3,
					RANDOM_RANGE: 4,
				},
			},
		},
		Ground: {
			id: {
				NO_OPTION: -1,
				ROE: 0,
				FORMATION: 5,
				DISPERSE_ON_ATTACK: 8,
				ALARM_STATE: 9,
				ENGAGE_AIR_WEAPONS: 20,
				AC_ENGAGEMENT_RANGE_RESTRICTION: 24,
				EVASION_OF_ARM: 31,
			},
			val: {
				ROE: { OPEN_FIRE: 2, RETURN_FIRE: 3, WEAPON_HOLD: 4 },
				ALARM_STATE: { AUTO: 0, GREEN: 1, RED: 2 },
			},
		},
		Naval: {
			id: { NO_OPTION: -1, ROE: 0 },
			val: { ROE: { OPEN_FIRE: 2, RETURN_FIRE: 3, WEAPON_HOLD: 4 } },
		},
	},
};
