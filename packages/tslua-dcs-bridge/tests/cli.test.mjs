/**
 * Node tests for the `dcs-bridge` CLI and the test-mission builder, against a fake
 * Saved Games folder and a fake DCS install in a temp directory (no DCS needed).
 * Run: npm test --workspace=@flying-dice/tslua-dcs-bridge (after npm run build).
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
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

test("install creates a per-install bearer token, keeps it on reinstall, and uninstall removes it", async () => {
	dcsBridge("install");
	const p = paths();
	const token = readFileSync(p.token, "utf8").trim();
	assert.match(token, /^[0-9a-f]{64}$/);
	dcsBridge("install");
	assert.equal(readFileSync(p.token, "utf8").trim(), token, "a running DCS keeps working after reinstall");
	const { bridgeToken } = await import(`${pathToFileURL(cli).href}?token-test`);
	const previous = { ...process.env };
	try {
		process.env.DCS_SAVED_GAMES = env.DCS_SAVED_GAMES;
		delete process.env.DCS_BRIDGE_TOKEN;
		assert.equal(bridgeToken(), token);
		process.env.DCS_BRIDGE_TOKEN = "from-env";
		assert.equal(bridgeToken(), "from-env");
	} finally {
		process.env = previous;
	}
	dcsBridge("uninstall");
	assert.ok(!existsSync(p.token));
});

test("luaString round-trips every byte through Lua 5.1, including control characters before digits", async () => {
	// Regression: variable-width \ddd escapes turned TAB + "42" into the invalid "\942"
	// and byte 1 + "2" into "\12" (a different character).
	const { luaString } = await import(`${pathToFileURL(cli).href}?quote-test`);
	const samples = [
		"\t42",
		"\u00012",
		"\u000199",
		"x\u001f0y",
		"\u007f9",
		'quote " backslash \\ end',
		"crlf\r\nlf\n",
		Array.from({ length: 128 }, (_, i) => String.fromCharCode(i)).join(""),
		Array.from({ length: 128 }, (_, i) => `${String.fromCharCode(i)}${i % 10}`).join(""),
	];
	const script = join(sandbox, "roundtrip.lua");
	writeFileSync(
		script,
		`${samples
			.map(
				(sample) =>
					`io.write((string.gsub(${luaString(sample)}, ".", function(c) return string.format("%02x", string.byte(c)) end)), "\\n")`,
			)
			.join("\n")}\n`,
	);
	const lua51 = join(repoRoot, "node_modules", ".bin", process.platform === "win32" ? "lua51.cmd" : "lua51");
	const lines = execFileSync(lua51, [script], { encoding: "utf8", shell: process.platform === "win32" })
		.trim()
		.split(/\r?\n/);
	assert.deepEqual(
		lines,
		samples.map((sample) => Buffer.from(sample, "latin1").toString("hex")),
	);
});

test("with two profiles, the installer, the CLI and the exporters all pick the same profile and token", async () => {
	// Regression: the exporters used to pick the profile with the newest *token file* while the
	// installer/CLI pick the one with the newest dcs.log, so they could send another profile's token.
	const profiles = await import(`${pathToFileURL(join(repoRoot, "scripts", "dcs-profile.mjs")).href}?two-profiles`);
	const root = join(sandbox, "Two Profiles");
	const stable = join(root, "DCS");
	const beta = join(root, "DCS.openbeta");
	for (const dir of [stable, beta]) mkdirSync(join(dir, "Logs"), { recursive: true });
	for (const dir of [stable, beta]) mkdirSync(join(dir, "Config"), { recursive: true });
	const now = Date.now() / 1000;
	// DCS.openbeta: older log, NEWER token. DCS: newer log, older token.
	writeFileSync(join(beta, "Logs", "dcs.log"), "");
	utimesSync(join(beta, "Logs", "dcs.log"), now - 3600, now - 3600);
	writeFileSync(join(stable, "Logs", "dcs.log"), "");
	utimesSync(join(stable, "Logs", "dcs.log"), now - 60, now - 60);
	writeFileSync(join(stable, "Config", "tslua-dcs-bridge.token"), "stable-token\n");
	utimesSync(join(stable, "Config", "tslua-dcs-bridge.token"), now - 7200, now - 7200);
	writeFileSync(join(beta, "Config", "tslua-dcs-bridge.token"), "beta-token\n");
	utimesSync(join(beta, "Config", "tslua-dcs-bridge.token"), now - 10, now - 10);

	const previous = { ...process.env };
	try {
		delete process.env.DCS_SAVED_GAMES;
		delete process.env.DCS_BRIDGE_TOKEN;
		assert.equal(profiles.findSavedGames({ root }), stable, "the newest dcs.log wins");
		assert.equal(profiles.bridgeToken({ root }), "stable-token", "the token of that same profile");
		process.env.DCS_SAVED_GAMES = beta;
		assert.equal(profiles.bridgeToken({ root }), "beta-token", "an explicit profile is honoured");
		process.env.DCS_BRIDGE_TOKEN = "explicit";
		assert.equal(profiles.bridgeToken({ root }), "explicit", "an explicit token wins");
	} finally {
		process.env = previous;
	}

	// The CLI re-exports the very same functions, so it cannot drift from the exporters.
	const shared = await import(pathToFileURL(join(repoRoot, "scripts", "dcs-profile.mjs")).href);
	const cliModule = await import(pathToFileURL(cli).href);
	assert.equal(cliModule.findSavedGames, shared.findSavedGames);
	assert.equal(cliModule.bridgeToken, shared.bridgeToken);
});

test("both exporters take their token from the shared profile module, with no discovery of their own", () => {
	for (const pkg of ["tslua-dcs-mission-types", "tslua-dcs-gui-types"]) {
		const source = readFileSync(join(repoRoot, "packages", pkg, "scripts", "export.ts"), "utf8");
		assert.match(source, /import \{ bridgeToken \} from "\.\.\/\.\.\/\.\.\/scripts\/dcs-profile\.mjs";/, pkg);
		assert.match(source, /authorization: `Bearer \$\{bridgeToken\(\)\}`/, pkg);
		assert.doesNotMatch(source, /Saved Games|readdirSync|tslua-dcs-bridge\.token/, `${pkg} has its own discovery`);
	}
});
