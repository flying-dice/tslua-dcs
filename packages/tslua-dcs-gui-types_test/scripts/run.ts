import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const base = (
	process.env.DCS_STUDIO_GUI_URL ?? "http://127.0.0.1:25569"
).replace(/\/$/, "");
const luaString = (value: string) =>
	`"${value
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')
		.replace(/\r/g, "\\r")
		.replace(/\n/g, "\\n")
		// biome-ignore lint/suspicious/noControlCharactersInRegex: Lua strings must escape every ASCII control character.
		.replace(/[\x00-\x1f]/g, (character) => `\\${character.charCodeAt(0)}`)}"`;

async function json(url: string, init?: RequestInit) {
	const response = await fetch(url, {
		...init,
		signal: AbortSignal.timeout(120000),
	});
	if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
	return response.json() as Promise<Record<string, unknown>>;
}

async function main() {
	const health = await json(`${base}/health`);
	if (health.name !== "dcs-studio-gui" || health.env !== "gui")
		throw new Error(`wrong bridge at ${base}`);
	if (health.pump_stalled) throw new Error("GUI bridge is stalled");

	const bundle = await readFile(resolve(".test/gui-tests.lua"), "utf8");
	const code = `local output={} local original_print=print print=function(...) local values={...} for i=1,#values do values[i]=tostring(values[i]) end output[#output+1]=table.concat(values,"\\t") original_print(...) end local chunk,load_error=loadstring(${luaString(bundle)},"@tslua-dcs-gui-types_test") if not chunk then print=original_print return {passed=false,error=load_error,output=output} end local ok,result=pcall(chunk) print=original_print if not ok then return {passed=false,error=tostring(result),output=output} end return {passed=true,output=output}`;
	const response = await json(`${base}/rpc`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			jsonrpc: "2.0",
			id: "tslua-dcs-gui-types_test",
			method: "eval",
			params: { code },
		}),
	});
	if (response.error) throw new Error(JSON.stringify(response.error));
	const result = response.result as
		| { passed?: boolean; error?: string; output?: string[] }
		| undefined;
	for (const line of result?.output ?? []) console.log(line);
	if (!result?.passed)
		throw new Error(result?.error ?? "GUI test bundle failed");
	console.log("PASS: GUI TypeScript examples compiled to Lua and ran in DCS");
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
