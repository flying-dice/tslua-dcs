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

export interface NetBanRecord {
	ucid: string;
	ipaddr: string;
	name: string;
	reason: string;
	banned_from: number;
	banned_until: number;
}

export interface NetMissionList {
	listLoop: boolean;
	listShuffle: boolean;
	missionList: string[];
	current: number;
}

type NetFunction =
	| "banlist_add"
	| "banlist_add_by_ucid"
	| "banlist_get"
	| "banlist_remove"
	| "check_ic_requirements"
	| "check_password"
	| "dostring_in"
	| "force_player_slot"
	| "get_chat_history"
	| "get_coalition"
	| "get_default_server_settings"
	| "get_my_player_id"
	| "get_name"
	| "get_player_info"
	| "get_player_list"
	| "get_server_host"
	| "get_server_id"
	| "get_server_settings"
	| "get_server_uptime"
	| "get_session_history"
	| "get_slot"
	| "get_stat"
	| "hash_password"
	| "is_loopback_address"
	| "is_private_address"
	| "json2lua"
	| "kick"
	| "load_mission"
	| "load_next_mission"
	| "log"
	| "lua2json"
	| "missionlist_append"
	| "missionlist_clear"
	| "missionlist_delete"
	| "missionlist_get"
	| "missionlist_get_installed_theatres"
	| "missionlist_move"
	| "missionlist_run"
	| "missionlist_set_loop"
	| "missionlist_set_shuffle"
	| "recv_chat"
	| "resetJoinCooldownEndForAll"
	| "resetJoinCooldownEndForPlayer"
	| "restart"
	| "screenshot_del"
	| "screenshot_request"
	| "send_chat"
	| "send_chat_to"
	| "send_rpc_error"
	| "send_rpc_request"
	| "send_rpc_result"
	| "serverinfo_get"
	| "serverinfo_request"
	| "serverlist_get"
	| "serverlist_reset"
	| "serverlist_search"
	| "set_coalition"
	| "set_name"
	| "set_slot"
	| "spawn_player"
	| "start_client"
	| "start_server"
	| "stop_game"
	| "stop_network"
	| "trace";
/**
 * @see [Authoritative executable examples](https://github.com/flying-dice/tslua-dcs/blob/main/packages/tslua-dcs-gui-types_test/src/net_test.ts)
 * @noSelf
 */
export interface l_net extends Omit<_net, NetFunction> {
	/**
	 * Executes Lua source in another DCS scripting environment and returns the
	 * value converted to text. This crosses sandbox boundaries, so only execute
	 * trusted source and expect an unavailable environment or Lua error to return
	 * `undefined`.
	 *
	 * Common environment names include `"mission"`, `"export"`, `"config"`, and
	 * `"gui"`; availability depends on the current DCS context.
	 *
	 * @param env Name of the destination DCS Lua environment.
	 * @param luaScript Lua source to evaluate in that environment.
	 * @returns String representation returned by DCS, or `undefined` on failure.
	 * @example
	 * ```ts
	 * const missionName = net.dostring_in("mission", "return env.mission.name");
	 * ```
	 */
	dostring_in(env: string, luaScript: string): string | undefined;

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
	 * Sends direct chat to a player ID or `CHAT_ALL`/`CHAT_TEAM`.
	 *
	 * @example `net.send_chat_to("Ready", net.CHAT_TEAM);`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:331
	 */
	send_chat_to(message: string, playerId: number): void;
	/**
	 * Injects a local chat message.
	 *
	 * @example `net.recv_chat("Server notice", 0);`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:336
	 */
	recv_chat(message: string, fromPlayerId?: number): void;
	/**
	 * Returns chat records from `fromIndex` and the new last index. Record schema is controlled by DCS.
	 *
	 * @example `const [history, last] = net.get_chat_history(0);`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:342
	 */
	get_chat_history(fromIndex: number): LuaMultiReturn<[unknown[], number]>;

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
	 * Returns all attributes for a player.
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
	 * Returns a player's name.
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
	 * Returns a statistic selected by a `net.PS_*` constant.
	 *
	 * @example `const ping = net.get_stat(id, net.PS_PING);`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:395
	 */
	get_stat(playerId: number, statisticId: number): number;
	/**
	 * Returns a player's coalition.
	 *
	 * @example `const side = net.get_coalition(id);`
	 * @see %DCS_INSTALL_DIR%/Scripts/UI/MultiplayerSelectRoleMap/MultiplayerSelectRole.lua:454
	 */
	get_coalition(playerId: number): number;
	/**
	 * Returns the connected server host/address.
	 *
	 * @example `const host = net.get_server_host();`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/mul_select_role.lua:1932
	 */
	get_server_host(): string | undefined;
	/**
	 * Returns server uptime in seconds.
	 *
	 * @example `const seconds = net.get_server_uptime();`
	 */
	get_server_uptime(): number;
	/**
	 * Tests an address for loopback scope.
	 *
	 * @example `net.is_loopback_address("127.0.0.1");`
	 */
	is_loopback_address(address: string): boolean;
	/**
	 * Tests an address for private-network scope.
	 *
	 * @example `net.is_private_address("192.168.1.1");`
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
	 * Hashes a server password using DCS's native format.
	 *
	 * @example `const hash = net.hash_password(password);`
	 */
	hash_password(password: string): string;
	/**
	 * Checks a password against a native password hash.
	 *
	 * @example `const valid = net.check_password(password, hash);`
	 */
	check_password(password: string, hash: string): boolean;
	/**
	 * Checks whether a client satisfies integrity-check requirements. TODO: requirement/result schemas are native and version-dependent.
	 */
	check_ic_requirements(requirements: unknown): unknown;

