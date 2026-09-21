export type Config = {
	scripts: {
		env: "mission" | "gui";
		luascript: string;
		outdir: string;
		namespaces: string[];
	}[];
};

export const config: Config = {
	scripts: [
		{
			env: "gui",
			luascript: "scripts/export.bridge.lua",
			outdir: "src/exports",
			namespaces: [
				"DCS",
				"Export",
				"log",
				"coalition",
				"net",
				"lfs",
				"terrain",
			],
		},
	],
};
