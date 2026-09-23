import {
	afterEach,
	beforeEach,
	describe,
	expect,
	test,
} from "@flying-dice/tslua-luatest";
import { LogLevel, Logger } from "../src";
import {
	METHODS,
	type TransportMocks,
	installMockTransports,
	resetLogger,
} from "./helpers";

// Every combination of Logger.level and log method: a method logs when its level is >= Logger.level.
describe("level filtering", () => {
	let transports: TransportMocks;
	const logger = new Logger("Levels");

	beforeEach(() => {
		transports = installMockTransports();
	});

	afterEach(() => resetLogger());

	const levels: Array<[string, LogLevel]> = [
		["TRACE", LogLevel.TRACE],
		["DEBUG", LogLevel.DEBUG],
		["INFO", LogLevel.INFO],
		["WARN", LogLevel.WARN],
		["ERROR", LogLevel.ERROR],
		["OFF", LogLevel.OFF],
	];

	for (const [levelName, level] of levels) {
		for (const { method, level: methodLevel, tag } of METHODS) {
			const enabled = methodLevel >= level;
			test(`at ${levelName}, ${method} ${enabled ? "logs" : "is filtered"}`, () => {
				Logger.level = level;
				logger[method]("m");
				if (enabled) {
					expect(transports[method]).toHaveBeenCalledTimes(1);
					expect(transports[method]).toHaveBeenCalledWith(
						`[${tag}] [Levels] - m`,
					);
				} else {
					expect(transports[method]).not.toHaveBeenCalled();
				}
			});
		}
	}

	test("a custom level between two named levels filters by numeric comparison", () => {
		Logger.level = 25 as LogLevel;
		logger.debug("d");
		logger.info("i");
		expect(transports.debug).not.toHaveBeenCalled();
		expect(transports.info).toHaveBeenCalledWith("[INFO] [Levels] - i");
	});

	test("a level below TRACE logs everything", () => {
		Logger.level = 0 as LogLevel;
		for (const { method } of METHODS) logger[method]("m");
		for (const { method } of METHODS)
			expect(transports[method], method).toHaveBeenCalledTimes(1);
	});

	test("a level between ERROR and OFF logs nothing", () => {
		Logger.level = 51 as LogLevel;
		for (const { method } of METHODS) logger[method]("m");
		for (const { method } of METHODS)
			expect(transports[method], method).not.toHaveBeenCalled();
	});

	test("changing the level takes effect immediately", () => {
		Logger.level = LogLevel.ERROR;
		logger.info("before");
		Logger.level = LogLevel.INFO;
		logger.info("after");
		expect(transports.info).toHaveBeenCalledTimes(1);
		expect(transports.info).toHaveBeenCalledWith("[INFO] [Levels] - after");
	});
});
