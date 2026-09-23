#!/usr/bin/env node
/**
 * `dcs-bridge` — installs, drives and talks to the project bridge in DCS World.
 *
 *   dcs-bridge install            copy the GUI hook, mission script and test mission into Saved Games
 *                                 and add the loader block to MissionScripting.lua
 *   dcs-bridge uninstall          undo all of the above
 *   dcs-bridge paths              print the resolved DCS paths
 *   dcs-bridge status             GET /health on both bridges
 *   dcs-bridge launch             start DCS and wait for the GUI bridge
 *   dcs-bridge mission [file.miz] start a mission (default: the installed empty test mission)
 *                                 from the GUI bridge, unpause it, and wait for the mission bridge
 *   dcs-bridge eval <gui|mission> <lua code | ->   run Lua and print the JSON result
 *   dcs-bridge run <gui|mission> <bundle.lua>      run a compiled bundle (e.g. a luatest suite); exit 1 on failure
 *
 * Paths are auto-detected; override with DCS_SAVED_GAMES (e.g. "...\Saved Games\DCS.openbeta")
 * and DCS_INSTALL. Bridge URLs default to http://127.0.0.1:25579 (gui) and :25580 (mission);
 * override with DCS_BRIDGE_GUI_URL / DCS_BRIDGE_MISSION_URL.
 */
import { execFileSync, spawn } from "node:child_process";
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	realpathSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(packageDir, "dist");

export const BRIDGE_URLS = {
	gui: (process.env.DCS_BRIDGE_GUI_URL ?? "http://127.0.0.1:25579").replace(/\/$/, ""),
	mission: (process.env.DCS_BRIDGE_MISSION_URL ?? "http://127.0.0.1:25580").replace(/\/$/, ""),
};

const HOOK_FILE = "tslua-dcs-bridge.lua";
const MISSION_DIR = "tslua-dcs";
const MISSION_FILE = "mission-bridge.lua";
const BEGIN_MARK = "-- BEGIN tslua-dcs-bridge";
const END_MARK = "-- END tslua-dcs-bridge";
const ANCHOR = "dofile('Scripts/ScriptingSystem.lua')";
const TEST_MISSION = "tslua-dcs-test.miz";

function fail(message) {
	throw new Error(`[dcs-bridge] ${message}`);
}

/** The Saved Games write dir: DCS_SAVED_GAMES, else the DCS* folder whose dcs.log is newest. */
export function findSavedGames() {
	if (process.env.DCS_SAVED_GAMES) return resolve(process.env.DCS_SAVED_GAMES);
	const root = join(homedir(), "Saved Games");
	if (!existsSync(root)) fail(`no Saved Games folder at ${root}; set DCS_SAVED_GAMES`);
	const candidates = readdirSync(root)
		.filter((name) => /^DCS/i.test(name))
		.map((name) => join(root, name))
		.map((dir) => {
			const log = join(dir, "Logs", "dcs.log");
			return { dir, used: existsSync(log) ? statSync(log).mtimeMs : 0 };
		})
		.sort((a, b) => b.used - a.used);
	if (candidates.length === 0) fail(`no DCS folder under ${root}; set DCS_SAVED_GAMES`);
	return candidates[0].dir;
}

/** The game install dir: DCS_INSTALL, else the Windows uninstall registry entry. */
export function findInstall() {
	if (process.env.DCS_INSTALL) return resolve(process.env.DCS_INSTALL);
	const hives = [
		"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
		"HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
		"HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
	];
	for (const hive of hives) {
		let output = "";
		try {
			output = execFileSync("reg", ["query", hive, "/s", "/f", "DCS World", "/d"], {
				encoding: "utf8",
				stdio: ["ignore", "pipe", "ignore"],
			});
		} catch {
			continue;
		}
		for (const block of output.split(/\r?\n\r?\n/)) {
			const location = block.match(/InstallLocation\s+REG_SZ\s+(.+)/);
			if (location && existsSync(join(location[1].trim(), "bin", "DCS.exe"))) {
				return location[1].trim().replace(/\\$/, "");
			}
		}
	}
	fail("could not find the DCS install; set DCS_INSTALL");
}

function paths() {
	const savedGames = findSavedGames();
	const install = findInstall();
	return {
		savedGames,
		install,
		hook: join(savedGames, "Scripts", "Hooks", HOOK_FILE),
		missionScript: join(savedGames, "Scripts", MISSION_DIR, MISSION_FILE),
		missionScripting: join(install, "Scripts", "MissionScripting.lua"),
		testMission: join(savedGames, "Missions", MISSION_DIR, TEST_MISSION),
		exe: [join(install, "bin-mt", "DCS.exe"), join(install, "bin", "DCS.exe")].find((p) => existsSync(p)),
	};
}

