import { describe, expect, test } from "@flying-dice/tslua-luatest";

describe("log examples", () => {
	test("documented logging calls execute", () => {
		log.debug("tslua-dcs GUI example: %s", "debug");
		log.info("tslua-dcs GUI example: %s", "info");
		log.warning("tslua-dcs GUI example: %s", "warning");
		log.error("tslua-dcs GUI example: %s", "error");
		log.write("tslua-dcs", log.INFO, "GUI bridge example %d", 1);
		expect(true).toBe(true);
	});

	test("non-destructive log exports are present", () => {
		expect(type(log.alert)).toBe("function");
		expect(type(log.backup)).toBe("function");
		expect(type(log.set_output)).toBe("function");
		expect(type(log.set_output_rules)).toBe("function");
	});
});
