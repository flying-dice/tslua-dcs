import { describe, expect, test } from "@flying-dice/tslua-luatest";

describe("timer examples", () => {
	test("time getters return numbers", () => {
		expect(type(timer.getAbsTime())).toBe("number");
		expect(type(timer.getTime())).toBe("number");
		expect(type(timer.getTime0())).toBe("number");
	});

	test("getPause returns a boolean", () => {
		expect(type(timer.getPause())).toBe("boolean");
	});

	test("scheduleFunction can be rescheduled and removed", () => {
		const functionId = timer.scheduleFunction(
			(_message: string, time) => time + 60,
			"Runs every minute",
			timer.getTime() + 60,
		);
		const newRunTime = timer.getTime() + 30;
		const scheduledTime = timer.setFunctionTime(functionId, newRunTime);
		expect(math.abs(scheduledTime - newRunTime) < 0.001).toBe(true);
		timer.removeFunction(functionId);
	});
});
