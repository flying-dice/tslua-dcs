import type {
	l_env,
	l_timer,
	ScheduledFunction,
} from "@flying-dice/tslua-dcs-mission-types";
import { envMode } from "./constants";
import { fixtureNames } from "./fixtures";
import type { Double } from "./runtime";
import { type LogEntry, state } from "./state";

export function log(level: LogEntry["level"], message: string): void {
	state.log.push({ level, message });
	if (state.echoLog) print(`[${level}] ${message}`);
}

/** Localised dictionary entries returned by `env.getValueDictByKey`. */
const dictionary: Record<string, string> = {
	DictKey_MissionName: fixtureNames.missionName,
	DictKey_descriptionText:
		"Deterministic mission used by the offline test doubles.",
};

export const env = {
	Mode: { ...envMode },
	info: (message: string) => log("info", tostring(message)),
	warning: (message: string) => log("warning", tostring(message)),
	error: (message: string) => log("error", tostring(message)),
	setErrorMessageBoxEnabled: (enabled: boolean) => {
		state.errorMessageBoxEnabled = enabled;
	},
	getMissionName: () => fixtureNames.missionName,
	getValueDictByKey: (key: string) => dictionary[key] ?? key,
	getMode: () => envMode.SIMULATION,
	showTraining: () => undefined,
	crash: (): never => {
		error("env.crash() was called: DCS would terminate here", 2);
		throw "unreachable";
	},
} satisfies Double<l_env, "mission" | "warehouses">;

function scheduled(functionId: number) {
	return state.scheduled.find((entry) => entry.id === functionId);
}

let nextFunctionId = 0;

function removeScheduled(functionId: number): void {
	state.scheduled = state.scheduled.filter((entry) => entry.id !== functionId);
}

export const timer = {
	getTime: () => state.time,
	getAbsTime: () => state.time0 + state.time,
	getTime0: () => state.time0,
	getPause: () => state.paused,
	scheduleFunction: <T>(
		functionToCall: ScheduledFunction<T>,
		functionArgument: T,
		modelTime: number,
	): number => {
		if (type(functionToCall) !== "function" && type(functionToCall) !== "table")
			error("timer.scheduleFunction: the first argument must be a function", 2);
		nextFunctionId += 1;
		state.scheduled.push({
			id: nextFunctionId,
			fn: functionToCall as (
				this: void,
				argument: unknown,
				time: number,
			) => number | undefined,
			argument: functionArgument,
			time: modelTime,
		});
		return nextFunctionId;
	},
	setFunctionTime: (functionId: number, modelTime: number): number => {
		const entry = scheduled(functionId);
		if (entry) entry.time = modelTime;
		return modelTime;
	},
	removeFunction: (functionId: number) => removeScheduled(functionId),
} satisfies Double<l_timer>;

/**
 * Advances model time to `now + seconds`, running each scheduled function whose time is due in time
 * order, as DCS does: the function receives `(argument, time)` and is rescheduled when it returns a
 * number. An error removes the function and is logged with `env.error` semantics (DCS logs and drops
 * it), then re-raised so the test sees it.
 */
export function advanceTime(seconds: number): void {
	const target = state.time + seconds;
	while (true) {
		let next: (typeof state.scheduled)[number] | undefined;
		for (const entry of state.scheduled)
			if (
				entry.time <= target &&
				(next === undefined || entry.time < next.time)
			)
				next = entry;
		if (!next) break;
		const entry = next;
		state.time = math.max(state.time, entry.time);
		const [ok, result] = pcall(entry.fn, entry.argument, state.time);
		if (!ok) {
			removeScheduled(entry.id);
			log(
				"error",
				`scheduled function ${entry.id} failed: ${tostring(result)}`,
			);
			error(result, 0);
		}
		// A time that is not in the future runs again on the next frame, never in the same instant.
		if (type(result) === "number")
			entry.time = math.max(result as number, state.time + 0.001);
		else removeScheduled(entry.id);
	}
	state.time = target;
}

export function resetTimers(): void {
	nextFunctionId = 0;
}
