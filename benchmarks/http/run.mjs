// HTTP server benchmark orchestrator: before/after the non-blocking refactor, and against a raw Lua server.
//
//   node benchmarks/http/run.mjs [--baseline <git ref>] [--duration <s>] [--reps <n>]
//                                [--scenarios a,b] [--variants a,b] [--skip-build]
//
// 1. Builds the baseline tree (a git worktree of --baseline, default 677d1cf, the commit before the refactor)
//    and the current tree, and bundles entries/app.ts and entries/http.ts against each with TypeScriptToLua.
// 2. For every scenario and variant, starts `lua51 host.lua` on a fresh port, runs load.mjs against it,
//    then stops the host and collects both sides' measurements.
// 3. Writes results/results.json and results/RESULTS.md.
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { runLoad } from "./load.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");
const work = join(here, ".work");

const args = process.argv.slice(2);
const option = (name, fallback) => {
	const i = args.indexOf(`--${name}`);
	return i >= 0 ? args[i + 1] : fallback;
};
const flag = (name) => args.includes(`--${name}`);

const BASELINE = option("baseline", "677d1cf");
const DURATION_MS = Number(option("duration", "8")) * 1000;
const REPS = Number(option("reps", "1"));
const FRAME = 1 / 60;

const VARIANTS = [
	{ name: "before-http", tree: "before", bundle: "http", profile: "default", label: "Before: HttpServer + TS router" },
	{ name: "before-app", tree: "before", bundle: "app", profile: "default", label: "Before: Application (Express-style)" },
	{ name: "after-http", tree: "after", bundle: "http", profile: "default", label: "After: HttpServer + TS router" },
	{ name: "after-http-tuned", tree: "after", bundle: "http", profile: "tuned", label: "After: HttpServer + TS router, tuned budgets" },
	{ name: "after-app", tree: "after", bundle: "app", profile: "default", label: "After: Application (Express-style)" },
	{ name: "after-app-tuned", tree: "after", bundle: "app", profile: "tuned", label: "After: Application, tuned budgets" },
	{ name: "raw-lua", tree: "raw", profile: "default", label: "Raw Lua + route matcher" },
	{ name: "raw-lua-tuned", tree: "raw", profile: "tuned", label: "Raw Lua, tuned budgets" },
];

const SCENARIOS = [
	{
		name: "capacity",
		mode: "tight",
		load: { healthy: 48, threads: 3 },
		describe: "Unpaced loop (server capacity), 48 concurrent clients on 3 load-generator threads",
	},
	{
		name: "frame-healthy",
		mode: "frame",
		load: { healthy: 16 },
		describe: "60 Hz frame loop, 16 concurrent well-behaved clients",
	},
	{
		name: "frame-idle",
		mode: "frame",
		load: { healthy: 16, idle: 8 },
		describe: "60 Hz, 16 clients + 8 idle preconnects (connect, send nothing)",
	},
	{
		name: "frame-slowloris",
		mode: "frame",
		load: { healthy: 16, slowloris: 4 },
		describe: "60 Hz, 16 clients + 4 slowloris (one header line per second)",
	},
	{
		name: "frame-slow-readers",
		mode: "frame",
		load: { healthy: 16, slowReaders: 4 },
		describe: "60 Hz, 16 clients + 4 clients that stop reading an 8 MiB response for 3 s",
	},
	{
		name: "frame-fragmented",
		mode: "frame",
		load: { healthy: 16, fragmented: 4 },
		describe: "60 Hz, 16 clients + 4 clients writing requests in 16-byte pieces every 10 ms",
	},
];

const selectedScenarios = option("scenarios")?.split(",") ?? SCENARIOS.map((s) => s.name);
const selectedVariants = option("variants")?.split(",") ?? VARIANTS.map((v) => v.name);

