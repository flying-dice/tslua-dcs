import type { l_Object, l_Vec3 } from "@flying-dice/tslua-dcs-mission-types";
import { beforeEach, restoreAllMocks } from "@flying-dice/tslua-luatest";
import type { DcsDoubles } from "../doubles/control";

/** The control API the doubles install as the global `dcsDoubles`. */
export const doubles = (_G as unknown as { dcsDoubles: DcsDoubles }).dcsDoubles;

/**
 * DCS's `Object` class table. TypeScript's `Object` is the JavaScript constructor, so the mission
 * `Object` global is reached through `_G`, the way base-class functions are called from Lua:
 * `Object.getName(unit)`.
 */
export const DcsObject = (_G as unknown as Record<string, unknown>).Object as {
	[K in keyof l_Object]: l_Object[K] extends (...args: infer A) => infer R
		? (this: void, object: l_Object, ...args: A) => R
		: l_Object[K];
};

/** Resets the doubles' world and restores spies before every test of the enclosing describe. */
export function useFreshWorld(): void {
	beforeEach(() => {
		restoreAllMocks();
		doubles.reset();
	});
}

export function near(a: l_Vec3, b: l_Vec3, tolerance = 0.001): boolean {
	return (
		math.abs(a.x - b.x) <= tolerance &&
		math.abs(a.y - b.y) <= tolerance &&
		math.abs(a.z - b.z) <= tolerance
	);
}

/** A unit, group, ... by name, failing the test when the fixture world does not contain it. */
export function required<T>(value: T | undefined, what: string): T {
	if (value === undefined) error(`fixture ${what} is missing`, 2);
	return value as T;
}
