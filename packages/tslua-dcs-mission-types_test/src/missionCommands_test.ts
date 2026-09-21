import { describe, expect, test } from "@flying-dice/tslua-luatest";

describe("missionCommands examples", () => {
	test("all menu construction and removal exports are present", () => {
		for (const value of [
			missionCommands.addCommand,
			missionCommands.addCommandForCoalition,
			missionCommands.addCommandForGroup,
			missionCommands.addSubMenu,
			missionCommands.addSubMenuForCoalition,
			missionCommands.addSubMenuForGroup,
			missionCommands.doAction,
			missionCommands.removeItem,
			missionCommands.removeItemForCoalition,
			missionCommands.removeItemForGroup,
		])
			expect(type(value)).toBe("function");
	});
});
