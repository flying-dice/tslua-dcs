/** @noSelfInFile */

import type { GuiState } from "./state";

/**
 * What each namespace double needs from the installer.
 *
 * @noSelf
 */
export interface DoubleContext {
	/** The current state (replaced by `guiDoubles.reset()`, so always read it through this). */
	state(): GuiState;
	/** Records a call to a native function with an undocumented contract and returns nothing. */
	native(name: string, arguments_: unknown[]): undefined;
}

/** Deep copy of plain data, so a getter never hands out the state's own tables. */
export function copy<T>(value: T): T {
	if (type(value) !== "table") return value;
	const result = new LuaTable();
	for (const [key, item] of pairs(value as unknown as LuaTable))
		result.set(key, copy(item));
	return result as unknown as T;
}
