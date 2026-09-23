import {
	afterEach,
	beforeEach,
	restoreAllMocks,
} from "@flying-dice/tslua-luatest";
import type { GuiDoubles } from "./doubles/controller";

/**
 * The preloaded doubles' controller. The suites in this package only run offline
 * (`lua51 --preload .test/doubles.lua`), so a missing controller is a setup error.
 */
export function doubles(): GuiDoubles {
	if (guiDoubles === undefined)
		error(
			"the DCS GUI doubles are not loaded: run with lua51 --preload ./.test/doubles.lua",
			2,
		);
	return guiDoubles as GuiDoubles;
}

/** Fresh state before, and no spies left behind after, every test of the enclosing describe. */
export function isolate(): void {
	beforeEach(() => doubles().reset());
	afterEach(() => restoreAllMocks());
}
