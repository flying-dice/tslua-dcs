/**
 * The single rule for "which DCS Saved Games profile, and which bridge token".
 *
 * Shared by the `dcs-bridge` installer/CLI and both type exporters so they can
 * never disagree: previously the exporters picked the profile with the newest
 * token file while the installer picked the one with the newest dcs.log, so
 * with two profiles the exporters could send another profile's token (401).
 *
 * Plain ESM with no dependencies, so any package script can import it by
 * relative path without a workspace dependency (the bridge package already
 * depends on the type packages, so they cannot depend on it).
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

/** The bridge token's location, relative to the Saved Games profile. */
export const TOKEN_FILE = join("Config", "tslua-dcs-bridge.token");

/**
 * The Saved Games profile: `DCS_SAVED_GAMES` if set, else the `DCS*` folder under
 * `<root>` (default `~/Saved Games`) whose `Logs/dcs.log` was written most recently.
 */
export function findSavedGames({ root = join(homedir(), "Saved Games") } = {}) {
	if (process.env.DCS_SAVED_GAMES) return resolve(process.env.DCS_SAVED_GAMES);
	if (!existsSync(root)) {
		throw new Error(`[dcs-bridge] no Saved Games folder at ${root}; set DCS_SAVED_GAMES`);
	}
	const candidates = readdirSync(root)
		.filter((name) => /^DCS/i.test(name))
		.map((name) => join(root, name))
		.map((dir) => {
			const log = join(dir, "Logs", "dcs.log");
			return { dir, used: existsSync(log) ? statSync(log).mtimeMs : 0 };
		})
		.sort((a, b) => b.used - a.used);
	if (candidates.length === 0) {
		throw new Error(`[dcs-bridge] no DCS folder under ${root}; set DCS_SAVED_GAMES`);
	}
	return candidates[0].dir;
}

/** The token file of the profile {@link findSavedGames} selects. */
export function tokenPath(options) {
	return join(findSavedGames(options), TOKEN_FILE);
}

/** The bridge token: `DCS_BRIDGE_TOKEN` if set, else the selected profile's token file. */
export function bridgeToken(options) {
	const fromEnv = process.env.DCS_BRIDGE_TOKEN?.trim();
	if (fromEnv) return fromEnv;
	const file = tokenPath(options);
	if (!existsSync(file)) {
		throw new Error(`[dcs-bridge] no bridge token at ${file}; run: npm run dcs:start (or set DCS_BRIDGE_TOKEN)`);
	}
	return readFileSync(file, "utf8").trim();
}
