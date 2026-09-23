/** @noSelfInFile */

/**
 * The mutable world behind the DCS GUI doubles. The namespace doubles read and write this state, so
 * a setter and its getter agree (`DCS.setPause(true)` makes `DCS.getPause()` return `true`), and
 * tests arrange a scenario by editing `guiDoubles.state()` before calling the code under test.
 * `guiDoubles.reset()` replaces it with a fresh `createState()`.
 */

import type {
	DCSAvailableSlot,
	DCSLogEntry,
	ExportCameraBookmark,
	ExportObject,
	ExportPlayer,
	ExportPosition,
	ExportVec3,
	LfsLocation,
	NetBanRecord,
	NetMissionList,
	NetPlayerInfo,
} from "../../src";
import {
	bookmarksFixture,
	type OwnshipFixture,
	position,
	vec3,
	worldObject,
} from "./fixtures";

export type AnyFunction = (this: void, ...arguments_: unknown[]) => unknown;

/** One table passed to `DCS.setUserCallbacks`. */
export type CallbackTable = Record<string, AnyFunction | undefined>;

/** A line written through `log.*`, `net.log` or `net.trace`. */
export interface LogRecord {
	subsystem: string;
	level: number;
	message: string;
}

/** A call to a native function whose contract DCS does not document (recorded, returns nothing). */
export interface NativeCall {
	name: string;
	arguments_: unknown[];
}

export interface ChatRecord {
	from: number;
	to: number;
	message: string;
}

export interface UnitFixture {
	type: string;
	name: string;
	callsign: string;
	playerName?: string;
	groupName: string;
	coalition: number;
	country: number;
	category: string;
	groupCategory: string;
	role: string;
	runtimeId: number;
	groupMissionId: number;
	hidden: boolean;
	task: string;
}

export interface FileEntry {
	content: string;
	md5: string;
	modification: number;
}

export interface GuiState {
	// DCS: simulation and mission
	paused: boolean;
	viewPaused: boolean;
	modelTime: number;
	realTime: number;
	multiplayer: boolean;
	server: boolean;
	missionLoaded: boolean;
	missionName: string;
	missionDescription: string;
	missionFilename: string | undefined;
	missionTheatre: string;
	missionOptions: Record<string, unknown>;
	currentMission: Record<string, unknown>;
	playerBriefing: string;
	missionResults: { red: number; blue: number };
	coalitionNames: Record<number, string>;
	slots: Record<number, DCSAvailableSlot[]>;
	units: Record<number, UnitFixture>;
	unitTypes: Record<string, Record<string, unknown>>;
	playerCoalition: number;
	playerUnit: number | string | undefined;
	mainPilot: number | string | undefined;
	fov: { current: number; default: number };
	maxFps: number;
	installedTheatres: string[];
	userOptions: Record<string, unknown>;
	config: Record<string, unknown>;
	persistence: Record<string, unknown>;
	airdromeCoalitions: Record<number, number>;
	warehouseAircraft: Record<number, Record<string, number>>;
	/** Handler tables registered with `DCS.setUserCallbacks`, in registration order. */
	callbacks: CallbackTable[];
	debriefing: string[];
	screenshots: string[];
	screenshotExtension: string;
	logHistory: DCSLogEntry[];
	// log
	logOutputs: Record<
		string,
		{ subsystem: string; levelMask: number; outputMode: number }
	>;
	logRecords: LogRecord[];
	// Export
	/** The player aircraft; `undefined` (the default) models the main menu or a spectator. */
	ownship: OwnshipFixture | undefined;
	exportPermissions: { objects: boolean; sensors: boolean; ownship: boolean };
	missionStartTime: number;
	camera: ExportPosition;
	remoteForceCameraAllowed: boolean;
	bookmarks: ExportCameraBookmark[];
	commands: Array<{ command: number; value: number | undefined }>;
	drawArguments: Record<number, number>;
	worldObjects: Record<
		"units" | "ballistic" | "airdromes",
		Record<number, ExportObject>
	>;
	exportPlayers: ExportPlayer[];
	wind: ExportVec3;
	typeNames: Record<string, string>;
	// net
	myPlayerId: number;
	serverId: number;
	serverHost: string | undefined;
	players: NetPlayerInfo[];
	playerStats: Record<number, Record<number, number>>;
	chat: ChatRecord[];
	bans: NetBanRecord[];
	missionList: NetMissionList;
	serverSettings: Record<string, unknown>;
	/** Lua environments reachable through `net.dostring_in`, as sandbox globals. */
	environments: Record<string, Record<string, unknown>>;
	// lfs
	tempdir: string;
	writedir: string;
	currentdir: string;
	directories: Record<string, boolean>;
	files: Record<string, FileEntry>;
	locations: LfsLocation[];
	// terrain
	terrainInitialized: boolean;
	terrainConfig: Record<string, unknown>;
	// every native call without a documented contract
	nativeCalls: NativeCall[];
}

