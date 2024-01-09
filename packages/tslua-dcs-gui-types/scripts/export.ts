import axios from "axios";
import { cosmiconfigSync } from "cosmiconfig";
import { ensureDirSync, readFileSync, writeFileSync } from "fs-extra";

const result = cosmiconfigSync("export").search();

if (!result) throw new Error("Config Not Found!");

const config: {
	scripts: { fiddlescript: string; outdir: string; namespaces: string[] }[];
} = result.config;

config.scripts.forEach(({ fiddlescript, outdir, namespaces }) => {
	axios
		.get<{ result: Record<string, string> }>(
			`http://127.0.0.1:12081/${Buffer.from(
				readFileSync(fiddlescript, { encoding: "utf-8" }).replace(
					"[[NAMESPACES]]",
					`"${namespaces.join('", "')}"`,
				),
			).toString("base64")}?env=default`,
		)
		.then(({ data }) =>
			Object.keys(data.result).forEach((key) => {
				ensureDirSync(outdir);
				writeFileSync(`${outdir}/${key}`, data.result[key].toString());
			}),
		);
});
