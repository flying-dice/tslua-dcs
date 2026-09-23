#!/usr/bin/env node
/**
 * Builds dist/tslua-dcs-test.miz: a minimal, empty Caucasus mission used by the
 * `test:dcs` suites. It has no units; the suites create what they need at runtime.
 * The mission is generated from the object below (no binary blobs in the repo).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32 } from "node:zlib";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const MISSION_PATH = join(packageDir, "dist", "tslua-dcs-test.miz");

const emptyResult = () => ({ conditions: {}, actions: {}, func: {} });
const noRoles = () => ({ blue: 0, red: 0 });

const mission = {
	date: { Day: 21, Month: 6, Year: 2016 },
	start_time: 43200,
	theatre: "Caucasus",
	version: 21,
	currentKey: 1,
	maxDictId: 0,
	sortie: "tslua-dcs test",
	descriptionText: "Empty Caucasus mission for the tslua-dcs in-sim test suites.",
	descriptionBlueTask: "",
	descriptionRedTask: "",
	descriptionNeutralsTask: "",
	pictureFileNameB: {},
	pictureFileNameR: {},
	pictureFileNameN: {},
	trig: {
		actions: {},
		events: {},
		custom: {},
		func: {},
		flag: {},
		conditions: {},
		customStartup: {},
		funcStartup: {},
	},
	trigrules: {},
	triggers: { zones: {} },
	result: { offline: emptyResult(), total: 0, blue: emptyResult(), red: emptyResult() },
	groundControl: {
		isPilotControlVehicles: false,
		roles: {
			artillery_commander: noRoles(),
			instructor: noRoles(),
			observer: noRoles(),
			forward_observer: noRoles(),
		},
	},
	goals: {},
	failures: {},
	forcedOptions: {},
	usedModules: {},
	needModules: {},
	resourceCounter: {},
	map: { centerX: -355000, centerY: 617000, zoom: 250000 },
	weather: {
		atmosphere_type: 0,
		type_weather: 0,
		name: "Summer, clean sky",
		qnh: 760,
		enable_fog: false,
		season: { temperature: 20 },
		wind: {
			atGround: { speed: 0, dir: 0 },
			at2000: { speed: 0, dir: 0 },
			at8000: { speed: 0, dir: 0 },
		},
		groundTurbulence: 0,
		cyclones: {},
		fog: { thickness: 0, visibility: 0 },
		visibility: { distance: 80000 },
		clouds: { thickness: 200, density: 0, base: 300, iprecptns: 0 },
	},
	coalitions: { blue: [2], red: [0], neutrals: [] },
	coalition: {
		blue: {
			name: "blue",
			bullseye: { x: -355000, y: 617000 },
			nav_points: {},
			country: [{ id: 2, name: "USA" }],
		},
		red: {
			name: "red",
			bullseye: { x: -355000, y: 617000 },
			nav_points: {},
			country: [{ id: 0, name: "Russia" }],
		},
		neutrals: {
			name: "neutrals",
			bullseye: { x: 0, y: 0 },
			nav_points: {},
			country: [],
		},
	},
};

/** Serialises a JS value as a Lua table constructor (arrays become [1], [2], ...). */
export function toLua(value, indent = "") {
	if (value === null || value === undefined) return "nil";
	if (typeof value === "boolean" || typeof value === "number") return String(value);
	if (typeof value === "string") return JSON.stringify(value);
	const inner = `${indent}    `;
	const entries = Array.isArray(value)
		? value.map((item, index) => `${inner}[${index + 1}] = ${toLua(item, inner)},`)
		: Object.entries(value).map(([key, item]) => `${inner}[${JSON.stringify(key)}] = ${toLua(item, inner)},`);
	return entries.length === 0 ? "{}" : `{\n${entries.join("\n")}\n${indent}}`;
}

/** A minimal store-only (uncompressed) ZIP writer: enough for a .miz. */
export function zip(files) {
	const locals = [];
	const centrals = [];
	let offset = 0;
	for (const [name, text] of files) {
		const data = Buffer.from(text, "utf8");
		const nameBytes = Buffer.from(name, "utf8");
		const crc = crc32(data);
		const local = Buffer.alloc(30);
		local.writeUInt32LE(0x04034b50, 0);
		local.writeUInt16LE(20, 4);
		local.writeUInt32LE(crc, 14);
		local.writeUInt32LE(data.length, 18);
		local.writeUInt32LE(data.length, 22);
		local.writeUInt16LE(nameBytes.length, 26);
		const central = Buffer.alloc(46);
		central.writeUInt32LE(0x02014b50, 0);
		central.writeUInt16LE(20, 4);
		central.writeUInt16LE(20, 6);
		central.writeUInt32LE(crc, 16);
		central.writeUInt32LE(data.length, 20);
		central.writeUInt32LE(data.length, 24);
		central.writeUInt16LE(nameBytes.length, 28);
		central.writeUInt32LE(offset, 42);
		locals.push(local, nameBytes, data);
		centrals.push(central, nameBytes);
		offset += local.length + nameBytes.length + data.length;
	}
	const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
	const end = Buffer.alloc(22);
	end.writeUInt32LE(0x06054b50, 0);
	end.writeUInt16LE(files.length, 8);
	end.writeUInt16LE(files.length, 10);
	end.writeUInt32LE(centralSize, 12);
	end.writeUInt32LE(offset, 16);
	return Buffer.concat([...locals, ...centrals, end]);
}

export function buildMission(path = MISSION_PATH) {
	const files = [
		["mission", `mission = ${toLua(mission)}\n`],
		["warehouses", `warehouses = ${toLua({ airports: {}, warehouses: {} })}\n`],
		["options", `options = ${toLua({})}\n`],
		["theatre", "Caucasus"],
		["l10n/DEFAULT/dictionary", `dictionary = ${toLua({})}\n`],
		["l10n/DEFAULT/mapResource", `mapResource = ${toLua({})}\n`],
	];
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, zip(files));
	return path;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	console.log(`built ${buildMission()}`);
}
