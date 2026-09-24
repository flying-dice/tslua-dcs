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
// The same profile/token rule as the dcs-bridge installer and CLI (one implementation).
import { bridgeToken } from "../../../scripts/dcs-profile.mjs";
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
	throw new Error(`[mission export] ${message}`);
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
	operation: string,
) {
	let response: Response | undefined;
	try {
		response = await fetch(url, {
			...init,
			redirect: "error",
			signal: AbortSignal.timeout(timeout),
		});
	} catch (error) {
		fail(
			`${operation} at ${url} failed: ${error instanceof Error ? error.message : error}`,
		);
	}
	if (!response || !response.ok)
		fail(
			`${operation} at ${url} returned HTTP ${response?.status ?? "no response"}`,
		);
	const validResponse = response as Response;
	try {
		return await validResponse.json();
	} catch {
		fail(`${operation} returned invalid JSON`);
	}
}
async function rpc(
	base: string,
	id: string,
	method: string,
	params: Record<string, unknown>,
) {
	const response = (await getJson(
		`${base}/rpc`,
		{
			method: "POST",
			headers: {
				"content-type": "application/json",
				authorization: `Bearer ${bridgeToken()}`,
			},
			body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
		},
		rpcTimeout,
		method,
	)) as Rpc;
	if (
		response.jsonrpc !== "2.0" ||
		response.id !== id ||
		"result" in response === "error" in response
	)
		fail(`${method} returned an invalid JSON-RPC response`);
	if (response.error)
		fail(
			`${method} (${id}) failed (${response.error.code ?? "unknown"}): ${response.error.message ?? JSON.stringify(response.error.data)}`,
		);
	return response.result;
}
function validate(namespaces: string[]) {
	for (const name of namespaces)
		if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name))
			fail(`unsafe namespace ${JSON.stringify(name)}`);
	const duplicate = namespaces.find(
		(name, i) => namespaces.indexOf(name) !== i,
	);
	if (duplicate)
		fail(`configuration contains duplicate namespace ${duplicate}`);
}
async function publish(outdir: string, files: Map<string, string>) {
	await mkdir(outdir, { recursive: true });
	const stage = await mkdtemp(join(outdir, ".tslua-dcs-export-"));
	try {
		for (const [filename, source] of files)
			await writeFile(join(stage, filename), source, "utf8");
		for (const [filename] of files)
			await rename(join(stage, filename), join(outdir, filename));
	} finally {
		await rm(stage, { recursive: true, force: true });
	}
}
export async function runExport() {
	const started = Date.now();
	for (const job of config.scripts) {
		validate(job.namespaces);
		const base = (
			process.env.DCS_BRIDGE_MISSION_URL ?? "http://127.0.0.1:25580"
		).replace(/\/$/, "");
		try {
			const url = new URL(base);
			if (!/^https?:$/.test(url.protocol)) throw new Error();
		} catch {
			fail(`invalid bridge URL ${base}`);
		}
		const health = (await getJson(
			`${base}/health`,
			{ method: "GET" },
			healthTimeout,
			"health",
		)) as Record<string, unknown>;
		if (health.name !== "tslua-dcs-mission-bridge" || health.env !== job.env)
			fail(
				`wrong bridge at ${base}; expected tslua-dcs-mission-bridge/mission (run "npm run dcs:start")`,
			);
		if (health.pump_stalled)
			fail("bridge reports pump_stalled; start and unpause a mission");
		const discovery = await rpc(base, "export:discover", "rpc.discover", {});
		if (!JSON.stringify(discovery).includes("eval"))
			fail(
				"bridge does not advertise eval; rebuild and reinstall with: npm run dcs:start",
			);
		const probedVersion = await rpc(base, "export:version", "eval", {
			code: "return type(_G._APP_VERSION) == 'string' and _G._APP_VERSION or nil",
		});
		const version =
			typeof probedVersion === "string" && probedVersion.trim()
				? probedVersion
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
		for (const [index, namespace] of job.namespaces.entries()) {
			if (Date.now() - started > runTimeout)
				fail(`run exceeded ${runTimeout}ms budget`);
			const result = await rpc(
				base,
				`export:${namespace}:${index + 1}`,
				"eval",
				{
					code: template
						.replace("[[NAMESPACE]]", lua(namespace))
						.replace("[[DCS_VERSION]]", lua(exportVersion)),
				},
			);
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
			`[mission export] published ${files.size} namespaces; DCS ${version}${typeof probedVersion === "string" ? "" : " (maintainer-supplied)"}`,
		);
	}
}
if (
	process.argv[1] &&
	resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
	runExport().catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	});
