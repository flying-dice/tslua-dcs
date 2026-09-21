import type { _log } from "./exports/log.export";

/**
 * @noSelf
 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:228
 * @see [Authoritative executable examples](https://github.com/flying-dice/tslua-dcs/blob/main/packages/tslua-dcs-gui-types_test/src/log_test.ts)
 */
export interface l_log
	extends Omit<
		_log,
		| "alert"
		| "backup"
		| "debug"
		| "error"
		| "info"
		| "set_output"
		| "set_output_rules"
		| "warning"
		| "write"
	> {
	/**
	 * Writes a formatted message at alert level. Additional values are substituted using Lua `string.format`.
	 *
	 * @example `log.alert("bridge unavailable: %s", reason);`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:234
	 */
	alert(format: string, ...values: unknown[]): void;
	/**
	 * Writes a formatted message at debug level.
	 *
	 * @example `log.debug("loaded %d records", count);`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:234
	 */
	debug(format: string, ...values: unknown[]): void;
	/**
	 * Writes a formatted message at error level.
	 *
	 * @example `log.error("failed to load %s", fileName);`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:234
	 */
	error(format: string, ...values: unknown[]): void;
	/**
	 * Writes a formatted message at info level.
	 *
	 * @example `log.info("mod initialized");`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:234
	 */
	info(format: string, ...values: unknown[]): void;
	/**
	 * Writes a formatted message at warning level.
	 *
	 * @example `log.warning("missing optional file: %s", fileName);`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:234
	 */
	warning(format: string, ...values: unknown[]): void;
	/**
	 * Writes a message for an explicit subsystem and log-level constant.
	 *
	 * @example `log.write("MyMod", log.INFO, "initialized %s", version);`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:234
	 */
	write(
		subsystem: string,
		level: number,
		format: string,
		...values: unknown[]
	): void;
	/**
	 * Opens, reconfigures, or closes a log output. Passing empty subsystem and zero masks closes it.
	 *
	 * @example `log.set_output("my-mod", "MyMod", log.ALL, log.FULL);`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:247
	 */
	set_output(
		fileNameWithoutExtension: string,
		subsystem: string,
		levelMask: number,
		outputMode: number,
	): void;
	/**
	 * TODO: exported by this DCS build but absent from the installed public API and Lua callsites; the rules schema is intentionally `unknown`.
	 *
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:228
	 */
	set_output_rules(rules: unknown): unknown;
	/**
	 * TODO: exported by this DCS build but absent from the installed public API and Lua callsites; backup target semantics are not inferable safely.
	 *
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:228
	 */
	backup(...arguments_: unknown[]): unknown;
}
