import type {
	CoalitionReferencePoint,
	ControllerAction,
	l_Vec3,
	l_WorldEventHandler,
	TriggerZone,
} from "@flying-dice/tslua-dcs-mission-types";
import {
	airbaseCategory,
	country,
	groupCategory,
	objectCategory,
	side,
	unitCategory,
} from "./constants";
import { type TypeDesc, typeDatabase } from "./fixtures";
import { clearInstances } from "./runtime";

export type ObjectKind = "unit" | "static" | "airbase" | "weapon";

/** Everything the doubles know about one object in the world. Methods read and mutate these records. */
export interface ObjectRecord {
	/** Runtime object id (`id_` of the instance). */
	id: number;
	kind: ObjectKind;
	/** Mission id returned by `getID()` (unit id, static id or airdrome id). */
	missionId: number;
	name: string;
	typeName: string;
	coalition: number;
	country: number;
	point: l_Vec3;
	velocity: l_Vec3;
	heading: number;
	inAir: boolean;
	exists: boolean;
	life: number;
	life0: number;
	/** `Object.Category` value returned by `getCategory()`. */
	category: number;
	/** Class-specific category returned by `getCategoryEx()`. */
	categoryEx: number;
	desc: TypeDesc;
	emission: boolean;
	drawArguments: Record<number, number>;
	// Units
	groupId?: number;
	playerName?: string;
	callsign?: string;
	unitNumber?: number;
	fuel?: number;
	skill?: string;
	controllerId?: number;
	// Statics and cargo
	cargoDisplayName?: string;
	cargoWeight?: number;
	// Airbases
	autoCapture?: boolean;
	radioSilent?: boolean;
	warehouseId?: number;
	// Weapons
	launcherId?: number;
	targetId?: number;
}

export interface GroupRecord {
	id: number;
	name: string;
	coalition: number;
	country: number;
	category: number;
	unitIds: number[];
	initialSize: number;
	active: boolean;
	exists: boolean;
	emission: boolean;
	controllerId: number;
}

export interface ControllerRecord {
	id: number;
	/** Group or unit object this controller drives. */
	ownerGroupId?: number;
	ownerUnitId?: number;
	tasks: ControllerAction[];
	commands: ControllerAction[];
	options: Record<number, number | boolean | string>;
	onOff: boolean;
	altitude?: { altitude: number; keep?: boolean; type?: string };
	speed?: { speed: number; keep?: boolean };
}

export interface WarehouseRecord {
	id: number;
	ownerId: number;
	items: Record<string, number>;
	liquids: Record<number, number>;
}

export interface MarkRecord {
	idx: number;
	shape: string;
	text: string;
	pos: l_Vec3;
	points: l_Vec3[];
	coalition: number;
	groupID: number;
	time: number;
	readOnly: boolean;
	color?: [number, number, number, number];
	fillColor?: [number, number, number, number];
	lineType?: number;
	radius?: number;
	fontSize?: number;
}

export interface MenuItem {
	path: string[];
	scope: string;
	kind: "command" | "submenu";
	callback?: (this: void, argument: unknown) => void;
	argument?: unknown;
}

export interface ScheduledRecord {
	id: number;
	fn: (this: void, argument: unknown, time: number) => number | undefined;
	argument: unknown;
	time: number;
}

export interface LogEntry {
	level: "info" | "warning" | "error" | "net" | "trace";
	message: string;
}

export interface MessageRecord {
	/** Function that produced the message, e.g. `"outTextForCoalition"`. */
	kind: string;
	/** Recipient (coalition, country, group or unit id); `undefined` for everyone. */
	target?: number;
	text: string;
	displayTime: number;
	clearView?: boolean;
}

export interface WorldState {
	time: number;
	time0: number;
	paused: boolean;
	nextId: number;
	objects: LuaTable<number, ObjectRecord>;
	objectOrder: number[];
	groups: LuaTable<number, GroupRecord>;
	groupOrder: number[];
	controllers: LuaTable<number, ControllerRecord>;
	warehouses: LuaTable<number, WarehouseRecord>;
	flags: Record<string, number>;
	zones: TriggerZone[];
	marks: MarkRecord[];
	menus: MenuItem[];
	scheduled: ScheduledRecord[];
	eventHandlers: l_WorldEventHandler[];
	persistenceHandlers: Record<string, (this: void) => unknown>;
	persistenceOrder: string[];
	persistenceData: Record<string, unknown>;
	persistencePassthrough?: (this: void, ...args: unknown[]) => unknown;
	refPoints: Record<number, CoalitionReferencePoint[]>;
	log: LogEntry[];
	messages: MessageRecord[];
	chat: { message: string; to?: number; from?: number }[];
	errorMessageBoxEnabled: boolean;
	players: {
		id: number;
		name: string;
		side: number;
		slot: number | string;
		ping: number;
		ipaddr: string;
		ucid: string;
	}[];
	fog: { thickness: number; visibility: number; animation: unknown[] };
	echoLog: boolean;
}

