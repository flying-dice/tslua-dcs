import type { _net } from "./exports/net.export";

export interface NetPlayerInfo {
	id: number;
	name: string;
	side: number;
	slot: number | string;
	ping: number;
	ipaddr?: string;
	ucid?: string;
}

type NetFunction =
	| "dostring_in"
	| "force_player_slot"
	| "get_coalition"
	| "get_my_player_id"
	| "get_name"
	| "get_player_info"
	| "get_player_list"
	| "get_server_host"
	| "get_server_id"
	| "get_slot"
	| "get_stat"
	| "is_loopback_address"
	| "is_private_address"
	| "json2lua"
	| "kick"
	| "log"
	| "lua2json"
	| "recv_chat"
	| "resetJoinCooldownEndForAll"
	| "resetJoinCooldownEndForPlayer"
	| "send_chat"
	| "send_chat_to"
	| "set_coalition"
	| "set_name"
	| "set_slot"
	| "trace";

/**
 * Network API available when DCS enables it for mission scripting.
 *
 * @noSelf
 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:286
 */
export interface l_net extends Omit<_net, NetFunction> {
	/**
	 * Executes trusted Lua in an allowed DCS state. This API is obsolete and unsafe.
	 *
	 * @example `const result = net.dostring_in("mission", "return 2 + 2");`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:309
	 * @see https://wiki.hoggitworld.com/view/DCS_func_dostring_in
	 */
	dostring_in(state: string, luaSource: string): string | undefined;
	/**
	 * Writes to the normal LuaNET log stream.
	 *
	 * @example `net.log("hook connected");`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:290
	 */
	log(message: string): void;
	/**
	 * Writes to the lossless LuaNET trace stream.
	 *
	 * @example `net.trace("packet received");`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:291
	 */
	trace(message: string): void;
	/**
	 * Sends chat globally or to the local coalition.
	 *
	 * @example `net.send_chat("Ready", true);`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:327
	 */
	send_chat(message: string, all: boolean): void;
	/**
	 * Sends direct chat to a player ID or `net.CHAT_ALL`/`CHAT_TEAM`.
	 *
	 * @example `net.send_chat_to("Ready", net.CHAT_TEAM);`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:331
	 */
	send_chat_to(message: string, playerId: number): void;
	/**
	 * Injects a chat message locally, optionally pretending it came from a player.
	 *
	 * @example `net.recv_chat("Server notice", 0);`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:336
	 */
	recv_chat(message: string, fromPlayerId?: number): void;
	/**
	 * Returns connected player IDs.
	 *
	 * @example `const players = net.get_player_list();`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:361
	 */
	get_player_list(): number[];
	/**
	 * Returns the local player ID.
	 *
	 * @example `const me = net.get_my_player_id();`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:365
	 */
	get_my_player_id(): number;
	/**
	 * Returns the server player ID.
	 *
	 * @example `const server = net.get_server_id();`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:369
	 */
	get_server_id(): number;
	/**
	 * Returns all player attributes, or nothing for an invalid ID.
	 *
	 * @example `const player = net.get_player_info(id);`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:373
	 */
	get_player_info(playerId: number): NetPlayerInfo | undefined;
	/**
	 * Returns one named player attribute.
	 *
	 * @example `const ucid = net.get_player_info(id, "ucid");`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:377
	 */
	get_player_info(playerId: number, attribute: keyof NetPlayerInfo): unknown;
	/**
	 * Returns a player's display name.
	 *
	 * @example `const name = net.get_name(id);`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:408
	 */
	get_name(playerId: number): string | undefined;
	/**
	 * Returns player coalition and slot.
	 *
	 * @example `const [side, slot] = net.get_slot(id);`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:412
	 */
	get_slot(playerId: number): LuaMultiReturn<[number, number | string]>;
	/**
	 * Returns a player statistic selected by a `net.PS_*` constant.
	 *
	 * @example `const ping = net.get_stat(id, net.PS_PING);`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:395
	 */
	get_stat(playerId: number, statisticId: number): number;
	/**
	 * Returns a player's coalition.
	 *
	 * @example `const side = net.get_coalition(id);`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/MultiplayerSelectRoleMap/MultiplayerSelectRole.lua:454
	 */
	get_coalition(playerId: number): number;
	/**
	 * Returns the connected server host/address.
	 *
	 * @example `const host = net.get_server_host();`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/mul_select_role.lua:1932
	 */
	get_server_host(): string;
	/**
	 * Tests an address for loopback scope.
	 *
	 * @example `const localOnly = net.is_loopback_address("127.0.0.1");`
	 */
	is_loopback_address(address: string): boolean;
	/**
	 * Tests an address for private-network scope.
	 *
	 * @example `const privateAddress = net.is_private_address("192.168.1.1");`
	 */
	is_private_address(address: string): boolean;
	/**
	 * Serializes a Lua value as JSON.
	 *
	 * @example `const json = net.lua2json({ ready: true });`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:430
	 */
	lua2json(value: unknown): string;
	/**
	 * Parses JSON to a Lua value.
	 *
	 * @example `const value = net.json2lua("{\"ready\":true}");`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:434
	 */
	json2lua(json: string): unknown;
	/**
	 * Kicks a player with an optional explanation. Server only.
	 *
	 * @example `net.kick(id, "mission restart");`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:387
	 */
	kick(playerId: number, message?: string): boolean;
	/**
	 * Forces a player into a coalition/slot. Empty slot moves to spectators.
	 *
	 * @example `net.force_player_slot(id, 0, "");`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:422
	 */
	force_player_slot(
		playerId: number,
		sideId: number,
		slotId: number | string,
	): boolean;
	/**
	 * Attempts to change the local player's slot. Password parameters are DCS UI extensions.
	 *
	 * @example `net.set_slot(0, "");`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:418
	 */
	set_slot(
		sideId: number,
		slotId: number | string,
		coalitionPassword?: string,
		slotPassword?: string,
	): boolean | undefined;
	/**
	 * Changes the local player's coalition.
	 *
	 * @example `net.set_coalition(coalition.side.BLUE, password);`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/MultiplayerSelectRoleMap/MultiplayerSelectRole.lua:461
	 */
	set_coalition(sideId: number, password?: string): boolean | undefined;
	/**
	 * Obsolete local-only player rename.
	 *
	 * @example `net.set_name(id, "Pilot");`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:426
	 */
	set_name(playerId: number, name: string): void;
	/**
	 * Resets the join cooldown for one unit/player identifier.
	 *
	 * @example `net.resetJoinCooldownEndForPlayer(unitId);`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/mul_playersPool.lua:316
	 */
	resetJoinCooldownEndForPlayer(id: number): boolean;
	/**
	 * Resets join cooldowns globally.
	 *
	 * @example `net.resetJoinCooldownEndForAll();`
	 * @see %DCS_INSTALL_DIR%/Scripts/Hooks/webGUI.lua:152
	 */
	resetJoinCooldownEndForAll(): boolean;
}