function unit(
	name: string,
	type: string,
	coalition: number,
	runtimeId: number,
): UnitFixture {
	return {
		type,
		name,
		callsign: name,
		groupName: `${name} group`,
		coalition,
		country: coalition === 2 ? 2 : 0,
		category: "plane",
		groupCategory: "airplane",
		role: "pilot",
		runtimeId,
		groupMissionId: runtimeId + 100,
		hidden: false,
		task: "CAP",
	};
}

export const TEMPDIR = "C:\\Users\\Pilot\\AppData\\Local\\Temp\\DCS\\";
export const WRITEDIR = "C:\\Users\\Pilot\\Saved Games\\DCS\\";
export const CURRENTDIR = "C:\\Program Files\\Eagle Dynamics\\DCS World\\";

/** A fresh state: a single-player server with a Caucasus mission loaded and no player aircraft. */
export function createState(): GuiState {
	const missionFile = `${WRITEDIR}Missions\\tslua-dcs.miz`;
	return {
		paused: false,
		viewPaused: false,
		modelTime: 120,
		realTime: 1234.5,
		multiplayer: false,
		server: true,
		missionLoaded: true,
		missionName: "tslua-dcs test mission",
		missionDescription: "Fixture mission used by the DCS GUI doubles",
		missionFilename: missionFile,
		missionTheatre: "Caucasus",
		missionOptions: { difficulty: { labels: true, externalViews: true } },
		currentMission: {
			mission: { theatre: "Caucasus", sortie: "tslua-dcs test mission" },
		},
		playerBriefing: "Defend Kobuleti.",
		missionResults: { red: 0, blue: 0 },
		coalitionNames: { 1: "Red", 2: "Blue" },
		slots: {
			1: [
				{
					unitId: 11,
					type: "Su-27",
					role: "pilot",
					callsign: "Flanker 1",
					groupName: "Red CAP",
					country: 0,
				},
			],
			2: [
				{
					unitId: 21,
					type: "F-16C_50",
					role: "pilot",
					callsign: "Viper 1-1",
					groupName: "Blue CAP",
					country: 2,
				},
				{
					unitId: "22_1",
					type: "F-14B",
					role: "pilot",
					callsign: "Tomcat 1-1",
					groupName: "Blue Fleet CAP",
					country: 2,
				},
			],
		},
		units: {
			11: unit("Flanker 1", "Su-27", 1, 16777216),
			21: unit("Viper 1-1", "F-16C_50", 2, 16777472),
		},
		unitTypes: {
			"F-16C_50": {
				DisplayName: "F-16CM bl.50",
				Name: "F-16C_50",
				category: "Planes",
			},
			"Su-27": { DisplayName: "Su-27", Name: "Su-27", category: "Planes" },
		},
		playerCoalition: 0,
		playerUnit: undefined,
		mainPilot: undefined,
		fov: { current: 78, default: 78 },
		maxFps: 180,
		installedTheatres: ["Caucasus", "PersianGulf", "Syria"],
		userOptions: {
			graphics: { width: 1920, height: 1080 },
			miscellaneous: { f10_awacs: true },
		},
		config: {
			"graphics.width": 1920,
			"graphics.height": 1080,
			"sound.volume": 80,
		},
		persistence: { "tslua-dcs": { counter: 1 } },
		airdromeCoalitions: { 21: 2, 22: 1 },
		warehouseAircraft: { 21: { "F-16C_50": 4 } },
		callbacks: [],
		debriefing: [],
		screenshots: [],
		screenshotExtension: "png",
		logHistory: [
			{ abstime: 0, level: 8, subsystem: "APP", message: "DCS started" },
			{ abstime: 1, level: 8, subsystem: "SCRIPTING", message: "hooks loaded" },
		],
		logOutputs: {},
		logRecords: [],
		ownship: undefined,
		exportPermissions: { objects: true, sensors: true, ownship: true },
		missionStartTime: 43200,
		camera: position(vec3(-281000, 1500, 647000)),
		remoteForceCameraAllowed: false,
		bookmarks: bookmarksFixture(),
		commands: [],
		drawArguments: { 0: 1 },
		worldObjects: {
			units: {
				16777216: worldObject("Flanker 1", 1, vec3(-250000, 2000, 600000)),
				16777472: worldObject("Viper 1-1", 2, vec3(-281000, 1000, 647000)),
			},
			ballistic: {},
			airdromes: {
				5000021: worldObject("Kobuleti", 2, vec3(-317948, 18, 636639)),
			},
		},
		exportPlayers: [{ host_id: 1, name: "Pilot" }],
		wind: vec3(-3, 0, 2),
		typeNames: { "1.1.1.5": "F-16C_50", "1.1.1.3": "Su-27" },
		myPlayerId: 1,
		serverId: 1,
		serverHost: undefined,
		players: [
			{
				id: 1,
				name: "Pilot",
				side: 0,
				slot: "",
				ping: 0,
				ipaddr: "127.0.0.1",
				ucid: "0123456789abcdef0123456789abcdef",
			},
		],
		playerStats: { 1: {} },
		chat: [],
		bans: [],
		missionList: {
			listLoop: false,
			listShuffle: false,
			missionList: [missionFile, `${WRITEDIR}Missions\\second.miz`],
			current: 1,
		},
		serverSettings: {
			name: "tslua-dcs test server",
			port: 10308,
			maxPlayers: 16,
			password: "",
		},
		environments: { mission: {}, export: {}, config: {}, gui: {}, server: {} },
		tempdir: TEMPDIR,
		writedir: WRITEDIR,
		currentdir: CURRENTDIR,
		directories: {
			[TEMPDIR]: true,
			[WRITEDIR]: true,
			[`${WRITEDIR}Logs\\`]: true,
			[`${WRITEDIR}Missions\\`]: true,
			[`${WRITEDIR}Scripts\\`]: true,
			[CURRENTDIR]: true,
			[`${CURRENTDIR}Scripts\\`]: true,
		},
		files: {
			[missionFile]: {
				content: "PK",
				md5: "0f4bc9a1c9e3b3f2e1d8f3b9a8c7d6e5",
				modification: 1700000000,
			},
			[`${WRITEDIR}Logs\\dcs.log`]: {
				content: "DCS started\n",
				md5: "5d41402abc4b2a76b9719d911017c592",
				modification: 1700000100,
			},
		},
		locations: [
			{ name: "My Missions", path: `${WRITEDIR}Missions\\` },
			{ name: "Saved Games", path: WRITEDIR },
		],
		terrainInitialized: true,
		terrainConfig: {
			id: "Caucasus",
			SummerTimeDelta: 4,
			Airdromes: { 21: { roadnet: "kobuleti.rn", display_name: "Kobuleti" } },
		},
		nativeCalls: [],
	};
}
