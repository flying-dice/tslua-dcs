#!/usr/bin/env node
/**
 * `lua51` — runs the repository-managed Lua 5.1.5 interpreter.
 *
 * Builds `crates/lua51` with the pinned Rust toolchain (a no-op when it is
 * already up to date; cargo serialises concurrent builds itself), then runs
 * it with the given arguments, which are the same as stock `lua`'s plus
 * `--preload <file>`. The interpreter runs in the caller's working directory.
 *
 *   lua51 [options] [script [args]]   run a script
 *   lua51 --setup                      build only, print the binary path
 */
import { spawn } from "node:child_process";
import { BuildError, buildInterpreter } from "../lib/build.mjs";

const args = process.argv.slice(2);

let binary;
try {
	binary = buildInterpreter();
} catch (error) {
	if (!(error instanceof BuildError)) throw error;
	process.stderr.write(`[lua51] ${error.message}\n`);
	process.exit(1);
}

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
