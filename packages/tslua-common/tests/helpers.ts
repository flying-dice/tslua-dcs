import { fn, type Mock } from "@flying-dice/tslua-luatest";
import { Logger, LogLevel, type LoggerTransports } from "../src";

export type TransportMocks = {
	[K in keyof LoggerTransports]: Mock<LoggerTransports[K]>;
};

/** The five log methods, lowest severity first, with the level each one needs. */
export const METHODS: ReadonlyArray<{
	method: keyof LoggerTransports;
	level: LogLevel;
	tag: string;
}> = [
	{ method: "trace", level: LogLevel.TRACE, tag: "TRACE" },
	{ method: "debug", level: LogLevel.DEBUG, tag: "DEBUG" },
	{ method: "info", level: LogLevel.INFO, tag: "INFO" },
	{ method: "warn", level: LogLevel.WARN, tag: "WARN" },
	{ method: "error", level: LogLevel.ERROR, tag: "ERROR" },
];

/** Installs a fresh mock for every transport and returns them. */
export function installMockTransports(): TransportMocks {
	const mocks: TransportMocks = {
		trace: fn(),
		debug: fn(),
		info: fn(),
		warn: fn(),
		error: fn(),
	};
	Logger.transports = mocks;
	return mocks;
}

const defaultLevel = Logger.level;
const defaultTransports = Logger.transports;

/** Puts the static Logger state back to what it was when the bundle loaded. */
export function resetLogger(): void {
	Logger.level = defaultLevel;
	Logger.transports = defaultTransports;
}
