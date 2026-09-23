import {
	mkdir,
	mkdtemp,
	readFile,
	rename,
	rm,
	writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const healthTimeout = Number(process.env.DCS_EXPORT_HEALTH_TIMEOUT_MS ?? 3000);
const rpcTimeout = Number(process.env.DCS_EXPORT_RPC_TIMEOUT_MS ?? 35000);
const runTimeout = Number(process.env.DCS_EXPORT_TIMEOUT_MS ?? 120000);
type Rpc = {
	jsonrpc?: string;
	id?: string;
	result?: unknown;
	error?: { code?: number; message?: string; data?: unknown };
};
const fail = (message: string): never => {
	throw new Error(`[gui export] ${message}`);
};
const lua = (s: string) =>
	`"${s
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')
		.replace(/\r/g, "\\r")
		.replace(/\n/g, "\\n")
		// biome-ignore lint/suspicious/noControlCharactersInRegex: Lua strings must escape every ASCII control character.
		.replace(/[\x00-\x1f]/g, (c) => `\\${c.charCodeAt(0)}`)}"`;
async function getJson(
	url: string,
	init: RequestInit,
	timeout: number,
	op: string,
) {
	let response: Response | undefined;
	try {
		response = await fetch(url, {
			...init,
			redirect: "error",
			signal: AbortSignal.timeout(timeout),
		});
	} catch (e) {
		fail(`${op} at ${url} failed: ${e instanceof Error ? e.message : e}`);
	}
	if (!response || !response.ok)
		fail(`${op} at ${url} returned HTTP ${response?.status ?? "no response"}`);
	const validResponse = response as Response;
	try {
		return await validResponse.json();
	} catch {
		fail(`${op} returned invalid JSON`);
	}
}
async function rpc(
	base: string,
	id: string,
	method: string,
	params: Record<string, unknown>,
) {
	const r = (await getJson(
		`${base}/rpc`,
		{
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
		},
		rpcTimeout,
		method,
	)) as Rpc;
	if (r.jsonrpc !== "2.0" || r.id !== id || "result" in r === "error" in r)
		fail(`${method} returned an invalid JSON-RPC response`);
	if (r.error)
		fail(
			`${method} (${id}) failed (${r.error.code ?? "unknown"}): ${r.error.message ?? JSON.stringify(r.error.data)}`,
		);
	return r.result;
}
async function publish(outdir: string, files: Map<string, string>) {
	await mkdir(outdir, { recursive: true });
	const stage = await mkdtemp(join(outdir, ".tslua-dcs-export-"));
	try {
		for (const [n, s] of files) await writeFile(join(stage, n), s, "utf8");
		for (const [n] of files) await rename(join(stage, n), join(outdir, n));
	} finally {
		await rm(stage, { recursive: true, force: true });
	}
}
export async function runExport() {
	const started = Date.now();
	for (const job of config.scripts) {
		const duplicate = job.namespaces.find(
			(n, i) => job.namespaces.indexOf(n) !== i,
		);
		if (duplicate)
			fail(`configuration contains duplicate namespace ${duplicate}`);
		for (const n of job.namespaces)
			if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(n))
				fail(`unsafe namespace ${JSON.stringify(n)}`);
		const base = (
			process.env.DCS_BRIDGE_GUI_URL ?? "http://127.0.0.1:25579"
		).replace(/\/$/, "");
		try {
			const u = new URL(base);
			if (!/^https?:$/.test(u.protocol)) throw new Error();
		} catch {
			fail(`invalid bridge URL ${base}`);
		}
		const health = (await getJson(
			`${base}/health`,
			{ method: "GET" },
			healthTimeout,
			"health",
		)) as Record<string, unknown>;
		if (health.name !== "tslua-dcs-gui-bridge" || health.env !== job.env)
			fail(
				`wrong bridge at ${base}; expected tslua-dcs-gui-bridge/gui (run "npm run dcs:start")`,
			);
		if (health.pump_stalled)
			fail("bridge reports pump_stalled; wait for DCS to be ready");
		const discovery = await rpc(base, "export:discover", "rpc.discover", {});
		if (!JSON.stringify(discovery).includes("eval"))
			fail(
				"bridge does not advertise eval; rebuild and reinstall with: npm run dcs:start",
			);
		const probe = await rpc(base, "export:version", "eval", {
			code: "return type(_G._APP_VERSION) == 'string' and _G._APP_VERSION or nil",
		});
		const version =
			typeof probe === "string" && probe.trim()
				? probe
				: process.env.DCS_EXPORT_DCS_VERSION;
		if (!version)
			fail(
				"runtime did not provide _APP_VERSION; set DCS_EXPORT_DCS_VERSION to a maintainer-supplied DCS version",
			);
		const exportVersion = version as string;
		const globals = await rpc(base, "export:preflight", "eval", {
			code: `local r={} for _,n in ipairs({${job.namespaces.map(lua).join(",")}}) do r[n]=type(rawget(_G,n)) end return r`,
		});
		if (!globals || typeof globals !== "object")
			fail("namespace preflight returned invalid result");
		const absent = job.namespaces.filter(
			(n) => (globals as Record<string, unknown>)[n] !== "table",
		);
		if (absent.length)
			fail(`missing or non-table namespaces: ${absent.join(", ")}`);
		const template = await readFile(resolve(root, job.luascript), "utf8");
		const files = new Map<string, string>();
		for (const [i, namespace] of job.namespaces.entries()) {
			if (Date.now() - started > runTimeout)
				fail(`run exceeded ${runTimeout}ms budget`);
			const result = await rpc(base, `export:${namespace}:${i + 1}`, "eval", {
				code: template
					.replace("[[NAMESPACE]]", lua(namespace))
					.replace("[[DCS_VERSION]]", lua(exportVersion)),
			});
			const filename = `${namespace}.export.ts`;
			if (
				!result ||
				typeof result !== "object" ||
				Object.keys(result).length !== 1 ||
				typeof (result as Record<string, unknown>)[filename] !== "string" ||
				!(result as Record<string, string>)[filename].trim()
			)
				fail(`${namespace} returned an invalid export map`);
			files.set(filename, (result as Record<string, string>)[filename]);
		}
		await publish(resolve(root, job.outdir), files);
		console.log(
			`[gui export] published ${files.size} namespaces; DCS ${version}${typeof probe === "string" ? "" : " (maintainer-supplied)"}`,
		);
	}
}
if (
	process.argv[1] &&
	resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
	runExport().catch((e) => {
		console.error(e instanceof Error ? e.message : e);
		process.exitCode = 1;
	});