function sh(cmd, cmdArgs, cwd) {
	return execFileSync(cmd, cmdArgs, { cwd, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function bundle(treeRoot, entry, out) {
	const dir = join(treeRoot, "benchmarks", "http");
	const tsconfig = join(dir, `tsconfig.${entry}.json`);
	writeFileSync(
		tsconfig,
		JSON.stringify(
			{
				compilerOptions: {
					target: "ES6",
					lib: ["ES6"],
					moduleResolution: "Node",
					ignoreDeprecations: "6.0",
					types: ["lua-types/5.1", "@typescript-to-lua/language-extensions"],
					strict: true,
					skipLibCheck: true,
					rootDir: ".",
					outDir: join(work, "tstl-out", treeRoot === repo ? "after" : "before", entry),
				},
				files: [`entries/${entry}.ts`],
				tstl: { luaBundle: out, luaBundleEntry: `entries/${entry}.ts`, noResolvePaths: ["socket"] },
			},
			null,
			"\t",
		),
	);
	sh(join(treeRoot, "node_modules", ".bin", "tstl"), ["-p", tsconfig], dir);
	rmSync(tsconfig);
}

/** The packages the benchmark bundles depend on, in build order. */
const PACKAGES = ["tslua-common", "tslua-json", "tslua-http", "tslua-http-api"];

function buildPackages(treeRoot) {
	// Built one by one with npm rather than lerna: lerna/Nx can resolve a nested checkout to an outer workspace.
	for (const pkg of PACKAGES) sh("npm", ["run", "build"], join(treeRoot, "packages", pkg));
}

function prepareBaseline(beforeRoot) {
	console.log(`Preparing baseline ${BASELINE} in ${beforeRoot}`);
	sh("git", ["worktree", "prune"], repo);
	if (existsSync(beforeRoot)) {
		try {
			sh("git", ["worktree", "remove", "--force", beforeRoot], repo);
		} catch {
			rmSync(beforeRoot, { recursive: true, force: true });
		}
	}
	sh("git", ["worktree", "add", "--detach", beforeRoot, BASELINE], repo);
	sh("npm", ["ci", "--ignore-scripts", "--no-audit", "--no-fund"], beforeRoot);
	buildPackages(beforeRoot);
}

function prepare() {
	mkdirSync(join(work, "bundles"), { recursive: true });
	// Outside the repository, so module resolution can never fall back to the current tree's node_modules.
	const beforeRoot = process.env.BENCH_BASELINE_DIR ?? join(os.tmpdir(), "tslua-http-bench-baseline");
	if (!flag("skip-build")) {
		console.log(`Building the current tree`);
		buildPackages(repo);

		if (flag("reuse-baseline") && existsSync(join(beforeRoot, "packages", "tslua-http-api", "dist"))) {
			console.log(`Reusing the baseline build in ${beforeRoot}`);
		} else {
			prepareBaseline(beforeRoot);
		}
		// The benchmark entries are not in the baseline commit: copy them in and compile them there.
		mkdirSync(join(beforeRoot, "benchmarks", "http", "entries"), { recursive: true });
		for (const file of ["app.ts", "http.ts", "common.ts"]) {
			writeFileSync(join(beforeRoot, "benchmarks", "http", "entries", file), readFileSync(join(here, "entries", file)));
		}
	}
	const bundles = {};
	for (const [tree, root] of [
		["before", beforeRoot],
		["after", repo],
	]) {
		for (const entry of ["app", "http"]) {
			const out = join(work, "bundles", `${tree}-${entry}.lua`);
			if (!flag("skip-build")) {
				console.log(`Bundling ${tree} ${entry}`);
				bundle(root, entry, out);
			}
			// Guard against bundling the wrong tree: only the refactored server has a ConnectionScheduler.
			const refactored = readFileSync(out, "utf8").includes("ConnectionScheduler");
			if (refactored !== (tree === "after")) {
				throw new Error(`${out} was built from the wrong tree (refactored code: ${refactored})`);
			}
			bundles[`${tree}-${entry}`] = out;
		}
	}
	bundles.raw = join(here, "raw", "server.lua");
	return bundles;
}

function lua51() {
	return sh("npx", ["lua51", "--setup"], repo).trim().split("\n").pop();
}

let nextPort = 20000 + Math.floor(Math.random() * 20000);

async function runOne(luaBin, bundles, variant, scenario) {
	const port = nextPort++;
	const stopFile = join(work, `stop-${port}`);
	rmSync(stopFile, { force: true });
	const bundlePath = variant.tree === "raw" ? bundles.raw : bundles[`${variant.tree}-${variant.bundle}`];
	const host = spawn(luaBin, [join(here, "host.lua"), bundlePath, String(port), variant.profile, scenario.mode, String(FRAME), stopFile], {
		cwd: here,
		stdio: ["ignore", "pipe", "pipe"],
	});
	let stdout = "";
	let stderr = "";
	host.stdout.on("data", (d) => {
		stdout += d;
	});
	host.stderr.on("data", (d) => {
		stderr += d;
	});
	await new Promise((resolve, reject) => {
		const check = setInterval(() => {
			if (stdout.includes("READY")) {
				clearInterval(check);
				resolve();
			}
		}, 20);
		host.on("exit", (code) => {
			clearInterval(check);
			reject(new Error(`host exited early (${code}): ${stderr}`));
		});
	});

	const client = await runLoad({ port, durationMs: DURATION_MS, ...scenario.load });

	writeFileSync(stopFile, "");
	const exitCode = await new Promise((resolve) => host.on("exit", resolve));
	rmSync(stopFile, { force: true });
	const line = stdout.split("\n").find((l) => l.startsWith("{"));
	if (!line) throw new Error(`no host report (exit ${exitCode}): ${stderr}`);
	return { client, server: JSON.parse(line) };
}

function median(values) {
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[Math.floor(sorted.length / 2)];
}

async function main() {
	if (flag("report-only")) {
		const { meta, results } = JSON.parse(readFileSync(join(here, "results", "results.json"), "utf8"));
		writeFileSync(join(here, "results", "RESULTS.md"), report(meta, results));
		console.log("Rewrote results/RESULTS.md");
		return;
	}
	const bundles = prepare();
	const luaBin = lua51();
	const results = [];
	for (const scenario of SCENARIOS.filter((s) => selectedScenarios.includes(s.name))) {
		for (const variant of VARIANTS.filter((v) => selectedVariants.includes(v.name))) {
			const reps = [];
			for (let r = 0; r < REPS; r++) {
				process.stdout.write(`${scenario.name.padEnd(20)} ${variant.name.padEnd(16)} rep ${r + 1}/${REPS} ... `);
				const run = await runOne(luaBin, bundles, variant, scenario);
				reps.push(run);
				console.log(
					`${run.client.healthy.perSecond.toFixed(1)} ok/s, p99 ${run.client.healthy.latencyMs.p99?.toFixed(1)} ms, max step ${(run.server.stepMax * 1000).toFixed(1)} ms`,
				);
			}
			// Report the repetition with the median healthy throughput.
			const mid = median(reps.map((r) => r.client.healthy.perSecond));
			const chosen = reps.find((r) => r.client.healthy.perSecond === mid);
			results.push({ scenario: scenario.name, variant: variant.name, reps: reps.length, ...chosen });
		}
	}

	const meta = {
		date: new Date().toISOString(),
		baseline: BASELINE,
		after:
			sh("git", ["rev-parse", "--short", "HEAD"], repo).trim() +
			(sh("git", ["status", "--porcelain", "--", "packages", "benchmarks/http/entries", "benchmarks/http/raw"], repo).trim()
				? " (with uncommitted changes)"
				: ""),
		durationSeconds: DURATION_MS / 1000,
		reps: REPS,
		frameSeconds: FRAME,
		machine: `${os.cpus()[0].model}, ${os.cpus().length} CPUs, ${Math.round(os.totalmem() / 2 ** 30)} GiB, ${os.platform()} ${os.release()}`,
		node: process.version,
		lua: sh(luaBin, ["-v"], repo).trim(),
	};
	mkdirSync(join(here, "results"), { recursive: true });
	writeFileSync(join(here, "results", "results.json"), `${JSON.stringify({ meta, results }, null, "\t")}\n`);
	writeFileSync(join(here, "results", "RESULTS.md"), report(meta, results));
	console.log(`Wrote ${relative(repo, join(here, "results"))}/results.json and RESULTS.md`);
}

// Report ----------------------------------------------------------------------------------------------------

const fmt = (value, digits = 1) => (value === null || value === undefined ? "–" : value.toFixed(digits));
const ms = (seconds) => fmt(seconds * 1000, seconds < 0.001 ? 3 : seconds < 0.1 ? 2 : 0);
const errors = (errs) => {
	const entries = Object.entries(errs);
	return entries.length === 0 ? "0" : entries.map(([k, v]) => `${v} ${k}`).join(", ");
};

function report(meta, results) {
	const lines = [];
	lines.push("# HTTP server benchmark results", "");
	lines.push(`- Date: ${meta.date}`);
	lines.push(`- Baseline (before): \`${meta.baseline}\`; after: \`${meta.after}\``);
	lines.push(`- Machine: ${meta.machine}; Node ${meta.node}; ${meta.lua}`);
	lines.push(`- ${meta.durationSeconds} s of load per run; ${meta.reps} repetition(s), median healthy throughput reported`);
	lines.push(`- Frame scenarios call the server once per ${fmt(meta.frameSeconds * 1000, 2)} ms frame (60 Hz)`, "");
	const label = (name) => VARIANTS.find((v) => v.name === name).label;
	const find = (scenario, variant) => results.find((r) => r.scenario === scenario && r.variant === variant);
	const cell = (r, pick) => (r ? pick(r) : "–");

	lines.push("## Summary: before and after, under load", "");
	lines.push(
		"Healthy-client throughput and the longest single server call (host-thread stall) in each 60 Hz scenario.",
		"",
		"| Scenario | Before: Application | After: Application (defaults) | After: Application (tuned) | Before: longest call | After: longest call (defaults / tuned) |",
		"|---|---:|---:|---:|---:|---:|",
	);
	for (const scenario of SCENARIOS.filter((s) => s.mode === "frame")) {
		const before = find(scenario.name, "before-app");
		const after = find(scenario.name, "after-app");
		const tuned = find(scenario.name, "after-app-tuned");
		if (!before && !after) continue;
		const okps = (r) => `${fmt(r.client.healthy.perSecond)} req/s`;
		lines.push(
			`| ${scenario.name} | ${cell(before, okps)} | ${cell(after, okps)} | ${cell(tuned, okps)} | ${cell(before, (r) => `${ms(r.server.stepMax)} ms`)} | ${cell(after, (r) => ms(r.server.stepMax))} / ${cell(tuned, (r) => ms(r.server.stepMax))} ms |`,
		);
	}
	lines.push("");

	const layers = [
		["raw-lua-tuned", "Raw Lua + route matcher"],
		["after-http-tuned", "TypeScriptToLua HttpServer + TS router"],
		["after-app-tuned", "TypeScriptToLua Application (Express-style)"],
	];
	const capacity = layers.map(([v]) => find("capacity", v));
	const frame = layers.map(([v]) => find("frame-healthy", v));
	if (capacity.some(Boolean) || frame.some(Boolean)) {
		lines.push("## Summary: what TypeScriptToLua and the Express-style layer cost", "");
		lines.push(
			"All three use the same non-blocking transport design with tuned budgets. Capacity is the unpaced loop; CPU per request is measured at 60 Hz under the same offered load.",
			"",
			"| Implementation | Capacity (req/s) | vs raw Lua | Host CPU per request at 60 Hz (µs) | vs raw Lua |",
			"|---|---:|---:|---:|---:|",
		);
		const rawCap = capacity[0]?.client.healthy.perSecond;
		const cpu = (r) => (r ? (r.server.cpuSeconds / (r.client.healthy.ok || 1)) * 1e6 : undefined);
		const rawCpu = cpu(frame[0]);
		layers.forEach(([, name], i) => {
			const cap = capacity[i]?.client.healthy.perSecond;
			const c = cpu(frame[i]);
			lines.push(
				`| ${name} | ${fmt(cap, 0)} | ${cap && rawCap ? `${fmt((cap / rawCap) * 100, 0)}%` : "–"} | ${fmt(c, 0)} | ${c && rawCpu ? `${fmt(c / rawCpu, 1)}×` : "–"} |`,
			);
		});
		lines.push("");
	}

	for (const scenario of SCENARIOS) {
		const rows = results.filter((r) => r.scenario === scenario.name);
		if (rows.length === 0) continue;
		lines.push(`## ${scenario.name}`, "", scenario.describe, "");
		lines.push(
			"| Variant | Healthy ok/s | Healthy errors | Latency p50 / p99 / max (ms) | Step p50 / p99 / max (ms) | Steps > 16.7 ms | Host CPU per request (µs) | Peak Lua heap (MiB) |",
			"|---|---:|---|---|---|---:|---:|---:|",
		);
		for (const r of rows) {
			const c = r.client;
			const s = r.server;
			const served = c.healthy.ok + c.fragmented.ok + c.slowReaders.ok;
			lines.push(
				`| ${label(r.variant)} | ${fmt(c.healthy.perSecond)} | ${errors(c.healthy.errors)} | ${fmt(c.healthy.latencyMs.p50)} / ${fmt(c.healthy.latencyMs.p99)} / ${fmt(c.healthy.latencyMs.max)} | ${ms(s.stepP50)} / ${ms(s.stepP99)} / ${ms(s.stepMax)} | ${s.over16ms} | ${served > 0 ? fmt((s.cpuSeconds / served) * 1e6, 0) : "–"} | ${fmt(s.peakLuaKb / 1024, 1)} |`,
			);
		}
		const extra = rows.filter((r) => r.client.fragmented.ok + Object.keys(r.client.fragmented.errors).length > 0);
		if (extra.length > 0) {
			lines.push("", "| Variant | Fragmented ok | Fragmented errors | Fragmented latency p50 / p99 (ms) |", "|---|---:|---|---|");
			for (const r of extra) {
				const f = r.client.fragmented;
				lines.push(`| ${label(r.variant)} | ${f.ok} | ${errors(f.errors)} | ${fmt(f.latencyMs.p50)} / ${fmt(f.latencyMs.p99)} |`);
			}
		}
		const slow = rows.filter((r) => r.client.slowReaders.ok + Object.keys(r.client.slowReaders.errors).length > 0);
		if (slow.length > 0) {
			lines.push("", "| Variant | Complete 8 MiB responses | Failed / truncated |", "|---|---:|---|");
			for (const r of slow) {
				lines.push(`| ${label(r.variant)} | ${r.client.slowReaders.ok} | ${errors(r.client.slowReaders.errors)} |`);
			}
		}
		const holders = rows.filter((r) => r.client.idle.connections + r.client.slowloris.connections > 0);
		if (holders.length > 0) {
			lines.push("", "| Variant | Idle/slowloris connections opened | Closed by server |", "|---|---:|---:|");
			for (const r of holders) {
				const h = r.client.idle.connections > 0 ? r.client.idle : r.client.slowloris;
				lines.push(`| ${label(r.variant)} | ${h.connections} | ${h.closedByServer} |`);
			}
		}
		lines.push("");
	}
	return `${lines.join("\n")}\n`;
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
