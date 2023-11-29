import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LogLevel, Logger, LoggerTransports } from "./logger";

describe("Logger", () => {
	let logger: Logger;
	const mockTransports: LoggerTransports = {
		trace: vi.fn(),
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	};

	beforeEach(() => {
		Logger.level = LogLevel.DEBUG;
		Logger.transports = mockTransports;
		logger = new Logger("TestLogger");
	});

	afterEach(() => {
		vi.restoreAllMocks();
		Logger.level = LogLevel.OFF;
		Logger.transports = {
			// @ts-ignore
			trace: Logger.ignore,
			// @ts-ignore
			debug: Logger.ignore,
			// @ts-ignore
			info: Logger.ignore,
			// @ts-ignore
			warn: Logger.ignore,
			// @ts-ignore
			error: Logger.ignore,
		};
	});

	it("should log trace messages", () => {
		Logger.level = LogLevel.TRACE;
		logger.trace("Trace message");
		expect(mockTransports.trace).toHaveBeenCalledWith(
			"[TRACE] [TestLogger] - Trace message",
		);
	});

	it("should log debug messages", () => {
		logger.debug("Debug message");
		expect(mockTransports.debug).toHaveBeenCalledWith(
			"[DEBUG] [TestLogger] - Debug message",
		);
	});

	it("should log info messages", () => {
		logger.info("Info message");
		expect(mockTransports.info).toHaveBeenCalledWith(
			"[INFO] [TestLogger] - Info message",
		);
	});

	it("should log warn messages", () => {
		logger.warn("Warn message");
		expect(mockTransports.warn).toHaveBeenCalledWith(
			"[WARN] [TestLogger] - Warn message",
		);
	});

	it("should log error messages", () => {
		logger.error("Error message");
		expect(mockTransports.error).toHaveBeenCalledWith(
			"[ERROR] [TestLogger] - Error message",
		);
	});

	it("should not log if level is not active", function () {
		Logger.level = LogLevel.OFF;
		logger.debug("test");
		logger.info("test");
		logger.warn("test");
		logger.error("test");
		expect(mockTransports.debug).not.toHaveBeenCalled();
		expect(mockTransports.info).not.toHaveBeenCalled();
		expect(mockTransports.warn).not.toHaveBeenCalled();
		expect(mockTransports.error).not.toHaveBeenCalled();
	});

	it("should do nothing when transports are reset", function () {
		Logger.level = LogLevel.DEBUG;
		Logger.transports = {
			// @ts-ignore
			trace: Logger.ignore,
			// @ts-ignore
			debug: Logger.ignore,
			// @ts-ignore
			info: Logger.ignore,
			// @ts-ignore
			warn: Logger.ignore,
			// @ts-ignore
			error: Logger.ignore,
		};
		logger.debug("test");
		expect(mockTransports.trace).not.toHaveBeenCalled();
		expect(mockTransports.debug).not.toHaveBeenCalled();
		expect(mockTransports.info).not.toHaveBeenCalled();
		expect(mockTransports.warn).not.toHaveBeenCalled();
		expect(mockTransports.error).not.toHaveBeenCalled();
	});
});