/** The world the doubles simulate. It is mutated in place, never replaced, so imports stay live. */
export const state: WorldState = createState();

function createState(): WorldState {
	return {
		time: 0,
		time0: 43200,
		paused: false,
		nextId: 1000,
		objects: new LuaTable(),
		objectOrder: [],
		groups: new LuaTable(),
		groupOrder: [],
		controllers: new LuaTable(),
		warehouses: new LuaTable(),
		flags: {},
		zones: [],
		marks: [],
		menus: [],
		scheduled: [],
		eventHandlers: [],
		persistenceHandlers: {},
		persistenceOrder: [],
		persistenceData: {},
		refPoints: {},
		log: [],
		messages: [],
		chat: [],
		errorMessageBoxEnabled: true,
		players: [],
		fog: { thickness: 0, visibility: 0, animation: [] },
		echoLog: false,
	};
}

export function nextId(): number {
	state.nextId += 1;
	return state.nextId;
}

export function describeType(typeName: string): TypeDesc {
	const desc = typeDatabase[typeName];
	if (desc !== undefined) return desc;
	return {
		typeName,
		displayName: typeName,
		_origin: "",
		category: 0,
		life: 1,
		attributes: {},
	};
}

export interface NewObject {
	kind: ObjectKind;
	name: string;
	typeName: string;
	coalition: number;
	country: number;
	point: l_Vec3;
	heading?: number;
	missionId?: number;
	category: number;
	categoryEx: number;
	inAir?: boolean;
	velocity?: l_Vec3;
}

export function addObject(data: NewObject): ObjectRecord {
	const id = nextId();
	const desc = describeType(data.typeName);
	const record: ObjectRecord = {
		id,
		kind: data.kind,
		missionId: data.missionId ?? id,
		name: data.name,
		typeName: data.typeName,
		coalition: data.coalition,
		country: data.country,
		point: { ...data.point },
		velocity: data.velocity ?? { x: 0, y: 0, z: 0 },
		heading: data.heading ?? 0,
		inAir: data.inAir ?? false,
		exists: true,
		life: desc.life,
		life0: desc.life,
		category: data.category,
		categoryEx: data.categoryEx,
		desc,
		emission: true,
		drawArguments: {},
	};
	state.objects.set(id, record);
	state.objectOrder.push(id);
	return record;
}

export function addController(owner: {
	groupId?: number;
	unitId?: number;
}): ControllerRecord {
	const controller: ControllerRecord = {
		id: nextId(),
		ownerGroupId: owner.groupId,
		ownerUnitId: owner.unitId,
		tasks: [],
		commands: [],
		options: {},
		onOff: true,
	};
	state.controllers.set(controller.id, controller);
	return controller;
}

export interface NewUnit {
	name: string;
	type: string;
	x: number;
	y: number;
	alt?: number;
	heading?: number;
	skill?: string;
	playerName?: string;
	callsign?: string;
	unitId?: number;
}

const unitCategoryOfGroup: Record<number, number> = {
	[groupCategory.AIRPLANE]: unitCategory.AIRPLANE,
	[groupCategory.HELICOPTER]: unitCategory.HELICOPTER,
	[groupCategory.GROUND]: unitCategory.GROUND_UNIT,
	[groupCategory.SHIP]: unitCategory.SHIP,
	[groupCategory.TRAIN]: unitCategory.GROUND_UNIT,
};

let nextMissionUnitId = 100;
let nextGroupId = 10;