function loaderBlock() {
	return [
		`${BEGIN_MARK} (added by \`dcs-bridge install\`; remove with \`dcs-bridge uninstall\`)`,
		"do",
		`\tlocal ok, err = pcall(dofile, lfs.writedir() .. [[Scripts\\${MISSION_DIR}\\${MISSION_FILE}]])`,
		'\tif not ok then env.error("[tslua-dcs-bridge] " .. tostring(err)) end',
		"end",
		END_MARK,
	].join("\n");
}

function stripLoader(source) {
	const pattern = new RegExp(`\\r?\\n?\\r?\\n?${BEGIN_MARK}[\\s\\S]*?${END_MARK}`, "g");
	return source.replace(pattern, "");
}

export function install() {
	const p = paths();
	for (const bundle of ["tslua-dcs-gui-bridge.lua", "tslua-dcs-mission-bridge.lua", TEST_MISSION]) {
		if (!existsSync(join(distDir, bundle))) fail(`missing dist/${bundle}; run npm run build first`);
	}
	mkdirSync(dirname(p.hook), { recursive: true });
	mkdirSync(dirname(p.missionScript), { recursive: true });
	copyFileSync(join(distDir, "tslua-dcs-gui-bridge.lua"), p.hook);
	copyFileSync(join(distDir, "tslua-dcs-mission-bridge.lua"), p.missionScript);
	// DCS keeps a running mission file open, so it runs a copy, never dist/.
	mkdirSync(dirname(p.testMission), { recursive: true });
	try {
		copyFileSync(join(distDir, TEST_MISSION), p.testMission);
	} catch (error) {
		if (error.code !== "EBUSY") throw error;
		console.warn(`test mission is open in DCS; kept the existing ${p.testMission}`);
	}

	const original = readFileSync(p.missionScripting, "utf8");
	const backup = `${p.missionScripting}.tslua-dcs.bak`;
	if (!existsSync(backup)) writeFileSync(backup, original);
	const clean = stripLoader(original);
	if (!clean.includes(ANCHOR)) fail(`${p.missionScripting} has no "${ANCHOR}" line to anchor the loader`);
	const eol = clean.includes("\r\n") ? "\r\n" : "\n";
	const patched = clean.replace(ANCHOR, `${ANCHOR}${eol}${eol}${loaderBlock().replaceAll("\n", eol)}`);
	writeFileSync(p.missionScripting, patched);

	console.log(`installed GUI hook       ${p.hook}`);
	console.log(`installed mission script ${p.missionScript}`);
	console.log(`installed test mission   ${p.testMission}`);
	console.log(`patched                  ${p.missionScripting} (original kept at ${backup})`);
	console.log("Restart DCS to load the GUI hook; the mission bridge starts with every mission.");
}

export function uninstall() {
	const p = paths();
	rmSync(p.hook, { force: true });
	rmSync(dirname(p.missionScript), { recursive: true, force: true });
	rmSync(dirname(p.testMission), { recursive: true, force: true });
	if (existsSync(p.missionScripting)) {
		const source = readFileSync(p.missionScripting, "utf8");
		const clean = stripLoader(source);
		if (clean !== source) writeFileSync(p.missionScripting, clean);
	}
	console.log("removed the GUI hook, the mission script, the test mission and the MissionScripting.lua loader");
}

export async function health(env, timeoutMs = 2000) {
	const response = await fetch(`${BRIDGE_URLS[env]}/health`, { signal: AbortSignal.timeout(timeoutMs) });
	if (!response.ok) fail(`${env} bridge /health returned HTTP ${response.status}`);
	return response.json();
}

let rpcId = 0;
/** Calls a JSON-RPC method on a bridge and returns its result (throws on an RPC error). */
export async function rpc(env, method, params = {}, timeoutMs = 120000) {
	const id = `dcs-bridge-${++rpcId}`;
	const response = await fetch(`${BRIDGE_URLS[env]}/rpc`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
		signal: AbortSignal.timeout(timeoutMs),
	});
	if (!response.ok) fail(`${env} bridge /rpc returned HTTP ${response.status}`);
	const body = await response.json();
	if (body.error) fail(`${method} failed (${body.error.code}): ${body.error.message}`);
	return body.result;
}

export function evaluate(env, code, timeoutMs) {
	return rpc(env, "eval", { code }, timeoutMs);
}

export async function waitForHealth(env, timeoutMs) {
	const deadline = Date.now() + timeoutMs;
	let last;
	while (Date.now() < deadline) {
		try {
			return await health(env, Math.min(2000, Math.max(1, deadline - Date.now())));
		} catch (error) {
			last = error;
		}
		await new Promise((r) => setTimeout(r, 1000));
	}
	fail(`${env} bridge not healthy after ${timeoutMs / 1000}s: ${last?.message ?? "no response"}`);
}

