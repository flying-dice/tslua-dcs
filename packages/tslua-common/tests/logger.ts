import {
	afterEach,
	beforeEach,
	describe,
	expect,
	fn,
	test,
} from "@flying-dice/tslua-luatest";
import { LogLevel, Logger, type LoggerTransports } from "../src";
import {
	METHODS,
	type TransportMocks,
	installMockTransports,
	resetLogger,
} from "./helpers";

// Ported from the former vitest suite (src/logger.test.ts), then extended.
describe("Logger", () => {
	let logger: Logger;
	let transports: TransportMocks;

	beforeEach(() => {
		Logger.level = LogLevel.DEBUG;
		transports = installMockTransports();
		logger = new Logger("TestLogger");
	});

	afterEach(() => resetLogger());

	test("should log trace messages", () => {
		Logger.level = LogLevel.TRACE;
		logger.trace("Trace message");
		expect(transports.trace).toHaveBeenCalledWith(
			"[TRACE] [TestLogger] - Trace message",
		);
	});

	test("should log debug messages", () => {
		logger.debug("Debug message");
		expect(transports.debug).toHaveBeenCalledWith(
			"[DEBUG] [TestLogger] - Debug message",
		);
	});

	test("should log info messages", () => {
		logger.info("Info message");
		expect(transports.info).toHaveBeenCalledWith(
			"[INFO] [TestLogger] - Info message",
		);
	});

	test("should log warn messages", () => {
		logger.warn("Warn message");
		expect(transports.warn).toHaveBeenCalledWith(
			"[WARN] [TestLogger] - Warn message",
		);
	});

	test("should log error messages", () => {
		logger.error("Error message");
		expect(transports.error).toHaveBeenCalledWith(
			"[ERROR] [TestLogger] - Error message",
		);
	});

	test("should not log if level is not active", () => {
		Logger.level = LogLevel.OFF;
		logger.trace("test");
		logger.debug("test");
		logger.info("test");
		logger.warn("test");
		logger.error("test");
		for (const { method } of METHODS) {
			expect(transports[method], method).not.toHaveBeenCalled();
		}
	});

	test("should do nothing when transports are reset", () => {
		Logger.transports = {
			trace: Logger.ignore,
			debug: Logger.ignore,
			info: Logger.ignore,
			warn: Logger.ignore,
			error: Logger.ignore,
		};
		logger.trace("test");
		logger.debug("test");
		logger.info("test");
		logger.warn("test");
		logger.error("test");
		for (const { method } of METHODS) {
			expect(transports[method], method).not.toHaveBeenCalled();
		}
	});

	test("does not log trace at DEBUG", () => {
		logger.trace("hidden");
		expect(transports.trace).not.toHaveBeenCalled();
	});

	test("each method calls only its own transport, exactly once", () => {
		Logger.level = LogLevel.TRACE;
		for (const { method } of METHODS) {
			const mocks = installMockTransports();
			logger[method]("x");
			for (const other of METHODS) {
				expect(
					mocks[other.method],
					`${method} -> ${other.method}`,
				).toHaveBeenCalledTimes(other.method === method ? 1 : 0);
			}
		}
	});

	test("transports are called without a receiver: the message is the only argument", () => {
		Logger.level = LogLevel.TRACE;
		for (const { method, tag } of METHODS) {
			logger[method]("only");
			const call = transports[method].mock.lastCall;
			expect(call, method).toBeDefined();
			expect(call?.n, method).toBe(1);
			expect(call?.[0], method).toBe(`[${tag}] [TestLogger] - only`);
		}
	});

	test("the log methods return nothing, whatever the transport returns", () => {
		Logger.level = LogLevel.TRACE;
		for (const { method } of METHODS) {
			transports[method].mockImplementation(
				() => "ignored" as unknown as undefined,
			);
			expect(logger[method]("x") as unknown, method).toBeUndefined();
		}
	});

	test("transports and level are read at call time, not captured by the constructor", () => {
		Logger.level = LogLevel.OFF;
		const early = new Logger("Early");
		early.info("suppressed");
		expect(transports.info).not.toHaveBeenCalled();

		Logger.level = LogLevel.INFO;
		const replacement = fn<LoggerTransports["info"]>();
		Logger.transports = { ...transports, info: replacement };
		early.info("now visible");
		expect(transports.info).not.toHaveBeenCalled();
		expect(replacement).toHaveBeenCalledWith("[INFO] [Early] - now visible");
	});

	test("a single transport can be swapped in place on the transports table", () => {
		const original = transports.warn;
		const replacement = fn<LoggerTransports["warn"]>();
		Logger.transports.warn = replacement;
		logger.warn("w");
		expect(original).not.toHaveBeenCalled();
		expect(replacement).toHaveBeenCalledWith("[WARN] [TestLogger] - w");
	});

	test("the level is shared by every logger instance", () => {
		const a = new Logger("A");
		const b = new Logger("B");
		Logger.level = LogLevel.WARN;
		a.info("a-info");
		b.info("b-info");
		a.warn("a-warn");
		b.error("b-error");
		expect(transports.info).not.toHaveBeenCalled();
		expect(transports.warn).toHaveBeenCalledWith("[WARN] [A] - a-warn");
		expect(transports.error).toHaveBeenCalledWith("[ERROR] [B] - b-error");
	});

	test("each instance keeps its own name", () => {
		new Logger("First").info("1");
		new Logger("Second").info("2");
		expect(transports.info).toHaveBeenNthCalledWith(1, "[INFO] [First] - 1");
		expect(transports.info).toHaveBeenNthCalledWith(2, "[INFO] [Second] - 2");
	});

	test("individual levels can be silenced with Logger.ignore while others still log", () => {
		Logger.transports = {
			...transports,
			info: Logger.ignore,
			debug: Logger.ignore,
		};
		logger.debug("d");
		logger.info("i");
		logger.warn("w");
		expect(transports.debug).not.toHaveBeenCalled();
		expect(transports.info).not.toHaveBeenCalled();
		expect(transports.warn).toHaveBeenCalledWith("[WARN] [TestLogger] - w");
	});

	test("an error raised by a transport propagates to the caller", () => {
		transports.error.mockImplementation(() => {
			error("transport down", 0);
		});
		expect(() => logger.error("boom")).toThrow({ exact: "transport down" });
		expect(transports.error).toHaveBeenCalledTimes(1);
	});

	test("an error raised by one transport does not affect the others", () => {
		transports.warn.mockImplementation(() => {
			error("warn transport down", 0);
		});
		expect(() => logger.warn("w")).toThrow("warn transport down");
		logger.info("still fine");
		expect(transports.info).toHaveBeenCalledWith(
			"[INFO] [TestLogger] - still fine",
		);
	});

	test("a missing transport raises when its level is enabled", () => {
		const withoutWarn: Partial<LoggerTransports> = { ...transports };
		delete withoutWarn.warn;
		Logger.transports = withoutWarn as LoggerTransports;
		expect(() => logger.warn("w")).toThrow("attempt to call");
	});

	test("a missing transport is never touched when its level is filtered out", () => {
		Logger.level = LogLevel.ERROR;
		const withoutWarn: Partial<LoggerTransports> = { ...transports };
		delete withoutWarn.warn;
		Logger.transports = withoutWarn as LoggerTransports;
		expect(() => logger.warn("w")).not.toThrow();
	});
});

describe("Logger subclasses", () => {
	afterEach(() => resetLogger());

	class PrefixedLogger extends Logger {
		constructor(
			name: string,
			private readonly prefix: string,
		) {
			super(name);
		}

		getName(): string {
			return this.name;
		}

		override info(message: string): void {
			super.info(`${this.prefix}${message}`);
		}
	}

	test("inherit every method and can read the protected name", () => {
		const transports = installMockTransports();
		Logger.level = LogLevel.TRACE;
		const logger = new PrefixedLogger("Sub", ">> ");
		expect(logger).toBeInstanceOf(Logger);
		expect(logger.getName()).toBe("Sub");
		logger.trace("t");
		logger.info("i");
		expect(transports.trace).toHaveBeenCalledWith("[TRACE] [Sub] - t");
		expect(transports.info).toHaveBeenCalledWith("[INFO] [Sub] - >> i");
	});
});
