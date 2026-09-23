import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { LogLevel, Logger } from "../src";

// Declared before any other suite changes the static state; deferred mode runs suites in declaration order.
describe("Logger defaults", () => {
	test("the default level is INFO", () => {
		expect(Logger.level).toBe(LogLevel.INFO);
	});

	test("every default transport is Logger.ignore", () => {
		expect(Logger.transports.trace).toBe(Logger.ignore);
		expect(Logger.transports.debug).toBe(Logger.ignore);
		expect(Logger.transports.info).toBe(Logger.ignore);
		expect(Logger.transports.warn).toBe(Logger.ignore);
		expect(Logger.transports.error).toBe(Logger.ignore);
	});

	test("logging with the defaults does nothing and does not throw", () => {
		const logger = new Logger("Defaults");
		expect(() => {
			logger.trace("t");
			logger.debug("d");
			logger.info("i");
			logger.warn("w");
			logger.error("e");
		}).not.toThrow();
	});

	test("Logger.ignore returns nothing whatever it is given", () => {
		expect(Logger.ignore()).toBeUndefined();
		const ignore = Logger.ignore as (this: void, ...args: unknown[]) => unknown;
		expect(ignore("message", 1, {})).toBeUndefined();
	});
});

describe("LogLevel", () => {
	test("has the documented numeric values", () => {
		expect(LogLevel.TRACE).toBe(10);
		expect(LogLevel.DEBUG).toBe(20);
		expect(LogLevel.INFO).toBe(30);
		expect(LogLevel.WARN).toBe(40);
		expect(LogLevel.ERROR).toBe(50);
		expect(LogLevel.OFF).toBe(100);
	});

	test("levels are ordered from most to least verbose, OFF last", () => {
		const ordered = [
			LogLevel.TRACE,
			LogLevel.DEBUG,
			LogLevel.INFO,
			LogLevel.WARN,
			LogLevel.ERROR,
			LogLevel.OFF,
		];
		for (let i = 1; i < ordered.length; i++) {
			expect(ordered[i], `level #${i + 1}`).toBeGreaterThan(ordered[i - 1]);
		}
	});

	test("maps values back to names", () => {
		expect(LogLevel[10]).toBe("TRACE");
		expect(LogLevel[20]).toBe("DEBUG");
		expect(LogLevel[30]).toBe("INFO");
		expect(LogLevel[40]).toBe("WARN");
		expect(LogLevel[50]).toBe("ERROR");
		expect(LogLevel[100]).toBe("OFF");
	});
});
