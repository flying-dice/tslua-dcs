import type {
	l_missionCommands,
	l_net,
	MissionCommandPath,
	NetPlayerInfo,
} from "@flying-dice/tslua-dcs-mission-types";
import { netConstants } from "./constants";
import { log } from "./environment";
import { decode, encode } from "./json";
import type { Double } from "./runtime";
import { type MenuItem, state } from "./state";

// ---------------------------------------------------------------------------------------------------
// missionCommands: an F10 menu tree per scope ("all", "coalition:<id>", "group:<id>")
// ---------------------------------------------------------------------------------------------------

function samePrefix(path: string[], prefix: string[]): boolean {
	if (path.length < prefix.length) return false;
	for (let index = 0; index < prefix.length; index++)
		if (path[index] !== prefix[index]) return false;
	return true;
}

function addItem(
	scope: string,
	kind: MenuItem["kind"],
	name: string,
	parent: MissionCommandPath | undefined,
	callback?: (this: void, argument: unknown) => void,
	argument?: unknown,
): MissionCommandPath {
	const path = [...(parent ?? []), name];
	removeItems(scope, path);
	state.menus.push({ path, scope, kind, callback, argument });
	return [...path];
}

function removeItems(
	scope: string,
	path: MissionCommandPath | undefined,
): void {
	state.menus = state.menus.filter(
		(item) => item.scope !== scope || !samePrefix(item.path, path ?? []),
	);
}

/** Finds a command by scope and path, as a player selecting it in the F10 menu would. */
export function findMenuItem(
	path: string[],
	scope = "all",
): MenuItem | undefined {
	return state.menus.find(
		(item) =>
			item.scope === scope &&
			item.path.length === path.length &&
			samePrefix(item.path, path),
	);
}

export const missionCommands = {
	addCommand: (name, path, callback, argument) =>
		addItem(
			"all",
			"command",
			name,
			path,
			callback as MenuItem["callback"],
			argument,
		),
	addCommandForCoalition: (coalitionId, name, path, callback, argument) =>
		addItem(
			`coalition:${coalitionId}`,
			"command",
			name,
			path,
			callback as MenuItem["callback"],
			argument,
		),
	addCommandForGroup: (groupId, name, path, callback, argument) =>
		addItem(
			`group:${groupId}`,
			"command",
			name,
			path,
			callback as MenuItem["callback"],
			argument,
		),
	addSubMenu: (name, path) => addItem("all", "submenu", name, path),
	addSubMenuForCoalition: (coalitionId, name, path) =>
		addItem(`coalition:${coalitionId}`, "submenu", name, path),
	addSubMenuForGroup: (groupId, name, path) =>
		addItem(`group:${groupId}`, "submenu", name, path),
	removeItem: (path) => removeItems("all", path),
	removeItemForCoalition: (coalitionId, path) =>
		removeItems(`coalition:${coalitionId}`, path),
	removeItemForGroup: (groupId, path) => removeItems(`group:${groupId}`, path),
	doAction: (actionId) => {
		log("info", `missionCommands.doAction(${actionId})`);
	},
} satisfies Double<l_missionCommands>;

// ---------------------------------------------------------------------------------------------------
// net
// ---------------------------------------------------------------------------------------------------

function player(playerId: number) {
	return state.players.find((candidate) => candidate.id === playerId);
}

function startsWith(text: string, prefix: string): boolean {
	return string.sub(text, 1, prefix.length) === prefix;
}

function getPlayerInfo(this: void, playerId: number): NetPlayerInfo | undefined;
function getPlayerInfo(
	this: void,
	playerId: number,
	attribute: keyof NetPlayerInfo,
): unknown;
function getPlayerInfo(
	this: void,
	playerId: number,
	attribute?: keyof NetPlayerInfo,
): unknown {
	const found = player(playerId);
	if (!found) return undefined;
	if (attribute !== undefined)
		return (found as Record<string, unknown>)[attribute as string];
	return { ...found };
}

export const net = {
	...netConstants,
	lua2json: (value: unknown) => encode(value),
	json2lua: (json: string) => decode(json),
	dostring_in: (stateName: string, luaSource: string): string | undefined => {
		const [chunk, compileError] = loadstring(luaSource, `=${stateName}`);
		if (!chunk) return `error: ${compileError}`;
		const [ok, result] = pcall(chunk);
		if (!ok) return `error: ${tostring(result)}`;
		return result === undefined ? "" : tostring(result);
	},
	log: (message: string) => log("net", message),
	trace: (message: string) => log("trace", message),
	send_chat: (message: string, all: boolean) => {
		state.chat.push({ message, to: all ? undefined : -1 });
	},
	send_chat_to: (message: string, playerId: number) => {
		state.chat.push({ message, to: playerId });
	},
	recv_chat: (message: string, fromPlayerId?: number) => {
		state.chat.push({ message, from: fromPlayerId });
	},
	get_player_list: () => state.players.map((candidate) => candidate.id),
	get_my_player_id: () => 1,
	get_server_id: () => 1,
	get_player_info: getPlayerInfo,
	get_name: (playerId: number) => player(playerId)?.name,
	get_slot: (playerId: number): LuaMultiReturn<[number, number | string]> => {
		const found = player(playerId);
		return $multi(found?.side ?? 0, found?.slot ?? "");
	},
	get_stat: (_playerId: number, _statisticId: number) => 0,
	get_coalition: (playerId: number) => player(playerId)?.side ?? 0,
	get_server_host: () => "127.0.0.1",
	is_loopback_address: (address: string) =>
		startsWith(address, "127.") || address === "::1" || address === "localhost",
	is_private_address: (address: string) => {
		if (startsWith(address, "10.") || startsWith(address, "192.168."))
			return true;
		const [second] = string.match(address, "^172%.(%d+)%.");
		const octet = second === undefined ? undefined : tonumber(second);
		return octet !== undefined && octet >= 16 && octet <= 31;
	},
	kick: (playerId: number, message?: string) => {
		if (playerId === 1 || !player(playerId)) return false;
		state.players = state.players.filter(
			(candidate) => candidate.id !== playerId,
		);
		log("net", `kicked ${playerId}: ${message ?? ""}`);
		return true;
	},
	force_player_slot: (
		playerId: number,
		sideId: number,
		slotId: number | string,
	) => {
		const found = player(playerId);
		if (!found) return false;
		found.side = sideId;
		found.slot = slotId;
		return true;
	},
	set_slot: (sideId: number, slotId: number | string) => {
		const found = player(1);
		if (!found) return false;
		found.side = sideId;
		found.slot = slotId;
		return true;
	},
	set_coalition: (sideId: number) => {
		const found = player(1);
		if (!found) return false;
		found.side = sideId;
		return true;
	},
	set_name: (playerId: number, name: string) => {
		const found = player(playerId);
		if (found) found.name = name;
	},
	resetJoinCooldownEndForPlayer: (id: number) => player(id) !== undefined,
	resetJoinCooldownEndForAll: () => true,
} satisfies Double<l_net>;
