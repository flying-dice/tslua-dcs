/**
 * @version 2.9.29.27468
 * @noSelf
 */
export interface _AI {
	Option: {
		Air: {
			id: {
				ALLOW_FORMATION_SIDE_SWAP: number;
				ALLOW_LINE_UP_RW: number;
				DISENGAGE_AND_RTB: number;
				ECM_USING: number;
				FLARE_USING: number;
				FORCED_ATTACK: number;
				FORMATION: number;
				JETT_TANKS_IF_EMPTY: number;
				LANDING_OPTIONS: number;
				MISSILE_ATTACK: number;
				NO_OPTION: number;
				OPTION_RADIO_USAGE_CONTACT: number;
				OPTION_RADIO_USAGE_ENGAGE: number;
				OPTION_RADIO_USAGE_KILL: number;
				PREFER_VERTICAL: number;
				PROHIBIT_AA: number;
				PROHIBIT_AB: number;
				PROHIBIT_AG: number;
				PROHIBIT_JETT: number;
				PROHIBIT_WP_PASS_REPORT: number;
				RADAR_USING: number;
				REACTION_ON_THREAT: number;
				ROE: number;
				RTB_ON_BINGO: number;
				RTB_ON_OUT_OF_AMMO: number;
				SILENCE: number;
			};
			val: {
				ECM_USING: {
					ALWAYS_USE: number;
					NEVER_USE: number;
					USE_IF_DETECTED_LOCK_BY_RADAR: number;
					USE_IF_ONLY_LOCK_BY_RADAR: number;
				};
				FLARE_USING: {
					AGAINST_FIRED_MISSILE: number;
					NEVER: number;
					WHEN_FLYING_IN_SAM_WEZ: number;
					WHEN_FLYING_NEAR_ENEMIES: number;
				};
				MISSILE_ATTACK: {
					HALF_WAY_RMAX_NEZ: number;
					MAX_RANGE: number;
					NEZ_RANGE: number;
					RANDOM_RANGE: number;
					TARGET_THREAT_EST: number;
				};
				RADAR_USING: {
					FOR_ATTACK_ONLY: number;
					FOR_CONTINUOUS_SEARCH: number;
					FOR_SEARCH_IF_REQUIRED: number;
					NEVER: number;
				};
				REACTION_ON_THREAT: {
					ALLOW_ABORT_MISSION: number;
					BYPASS_AND_ESCAPE: number;
					EVADE_FIRE: number;
					NO_REACTION: number;
					PASSIVE_DEFENCE: number;
				};
				ROE: {
					OPEN_FIRE: number;
					OPEN_FIRE_WEAPON_FREE: number;
					RETURN_FIRE: number;
					WEAPON_FREE: number;
					WEAPON_HOLD: number;
				};
			};
		};
		Ground: {
			id: {
				AC_ENGAGEMENT_RANGE_RESTRICTION: number;
				ALARM_STATE: number;
				DISPERSE_ON_ATTACK: number;
				ENGAGE_AIR_WEAPONS: number;
				EVASION_OF_ARM: number;
				FORMATION: number;
				NO_OPTION: number;
				ROE: number;
			};
			val: {
				ALARM_STATE: {
					AUTO: number;
					GREEN: number;
					RED: number;
				};
				ROE: {
					OPEN_FIRE: number;
					RETURN_FIRE: number;
					WEAPON_HOLD: number;
				};
			};
		};
		Naval: {
			id: {
				NO_OPTION: number;
				ROE: number;
			};
			val: {
				ROE: {
					OPEN_FIRE: number;
					RETURN_FIRE: number;
					WEAPON_HOLD: number;
				};
			};
		};
	};
	Skill: {
		AVERAGE: string;
		CLIENT: string;
		EXCELLENT: string;
		GOOD: string;
		HIGH: string;
		PLAYER: string;
	};
	Task: {
		AltitudeType: {
			BARO: string;
			RADIO: string;
		};
		Designation: {
			AUTO: string;
			IR_POINTER: string;
			LASER: string;
			NO: string;
			WP: string;
		};
		OrbitPattern: {
			CIRCLE: string;
			RACE_TRACK: string;
		};
		TurnMethod: {
			FIN_POINT: string;
			FLY_OVER_POINT: string;
		};
		VehicleFormation: {
			CONE: string;
			DIAMOND: string;
			ECHELON_LEFT: string;
			ECHELON_RIGHT: string;
			OFF_ROAD: string;
			ON_ROAD: string;
			RANK: string;
			VEE: string;
		};
		WaypointType: {
			LAND: string;
			TAKEOFF: string;
			TAKEOFF_PARKING: string;
			TAKEOFF_PARKING_HOT: string;
			TURNING_POINT: string;
		};
		WeaponExpend: {
			ALL: string;
			FOUR: string;
			HALF: string;
			ONE: string;
			QUARTER: string;
			TWO: string;
		};
	};
}
