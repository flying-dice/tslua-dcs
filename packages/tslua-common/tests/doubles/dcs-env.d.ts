/**
 * Declarations for the DCS logging doubles installed by `tests/doubles/dcs-env.lua` (`lua51 --preload`).
 */

/** One call recorded by a double: the global function name, its argument count and its arguments. */
interface DcsLogRecord {
	fn: "env.info" | "env.warning" | "env.error" | "log.write";
	n: number;
	args: unknown[];
}

/** What the doubles recorded, oldest first; `clear` starts a new, empty `calls` array. */
interface DcsLogRecorder {
	calls: DcsLogRecord[];
	clear(this: void): void;
}

declare const __dcsLog: DcsLogRecorder;

/** The mission scripting environment's `env` logging functions. */
interface DcsEnv {
	info(this: void, message: string, showMessageBox?: boolean): void;
	warning(this: void, message: string, showMessageBox?: boolean): void;
	error(this: void, message: string, showMessageBox?: boolean): void;
}

declare const env: DcsEnv;

/** The GUI / hooks environment's `log` module. */
interface DcsLog {
	ALERT: number;
	ERROR: number;
	WARNING: number;
	INFO: number;
	DEBUG: number;
	TRACE: number;
	write(this: void, subsystem: string, level: number, message: string): void;
}

declare const log: DcsLog;
