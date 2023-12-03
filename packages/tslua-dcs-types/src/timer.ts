import { _timer } from "./exports/timer.export";
/** @noSelf **/
export interface l_timer extends _timer {
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
	 */
	getAbsTime(): number;

	/**
	 * Re-Schedules an already scheduled function to run at a different time in the future.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setFunctionTime
	 *
	 * @param functionId
	 * @param modelTime
	 */
	setFunctionTime(functionId: number, modelTime: number): void;

	/**
	 * Schedules a function to run at a time in the future. This is a very powerful function.
	 * The function that is called is expected to return nil or a number which will indicate the next time the function will be rescheduled.
	 *
	 * Use the second argument in that function to retrieve the current time and add the desired amount of delay (expressed in seconds).
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_scheduleFunction
	 *
	 * @param functionToCall
	 * @param anyFunctionArguement
	 * @param modelTime
	 */
	scheduleFunction(
		functionToCall: Function,
		anyFunctionArguement: any[],
		modelTime: number,
	): number;

	/**
	 * Removes a scheduled function as defined by the functionId from executing.
	 * Essentially will "destroy" the function.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_removeFunction
	 *
	 * @param functionId
	 */
	removeFunction(functionId: number): void;

	/**
	 * Returns the model time in seconds to 3 decimal places. This counts time once the simulator loads.
	 * So if a mission is paused, the time this function returns still moves forward.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getTime
	 */
	getTime(): number;

	/**
	 * Returns the mission start time in seconds.
	 * Can be used with timer.getAbsTime() to see how much time has passed in the mission.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getTime0
	 */
	getTime0(): number;
}
