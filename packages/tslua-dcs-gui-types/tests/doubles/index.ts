/** @noSelfInFile */

/**
 * Entry point of the DCS GUI doubles bundle (`.test/doubles.lua`). Preload it before a test bundle:
 *
 *     lua51 --preload ./.test/doubles.lua ./.test/tests.lua
 *
 * It installs every global that `src/index.ts` declares for the GUI environment (`DCS`, `Export`,
 * `net`, `lfs`, `log`, `terrain`, `coalition`, `db` and the version strings), each typed against the
 * declarations, plus the `guiDoubles` controller. See README.md in this directory.
 */

import { type GuiDoubles, createController } from "./controller";
import { copy, type DoubleContext } from "./context";
import { dbFixture, ownshipFixture } from "./fixtures";
import { guardDotCalls } from "./guard";
import { createDCS } from "./namespaces/DCS";
import { createExport } from "./namespaces/Export";
import { createLfs } from "./namespaces/lfs";
import { createLog } from "./namespaces/log";
import { createNet } from "./namespaces/net";
import { createTerrain } from "./namespaces/terrain";
import { createState, type GuiState } from "./state";

export const DCS_VERSION = "2.9.29.27468";

let state: GuiState = createState();
const context: DoubleContext = {
	state: () => state,
	native: (name, arguments_) => {
		state.nativeCalls.push({ name, arguments_: copy(arguments_) });
		return undefined;
	},
};

/**
 * The globals src/index.ts declares, with their declared types (`typeof DCS` is `l_DCS`, ...). A
 * double must be assignable to the declared type of its global, so a missing or mistyped member is a
 * compile error here (and in the namespace files, which return the declared interfaces).
 */
interface DeclaredGlobals {
	DCS: typeof DCS;
	Export: typeof Export;
	net: typeof net;
	lfs: typeof lfs;
	log: typeof log;
	terrain: typeof terrain;
	coalition: typeof coalition;
	db: typeof db;
	_APP_VERSION: typeof _APP_VERSION;
	__DCS_VERSION__: typeof __DCS_VERSION__;
	__FINAL_VERSION__: typeof __FINAL_VERSION__;
	_ARCHITECTURE: typeof _ARCHITECTURE;
	guiDoubles: GuiDoubles;
}

const installed: string[] = [];
function install<K extends keyof DeclaredGlobals>(
	name: K,
	value: DeclaredGlobals[K],
): void {
	rawset(_G as unknown as Record<string, unknown>, name, value);
	installed.push(name);
}

install("DCS", guardDotCalls("DCS", createDCS(context)));
install("Export", guardDotCalls("Export", createExport(context)));
install("net", guardDotCalls("net", createNet(context)));
install("lfs", guardDotCalls("lfs", createLfs(context)));
install("log", guardDotCalls("log", createLog(context)));
install("terrain", guardDotCalls("terrain", createTerrain(context)));
install("coalition", { NEUTRAL: 0, RED: 1, BLUE: 2 });
install("db", dbFixture());
install("_APP_VERSION", DCS_VERSION);
install("__DCS_VERSION__", DCS_VERSION);
install("__FINAL_VERSION__", DCS_VERSION);
install("_ARCHITECTURE", "x86_64");

const controller: GuiDoubles = createController(
	() => state,
	() => {
		state = createState();
	},
	ownshipFixture,
	[...installed],
);
install("guiDoubles", controller);
