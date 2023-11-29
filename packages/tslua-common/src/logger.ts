/**
 * LogLevel represents the different severity levels that can be used to log messages.
 *
 * The levels are TRACE, DEBUG, INFO, WARN, ERROR, and OFF.
 *
 * OFF is a special level that can be used to disable logging.
 */
export enum LogLevel {
	TRACE = 10,
	DEBUG = 20,
	INFO = 30,
	WARN = 40,
	ERROR = 50,
	OFF = 100,
}

/**
 * LoggerTransports are the functions that are used to log messages with different severity levels.
 *
 * They are statically defined on the Logger class.
 *
 * Update them to change the way messages are logged.
 *
 * @example
 * const logger = new Logger("MyLogger");
 * logger.transports = { debug: print, info: print, warn: print, error: print };
 */
export interface LoggerTransports {
	trace: (message: string) => void;
	debug: (message: string) => void;
	info: (message: string) => void;
	warn: (message: string) => void;
	error: (message: string) => void;
}

/**
 * Represents a logger that can be used to log messages with different severity levels.
 *
 * Change the static level property to change the severity level of messages that are logged.
 *
 * Change the static transports property to change the way messages are logged.
 *
 * Use Logger.ignore to ignore a severity level.
 *
 * @example
 * const logger = new Logger("MyLogger");
 * Logger.level = LogLevel.DEBUG;
 * Logger.transports = { debug: print, info: print, warn: print, error: print };
 */
export class Logger {
	public static level: LogLevel = LogLevel.INFO;

	public static transports: LoggerTransports = {
		trace: Logger.ignore,
		debug: Logger.ignore,
		info: Logger.ignore,
		warn: Logger.ignore,
		error: Logger.ignore,
	};

	constructor(protected name: string) {}

	/**
	 * Logs a trace message.
	 *
	 * Trace messages are the most verbose and should only be used for debugging.
	 *
	 * @param message The message to be logged.
	 * @example
	 * const logger = new Logger("MyLogger");
	 * logger.trace("This is a trace message");
	 */
	trace(message: string) {
		if (Logger.level <= LogLevel.TRACE) {
			Logger.transports.trace(`[TRACE] [${this.name}] - ${message}`);
		}
	}

	/**
	 * Logs a debug message.
	 *
	 * Debug messages are less verbose than trace messages and should be used for debugging.
	 *
	 * @param message The message to be logged.
	 * @example
	 * const logger = new Logger("MyLogger");
	 * logger.debug("This is a debug message");
	 */
	debug(message: string) {
		if (Logger.level <= LogLevel.DEBUG) {
			Logger.transports.debug(`[DEBUG] [${this.name}] - ${message}`);
		}
	}

	/**
	 * Logs an info message.
	 *
	 * Info messages are less verbose than debug messages and should be used for logging information.
	 *
	 * @param message The message to be logged.
	 * @example
	 * const logger = new Logger("MyLogger");
	 * logger.info("This is an info message");
	 */
	info(message: string) {
		if (Logger.level <= LogLevel.INFO) {
			Logger.transports.info(`[INFO] [${this.name}] - ${message}`);
		}
	}

	/**
	 * Logs a warning message.
	 *
	 * Warning messages are less verbose than info messages and should be used for logging warnings.
	 *
	 * @param message The message to be logged.
	 * @example
	 * const logger = new Logger("MyLogger");
	 * logger.warn("This is a warning message");
	 */
	warn(message: string) {
		if (Logger.level <= LogLevel.WARN) {
			Logger.transports.warn(`[WARN] [${this.name}] - ${message}`);
		}
	}

	/**
	 * Logs an error message.
	 *
	 * Error messages are the least verbose and should be used for logging errors.
	 *
	 * @param message The message to be logged.
	 * @example
	 * const logger = new Logger("MyLogger");
	 * logger.error("This is an error message");
	 */
	error(message: string) {
		if (Logger.level <= LogLevel.ERROR) {
			Logger.transports.error(`[ERROR] [${this.name}] - ${message}`);
		}
	}

	/**
	 * A transport function that does nothing.
	 *
	 * Use this to ignore a severity level as an alternative to setting the LogLevel, this can be useful
	 * where for example the trace transport is enabled but sending to an alternative location,
	 * but you want to disable info.
	 *
	 * @example
	 * const logger = new Logger("MyLogger");
	 * logger.transports = { debug: Logger.ignore, info: Logger.ignore, warn: print, error: print };
	 */
	public static ignore() {}
}
