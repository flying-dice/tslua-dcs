/**
 * Node tests for the `dcs-bridge` CLI and the test-mission builder, against a fake
 * Saved Games folder and a fake DCS install in a temp directory (no DCS needed).
 * Run: npm test --workspace=@flying-dice/tslua-dcs-bridge (after npm run build).
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(packageDir, "..", "..");
const cli = join(packageDir, "scripts", "dcs-bridge.mjs");

const STOCK_MISSION_SCRIPTING = [
	"--Initialization script for the Mission lua Environment (SSE)",
	"",
	"dofile('Scripts/ScriptingSystem.lua')",
	"",
	"--Sanitize Mission Scripting environment",
	"local function sanitizeModule(name)",
	"\t_G[name] = nil",
	"\tpackage.loaded[name] = nil",
	"end",
	"",
	"do",
	"\tsanitizeModule('os')",
	"\t_G['require'] = nil",
	"end",
	"",
].join("\r\n");

let sandbox;
let env;
let missionScripting;

beforeEach(() => {
	sandbox = mkdtempSync(join(tmpdir(), "dcs-bridge-cli-"));
	const savedGames = join(sandbox, "Saved Games", "DCS.openbeta");
	const install = join(sandbox, "DCS World");
	mkdirSync(join(savedGames, "Logs"), { recursive: true });
	mkdirSync(join(install, "Scripts"), { recursive: true });
	mkdirSync(join(install, "bin"), { recursive: true });
	writeFileSync(join(install, "bin", "DCS.exe"), "");
	missionScripting = join(install, "Scripts", "MissionScripting.lua");
	writeFileSync(missionScripting, STOCK_MISSION_SCRIPTING);
	env = { ...process.env, DCS_SAVED_GAMES: savedGames, DCS_INSTALL: install };
});

afterEach(() => rmSync(sandbox, { recursive: true, force: true }));

function dcsBridge(...args) {
	return spawnSync(process.execPath, [cli, ...args], { env, encoding: "utf8" });
}

function paths() {
	return JSON.parse(dcsBridge("paths").stdout);
}

test("install writes the hook, mission script and test mission, and patches MissionScripting.lua", () => {
	const result = dcsBridge("install");
	assert.equal(result.status, 0, result.stderr);
	const p = paths();
	for (const file of [p.hook, p.missionScript, p.testMission]) assert.ok(existsSync(file), `${file} missing`);
	const patched = readFileSync(missionScripting, "utf8");
	assert.equal(patched.match(/-- BEGIN tslua-dcs-bridge/g)?.length, 1);
	assert.ok(
		patched.indexOf("-- BEGIN tslua-dcs-bridge") > patched.indexOf("dofile('Scripts/ScriptingSystem.lua')"),
		"loader runs after ScriptingSystem.lua",
	);
	assert.ok(
		patched.indexOf("-- END tslua-dcs-bridge") < patched.indexOf("sanitizeModule"),
		"loader runs before the sanitization block",
	);
	assert.ok(patched.includes("[[Scripts\\tslua-dcs\\mission-bridge.lua]]"));
	assert.ok(!/[^\r]\n/.test(patched), "CRLF line endings are preserved");
	assert.equal(readFileSync(`${missionScripting}.tslua-dcs.bak`, "utf8"), STOCK_MISSION_SCRIPTING);
});

test("install is idempotent: one loader block, and the backup keeps the original", () => {
	dcsBridge("install");
	const once = readFileSync(missionScripting, "utf8");
	dcsBridge("install");
	dcsBridge("install");
	assert.equal(readFileSync(missionScripting, "utf8"), once);
	assert.equal(readFileSync(`${missionScripting}.tslua-dcs.bak`, "utf8"), STOCK_MISSION_SCRIPTING);
});

test("uninstall removes every installed file and restores MissionScripting.lua byte for byte", () => {
	dcsBridge("install");
	const p = paths();
	const result = dcsBridge("uninstall");
	assert.equal(result.status, 0, result.stderr);
	for (const file of [p.hook, p.missionScript, p.testMission]) assert.ok(!existsSync(file), `${file} left behind`);
	assert.equal(readFileSync(missionScripting, "utf8"), STOCK_MISSION_SCRIPTING);
});

test("install refuses a MissionScripting.lua without the ScriptingSystem anchor", () => {
	writeFileSync(missionScripting, "-- something else entirely\n");
	const result = dcsBridge("install");
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /has no "dofile\('Scripts\/ScriptingSystem\.lua'\)" line/);
});

test("the npm bin shim runs the CLI (it resolves through the workspace symlink)", () => {
	const shim = join(repoRoot, "node_modules", ".bin", process.platform === "win32" ? "dcs-bridge.cmd" : "dcs-bridge");
	const result = spawnSync(shim, ["paths"], { env, encoding: "utf8", shell: process.platform === "win32" });
	assert.equal(result.status, 0, result.stderr);
	assert.equal(JSON.parse(result.stdout).install, env.DCS_INSTALL);
});

/** Reads a (store or deflate) ZIP into { name: text }. */
function unzip(buffer) {
	const files = {};
	let offset = 0;
	while (buffer.readUInt32LE(offset) === 0x04034b50) {
		const method = buffer.readUInt16LE(offset + 8);
		const size = buffer.readUInt32LE(offset + 18);
		const nameLength = buffer.readUInt16LE(offset + 26);
		const extraLength = buffer.readUInt16LE(offset + 28);
		const name = buffer.toString("utf8", offset + 30, offset + 30 + nameLength);
		const start = offset + 30 + nameLength + extraLength;
		const data = buffer.subarray(start, start + size);
		files[name] = (method === 8 ? inflateRawSync(data) : data).toString("utf8");
		offset = start + size;
	}
	return files;
}

test("the generated test mission is a valid .miz that Lua 5.1 can load", () => {
	const miz = readFileSync(join(packageDir, "dist", "tslua-dcs-test.miz"));
	const files = unzip(miz);
	assert.deepEqual(Object.keys(files).sort(), [
		"l10n/DEFAULT/dictionary",
		"l10n/DEFAULT/mapResource",
		"mission",
		"options",
		"theatre",
		"warehouses",
	]);
	assert.equal(files.theatre, "Caucasus");
	const script = join(sandbox, "check.lua");
	writeFileSync(
		script,
		`${files.mission}\nassert(mission.theatre == "Caucasus")\nassert(mission.coalition.blue.country[1].name == "USA")\nassert(#mission.coalition.red.country == 1)\nprint("ok")\n`,
	);
	const lua51 = join(repoRoot, "node_modules", ".bin", process.platform === "win32" ? "lua51.cmd" : "lua51");
	const out = execFileSync(lua51, [script], { encoding: "utf8", shell: process.platform === "win32" });
	assert.equal(out.trim(), "ok");
});
