import type { l_net } from "@flying-dice/tslua-dcs-gui-types";
import { describe, expect, test } from "@flying-dice/tslua-luatest";

const checkedNet: l_net = net;

describe("net examples", () => {
	test("dostring_in returns text from the mission environment", () => {
		const result = checkedNet.dostring_in("mission", "return 'tslua-dcs'");
		expect(result).toBe("tslua-dcs");
	});

	test("safe network helpers execute", () => {
		const json = checkedNet.lua2json({ ready: true, count: 2 });
		expect(type(json)).toBe("string");
		expect(type(checkedNet.json2lua(json))).toBe("table");
		expect(checkedNet.is_loopback_address("127.0.0.1")).toBe(true);
		expect(type(checkedNet.is_private_address("192.168.1.1"))).toBe("boolean");
		checkedNet.log("tslua-dcs GUI net example");
		checkedNet.trace("tslua-dcs GUI net trace example");
		expect(type(checkedNet.get_player_list())).toBe("table");
	});

	test("every generated network function has a runtime export", () => {
		for (const value of [
			checkedNet.banlist_add,
			checkedNet.banlist_add_by_ucid,
			checkedNet.banlist_get,
			checkedNet.banlist_remove,
			checkedNet.check_ic_requirements,
			checkedNet.check_password,
			checkedNet.force_player_slot,
			checkedNet.get_chat_history,
			checkedNet.get_coalition,
			checkedNet.get_default_server_settings,
			checkedNet.get_my_player_id,
			checkedNet.get_name,
			checkedNet.get_player_info,
			checkedNet.get_player_list,
			checkedNet.get_server_host,
			checkedNet.get_server_id,
			checkedNet.get_server_settings,
			checkedNet.get_server_uptime,
			checkedNet.get_session_history,
			checkedNet.get_slot,
			checkedNet.get_stat,
			checkedNet.hash_password,
			checkedNet.kick,
			checkedNet.load_mission,
			checkedNet.load_next_mission,
			checkedNet.missionlist_append,
			checkedNet.missionlist_clear,
			checkedNet.missionlist_delete,
			checkedNet.missionlist_get,
			checkedNet.missionlist_get_installed_theatres,
			checkedNet.missionlist_move,
			checkedNet.missionlist_run,
			checkedNet.missionlist_set_loop,
			checkedNet.missionlist_set_shuffle,
			checkedNet.recv_chat,
			checkedNet.resetJoinCooldownEndForAll,
			checkedNet.resetJoinCooldownEndForPlayer,
			checkedNet.restart,
			checkedNet.screenshot_del,
			checkedNet.screenshot_request,
			checkedNet.send_chat,
			checkedNet.send_chat_to,
			checkedNet.send_rpc_error,
			checkedNet.send_rpc_request,
			checkedNet.send_rpc_result,
			checkedNet.serverinfo_get,
			checkedNet.serverinfo_request,
			checkedNet.serverlist_get,
			checkedNet.serverlist_reset,
			checkedNet.serverlist_search,
			checkedNet.set_coalition,
			checkedNet.set_name,
			checkedNet.set_slot,
			checkedNet.spawn_player,
			checkedNet.start_client,
			checkedNet.start_server,
			checkedNet.stop_game,
			checkedNet.stop_network,
		])
			expect(type(value)).toBe("function");
	});
});
