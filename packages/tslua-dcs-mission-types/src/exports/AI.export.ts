/**
 * @version 2.9.1.48335
 * @noSelf
 **/
export interface _AI {
	Option: {
		Air: {
			id: {
				JETT_TANKS_IF_EMPTY: number;
				SILENCE: number;
				ROE: number;
				RADAR_USING: number;
				OPTION_RADIO_USAGE_ENGAGE: number;
				PROHIBIT_AG: number;
				ECM_USING: number;
				PROHIBIT_WP_PASS_REPORT: number;
				PROHIBIT_AA: number;
				REACTION_ON_THREAT: number;
				FORCED_ATTACK: number;
				PROHIBIT_AB: number;
				RTB_ON_OUT_OF_AMMO: number;
				MISSILE_ATTACK: number;
				PROHIBIT_JETT: number;
				OPTION_RADIO_USAGE_CONTACT: number;
				FLARE_USING: number;
				OPTION_RADIO_USAGE_KILL: number;
				FORMATION: number;
				RTB_ON_BINGO: number;
				NO_OPTION: number;
			};
			val: {
				FLARE_USING: {
					WHEN_FLYING_NEAR_ENEMIES: number;
					WHEN_FLYING_IN_SAM_WEZ: number;
					AGAINST_FIRED_MISSILE: number;
					NEVER: number;
				};
				RADAR_USING: {
					FOR_ATTACK_ONLY: number;
					FOR_SEARCH_IF_REQUIRED: number;
					NEVER: number;
					FOR_CONTINUOUS_SEARCH: number;
				};
				REACTION_ON_THREAT: {
					BYPASS_AND_ESCAPE: number;
					EVADE_FIRE: number;
					NO_REACTION: number;
					PASSIVE_DEFENCE: number;
					ALLOW_ABORT_MISSION: number;
				};
				MISSILE_ATTACK: {
					HALF_WAY_RMAX_NEZ: number;
					MAX_RANGE: number;
					TARGET_THREAT_EST: number;
					RANDOM_RANGE: number;
					NEZ_RANGE: number;
				};
				ECM_USING: {
					ALWAYS_USE: number;
					NEVER_USE: number;
					USE_IF_DETECTED_LOCK_BY_RADAR: number;
					USE_IF_ONLY_LOCK_BY_RADAR: number;
				};
				ROE: {
					WEAPON_FREE: number;
					RETURN_FIRE: number;
					OPEN_FIRE: number;
					WEAPON_HOLD: number;
					OPEN_FIRE_WEAPON_FREE: number;
				};
			};
		};
		Ground: {
			id: {
				ALARM_STATE: number;
				DISPERSE_ON_ATTACK: number;
				ENGAGE_AIR_WEAPONS: number;
				AC_ENGAGEMENT_RANGE_RESTRICTION: number;
				FORMATION: number;
				ROE: number;
				NO_OPTION: number;
			};
			val: {
				ALARM_STATE: { AUTO: number; GREEN: number; RED: number };
				ROE: { OPEN_FIRE: number; WEAPON_HOLD: number; RETURN_FIRE: number };
			};
		};
		Naval: {
			id: { ROE: number; NO_OPTION: number };
			val: {
				ROE: { OPEN_FIRE: number; WEAPON_HOLD: number; RETURN_FIRE: number };
			};
		};
	};
	Task: {
		OrbitPattern: { RACE_TRACK: string; CIRCLE: string };
		Designation: {
			WP: string;
			NO: string;
			LASER: string;
			IR_POINTER: string;
			AUTO: string;
		};
		TurnMethod: { FLY_OVER_POINT: string; FIN_POINT: string };
		VehicleFormation: {
			VEE: string;
			ECHELON_RIGHT: string;
			OFF_ROAD: string;
			RANK: string;
			ECHELON_LEFT: string;
			ON_ROAD: string;
			CONE: string;
			DIAMOND: string;
		};
		AltitudeType: { RADIO: string; BARO: string };
		WaypointType: {
			TAKEOFF: string;
			TAKEOFF_PARKING: string;
			TURNING_POINT: string;
			TAKEOFF_PARKING_HOT: string;
			LAND: string;
		};
		WeaponExpend: {
			QUARTER: string;
			TWO: string;
			ONE: string;
			FOUR: string;
			HALF: string;
			ALL: string;
		};
	};
	Skill: {
		PLAYER: string;
		AVERAGE: string;
		HIGH: string;
		EXCELLENT: string;
		GOOD: string;
		CLIENT: string;
	};
}
