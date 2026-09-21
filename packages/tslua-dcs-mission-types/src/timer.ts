import type { _timer } from "./exports/timer.export";

/**
 * Callback accepted by `timer.scheduleFunction`.
 */
export type ScheduledFunction<T> = (
	this: void,
	argument: T,
	modelTime: number,
) => number | undefined;

/**
 * @noSelf
 */
/**
 * @see [Authoritative executable examples](https://github.com/flying-dice/tslua-dcs/blob/main/packages/tslua-dcs-mission-types_test/src/timer_test.ts)
 * @noSelf
 */
export interface l_timer extends _timer {
	/**
	 * Reports whether mission model time is paused.
	 *
	 * @returns Pause state.
	 * @example `if (timer.getPause()) env.info("Mission paused");`
	 * @see %DCS_INSTALL_DIR%/Scripts/UI/ConsoleCommands.lua:371
	 */
	getPause(): boolean;

	/**
	 * Returns the game world time in seconds relative to time the mission started.
	 * Will always count up from when the mission started.
	 * If the value is above 86400 then it is the next day after the mission started.
	 * This function is useful in attaining the time of day.
	 *
	 * Assuming a mission started at noon the value returned would be 43200. (12*60*60).
	 * Midnight would be 0. Calling this function at 12:00:10 timer.getAbsTime will return 43210.xxx.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getAbsTime
	 * @returns Absolute mission time-of-day in seconds.
	 * @example `const secondsSinceMidnight = timer.getAbsTime();`
	 */
	getAbsTime(): number;

	/**
	 * Re-Schedules an already scheduled function to run at a different time in the future.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setFunctionTime
	 *
	 * @param functionId Identifier returned by `scheduleFunction`.
	 * @param modelTime New execution time in mission model seconds.
	 * @returns The model time at which the callback is now scheduled to run.
	 * @example
	 * ```ts
	 * const newRunTime = timer.getTime() + 30;
	 * const scheduledTime = timer.setFunctionTime(functionId, newRunTime);
	 * env.info(`Rescheduled for ${scheduledTime}`);
	 * ```
	 * @see %DCS_INSTALL_DIR%/Scripts/UI/RadioCommandDialogPanel/CommandDialogsPanel.lua:140
	 */
	setFunctionTime(functionId: number, modelTime: number): number;

	/**
	 * Schedules a function to run at a time in the future. This is a very powerful function.
	 * The function that is called is expected to return nil or a number which will indicate the next time the function will be rescheduled.
	 *
	 * Use the second argument in that function to retrieve the current time and add the desired amount of delay (expressed in seconds).
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_scheduleFunction
	 *
	 * @param functionToCall Callback receiving the supplied argument and scheduled model time.
	 * @param functionArgument Value passed unchanged to the callback.
	 * @param modelTime First execution time in mission model seconds.
	 * @returns Numeric schedule identifier used to reschedule or cancel the callback.
	 * @example
	 * ```ts
	 * const functionId = timer.scheduleFunction(
	 * 	(message: string, time) => {
	 * 		env.info(message);
	 * 		return time + 60;
	 * 	},
	 * 	"Runs every minute",
	 * 	timer.getTime() + 60,
	 * );
	 * ```
	 */
	scheduleFunction<T>(
		functionToCall: ScheduledFunction<T>,
		functionArgument: T,
		modelTime: number,
	): number;

	/**
	 * Removes a scheduled function as defined by the functionId from executing.
	 * Essentially will "destroy" the function.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_removeFunction
	 *
	 * @param functionId Identifier returned by `scheduleFunction`.
	 * @returns Nothing.
	 * @example `timer.removeFunction(functionId);`
	 */
	removeFunction(functionId: number): void;

	/**
	 * Returns the model time in seconds to 3 decimal places. This counts time once the simulator loads.
	 * So if a mission is paused, the time this function returns still moves forward.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getTime
	 * @returns Elapsed mission model time in seconds.
	 * @example `const runAt = timer.getTime() + 10;`
	 */
	getTime(): number;

	/**
	 * Returns the mission start time in seconds.
	 * Can be used with timer.getAbsTime() to see how much time has passed in the mission.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getTime0
	 * @returns Mission start time in seconds since midnight.
	 * @example `const elapsed = timer.getAbsTime() - timer.getTime0();`
	 */
	getTime0(): number;
}
