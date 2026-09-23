/** @noSelfInFile */

/**
 * Makes DCS's bundled LuaSocket (`<install>/LuaSocket`) loadable. Imported
 * first by each entry point: `@flying-dice/tslua-http` requires `socket` as
 * soon as its module loads.
 */

interface LuaGlobals {
	// `package` is a reserved word in strict-mode TypeScript.
	package: { path: string; cpath: string };
	lfs?: { currentdir(this: void): string };
}

const globals = _G as unknown as LuaGlobals;
const installDir = globals.lfs !== undefined ? globals.lfs.currentdir() : "./";

/** DCS's LuaSocket folder, with a trailing separator. */
export const LUA_SOCKET_DIR = `${installDir}LuaSocket\\`;

function appendPath(current: string, entry: string): string {
	const [found] = string.find(current, entry, 1, true);
	return found === undefined ? `${current};${entry}` : current;
}

globals.package.path = appendPath(
	globals.package.path,
	`${LUA_SOCKET_DIR}?.lua`,
);
globals.package.cpath = appendPath(
	globals.package.cpath,
	`${LUA_SOCKET_DIR}?.dll`,
);
