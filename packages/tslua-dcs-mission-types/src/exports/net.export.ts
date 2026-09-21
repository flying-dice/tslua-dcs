/**
 * @version 2.9.29.27468
 * @noSelf
 */
export interface _net {
	CHAT_ALL: number;
	CHAT_TEAM: number;
	ERR_BAD_CALLSIGN: number;
	ERR_BANNED: number;
	ERR_CONNECT_FAILED: number;
	ERR_DENIED_TRIAL_ONLY: number;
	ERR_INVALID_ADDRESS: number;
	ERR_INVALID_PASSWORD: number;
	ERR_KICKED: number;
	ERR_NOT_ALLOWED: number;
	ERR_PROTOCOL_ERROR: number;
	ERR_REFUSED: number;
	ERR_SERVER_FULL: number;
	ERR_TAINTED_CLIENT: number;
	ERR_THATS_OKAY: number;
	ERR_TIMEOUT: number;
	ERR_WRONG_VERSION: number;
	GAME_MODE_CONQUEST: number;
	GAME_MODE_LAST_MAN_STANDING: number;
	GAME_MODE_MISSION: number;
	GAME_MODE_TEAM_DEATH_MATCH: number;
	PS_CAR: number;
	PS_CRASH: number;
	PS_EJECT: number;
	PS_LAND: number;
	PS_PING: number;
	PS_PLANE: number;
	PS_SCORE: number;
	PS_SHIP: number;
	RESUME_MANUAL: number;
	RESUME_ON_LOAD: number;
	RESUME_WITH_CLIENTS: number;
	dostring_in(...args: any[]): unknown;
	force_player_slot(...args: any[]): unknown;
	get_coalition(...args: any[]): unknown;
	get_my_player_id(...args: any[]): unknown;
	get_name(...args: any[]): unknown;
	get_player_info(...args: any[]): unknown;
	get_player_list(...args: any[]): unknown;
	get_server_host(...args: any[]): unknown;
	get_server_id(...args: any[]): unknown;
	get_slot(...args: any[]): unknown;
	get_stat(...args: any[]): unknown;
	is_loopback_address(...args: any[]): unknown;
	is_private_address(...args: any[]): unknown;
	json2lua(...args: any[]): unknown;
	kick(...args: any[]): unknown;
	log(...args: any[]): unknown;
	lua2json(...args: any[]): unknown;
	recv_chat(...args: any[]): unknown;
	resetJoinCooldownEndForAll(...args: any[]): unknown;
	resetJoinCooldownEndForPlayer(...args: any[]): unknown;
	send_chat(...args: any[]): unknown;
	send_chat_to(...args: any[]): unknown;
	set_coalition(...args: any[]): unknown;
	set_name(...args: any[]): unknown;
	set_slot(...args: any[]): unknown;
	trace(...args: any[]): unknown;
}
