/**
 * @version 2.9.1.48335
 * @noSelf
 **/
export interface _world {
	BirthPlace: {
		wsBirthPlace_Park: number;
		wsBirthPlace_Heliport_Cold: number;
		wsBirthPlace_Ship: number;
		wsBirthPlace_RunWay: number;
		wsBirthPlace_Ship_Cold: number;
		wsBirthPlace_Heliport_Hot: number;
		wsBirthPlace_Air: number;
		wsBirthPlace_Ship_Hot: number;
	};
	removeJunk(...args: any[]): unknown;
	VolumeType: { PYRAMID: number; BOX: number; SEGMENT: number; SPHERE: number };
	event: {
		S_EVENT_MISSION_END: number;
		S_EVENT_DAYNIGHT: number;
		S_EVENT_SHOT: number;
		S_EVENT_KILL: number;
		S_EVENT_MARK_ADDED: number;
		S_EVENT_POSTPONED_TAKEOFF: number;
		S_EVENT_UNIT_TASK_COMPLETE: number;
		S_EVENT_SHOOTING_END: number;
		S_EVENT_BASE_CAPTURED: number;
		S_EVENT_DEAD: number;
		S_EVENT_TRIGGER_ZONE: number;
		S_EVENT_WEAPON_REARM: number;
		S_EVENT_POSTPONED_LAND: number;
		S_EVENT_EJECTION: number;
		S_EVENT_MISSION_WINNER: number;
		S_EVENT_WEAPON_ADD: number;
		S_EVENT_MISSION_RESTART: number;
		S_EVENT_SHOOTING_START: number;
		S_EVENT_MAC_EXTRA_SCORE: number;
		S_EVENT_UNIT_LOST: number;
		S_EVENT_INVALID: number;
		S_EVENT_PLAYER_ENTER_UNIT: number;
		S_EVENT_EMERGENCY_LANDING: number;
		S_EVENT_REFUELING: number;
		S_EVENT_CRASH: number;
		S_EVENT_UNIT_TASK_STAGE: number;
		S_EVENT_WEAPON_DROP: number;
		S_EVENT_MAX: number;
		S_EVENT_LANDING_AFTER_EJECTION: number;
		S_EVENT_PLAYER_LEAVE_UNIT: number;
		S_EVENT_MARK_CHANGE: number;
		S_EVENT_UNIT_DELETE_TASK: number;
		S_EVENT_UNIT_CREATE_TASK: number;
		S_EVENT_PILOT_DEAD: number;
		S_EVENT_ENGINE_STARTUP: number;
		S_EVENT_LANDING_QUALITY_MARK: number;
		S_EVENT_REFUELING_STOP: number;
		S_EVENT_PLAYER_SELF_KILL_PILOT: number;
		S_EVENT_BDA: number;
		S_EVENT_AI_ABORT_MISSION: number;
		S_EVENT_LAND: number;
		S_EVENT_FLIGHT_TIME: number;
		S_EVENT_DISCARD_CHAIR_AFTER_EJECTION: number;
		S_EVENT_TAKEOFF: number;
		S_EVENT_MAC_SUBTASK_SCORE: number;
		S_EVENT_PLAYER_CAPTURE_AIRFIELD: number;
		S_EVENT_PLAYER_COMMENT: number;
		S_EVENT_SCORE: number;
		S_EVENT_MISSION_START: number;
		S_EVENT_TOOK_CONTROL: number;
		S_EVENT_PARATROOPER_LENDING: number;
		S_EVENT_BIRTH: number;
		S_EVENT_SIMULATION_START: number;
		S_EVENT_MARK_REMOVED: number;
		S_EVENT_HIT: number;
		S_EVENT_DETAILED_FAILURE: number;
		S_EVENT_ENGINE_SHUTDOWN: number;
		S_EVENT_HUMAN_FAILURE: number;
	};
	onEvent(...args: any[]): unknown;
	eventHandlers: {};
	removeEventHandler(...args: any[]): unknown;
	addEventHandler(...args: any[]): unknown;
	getMarkPanels(...args: any[]): unknown;
	searchObjects(...args: any[]): unknown;
	getPlayer(...args: any[]): unknown;
	getAirbases(...args: any[]): unknown;
}