	/**
	 * Kicks a player. Server only.
	 *
	 * @example `net.kick(id, "mission restart");`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:387
	 */
	kick(playerId: number, message?: string): boolean;
	/**
	 * Forces a player into a coalition/slot.
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
	 * Attempts to change the local player's slot.
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
	 * @example `net.set_coalition(2, password);`
	 * @see %DCS_INSTALL_DIR%/Scripts/UI/MultiplayerSelectRoleMap/MultiplayerSelectRole.lua:461
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
	 * Resets one join cooldown.
	 *
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/mul_playersPool.lua:316
	 */
	resetJoinCooldownEndForPlayer(id: number): boolean;
	/**
	 * Resets all join cooldowns.
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/Hooks/webGUI.lua:152
	 */
	resetJoinCooldownEndForAll(): boolean;

	/**
	 * Loads a mission, temporarily overriding the server list. Server only.
	 *
	 * @example `net.load_mission(fileName);`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:351
	 */
	load_mission(fileName: string): boolean;
	/**
	 * Loads the next mission in the server list.
	 *
	 * @example `const loaded = net.load_next_mission();`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:355
	 */
	load_next_mission(): boolean;
	/**
	 * Returns the server mission list.
	 *
	 * @example `const missions = net.missionlist_get();`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:456
	 */
	missionlist_get(): NetMissionList;
	/**
	 * Appends a mission file.
	 *
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:466
	 */
	missionlist_append(fileName: string): boolean;
	/**
	 * Deletes a one-based mission-list entry.
	 *
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:468
	 */
	missionlist_delete(index: number): boolean;
	/**
	 * Moves a mission-list entry.
	 *
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:470
	 */
	missionlist_move(oldIndex: number, newIndex: number): boolean;
	/**
	 * Enables/disables mission-list shuffling.
	 *
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:472
	 */
	missionlist_set_shuffle(enabled: boolean): void;
	/**
	 * Enables/disables mission-list looping.
	 *
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:474
	 */
	missionlist_set_loop(enabled: boolean): void;
	/**
	 * Runs a mission-list entry.
	 *
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:476
	 */
	missionlist_run(index: number): boolean;
	/**
	 * Clears the server mission list.
	 *
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:478
	 */
	missionlist_clear(): boolean;
	/**
	 * Returns installed theatre identifiers accepted by the mission list.
	 */
	missionlist_get_installed_theatres(): string[];
	/**
	 * Returns default server settings. Fields are version-dependent.
	 */
	get_default_server_settings(): Record<string, unknown>;
	/**
	 * Returns current server settings. Fields are version-dependent.
	 */
	get_server_settings(): Record<string, unknown>;
	/**
	 * Returns session history records. Their native schema is version-dependent.
	 */
	get_session_history(): unknown[];
	/**
	 * Returns active bans.
	 *
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:438
	 */
	banlist_get(): NetBanRecord[];
	/**
	 * Bans and kicks a player for `periodSeconds`.
	 *
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:449
	 */
	banlist_add(
		playerId: number,
		periodSeconds: number,
		reason?: string,
	): boolean;
	/**
	 * Bans a UCID directly. TODO: optional address/name ordering is native and not in the public API.
	 */
	banlist_add_by_ucid(
		ucid: string,
		periodSeconds: number,
		reason?: string,
	): boolean;
	/**
	 * Removes a ban by UCID.
	 *
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:453
	 */
	banlist_remove(ucid: string): boolean;

	/**
	 * TODO: native server-browser request; installed public docs do not expose the callback/result schema.
	 */
	serverinfo_request(...arguments_: unknown[]): unknown;
	/**
	 * TODO: native server-browser result schema is version-dependent.
	 */
	serverinfo_get(...arguments_: unknown[]): unknown;
	/**
	 * TODO: native server-list search request schema is version-dependent.
	 */
	serverlist_search(...arguments_: unknown[]): unknown;
	/**
	 * TODO: native server-list result schema is version-dependent.
	 */
	serverlist_get(...arguments_: unknown[]): unknown;
	/**
	 * Resets native server-browser search state.
	 */
	serverlist_reset(): void;
	/**
	 * TODO: native RPC request payload and return identifier are not documented in the installed API.
	 */
	send_rpc_request(...arguments_: unknown[]): unknown;
	/**
	 * TODO: native RPC result payload is not documented in the installed API.
	 */
	send_rpc_result(...arguments_: unknown[]): unknown;
	/**
	 * TODO: native RPC error payload is not documented in the installed API.
	 */
	send_rpc_error(...arguments_: unknown[]): unknown;
	/**
	 * TODO: native screenshot request identifiers/schema are undocumented.
	 */
	screenshot_request(...arguments_: unknown[]): unknown;
	/**
	 * TODO: native screenshot deletion identifiers/schema are undocumented.
	 */
	screenshot_del(...arguments_: unknown[]): unknown;
	/**
	 * TODO: native client-start connection options are version-dependent.
	 */
	start_client(...arguments_: unknown[]): unknown;
	/**
	 * TODO: native server-start options are version-dependent; prefer documented server settings files.
	 */
	start_server(...arguments_: unknown[]): unknown;
	/**
	 * Stops active network services.
	 */
	stop_network(): void;
	/**
	 * Stops the active multiplayer game.
	 */
	stop_game(): void;
	/**
	 * Restarts the active multiplayer game.
	 */
	restart(): void;
	/**
	 * TODO: native dynamic-player spawn payload is version-dependent.
	 */
	spawn_player(...arguments_: unknown[]): unknown;
}
