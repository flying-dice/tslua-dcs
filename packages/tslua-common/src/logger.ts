/**
 * Represents a logger that can be used to log messages with different severity levels.
 */
/**
 * Represents a logger that can be used to log messages with different severity levels.
 */
export class Logger {
	constructor(protected name: string) {}

	/**
	 * Logs a debug message.
	 * @param message The message to be logged.
	 * @example
	 * const logger = new Logger("MyLogger");
	 * logger.debug("This is a debug message");
	 */
	debug(message: string) {
		print(`[DEBUG] [${this.name}] - ${message}`);
	}

	/**
	 * Logs an info message.
	 * @param message The message to be logged.
	 * @example
	 * const logger = new Logger("MyLogger");
	 * logger.info("This is an info message");
	 */
	info(message: string) {
		print(`[INFO] [${this.name}] - ${message}`);
	}

	/**
	 * Logs a warning message.
	 * @param message The message to be logged.
	 * @example
	 * const logger = new Logger("MyLogger");
	 * logger.warn("This is a warning message");
	 */
	warn(message: string) {
		print(`[WARN] [${this.name}] - ${message}`);
	}

	/**
	 * Logs an error message.
	 * @param message The message to be logged.
	 * @example
	 * const logger = new Logger("MyLogger");
	 * logger.error("This is an error message");
	 */
	error(message: string) {
		print(`[ERROR] [${this.name}] - ${message}`);
	}
}
