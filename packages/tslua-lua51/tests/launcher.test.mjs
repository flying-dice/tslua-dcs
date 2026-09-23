/**
 * Launcher regression tests (node:test). Run: npm test --workspace=@flying-dice/tslua-lua51
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(packageDir, "..", "..");
const launcher = join(packageDir, "bin", "lua51.mjs");

/** The environment without anything that would select a toolchain or target dir for us. */
function cleanEnv(extra = {}) {
	const env = { ...process.env, ...extra };
	delete env.RUSTUP_TOOLCHAIN;
	if (!("CARGO_TARGET_DIR" in extra)) delete env.CARGO_TARGET_DIR;
	return env;
}

function run(args, { cwd = packageDir, env = cleanEnv(), input } = {}) {
	const result = spawnSync(process.execPath, [launcher, ...args], {
		cwd,
		env,
		input,
		encoding: "utf8",
		timeout: 15 * 60 * 1000,
	});
	return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

test("runs from the repository root and from a sibling workspace", () => {
	for (const cwd of [repoRoot, join(repoRoot, "packages", "tslua-http")]) {
		const { status, stdout, stderr } = run(["-e", "print('ok from ' .. _VERSION)"], { cwd });
		assert.equal(status, 0, stderr);
		assert.equal(stdout.trim(), "ok from Lua 5.1");
	}
});

test("builds with the package's pinned toolchain, not the caller's directory", () => {
	// A caller directory whose own pin names a toolchain that does not exist:
	// if cargo ran there, rustup would fail to resolve it.
	const caller = mkdtempSync(join(tmpdir(), "lua51-caller-"));
	try {
		writeFileSync(join(caller, "rust-toolchain.toml"), '[toolchain]\nchannel = "0.0.0"\n');
		writeFileSync(join(caller, "script.lua"), "print('relative script ran')\n");
		const { status, stdout, stderr } = run(["script.lua"], { cwd: caller });
		assert.equal(status, 0, stderr);
		assert.equal(stdout.trim(), "relative script ran", "the Lua child keeps the caller's working directory");
	} finally {
		rmSync(caller, { recursive: true, force: true });
	}
});

test("executes the binary Cargo built when CARGO_TARGET_DIR points elsewhere", () => {
	// A stable location so repeated local runs build incrementally.
	const targetDir = join(tmpdir(), "tslua-lua51-launcher-test-target");
	mkdirSync(targetDir, { recursive: true });
	const env = cleanEnv({ CARGO_TARGET_DIR: targetDir });

	const setup = run(["--setup"], { env });
	assert.equal(setup.status, 0, setup.stderr);
	const reported = setup.stdout.trim();
	assert.ok(
		reported.startsWith(targetDir + sep),
		`expected the binary under ${targetDir}, got ${reported} (the default target/release may hold a stale build)`,
	);

	// The interpreter's own path is the lowest index of the `arg` table.
	const executed = run(["-e", "local i = -1 while arg[i - 1] do i = i - 1 end print(arg[i])"], { env });
	assert.equal(executed.status, 0, executed.stderr);
	assert.equal(executed.stdout.trim(), reported, "the launched interpreter is the one Cargo reported");
});

test("stdin runs after -l, --preload and an explicit -", () => {
	const input = "print('executed', env ~= nil)\n";
	const cases = [
		[["-l", "socket"], "executed\tfalse"],
		[["--preload", "tests/dcs-doubles.lua"], "executed\ttrue"],
		[["--preload", "tests/dcs-doubles.lua", "-"], "executed\ttrue"],
		[["-"], "executed\tfalse"],
		[[], "executed\tfalse"],
	];
	for (const [args, expected] of cases) {
		const { status, stdout, stderr } = run(args, { input });
		assert.equal(status, 0, `${args.join(" ")}: ${stderr}`);
		assert.equal(stdout.trim(), expected, `lua51 ${args.join(" ")}`);
	}
});

test("-e without a script does not wait for stdin", async () => {
	const child = spawn(process.execPath, [launcher, "-e", "print('done')"], {
		cwd: packageDir,
		env: cleanEnv(),
		stdio: ["pipe", "pipe", "inherit"],
	});
	// stdin is deliberately left open: the interpreter must not read it.
	let stdout = "";
	child.stdout.on("data", (chunk) => {
		stdout += chunk;
	});
	const code = await new Promise((resolveExit, reject) => {
		const timer = setTimeout(() => {
			child.kill();
			reject(new Error("lua51 -e blocked on stdin"));
		}, 60 * 1000);
		child.on("exit", (exitCode) => {
			clearTimeout(timer);
			resolveExit(exitCode);
		});
	});
	child.stdin.end();
	assert.equal(code, 0);
	assert.equal(stdout.trim(), "done");
});
