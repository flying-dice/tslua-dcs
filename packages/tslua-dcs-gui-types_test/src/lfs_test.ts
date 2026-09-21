import type { l_lfs } from "@flying-dice/tslua-dcs-gui-types";
import { describe, expect, test } from "@flying-dice/tslua-luatest";

const checkedLfs: l_lfs = lfs;

describe("lfs examples", () => {
	test("directory functions return non-empty paths", () => {
		expect(checkedLfs.tempdir().length > 0).toBe(true);
		expect(checkedLfs.writedir().length > 0).toBe(true);
		expect(checkedLfs.currentdir().length > 0).toBe(true);
	});

	test("attributes, normalization, locations, and iteration match DCS callsites", () => {
		const current = checkedLfs.currentdir();
		const attributes = checkedLfs.attributes(current);
		expect(attributes?.mode).toBe("directory");
		expect(checkedLfs.attributes(current, "mode")).toBe("directory");
		expect(type(checkedLfs.normpath(`${current}Scripts/../Scripts`))).toBe(
			"string",
		);
		expect(type(checkedLfs.realpath(current))).toBe("string");
		expect(type(checkedLfs.locations())).toBe("table");
		let entries = 0;
		for (const _name of checkedLfs.dir(current)) {
			entries++;
			if (entries > 2) break;
		}
		expect(entries > 0).toBe(true);
	});

	test("temporary directories can be created and removed", () => {
		const path = `${checkedLfs.tempdir()}tslua-dcs-example-directory`;
		checkedLfs.rmdir(path);
		const [created] = checkedLfs.mkdir(path);
		expect(created).toBe(true);
		expect(checkedLfs.attributes(path, "mode")).toBe("directory");
		const [removed] = checkedLfs.rmdir(path);
		expect(removed).toBe(true);
	});

	test("remaining DCS filesystem extensions have stable runtime kinds", () => {
		expect(type(checkedLfs.add_location)).toBe("function");
		expect(type(checkedLfs.chdir)).toBe("function");
		expect(type(checkedLfs.del_location)).toBe("function");
		expect(type(checkedLfs.create_lockfile)).toBe("function");
		expect(type(checkedLfs.md5sum)).toBe("function");
	});
});
