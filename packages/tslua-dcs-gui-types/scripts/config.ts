export type Config = {
	scripts: {
		fiddlescript: string;
		outdir: string;
		namespaces: string[];
	}[];
};

export const config: Config = {
	scripts: [
		{
			fiddlescript: "scripts/export.fiddle.lua",
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
