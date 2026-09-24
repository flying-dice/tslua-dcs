// Runtime drift check between the doubles and DCS. `npm run export` generates
// src/exports/<namespace>.export.ts by running scripts/export.bridge.lua against the real DCS
// globals. Running the same chunk against the doubles must reproduce those committed files byte for
// byte: same members, same kinds (function / number / string / table). A member DCS added or removed
// in a new export therefore fails here until the double (and the declarations) follow.

import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { committedVersion, readFile, runBridge } from "./export/bridge";
import { doubles } from "./helpers";

// The namespaces scripts/config.ts exports from the GUI environment.
const namespaces = [
	"DCS",
	"Export",
	"log",
	"coalition",
	"net",
	"lfs",
	"terrain",
];

describe("doubles match the generated exports", () => {
	for (const namespace of namespaces)
		test(`the bridge reproduces src/exports/${namespace}.export.ts from the ${namespace} double`, () => {
			const committed = readFile(`src/exports/${namespace}.export.ts`);
			const generated = runBridge(namespace, committedVersion(committed));
			expect(generated).toEqual({ [`${namespace}.export.ts`]: committed });
		});

	test("the doubles install every global src/index.ts declares", () => {
		for (const name of doubles().globals)
			expect(
				rawget(_G as unknown as Record<string, unknown>, name),
				name,
			).toBeDefined();
		expect(doubles().globals).toEqual([
			"DCS",
			"Export",
			"net",
			"lfs",
			"log",
			"terrain",
			"coalition",
			"db",
			"_APP_VERSION",
			"__DCS_VERSION__",
			"__FINAL_VERSION__",
			"_ARCHITECTURE",
		]);
		expect(type(_APP_VERSION)).toBe("string");
		expect(db.Units.Planes.Plane[0].type).toBe("F-16C_50");
		expect(coalition.BLUE).toBe(2);
	});
});
