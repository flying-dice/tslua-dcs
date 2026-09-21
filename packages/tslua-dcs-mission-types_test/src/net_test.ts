import { describe, expect, test } from "@flying-dice/tslua-luatest";

describe("net examples", () => {
	test("serialization, address, and logging helpers execute", () => {
		const json = net.lua2json({ ready: true, count: 2 });
		expect(type(json)).toBe("string");
		expect(type(net.json2lua(json))).toBe("table");
		expect(net.is_loopback_address("127.0.0.1")).toBe(true);
		expect(type(net.is_private_address("192.168.1.1"))).toBe("boolean");
		net.log("tslua-dcs mission net example");
		net.trace("tslua-dcs mission net trace example");
	});

	test("dostring_in returns text when mission access is enabled", () => {
		const result = net.dostring_in("mission", "return 'tslua-dcs'");
		expect(result === undefined || result === "tslua-dcs").toBe(true);
	});

	test("player inspection helpers expose stable runtime kinds", () => {
		expect(type(net.get_player_list())).toBe("table");
		const playerId = net.get_my_player_id();
		if (playerId !== undefined) {
			expect(type(playerId)).toBe("number");
			const info = net.get_player_info(playerId);
			expect(info === undefined || type(info) === "table").toBe(true);
		}
	});

	test("state-changing network exports are present but not invoked", () => {
		for (const value of [
			net.force_player_slot,
			net.kick,
			net.recv_chat,
			net.resetJoinCooldownEndForAll,
			net.resetJoinCooldownEndForPlayer,
			net.send_chat,
			net.send_chat_to,
			net.set_coalition,
			net.set_name,
			net.set_slot,
			net.get_coalition,
			net.get_name,
			net.get_server_host,
			net.get_server_id,
			net.get_slot,
			net.get_stat,
		])
			expect(type(value)).toBe("function");
	});
});
