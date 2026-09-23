#!/usr/bin/env node
/**
 * `lua51` — runs the repository-managed Lua 5.1.5 interpreter.
 *
 * Builds `crates/lua51` with the pinned Rust toolchain (a no-op when it is
 * already up to date; cargo serialises concurrent builds itself), then runs
 * it with the given arguments, which are the same as stock `lua`'s plus
 * `--preload <file>`.
 *
 *   lua51 [options] [script [args]]   run a script
 *   lua51 --setup                      build only, print the binary path
 */
import { spawn, spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const binary = join(
	packageDir,
	"target",
	"release",
	process.platform === "win32" ? "tslua-lua51.exe" : "tslua-lua51",
);

function build() {
	const result = spawnSync(
		"cargo",
		["build", "--release", "--locked", "--quiet", "--manifest-path", join(packageDir, "Cargo.toml")],
		{ stdio: ["ignore", "inherit", "inherit"] },
	);
	if (result.error?.code === "ENOENT") {
		process.stderr.write(
			"[lua51] cargo was not found. Install Rust via https://rustup.rs — the toolchain version is pinned by packages/tslua-lua51/rust-toolchain.toml and installed automatically.\n",
		);
		process.exit(1);
	}
	if (result.status !== 0) {
		process.stderr.write(`[lua51] building the interpreter failed (exit ${result.status ?? result.signal})\n`);
		process.exit(1);
	}
}

const args = process.argv.slice(2);
build();

if (args[0] === "--setup") {
	process.stdout.write(`${binary}\n`);
	process.exit(0);
}

const child = spawn(binary, args, { stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
	process.on(signal, () => {
		if (child.exitCode === null) child.kill(signal);
	});
}
child.on("error", (error) => {
	process.stderr.write(`[lua51] ${error.message}\n`);
	process.exit(1);
});
child.on("exit", (code, signal) => {
	process.exit(code ?? (signal ? 1 : 0));
});
