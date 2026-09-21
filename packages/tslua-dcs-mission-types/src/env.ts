import type { _env } from "./exports/env.export";
/**
 * @see [Authoritative executable examples](https://github.com/flying-dice/tslua-dcs/blob/main/packages/tslua-dcs-mission-types_test/src/env_test.ts)
 * @noSelf
 */
export interface l_env extends _env {
	/**
	 * Resolves a localization dictionary key to its current text.
	 *
	 * @example `const text = env.getValueDictByKey("DictKey_descriptionText_1");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getValueDictByKey
	 */
	getValueDictByKey(key: string): string;
	/**
	 * Returns the active simulation mode identifier. DCS 2.9.29 exposes this as a number.
	 *
	 * @example `const mode = env.getMode();`
	 */
	getMode(): number;
	/**
	 * TODO: native training overlay control is exported but no installed Lua source documents its argument contract.
	 */
	showTraining(...arguments_: unknown[]): unknown;
	/**
	 * TODO: diagnostic crash entry point is deliberately not invoked and has no public parameter contract.
	 */
	crash(...arguments_: unknown[]): never;
	/**
	 * Writes an informational message to `dcs.log`. Set `showMessageBox` only for exceptional interactive diagnostics.
	 *
	 * @param message Text to log.
	 * @param showMessageBox Whether DCS should also show a modal message box.
	 * @returns Nothing.
	 * @example `env.info("Mission script loaded");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_info
	 */
	info(message: string, showMessageBox?: boolean): void;

	/**
	 * Writes a warning message to `dcs.log`.
	 *
	 * @param message Text to log.
	 * @param showMessageBox Whether DCS should also show a modal message box.
	 * @returns Nothing.
	 * @example `env.warning("Fallback route selected");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_warning
	 */
	warning(message: string, showMessageBox?: boolean): void;

	/**
	 * Writes an error message to `dcs.log`.
	 *
	 * @param message Text to log.
	 * @param showMessageBox Whether DCS should also show a modal message box.
	 * @returns Nothing.
	 * @example `env.error("Unable to find target group");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_error
	 */
	error(message: string, showMessageBox?: boolean): void;

	/**
	 * Globally enables or disables modal message boxes requested by `env.info`, `env.warning`, and `env.error`. Logging is unaffected.
	 *
	 * @param enabled Whether requested error message boxes may be displayed.
	 * @returns Nothing.
	 * @example `env.setErrorMessageBoxEnabled(false);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setErrorMessageBoxEnabled
	 */
	setErrorMessageBoxEnabled(enabled: boolean): void;

	/**
	 * Returns the current mission's name.
	 *
	 * @returns Mission name.
	 * @example `env.info(env.getMissionName());`
	 * @see %DCS_INSTALL_DIR%/Scripts/UI/ConsoleCommands.lua:303
	 */
	getMissionName(): string;
}