export async function launch({ timeoutMs = 300000 } = {}) {
	try {
		return await health("gui", 1500);
	} catch {}
	const p = paths();
	if (!p.exe) fail(`no DCS.exe under ${p.install}`);
	spawn(p.exe, ["--no-launcher"], { cwd: dirname(p.exe), detached: true, stdio: "ignore" }).unref();
	console.log(`started ${p.exe}; waiting for the GUI bridge...`);
	return waitForHealth("gui", timeoutMs);
}

export async function loadMission(file, { timeoutMs = 300000 } = {}) {
	const missionPath = resolve(file ?? paths().testMission);
	if (!existsSync(missionPath)) fail(`no mission file at ${missionPath}`);
	const started = await evaluate("gui", `return DCS.startMission(${JSON.stringify(missionPath)})`);
	if (started === false) fail(`DCS refused to load ${missionPath}`);
	console.log(`loading ${missionPath}; waiting for the mission bridge...`);
	// A single-player mission loads paused; the mission bridge is pumped by a
	// model-time timer, so unpause from the GUI side until it answers.
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			return await health("mission", 1500);
		} catch {}
		try {
			await evaluate("gui", "if DCS.getPause() then DCS.setPause(false) end return true", 5000);
		} catch {}
		await new Promise((r) => setTimeout(r, 1000));
	}
	fail(`mission bridge not healthy after ${timeoutMs / 1000}s`);
}

/** Lua-quotes a string for embedding in code sent to the bridge. */
function luaString(value) {
	return `"${value
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')
		.replace(/\r/g, "\\r")
		.replace(/\n/g, "\\n")
		// biome-ignore lint/suspicious/noControlCharactersInRegex: Lua strings must escape every control character.
		.replace(/[\x00-\x1f]/g, (c) => `\\${c.charCodeAt(0)}`)}"`;
}

/**
 * Runs a compiled Lua bundle (e.g. a luatest suite) inside DCS: captures its
 * `print` output, and reports whether it completed without raising an error.
 */
export async function runBundle(env, file, { timeoutMs = 300000 } = {}) {
	const bundle = readFileSync(resolve(file), "utf8");
	const code = [
		"local output = {}",
		"local original_print = print",
		"print = function(...) local values = {...} for i = 1, select('#', ...) do values[i] = tostring(values[i]) end output[#output + 1] = table.concat(values, '\\t') if original_print then original_print(...) end end",
		`local chunk, load_error = loadstring(${luaString(bundle)}, ${luaString(`@${file}`)})`,
		"if not chunk then print = original_print return { passed = false, error = load_error, output = output } end",
		"local ok, result = pcall(chunk)",
		"print = original_print",
		"if not ok then return { passed = false, error = tostring(result), output = output } end",
		"return { passed = true, output = output }",
	].join("\n");
	const result = await evaluate(env, code, timeoutMs);
	const output = Array.isArray(result?.output) ? result.output : [];
	return { passed: result?.passed === true, error: result?.error, output };
}

async function main(argv) {
	const [command, ...rest] = argv;
	switch (command) {
		case "install":
			return install();
		case "uninstall":
			return uninstall();
		case "paths":
			return console.log(JSON.stringify(paths(), null, 2));
		case "status":
			for (const env of ["gui", "mission"]) {
				try {
					console.log(env, JSON.stringify(await health(env)));
				} catch (error) {
					console.log(env, "unreachable:", error.message);
				}
			}
			return;
		case "launch":
			return console.log(JSON.stringify(await launch()));
		case "mission":
			return console.log(JSON.stringify(await loadMission(rest[0])));
		case "run": {
			const [env, file] = rest;
			if ((env !== "gui" && env !== "mission") || !file) fail("usage: dcs-bridge run <gui|mission> <bundle.lua>");
			const result = await runBundle(env, file);
			for (const line of result.output) console.log(line);
			if (!result.passed) fail(result.error ?? "bundle failed");
			return console.log(`PASS: ${file} ran in the DCS ${env} environment`);
		}
		case "eval": {
			const [env, codeArg] = rest;
			if (env !== "gui" && env !== "mission") fail("usage: dcs-bridge eval <gui|mission> <code | ->");
			const code = codeArg === "-" || codeArg === undefined ? readFileSync(0, "utf8") : codeArg;
			return console.log(JSON.stringify(await evaluate(env, code), null, 2));
		}
		default:
			console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("*/")[0]);
			if (command) process.exitCode = 1;
	}
}

// Compare real paths: npm runs bins through a workspace symlink.
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
	main(process.argv.slice(2)).catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	});
}
