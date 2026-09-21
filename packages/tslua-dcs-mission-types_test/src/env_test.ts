import { describe, expect, test } from "@flying-dice/tslua-luatest";

describe("env examples", () => {
	test("logging functions accept documented arguments", () => {
		env.info("tslua-dcs example: info");
		env.warning("tslua-dcs example: warning");
		env.error("tslua-dcs example: error");
		expect(true).toBe(true);
	});

	test("getMissionName returns text", () => {
		const missionName = env.getMissionName();
		expect(type(missionName)).toBe("string");
	});

	test("message boxes can be disabled and restored", () => {
		env.setErrorMessageBoxEnabled(false);
		env.setErrorMessageBoxEnabled(true);
		expect(true).toBe(true);
	});

	test("localization and mode helpers return text", () => {
		expect(type(env.getValueDictByKey("__tslua_dcs_missing_key__"))).toBe(
			"string",
		);
		expect(type(env.getMode())).toBe("number");
		expect(type(env.showTraining)).toBe("function");
		expect(type(env.crash)).toBe("function");
	});
});
