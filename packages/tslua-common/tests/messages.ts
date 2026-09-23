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

// The formatted line is "[<LEVEL>] [<name>] - <message>", built by plain concatenation.
describe("message formatting", () => {
	let transports: TransportMocks;

	beforeEach(() => {
		Logger.level = LogLevel.TRACE;
		transports = installMockTransports();
	});

	afterEach(() => resetLogger());

	test("every level uses the same layout with its own tag", () => {
		const logger = new Logger("Fmt");
		for (const { method, tag } of METHODS) {
			logger[method]("hello");
			expect(transports[method], method).toHaveBeenCalledWith(
				`[${tag}] [Fmt] - hello`,
			);
		}
	});

	test("an empty message still produces the prefix", () => {
		new Logger("Fmt").info("");
		expect(transports.info).toHaveBeenCalledWith("[INFO] [Fmt] - ");
	});

	test("an empty name produces empty brackets", () => {
		new Logger("").warn("w");
		expect(transports.warn).toHaveBeenCalledWith("[WARN] [] - w");
	});

	test("format directives are passed through verbatim, never interpreted", () => {
		new Logger("%s").info("%s %d %5.2f %% %q");
		expect(transports.info).toHaveBeenCalledWith(
			"[INFO] [%s] - %s %d %5.2f %% %q",
		);
	});

	test("Lua pattern characters are passed through verbatim", () => {
		new Logger("a.b").info("^(.-)$ [%a]+ %1");
		expect(transports.info).toHaveBeenCalledWith(
			"[INFO] [a.b] - ^(.-)$ [%a]+ %1",
		);
	});

	test("brackets and dashes in the name or message are not escaped", () => {
		new Logger("[x] - y").error("[ERROR] - z");
		expect(transports.error).toHaveBeenCalledWith(
			"[ERROR] [[x] - y] - [ERROR] - z",
		);
	});

	test("multi-line messages are kept intact", () => {
		new Logger("Fmt").info("line 1\nline 2\r\n\tline 3");
		expect(transports.info).toHaveBeenCalledWith(
			"[INFO] [Fmt] - line 1\nline 2\r\n\tline 3",
		);
	});

	test("binary data, including NUL bytes, is passed through byte for byte", () => {
		const bytes = `a\0b${string.char(255, 1)}z`;
		new Logger("Bin").debug(bytes);
		const received = transports.debug.mock.lastCall?.[0] as string;
		expect(received).toBe(`[DEBUG] [Bin] - ${bytes}`);
		expect(received).toHaveLength("[DEBUG] [Bin] - ".length + 6);
	});

	test("UTF-8 text is passed through unchanged", () => {
		new Logger("Ünïcødé").info("✈ Enfield 1-1 → Batumi");
		expect(transports.info).toHaveBeenCalledWith(
			"[INFO] [Ünïcødé] - ✈ Enfield 1-1 → Batumi",
		);
	});

	test("long messages are not truncated", () => {
		const long = string.rep("x", 100000);
		new Logger("Long").info(long);
		const received = transports.info.mock.lastCall?.[0] as string;
		expect(received).toHaveLength("[INFO] [Long] - ".length + 100000);
	});

	test("integer messages are converted with Lua's number formatting", () => {
		new Logger("Num").info(42 as unknown as string);
		expect(transports.info).toHaveBeenCalledWith("[INFO] [Num] - 42");
	});

	test("fractional and negative numbers are converted with Lua's number formatting", () => {
		const logger = new Logger("Num");
		logger.info(1.5 as unknown as string);
		logger.info(-0.25 as unknown as string);
		logger.info(1e20 as unknown as string);
		expect(transports.info).toHaveBeenNthCalledWith(1, "[INFO] [Num] - 1.5");
		expect(transports.info).toHaveBeenNthCalledWith(2, "[INFO] [Num] - -0.25");
		expect(transports.info).toHaveBeenNthCalledWith(3, "[INFO] [Num] - 1e+20");
	});

	test("a numeric name is converted like a numeric message", () => {
		new Logger(7 as unknown as string).warn("w");
		expect(transports.warn).toHaveBeenCalledWith("[WARN] [7] - w");
	});

	// The message is typed as a string and is concatenated as-is, so values Lua cannot concatenate raise an
	// error, but only when the level is enabled. These tests pin that behaviour for callers from plain Lua.
	describe("non-string messages from untyped callers", () => {
		const cases: Array<[string, unknown]> = [
			["nil", undefined],
			["a table", { a: 1 }],
			["a boolean", true],
			["a function", () => 1],
		];

		for (const [label, value] of cases) {
			test(`${label} raises a concatenation error when the level is enabled`, () => {
				expect(() => new Logger("Bad").info(value as string)).toThrow(
					"attempt to concatenate",
				);
				expect(transports.info).not.toHaveBeenCalled();
			});

			test(`${label} is ignored when the level is filtered out`, () => {
				Logger.level = LogLevel.ERROR;
				expect(() => new Logger("Bad").info(value as string)).not.toThrow();
			});
		}

		test("a nil name raises a concatenation error when the level is enabled", () => {
			expect(() =>
				new Logger(undefined as unknown as string).info("m"),
			).toThrow("attempt to concatenate");
		});
	});
});