export function addGroup(data: {
	name: string;
	coalition: number;
	country: number;
	category: number;
	units: NewUnit[];
	groupId?: number;
}): GroupRecord {
	nextGroupId += 1;
	const group: GroupRecord = {
		id: data.groupId ?? nextGroupId,
		name: data.name,
		coalition: data.coalition,
		country: data.country,
		category: data.category,
		unitIds: [],
		initialSize: data.units.length,
		active: true,
		exists: true,
		emission: true,
		controllerId: 0,
	};
	group.controllerId = addController({ groupId: group.id }).id;
	const airborne =
		data.category === groupCategory.AIRPLANE ||
		data.category === groupCategory.HELICOPTER;
	data.units.forEach((unit, index) => {
		nextMissionUnitId += 1;
		const record = addObject({
			kind: "unit",
			name: unit.name,
			typeName: unit.type,
			coalition: data.coalition,
			country: data.country,
			point: {
				x: unit.x,
				y: unit.alt ?? (airborne ? 3000 : 10),
				z: unit.y,
			},
			heading: unit.heading,
			missionId: unit.unitId ?? nextMissionUnitId,
			category: objectCategory.UNIT,
			categoryEx:
				unitCategoryOfGroup[data.category] ?? unitCategory.GROUND_UNIT,
			inAir: airborne && (unit.alt ?? 3000) > 50,
			velocity: airborne ? { x: 150, y: 0, z: 0 } : { x: 0, y: 0, z: 0 },
		});
		record.groupId = group.id;
		record.skill = unit.skill ?? "Average";
		record.playerName = unit.playerName;
		record.callsign = unit.callsign ?? `${data.name}${index + 1}`;
		record.unitNumber = index + 1;
		record.fuel = airborne ? 0.75 : 1;
		record.controllerId = addController({ unitId: record.id }).id;
		group.unitIds.push(record.id);
	});
	state.groups.set(group.id, group);
	state.groupOrder.push(group.id);
	return group;
}

export function addWarehouse(ownerId: number): WarehouseRecord {
	const warehouse: WarehouseRecord = {
		id: nextId(),
		ownerId,
		items: { "weapons.bombs.GBU_31": 12, "F-16C_50": 4 },
		liquids: { 0: 100000, 1: 5000, 2: 0, 3: 20000 },
	};
	state.warehouses.set(warehouse.id, warehouse);
	return warehouse;
}

export function addAirbase(data: {
	name: string;
	airdromeId: number;
	coalition: number;
	country: number;
	point: l_Vec3;
	category?: number;
}): ObjectRecord {
	const record = addObject({
		kind: "airbase",
		name: data.name,
		typeName: data.name,
		coalition: data.coalition,
		country: data.country,
		point: data.point,
		missionId: data.airdromeId,
		category: objectCategory.BASE,
		categoryEx: data.category ?? airbaseCategory.AIRDROME,
	});
	record.autoCapture = true;
	record.radioSilent = false;
	record.callsign = data.name;
	record.warehouseId = addWarehouse(record.id).id;
	return record;
}

export function addStatic(data: {
	name: string;
	type: string;
	coalition: number;
	country: number;
	point: l_Vec3;
	heading?: number;
	cargo?: { displayName: string; weight: number };
	staticId?: number;
}): ObjectRecord {
	const record = addObject({
		kind: "static",
		name: data.name,
		typeName: data.type,
		coalition: data.coalition,
		country: data.country,
		point: data.point,
		heading: data.heading,
		missionId: data.staticId,
		category: data.cargo ? objectCategory.CARGO : objectCategory.STATIC,
		categoryEx: data.cargo ? objectCategory.CARGO : objectCategory.STATIC,
	});
	if (data.cargo) {
		record.cargoDisplayName = data.cargo.displayName;
		record.cargoWeight = data.cargo.weight;
		record.warehouseId = addWarehouse(record.id).id;
	}
	return record;
}

/** Looks up a live object by name and kind (`undefined` when missing or destroyed). */
export function findObject(
	kind: ObjectKind,
	name: string,
): ObjectRecord | undefined {
	for (const id of state.objectOrder) {
		const record = state.objects.get(id);
		if (record && record.exists && record.kind === kind && record.name === name)
			return record;
	}
	return undefined;
}

export function liveObjects(kind?: ObjectKind): ObjectRecord[] {
	const result: ObjectRecord[] = [];
	for (const id of state.objectOrder) {
		const record = state.objects.get(id);
		if (record?.exists && (kind === undefined || record.kind === kind))
			result.push(record);
	}
	return result;
}

export function findGroup(name: string): GroupRecord | undefined {
	for (const id of state.groupOrder) {
		const group = state.groups.get(id);
		if (group?.exists && group.name === name) return group;
	}
	return undefined;
}

export function liveGroups(): GroupRecord[] {
	const result: GroupRecord[] = [];
	for (const id of state.groupOrder) {
		const group = state.groups.get(id);
		if (group?.exists) result.push(group);
	}
	return result;
}

export function destroyObject(record: ObjectRecord): void {
	record.exists = false;
	if (record.groupId !== undefined) {
		const group = state.groups.get(record.groupId);
		if (group !== undefined) {
			group.unitIds = group.unitIds.filter((id) => id !== record.id);
			if (group.unitIds.length === 0) group.exists = false;
		}
	}
}

export function destroyGroup(group: GroupRecord): void {
	for (const id of [...group.unitIds]) {
		const unit = state.objects.get(id);
		if (unit !== undefined) unit.exists = false;
	}
	group.unitIds = [];
	group.exists = false;
}

