import {
	afterEach,
	beforeEach,
	describe,
	expect,
	restoreAllMocks,
	spyOn,
	test,
} from "@flying-dice/tslua-luatest";
import { LogLevel, Logger } from "../src";
import { resetLogger } from "./helpers";

// Wiring Logger to real Lua / DCS output functions. `env` and `log` are the doubles from
// tests/doubles/dcs-env.lua, installed with `lua51 --preload`; they record every call in `__dcsLog.calls`.
describe("DCS transports", () => {
	beforeEach(() => {
		__dcsLog.clear();
		Logger.level = LogLevel.TRACE;
	});

	afterEach(() => {
		restoreAllMocks();
		resetLogger();
	});

	test("the preload installed the DCS doubles", () => {
		expect(env).toBeTypeOf("table");
		expect(env.info).toBeTypeOf("function");
		expect(log.write).toBeTypeOf("function");
	});

	test("env.info / env.warning / env.error can be assigned directly and receive only the message", () => {
		Logger.transports = {
			trace: env.info,
			debug: env.info,
			info: env.info,
			warn: env.warning,
			error: env.error,
		};
		const logger = new Logger("Mission");
		logger.trace("t");
		logger.debug("d");
		logger.info("i");
		logger.warn("w");
		logger.error("e");

		expect(__dcsLog.calls).toHaveLength(5);
		expect(__dcsLog.calls[0]).toEqual({
			fn: "env.info",
			n: 1,
			args: ["[TRACE] [Mission] - t"],
		});
		expect(__dcsLog.calls[1]).toEqual({
			fn: "env.info",
			n: 1,
			args: ["[DEBUG] [Mission] - d"],
		});
		expect(__dcsLog.calls[2]).toEqual({
			fn: "env.info",
			n: 1,
			args: ["[INFO] [Mission] - i"],
		});
		expect(__dcsLog.calls[3]).toEqual({
			fn: "env.warning",
			n: 1,
			args: ["[WARN] [Mission] - w"],
		});
		expect(__dcsLog.calls[4]).toEqual({
			fn: "env.error",
			n: 1,
			args: ["[ERROR] [Mission] - e"],
		});
	});

	test("the level filter applies before the DCS function is reached", () => {
		Logger.level = LogLevel.WARN;
		Logger.transports = {
			trace: env.info,
			debug: env.info,
			info: env.info,
			warn: env.warning,
			error: env.error,
		};
		const logger = new Logger("Mission");
		logger.info("dropped");
		logger.error("kept");
		expect(__dcsLog.calls).toHaveLength(1);
		expect(__dcsLog.calls[0].fn).toBe("env.error");
	});

	test("log.write (GUI environment) can be used through arrow-function adapters", () => {
		Logger.transports = {
			trace: (message) => log.write("MyMod", log.TRACE, message),
			debug: (message) => log.write("MyMod", log.DEBUG, message),
			info: (message) => log.write("MyMod", log.INFO, message),
			warn: (message) => log.write("MyMod", log.WARNING, message),
			error: (message) => log.write("MyMod", log.ERROR, message),
		};
		const logger = new Logger("Hooks");
		logger.info("i");
		logger.warn("w");
		logger.error("e");
		expect(__dcsLog.calls).toEqual([
			{
				fn: "log.write",
				n: 3,
				args: ["MyMod", log.INFO, "[INFO] [Hooks] - i"],
			},
			{
				fn: "log.write",
				n: 3,
				args: ["MyMod", log.WARNING, "[WARN] [Hooks] - w"],
			},
			{
				fn: "log.write",
				n: 3,
				args: ["MyMod", log.ERROR, "[ERROR] [Hooks] - e"],
			},
		]);
	});

	test("spyOn a DCS global sees the exact call", () => {
		const info = spyOn(env, "info");
		Logger.transports = { ...Logger.transports, info: env.info };
		new Logger("Spy").info("hello");
		expect(info).toHaveBeenCalledTimes(1);
		expect(info).toHaveBeenCalledWith("[INFO] [Spy] - hello");
		// spyOn calls through to the double.
		expect(__dcsLog.calls[0]).toEqual({
			fn: "env.info",
			n: 1,
			args: ["[INFO] [Spy] - hello"],
		});
	});

	test("print can be assigned directly and prints only the message", () => {
		const printed: unknown[][] = [];
		const printSpy = spyOn(_G, "print").mockImplementation(
			(...args: unknown[]) => {
				printed.push(args);
			},
		);
		// Read print from _G at call time so the spy is used.
		Logger.transports = {
			...Logger.transports,
			info: _G.print as typeof print,
		};
		new Logger("Print").info("to stdout");
		printSpy.mockRestore();
		expect(printed).toEqual([["[INFO] [Print] - to stdout"]]);
	});
});
