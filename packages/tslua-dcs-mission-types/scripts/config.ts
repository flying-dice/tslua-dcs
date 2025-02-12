export const config = {
	scripts: [
		{
			fiddlescript: "scripts/export.fiddle.lua",
			outdir: "src/exports",
			namespaces: [
				"AI",
				"Airbase",
				"atmosphere",
				"coalition",
				"Controller",
				"coord",
				"env",
				"Group",
				"land",
				"missionCommands",
				"net",
				"Object",
				"radio",
				"StaticObject",
				"timer",
				"trigger",
				"Unit",
				"Unit", // Duplicate entry
				"Warehouse",
				"Weapon",
				"world",
			],
		},
	],
};
