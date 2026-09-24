/** @noSelfInFile */

/**
 * The per-install bearer token. `dcs-bridge install` writes it to
 * `<Saved Games>/Config/tslua-dcs-bridge.token`; both bridges read it once at
 * load (before the mission environment is sanitized) and the CLI sends it.
 */

interface TokenGlobals {
	lfs?: { writedir(this: void): string };
}

export const TOKEN_FILE = "Config\\tslua-dcs-bridge.token";

/** Reads the token from Saved Games, or returns `undefined` (the bridge then refuses every RPC). */
export function readInstalledToken(): string | undefined {
	const globals = _G as unknown as TokenGlobals;
	if (globals.lfs === undefined) return undefined;
	const [file] = io.open(`${globals.lfs.writedir()}${TOKEN_FILE}`, "r");
	if (file === undefined) return undefined;
	const contents: unknown = file.read("*a");
	file.close();
	if (typeof contents !== "string") return undefined;
	const [token] = string.match(contents, "^%s*(%S+)%s*$");
	return token === undefined || token === "" ? undefined : token;
}
