/** @noSelfInFile */

import type { l_net, NetPlayerInfo } from "../../../src";
import { netConstants } from "../constants";
import { copy, type DoubleContext } from "../context";
import { decode, encode } from "../json";

/** `CHAT_ALL` / `CHAT_TEAM` as the doubles route them (see `constants.ts`). */
const CHAT_ALL = netConstants.CHAT_ALL;
const CHAT_TEAM = netConstants.CHAT_TEAM;

function hexOf(text: string): string {
	const [hex] = string.gsub(text, ".", (character: string) =>
		string.format("%02x", string.byte(character)),
	);
	return hex;
}

function isPrivateIPv4(address: string): boolean {
	const [a, b] = string.match(address, "^(%d+)%.(%d+)%.%d+%.%d+$");
	if (a === undefined) return false;
	const first = tonumber(a) as number;
	const second = tonumber(b) as number;
	return (
		first === 10 ||
		(first === 172 && second >= 16 && second <= 31) ||
		(first === 192 && second === 168)
	);
}

/**
 * `net` double: a single-player "server" whose only player is the local one (`state.players`).
 * Chat, bans, the mission list and player slots live in the state. `dostring_in` runs the source in
 * a sandbox per environment (`state.environments`) and returns the result as text, or `undefined`
 * for an unknown environment or a Lua error.
 */
