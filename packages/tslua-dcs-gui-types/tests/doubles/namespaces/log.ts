/** @noSelfInFile */

import type { l_log } from "../../../src";
import { logConstants } from "../constants";
import type { DoubleContext } from "../context";

/** The subsystem DCS stamps on messages written by the level shortcuts from GUI scripts. */
export const GUI_SUBSYSTEM = "LuaGUI";

/**
 * `log` double. Every message is formatted with `string.format` (so a bad format raises, as in DCS)
 * and appended to `state.logRecords` and to the `DCS.getLogHistory` history.
 */
export function createLog(ctx: DoubleContext): l_log {
	const s = () => ctx.state();
	const write = (
		subsystem: string,
		level: number,
		format: string,
		...values: unknown[]
	) => {
		const message =
			values.length > 0 ? string.format(format, ...values) : format;
		s().logRecords.push({ subsystem, level, message });
		s().logHistory.push({ abstime: s().realTime, level, subsystem, message });
	};
	const at =
		(level: number) =>
		(format: string, ...values: unknown[]) =>
			write(GUI_SUBSYSTEM, level, format, ...values);

	return {
		...logConstants,
		alert: at(logConstants.ALERT),
		error: at(logConstants.ERROR),
		warning: at(logConstants.WARNING),
		info: at(logConstants.INFO),
		debug: at(logConstants.DEBUG),
		write: (subsystem, level, format, ...values) =>
			write(subsystem, level, format, ...values),
		set_output: (
			fileNameWithoutExtension,
			subsystem,
			levelMask,
			outputMode,
		) => {
			if (subsystem === "" && levelMask === 0 && outputMode === 0)
				s().logOutputs[fileNameWithoutExtension] = undefined as never;
			else
				s().logOutputs[fileNameWithoutExtension] = {
					subsystem,
					levelMask,
					outputMode,
				};
		},
		set_output_rules: (rules) => ctx.native("log.set_output_rules", [rules]),
		backup: (...arguments_) => ctx.native("log.backup", arguments_),
	};
}
