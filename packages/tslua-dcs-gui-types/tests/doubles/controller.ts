/** @noSelfInFile */

import type { OwnshipFixture } from "./fixtures";
import type { AnyFunction, GuiState } from "./state";

/**
 * The test-side handle on the doubles, installed as the global `guiDoubles` next to the DCS
 * globals. It exists only under `lua51 --preload`, never in DCS: suites that must also run in DCS
 * check `guiDoubles !== undefined`.
 *
 * @noSelf
 */
export interface GuiDoubles {
	/** The current state. Edit it to arrange a scenario; the namespace doubles read it on every call. */
	state(): GuiState;
	/**
	 * Replaces the state with a fresh fixture (and so forgets registered callbacks, logs, chat,
	 * native calls, ...). The namespace tables stay the same, so references to `DCS` etc. remain valid.
	 */
	reset(): void;
	/**
	 * Plays DCS invoking a GameGUI hook: calls `name` on every table registered with
	 * `DCS.setUserCallbacks`, in registration order, as a plain function (no self). As DCS does for
	 * the `onPlayerTry*` hooks, the first handler that returns a non-nil value ends the dispatch and
	 * its return values are returned; otherwise nothing is returned.
	 */
	fire(name: string, ...arguments_: unknown[]): LuaMultiReturn<unknown[]>;
	/** The handlers registered for `name`, in registration order. */
	handlers(name: string): AnyFunction[];
	/** A fresh player-aircraft fixture; assign it to `state().ownship` to "spawn" the player. */
	ownshipFixture(): OwnshipFixture;
	/** Names of the globals the doubles installed. */
	readonly globals: string[];
}

declare global {
	/** Present only when the DCS GUI doubles were preloaded (`lua51 --preload .test/doubles.lua`). */
	const guiDoubles: GuiDoubles | undefined;
}

type MultiFunction = (
	this: void,
	...arguments_: unknown[]
) => LuaMultiReturn<unknown[]>;

export function createController(
	getState: () => GuiState,
	reset: () => void,
	ownshipFixture: () => OwnshipFixture,
	globals: string[],
): GuiDoubles {
	const handlers = (name: string) => {
		const result: AnyFunction[] = [];
		for (const table of getState().callbacks) {
			const handler = table[name];
			if (handler !== undefined) result.push(handler);
		}
		return result;
	};
	return {
		state: getState,
		reset,
		handlers,
		fire: (name, ...arguments_) => {
			for (const handler of handlers(name)) {
				const results = [...(handler as MultiFunction)(...arguments_)];
				if (results[0] !== undefined) return $multi(...results);
			}
			return $multi();
		},
		ownshipFixture,
		globals,
	};
}
