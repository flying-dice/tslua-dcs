/**
 * Builds the managed interpreter with Cargo and returns the path of the
 * executable Cargo actually produced.
 */
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export class BuildError extends Error {}

/**
 * Runs `cargo build --release` for crates/lua51 and returns the absolute path
 * of the `tslua-lua51` executable.
 *
 * - Cargo runs with `cwd: packageDir`. rustup looks for `rust-toolchain.toml`
 *   by walking up from the working directory, not from `--manifest-path`, so
 *   this is what makes the pinned toolchain apply wherever `lua51` is invoked.
 * - The executable path is read from Cargo's JSON build messages rather than
 *   assumed, so `CARGO_TARGET_DIR`, `build.target-dir` or a configured build
 *   target can never leave a stale or missing binary at a guessed path.
 */
export function buildInterpreter({ env = process.env } = {}) {
	const result = spawnSync(
		"cargo",
		[
			"build",
			"--release",
			"--locked",
			"--manifest-path",
			join(packageDir, "Cargo.toml"),
			"--bin",
			"tslua-lua51",
			"--quiet",
			"--message-format=json-render-diagnostics",
		],
		{
			cwd: packageDir,
			env,
			encoding: "utf8",
			maxBuffer: 64 * 1024 * 1024,
			stdio: ["ignore", "pipe", "inherit"],
		},
	);

	if (result.error?.code === "ENOENT") {
		throw new BuildError(
			"cargo was not found. Install Rust via https://rustup.rs; the toolchain version is pinned by packages/tslua-lua51/rust-toolchain.toml and installed automatically.",
		);
	}
	if (result.error) throw new BuildError(`running cargo failed: ${result.error.message}`);
	if (result.status !== 0) {
		throw new BuildError(`building the interpreter failed (cargo exit ${result.status ?? result.signal})`);
	}

	let executable;
	for (const line of result.stdout.split("\n")) {
		if (!line.startsWith("{")) continue;
		const message = JSON.parse(line);
		if (
			message.reason === "compiler-artifact" &&
			message.target?.name === "tslua-lua51" &&
			message.target.kind?.includes("bin") &&
			message.executable
		) {
			executable = message.executable;
		}
	}
	if (!executable) {
		throw new BuildError("cargo did not report the tslua-lua51 executable");
	}
	return executable;
}
