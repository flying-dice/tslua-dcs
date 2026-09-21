import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { unitFixture } from "./fixtures";

describe("Controller examples", () => {
	test("controller inspection returns documented values", () => {
		const controller = unitFixture().getController();
		expect(type(controller.hasTask())).toBe("boolean");
		expect(type(controller.getDetectedTargets())).toBe("table");
	});

	test("tasking and command exports are present", () => {
		const controller = unitFixture().getController();
		for (const value of [
			controller.isTargetDetected,
			controller.knowTarget,
			controller.popTask,
			controller.pushTask,
			controller.resetTask,
			controller.setAltitude,
			controller.setCommand,
			controller.setOnOff,
			controller.setOption,
			controller.setSpeed,
			controller.setTask,
		])
			expect(type(value)).toBe("function");
	});
});
