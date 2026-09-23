/**
 * Checks luatest's end-of-run contract from the outside: plain Lua scripts in ./fixtures run on
 * `lua51` against the compiled library (.test/lib) and must exit with the expected status.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const lib = resolve(here, "../.test/lib");
const lua51 = createRequire(import.meta.url).resolve("@flying-dice/tslua-lua51/bin/lua51.mjs");

function run(...args) {
	const result = spawnSync(process.execPath, [lua51, ...args], { cwd: lib, encoding: "utf8" });
	return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

const fixture = (name) => resolve(here, "fixtures", name);

const cases = [
	{
		name: "auto-run mode, passing, no run(): exits 0",
		args: [fixture("auto-pass.lua")],
		status: 0,
		stdout: ["Test Suite: legacy", "[OK] - legacy > passes"],
	},
	{
		name: "auto-run mode, failing, no run(): exits 1 at the failing block",
		args: [fixture("auto-fail.lua")],
		status: 1,
		stdout: ["[FAIL] - legacy > fails", "[OK] - legacy > still runs"],
		absent: ["second block"],
		stderr: ['luatest: 1 of 2 tests failed in "legacy"'],
	},
	{
		name: "deferred mode, passing: exits 0 with totals",
		args: [fixture("deferred-pass.lua")],
		status: 0,
		stdout: ["[OK] - deferred > one", "[OK] - deferred > two", "Tests: 0 failed, 2 passed, 0 skipped, 2 total"],
	},
	{
		name: "deferred mode, failing: runs everything, then exits 1",
		args: [fixture("deferred-fail.lua")],
		status: 1,
		stdout: [
			"[FAIL] - first > fails",
			"First difference at received.a: values differ",
			"[OK] - second > still runs",
			"Failed tests:",
			"  - first > fails",
			"Tests: 1 failed, 2 passed, 0 skipped, 3 total",
		],
		stderr: ["luatest: 1 of 3 tests failed"],
	},
	{
		name: "deferred mode, run() never called: exits 1 instead of passing silently",
		args: [fixture("deferred-never-run.lua")],
		status: 1,
		stdout: ["tests were declared but never run"],
	},
	{
		name: "DCS doubles via --preload: spies on trigger.action and timer",
		args: ["--preload", fixture("dcs-doubles.lua"), fixture("dcs.lua")],
		status: 0,
		stdout: ["[OK] - announce > writes to the screen through trigger.action.outText", "[OK] - announce > uses the mission time"],
	},
];

let failed = 0;
for (const testCase of cases) {
	const result = run(...testCase.args);
	try {
		assert.equal(result.status, testCase.status, `exit status\n${result.stdout}\n${result.stderr}`);
		for (const text of testCase.stdout ?? []) assert.ok(result.stdout.includes(text), `stdout lacks ${JSON.stringify(text)}:\n${result.stdout}`);
		for (const text of testCase.stderr ?? []) assert.ok(result.stderr.includes(text), `stderr lacks ${JSON.stringify(text)}:\n${result.stderr}`);
		for (const text of testCase.absent ?? []) assert.ok(!result.stdout.includes(text), `stdout should not contain ${JSON.stringify(text)}`);
		console.log(`[OK] - exit codes > ${testCase.name}`);
	} catch (error) {
		failed++;
		console.log(`[FAIL] - exit codes > ${testCase.name}\n${error.message}`);
	}
}
console.log(`Exit-code checks: ${failed} failed, ${cases.length - failed} passed, ${cases.length} total`);
process.exitCode = failed > 0 ? 1 : 0;