export function createNet(ctx: DoubleContext): l_net {
	const s = () => ctx.state();
	const player = (playerId: number): NetPlayerInfo | undefined => {
		for (const candidate of s().players)
			if (candidate.id === playerId) return candidate;
		return undefined;
	};
	const trace = (subsystem: string, message: string) =>
		s().logRecords.push({ subsystem, level: 8, message });
	// One implementation serves both `get_player_info` overloads.
	const getPlayerInfo = ((
		playerId: number,
		attribute?: keyof NetPlayerInfo,
	) => {
		const found = player(playerId);
		if (found === undefined) return undefined;
		return attribute === undefined ? copy(found) : found[attribute];
	}) as l_net["get_player_info"];
	const ban = (
		ucid: string,
		name: string,
		ipaddr: string,
		period: number,
		reason?: string,
	) => {
		s().bans.push({
			ucid,
			ipaddr,
			name,
			reason: reason ?? "",
			banned_from: s().realTime,
			banned_until: s().realTime + period,
		});
	};

	return {
		...netConstants,

		dostring_in: (env, luaScript) => {
			const sandbox = s().environments[env];
			if (sandbox === undefined) return undefined;
			const [chunk] = loadstring(luaScript, `=[dostring_in ${env}]`);
			if (chunk === undefined) return undefined;
			setmetatable(sandbox, { __index: _G });
			setfenv(chunk, sandbox);
			const [ok, result] = pcall(chunk);
			if (!ok) return undefined;
			return result === undefined ? "" : tostring(result);
		},
		log: (message) => trace("LuaNET", message),
		trace: (message) => trace("LuaNET.trace", message),

		// Chat
		send_chat: (message, all) => {
			s().chat.push({
				from: s().myPlayerId,
				to: all ? CHAT_ALL : CHAT_TEAM,
				message,
			});
		},
		send_chat_to: (message, playerId) => {
			s().chat.push({ from: s().myPlayerId, to: playerId, message });
		},
		recv_chat: (message, fromPlayerId = 0) => {
			s().chat.push({ from: fromPlayerId, to: s().myPlayerId, message });
		},
		get_chat_history: (fromIndex) => {
			const records = [];
			const chat = s().chat;
			for (let index = math.max(fromIndex, 0); index < chat.length; index++)
				records.push(copy(chat[index]));
			return $multi(records, chat.length);
		},

		// Players
		get_player_list: () => s().players.map((candidate) => candidate.id),
		get_my_player_id: () => s().myPlayerId,
		get_server_id: () => s().serverId,
		get_player_info: getPlayerInfo,
		get_name: (playerId) => player(playerId)?.name,
		get_slot: (playerId) => {
			const found = player(playerId);
			if (found === undefined) return $multi(0, "");
			return $multi(found.side, found.slot);
		},
		get_stat: (playerId, statisticId) =>
			s().playerStats[playerId]?.[statisticId] ?? 0,
		get_coalition: (playerId) => player(playerId)?.side ?? 0,
		get_server_host: () => s().serverHost,
		get_server_uptime: () => s().modelTime,
		is_loopback_address: (address) =>
			string.find(address, "^127%.")[0] !== undefined ||
			address === "::1" ||
			address === "localhost",
		is_private_address: (address) => isPrivateIPv4(address),

		// Serialization and passwords
		lua2json: (value) => encode(value),
		json2lua: (json) => decode(json),
		hash_password: (password) => `hash:${hexOf(password)}`,
		check_password: (password, hash) => hash === `hash:${hexOf(password)}`,
		check_ic_requirements: (requirements) => {
			ctx.native("net.check_ic_requirements", [requirements]);
			return true;
		},

		// Moderation
		kick: (playerId, message) => {
			const players = s().players;
			for (let index = 0; index < players.length; index++)
				if (players[index].id === playerId) {
					ctx.native("net.kick", [playerId, message]);
					players.splice(index, 1);
					return true;
				}
			return false;
		},
		force_player_slot: (playerId, sideId, slotId) => {
			const found = player(playerId);
			if (found === undefined) return false;
			found.side = sideId;
			found.slot = slotId;
			return true;
		},
		set_slot: (sideId, slotId) => {
			const me = player(s().myPlayerId);
			if (me === undefined) return undefined;
			me.side = sideId;
			me.slot = slotId;
			return true;
		},
		set_coalition: (sideId) => {
			const me = player(s().myPlayerId);
			if (me === undefined) return undefined;
			me.side = sideId;
			me.slot = "";
			return true;
		},
		set_name: (playerId, name) => {
			const found = player(playerId);
			if (found !== undefined) found.name = name;
		},
		resetJoinCooldownEndForPlayer: (id) => player(id) !== undefined,
		resetJoinCooldownEndForAll: () => true,
		banlist_get: () => copy(s().bans),
		banlist_add: (playerId, periodSeconds, reason) => {
			const found = player(playerId);
			if (found === undefined) return false;
			ban(
				found.ucid ?? "",
				found.name,
				found.ipaddr ?? "",
				periodSeconds,
				reason,
			);
			return true;
		},
		banlist_add_by_ucid: (ucid, periodSeconds, reason) => {
			ban(ucid, "", "", periodSeconds, reason);
			return true;
		},
		banlist_remove: (ucid) => {
			const bans = s().bans;
			for (let index = 0; index < bans.length; index++)
				if (bans[index].ucid === ucid) {
					bans.splice(index, 1);
					return true;
				}
			return false;
		},

		// Missions (list indices are 1-based, as in DCS)
		load_mission: (fileName) => {
			s().missionFilename = fileName;
			s().missionLoaded = true;
			return true;
		},
		load_next_mission: () => {
			const list = s().missionList;
			if (list.current >= list.missionList.length) {
				if (!list.listLoop) return false;
				list.current = 0;
			}
			list.current++;
			s().missionFilename = list.missionList[list.current - 1];
			return true;
		},
		missionlist_get: () => copy(s().missionList),
		missionlist_append: (fileName) => {
			s().missionList.missionList.push(fileName);
			return true;
		},
		missionlist_delete: (index) => {
			const list = s().missionList.missionList;
			if (index < 1 || index > list.length) return false;
			list.splice(index - 1, 1);
			return true;
		},
		missionlist_move: (oldIndex, newIndex) => {
			const list = s().missionList.missionList;
			if (
				oldIndex < 1 ||
				oldIndex > list.length ||
				newIndex < 1 ||
				newIndex > list.length
			)
				return false;
			const [moved] = list.splice(oldIndex - 1, 1);
			list.splice(newIndex - 1, 0, moved);
			return true;
		},
		missionlist_set_shuffle: (enabled) => {
			s().missionList.listShuffle = enabled;
		},
		missionlist_set_loop: (enabled) => {
			s().missionList.listLoop = enabled;
		},
		missionlist_run: (index) => {
			const list = s().missionList;
			if (index < 1 || index > list.missionList.length) return false;
			list.current = index;
			s().missionFilename = list.missionList[index - 1];
			return true;
		},
		missionlist_clear: () => {
			s().missionList.missionList = [];
			s().missionList.current = 0;
			return true;
		},
		missionlist_get_installed_theatres: () => copy(s().installedTheatres),
		get_default_server_settings: () => ({
			name: "DCS Server",
			port: 10308,
			maxPlayers: 16,
			password: "",
		}),
		get_server_settings: () => copy(s().serverSettings),
		get_session_history: () => [],

		// Network lifecycle
		stop_network: () => {
			ctx.native("net.stop_network", []);
			s().multiplayer = false;
		},
		stop_game: () => {
			ctx.native("net.stop_game", []);
			s().missionLoaded = false;
		},
		restart: () => {
			ctx.native("net.restart", []);
			s().modelTime = 0;
		},
		serverlist_reset: () => {
			ctx.native("net.serverlist_reset", []);
		},

		// Native functions without a documented contract
		serverinfo_request: (...arguments_) =>
			ctx.native("net.serverinfo_request", arguments_),
		serverinfo_get: (...arguments_) =>
			ctx.native("net.serverinfo_get", arguments_),
		serverlist_search: (...arguments_) =>
			ctx.native("net.serverlist_search", arguments_),
		serverlist_get: (...arguments_) =>
			ctx.native("net.serverlist_get", arguments_),
		send_rpc_request: (...arguments_) =>
			ctx.native("net.send_rpc_request", arguments_),
		send_rpc_result: (...arguments_) =>
			ctx.native("net.send_rpc_result", arguments_),
		send_rpc_error: (...arguments_) =>
			ctx.native("net.send_rpc_error", arguments_),
		screenshot_request: (...arguments_) =>
			ctx.native("net.screenshot_request", arguments_),
		screenshot_del: (...arguments_) =>
			ctx.native("net.screenshot_del", arguments_),
		start_client: (...arguments_) => ctx.native("net.start_client", arguments_),
		start_server: (...arguments_) => ctx.native("net.start_server", arguments_),
		spawn_player: (...arguments_) => ctx.native("net.spawn_player", arguments_),
	};
}