export function distance(a: l_Vec3, b: l_Vec3): number {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	const dz = a.z - b.z;
	return math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Rebuilds the deterministic fixture world: the airbases, groups, statics, zones, reference points and
 * players listed in `fixtures.ts`, at model time 0 and with every log, flag, mark and menu cleared.
 */
export function resetState(): void {
	const echoLog = state.echoLog;
	Object.assign(state, createState());
	state.persistencePassthrough = undefined;
	state.echoLog = echoLog;
	nextMissionUnitId = 100;
	nextGroupId = 10;
	clearInstances();

	addAirbase({
		name: "Batumi",
		airdromeId: 22,
		coalition: side.BLUE,
		country: country.GEORGIA,
		point: { x: -356437, y: 10, z: 618211 },
	});
	addAirbase({
		name: "Kobuleti",
		airdromeId: 24,
		coalition: side.BLUE,
		country: country.GEORGIA,
		point: { x: -318000, y: 18, z: 636620 },
	});
	addAirbase({
		name: "Senaki-Kolkhi",
		airdromeId: 23,
		coalition: side.RED,
		country: country.RUSSIA,
		point: { x: -281903, y: 13, z: 647379 },
	});

	addGroup({
		name: "Enfield-1",
		coalition: side.BLUE,
		country: country.USA,
		category: groupCategory.AIRPLANE,
		groupId: 1,
		units: [
			{
				name: "Enfield-1-1",
				type: "F-16C_50",
				x: -350000,
				y: 620000,
				alt: 6000,
				heading: 0.5,
				skill: "Player",
				playerName: "Maverick",
				callsign: "Enfield11",
				unitId: 1,
			},
			{
				name: "Enfield-1-2",
				type: "F-16C_50",
				x: -350100,
				y: 620100,
				alt: 6000,
				heading: 0.5,
				skill: "Excellent",
				callsign: "Enfield12",
				unitId: 2,
			},
		],
	});
	addGroup({
		name: "Uzi-1",
		coalition: side.BLUE,
		country: country.USA,
		category: groupCategory.GROUND,
		groupId: 2,
		units: [
			{
				name: "Uzi-1-1",
				type: "M-818",
				x: -356000,
				y: 618500,
				skill: "Good",
				unitId: 3,
			},
		],
	});
	addGroup({
		name: "Red Armor",
		coalition: side.RED,
		country: country.RUSSIA,
		category: groupCategory.GROUND,
		groupId: 3,
		units: [
			{
				name: "Red Armor-1",
				type: "Leopard-2",
				x: -345000,
				y: 625000,
				skill: "High",
				unitId: 4,
			},
			{
				name: "Red Armor-2",
				type: "Leopard-2",
				x: -345050,
				y: 625050,
				skill: "High",
				unitId: 5,
			},
		],
	});

	addStatic({
		name: "Blue Hangar",
		type: "Hangar A",
		coalition: side.BLUE,
		country: country.USA,
		point: { x: -356300, y: 10, z: 618100 },
		staticId: 50,
	});
	addStatic({
		name: "Ammo Crate",
		type: "ammo_cargo",
		coalition: side.BLUE,
		country: country.USA,
		point: { x: -356250, y: 10, z: 618150 },
		cargo: { displayName: "Ammo", weight: 500 },
		staticId: 51,
	});
	addStatic({
		name: "Red Depot",
		type: "Hangar A",
		coalition: side.RED,
		country: country.RUSSIA,
		point: { x: -281800, y: 13, z: 647300 },
		staticId: 52,
	});

	state.zones = [
		{
			name: "Batumi Zone",
			zoneId: 1,
			x: -356437,
			y: 618211,
			point: { x: -356437, y: 0, z: 618211 },
			radius: 3000,
			color: [1, 1, 1, 0.15],
			properties: [{ key: "purpose", value: "fixture" }],
			hidden: false,
			type: 0,
			heading: 0,
		},
	];
	state.refPoints = {
		[side.BLUE]: [
			{
				callsign: 1,
				type: 0,
				name: "Bullseye",
				point: { x: -300000, y: 0, z: 630000 },
			},
		],
		[side.RED]: [
			{
				callsign: 1,
				type: 0,
				name: "Bullseye",
				point: { x: -290000, y: 0, z: 640000 },
			},
		],
	};
	state.players = [
		{
			id: 1,
			name: "Server",
			side: 0,
			slot: "",
			ping: 0,
			ipaddr: "127.0.0.1",
			ucid: "00000000000000000000000000000001",
		},
		{
			id: 2,
			name: "Maverick",
			side: side.BLUE,
			slot: "1",
			ping: 42,
			ipaddr: "192.168.1.20",
			ucid: "00000000000000000000000000000002",
		},
	];
}
