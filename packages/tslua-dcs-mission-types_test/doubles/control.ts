import type {
	l_Unit,
	l_Weapon,
	l_WorldEvent,
} from "@flying-dice/tslua-dcs-mission-types";
import type { EffectRecord } from "./trigger";
import type { LogEntry, MarkRecord, MessageRecord } from "./state";

/**
 * The test-facing control surface of the doubles, installed as the global `dcsDoubles`. It lets a
 * test drive the simulated world (time, events, F10 menus, weapons) and inspect what the code under
 * test did (log lines, messages, marks, effects) without depending on the doubles' internals.
 *
 * @noSelf
 */
export interface DcsDoubles {
	/** Restores the fixture world: model time 0, fixture objects, empty logs, flags, marks and menus. */
	reset(): void;
	/** Advances model time, running due `timer.scheduleFunction` callbacks in time order. */
	advanceTime(seconds: number): void;
	/** Sets what `timer.getPause()` reports. */
	setPaused(paused: boolean): void;
	/** Delivers an event to every handler added with `world.addEventHandler`. */
	dispatchEvent(event: l_WorldEvent): void;
	/**
	 * Selects an F10 command added with `missionCommands.addCommand*`, calling its callback with its
	 * argument. `scope` is `"all"` (default), `"coalition:<id>"` or `"group:<id>"`. Throws when the
	 * command does not exist.
	 */
	selectMenuCommand(path: string[], scope?: string): void;
	/** Every F10 menu item as `{ path, scope, kind }`. */
	menu(): { path: string[]; scope: string; kind: string }[];
	/** Creates a weapon in flight, as a `S_EVENT_SHOT` would report it. */
	launchWeapon(options: {
		typeName: string;
		launcher: l_Unit;
		target?: l_Unit;
	}): l_Weapon;
	/** Sets a unit's remaining life (0 makes `isDead()` true). */
	setLife(unit: l_Unit, life: number): void;
	/** Lines written with `env.info/warning/error`, `net.log` and `net.trace`. */
	log(): LogEntry[];
	/** Messages shown with `trigger.action.outText*`. */
	messages(): MessageRecord[];
	/** Marks and markup shapes currently on the F10 map. */
	marks(): MarkRecord[];
	/** Other `trigger.action` side effects (explosions, smoke, sounds, AI toggles, ...). */
	effects(): EffectRecord[];
	/** Chat lines sent or received through `net`. */
	chat(): { message: string; to?: number; from?: number }[];
	/** Data `world.getPersistenceData(name)` returns. */
	setPersistenceData(name: string, value: unknown): void;
	/** Also print log lines to stdout (off by default). */
	setLogEcho(enabled: boolean): void;
	/** Every function path the doubles implement, e.g. `"Unit.getName"`, `"trigger.action.outText"`. */
	surface(): string[];
	/** Calls recorded for a function path since the last `resetCalls()`. */
	calls(path: string): number;
	resetCalls(): void;
}
