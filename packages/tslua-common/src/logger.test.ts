import { beforeAll, describe, expect, it, vi } from "vitest";
import { Logger } from "./logger";

describe("Logger", () => {
	let logger: Logger;

	beforeAll(() => {
		logger = new Logger("TestLogger");
		global.print = vi.fn();
	});

	it("should log debug messages", () => {
		logger.debug("Debug message");
		expect(global.print).toHaveBeenCalledWith(
			"[DEBUG] [TestLogger] - Debug message",
		);
	});

	it("should log info messages", () => {
		logger.info("Info message");
		expect(global.print).toHaveBeenCalledWith(
			"[INFO] [TestLogger] - Info message",
		);
	});

	it("should log warn messages", () => {
		logger.warn("Warn message");
		expect(global.print).toHaveBeenCalledWith(
			"[WARN] [TestLogger] - Warn message",
		);
	});

	it("should log error messages", () => {
		logger.error("Error message");
		expect(global.print).toHaveBeenCalledWith(
			"[ERROR] [TestLogger] - Error message",
		);
	});
});
