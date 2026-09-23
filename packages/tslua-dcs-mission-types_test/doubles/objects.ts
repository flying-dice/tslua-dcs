import type {
	AirbaseDesc,
	AirbaseParkingSpot,
	AirbaseRunway,
	DetectedTarget,
	l_Airbase,
	l_Controller,
	l_Group,
	l_Object,
	l_Position3,
	l_StaticObject,
	l_Unit,
	l_Vec3,
	l_Warehouse,
	l_Weapon,
	StaticObjectDesc,
	UnitAmmoItem,
	UnitDesc,
	UnitSensors,
	WarehouseInventory,
	WarehouseItem,
} from "@flying-dice/tslua-dcs-mission-types";
import {
	airbaseCategory,
	countryNames,
	detection,
	groupCategory,
	guidanceType,
	missileCategory,
	objectCategory,
	opticType,
	radarType,
	refuelingSystem,
	sensorType,
	side,
	unitCategory,
	warheadType,
	weaponCategory,
	weaponFlag,
} from "./constants";
import { typeDatabase } from "./fixtures";
import { type Double, defineClass, idOf, instanceOf } from "./runtime";
import {
	type ControllerRecord,
	type GroupRecord,
	type ObjectRecord,
	type WarehouseRecord,
	destroyGroup,
	destroyObject,
	distance,
	findGroup,
	findObject,
	liveObjects,
	state,
} from "./state";

// ---------------------------------------------------------------------------------------------------
// Record access
// ---------------------------------------------------------------------------------------------------

function objectRecord(self: unknown): ObjectRecord {
	const record = state.objects.get(idOf(self));
	if (!record || !record.exists)
		error(
			`DCS object ${idOf(self)} does not exist (destroyed or never spawned)`,
			3,
		);
	return record as ObjectRecord;
}

function groupRecord(self: unknown): GroupRecord {
	const group = state.groups.get(idOf(self));
	if (!group || !group.exists)
		error(`DCS group ${idOf(self)} does not exist`, 3);
	return group as GroupRecord;
}

function controllerRecord(self: unknown): ControllerRecord {
	return state.controllers.get(idOf(self)) as ControllerRecord;
}

function warehouseRecord(self: unknown): WarehouseRecord {
	return state.warehouses.get(idOf(self)) as WarehouseRecord;
}

function copy(point: l_Vec3): l_Vec3 {
	return { x: point.x, y: point.y, z: point.z };
}

function position(record: ObjectRecord): l_Position3 {
	const cos = math.cos(record.heading);
	const sin = math.sin(record.heading);
	return {
		p: copy(record.point),
		x: { x: cos, y: 0, z: sin },
		y: { x: 0, y: 1, z: 0 },
		z: { x: -sin, y: 0, z: cos },
	};
}

// ---------------------------------------------------------------------------------------------------
// Instances
// ---------------------------------------------------------------------------------------------------

export function unitInstance(record: ObjectRecord): l_Unit {
	return instanceOf<l_Unit>(Unit, record.id);
}

export function staticInstance(record: ObjectRecord): l_StaticObject {
	return instanceOf<l_StaticObject>(StaticObject, record.id);
}

export function airbaseInstance(record: ObjectRecord): l_Airbase {
	return instanceOf<l_Airbase>(Airbase, record.id);
}

export function weaponInstance(record: ObjectRecord): l_Weapon {
	return instanceOf<l_Weapon>(Weapon, record.id);
}

export function groupInstance(group: GroupRecord): l_Group {
	return instanceOf<l_Group>(Group, group.id);
}

export function controllerInstance(id: number): l_Controller {
	return instanceOf<l_Controller>(Controller, id);
}

export function warehouseInstance(id: number): l_Warehouse {
	return instanceOf<l_Warehouse>(Warehouse, id);
}

/** The instance of the class matching the record's kind. */
export function objectInstance(record: ObjectRecord): l_Object {
	switch (record.kind) {
		case "unit":
			return unitInstance(record) as unknown as l_Object;
		case "static":
			return staticInstance(record) as unknown as l_Object;
		case "airbase":
			return airbaseInstance(record) as unknown as l_Object;
		default:
			return weaponInstance(record) as unknown as l_Object;
	}
}

// ---------------------------------------------------------------------------------------------------
// Object: methods every world object shares
// ---------------------------------------------------------------------------------------------------

function objDestroy(this: unknown): void {
	destroyObject(objectRecord(this));
}
function objGetName(this: unknown): string {
	return objectRecord(this).name;
}
function objGetTypeName(this: unknown): string {
	return objectRecord(this).typeName;
}
function objGetPoint(this: unknown): l_Vec3 {
	return copy(objectRecord(this).point);
}
function objGetPosition(this: unknown): l_Position3 {
	return position(objectRecord(this));
}
function objGetVelocity(this: unknown): l_Vec3 {
	return copy(objectRecord(this).velocity);
}
function objInAir(this: unknown): boolean {
	return objectRecord(this).inAir;
}
function objIsExist(this: unknown): boolean {
	const record = state.objects.get(idOf(this));
	return record !== undefined && record.exists;
}
function objHasAttribute(this: unknown, attribute: string): boolean {
	return objectRecord(this).desc.attributes[attribute] === true;
}
function objGetAttributes(this: unknown): Record<string, boolean> {
	return { ...objectRecord(this).desc.attributes };
}
function objGetCategory(this: unknown): number {
	return objectRecord(this).category;
}
function objGetCategoryEx(this: unknown): number {
	return objectRecord(this).categoryEx;
}
function objGetCoalition(this: unknown): number {
	return objectRecord(this).coalition;
}
function objGetCountry(this: unknown): number {
	return objectRecord(this).country;
}
function objGetForcesName(this: unknown): string {
	return countryNames[objectRecord(this).country] ?? "Neutral";
}
function objGetLife(this: unknown): number {
	return objectRecord(this).life;
}
function objGetDrawArgumentValue(this: unknown, argument: number): number {
	return objectRecord(this).drawArguments[argument] ?? 0;
}
function nothing(this: unknown): undefined {
	return undefined;
}

export const DcsObject = defineClass(
	"Object",
	{
		className_: "Object",
		Category: { ...objectCategory },
		cancelChoosingCargo: nothing,
		destroy: objDestroy,
		getAttributes: objGetAttributes,
		getCategory: objGetCategory,
		getName: objGetName,
		getPoint: objGetPoint,
		getPosition: objGetPosition,
		getTypeName: objGetTypeName,
		getVelocity: objGetVelocity,
		hasAttribute: objHasAttribute,
		inAir: objInAir,
		isExist: objIsExist,
	} satisfies Double<l_Object, "database_">,
	{ statics: [] },
);

// ---------------------------------------------------------------------------------------------------
// Unit
// ---------------------------------------------------------------------------------------------------

function unitDesc(record: ObjectRecord): UnitDesc {
	return record.desc as unknown as UnitDesc;
}

export const Unit = defineClass(
	"Unit",
	{
		className_: "Unit",
		Category: { ...unitCategory },
		OpticType: { ...opticType },
		RadarType: { ...radarType },
		RefuelingSystem: { ...refuelingSystem },
		SensorType: { ...sensorType },
		getByName: (name: string): l_Unit | undefined => {
			const record = findObject("unit", name);
			return record ? unitInstance(record) : undefined;
		},
		getDescByName: (typeName: string): UnitDesc | undefined =>
			typeDatabase[typeName] as unknown as UnitDesc | undefined,
		LoadOnBoard: nothing,
		OldCarrierMenuShow: nothing,
		UnloadCargo: nothing,
		disembarking: nothing,
		markDisembarkingTask: nothing,
		vtolableLA: nothing,
		canShipLanding(): boolean | undefined {
			return objectRecord(this).categoryEx === unitCategory.HELICOPTER;
		},
		checkOpenRamp(): boolean {
			objectRecord(this);
			return false;
		},
		openRamp(): void {
			objectRecord(this);
		},
		destroy: objDestroy,
		enableEmission(enabled: boolean): void {
			objectRecord(this).emission = enabled;
		},
		getAirbase(): l_Airbase | undefined {
			const record = objectRecord(this);
			if (record.inAir) return undefined;
			for (const base of liveObjects("airbase"))
				if (distance(base.point, record.point) < 5000)
					return airbaseInstance(base);
			return undefined;
		},
		getAmmo(): UnitAmmoItem[] | undefined {
			const record = objectRecord(this);
			if (record.categoryEx !== unitCategory.AIRPLANE) return undefined;
			return [
				{
					count: 511,
					desc: {
						life: 2,
						_origin: "",
						category: weaponCategory.SHELL,
						typeName: "weapons.shells.M61_20_HE",
						displayName: "20mm HE",
					},
				},
			];
		},
		getAttributes: objGetAttributes,
		getCallsign(): string {
			return objectRecord(this).callsign ?? "";
		},
		getCargosOnBoard(): l_StaticObject[] | undefined {
			objectRecord(this);
			return [];
		},
		getCategory: objGetCategory,
		getCategoryEx: objGetCategoryEx,
		getCoalition: objGetCoalition,
		getCommunicator: nothing,
		getController(): l_Controller {
			return controllerInstance(objectRecord(this).controllerId ?? 0);
		},
		getCountry: objGetCountry,
		getDesc(): UnitDesc {
			return unitDesc(objectRecord(this));
		},
		getDescentCapacity(): number {
			objectRecord(this);
			return 0;
		},
		getDescentOnBoard: nothing,
		getDrawArgumentValue: objGetDrawArgumentValue,
		getForcesName: objGetForcesName,
		getFuel(): number {
			return objectRecord(this).fuel ?? 0;
		},
		getFuelLowState(): number {
			return (objectRecord(this).fuel ?? 1) < 0.2 ? 1 : 0;
		},
		getGroup(): l_Group | undefined {
			const groupId = objectRecord(this).groupId;
			const group =
				groupId === undefined ? undefined : state.groups.get(groupId);
			return group?.exists ? groupInstance(group) : undefined;
		},
		getID(): number | string {
			return objectRecord(this).missionId;
		},
		getLife: objGetLife,
		getLife0(): number {
			return objectRecord(this).life0;
		},
		getName: objGetName,
		getNearestCargos(): l_StaticObject[] | undefined {
			const record = objectRecord(this);
			return liveObjects("static")
				.filter(
					(cargo) =>
						cargo.category === objectCategory.CARGO &&
						distance(cargo.point, record.point) < 1000,
				)
				.map(staticInstance);
		},
		getNearestCargosForAircraft(): l_StaticObject[] | undefined {
			objectRecord(this);
			return [];
		},
		getNumber(): number {
			return objectRecord(this).unitNumber ?? 1;
		},
		getObjectID(): number {
			return objectRecord(this).id;
		},
		getPlayerName(): string | undefined {
			return objectRecord(this).playerName;
		},
		getPoint: objGetPoint,
		getPosition: objGetPosition,
		getRadar(): LuaMultiReturn<[boolean, l_Object | undefined]> {
			objectRecord(this);
			return $multi(false, undefined);
		},
		getSeats(): unknown[] | undefined {
			objectRecord(this);
			return undefined;
		},
		getSensors(): UnitSensors | undefined {
			const record = objectRecord(this);
			if (record.categoryEx !== unitCategory.AIRPLANE) return undefined;
			return {
				[sensorType.RADAR]: [{ typeName: "AN/APG-68", type: sensorType.RADAR }],
				[sensorType.RWR]: [{ typeName: "AN/ALR-56M", type: sensorType.RWR }],
			};
		},
		getTypeName: objGetTypeName,
		getVelocity: objGetVelocity,
		hasAttribute: objHasAttribute,
		hasCarrier(): boolean | undefined {
			objectRecord(this);
			return false;
		},
		hasSensors(sensor?: number): boolean {
			const record = objectRecord(this);
			if (record.categoryEx !== unitCategory.AIRPLANE) return false;
			return (
				sensor === undefined ||
				sensor === sensorType.RADAR ||
				sensor === sensorType.RWR
			);
		},
		inAir: objInAir,
		isActive(): boolean {
			const groupId = objectRecord(this).groupId;
			const group =
				groupId === undefined ? undefined : state.groups.get(groupId);
			return group?.active ?? true;
		},
		isAlive(): boolean {
			return objectRecord(this).life > 0;
		},
		isBroken(): boolean {
			const record = objectRecord(this);
			return record.life < record.life0 / 2;
		},
		isDead(): boolean {
			return objectRecord(this).life <= 0;
		},
		isEffective(): boolean {
			const record = objectRecord(this);
			return record.life >= record.life0 / 2;
		},
		isExist: objIsExist,
	} satisfies Double<l_Unit>,
	{ statics: ["getByName", "getDescByName"], parent: DcsObject },
);

// ---------------------------------------------------------------------------------------------------
// Group
// ---------------------------------------------------------------------------------------------------

function groupUnits(group: GroupRecord): ObjectRecord[] {
	const units: ObjectRecord[] = [];
	for (const id of group.unitIds) {
		const unit = state.objects.get(id);
		if (unit?.exists) units.push(unit);
	}
	return units;
}

export const Group = defineClass(
	"Group",
	{
		className_: "Group",
		Category: { ...groupCategory },
		getByName: (name: string): l_Group | undefined => {
			const group = findGroup(name);
			return group ? groupInstance(group) : undefined;
		},
		activate(): void {
			groupRecord(this).active = true;
		},
		destroy(): void {
			destroyGroup(groupRecord(this));
		},
		embarking: nothing,
		enableEmission(enabled: boolean): void {
			const group = groupRecord(this);
			group.emission = enabled;
			for (const unit of groupUnits(group)) unit.emission = enabled;
		},
		getCategory(): number {
			return groupRecord(this).category;
		},
		getCategoryEx(): number {
			return groupRecord(this).category;
		},
		getCoalition(): number {
			return groupRecord(this).coalition;
		},
		getController(): l_Controller {
			return controllerInstance(groupRecord(this).controllerId);
		},
		getID(): number {
			return groupRecord(this).id;
		},
		getInitialSize(): number {
			return groupRecord(this).initialSize;
		},
		getName(): string {
			return groupRecord(this).name;
		},
		getSize(): number {
			return groupUnits(groupRecord(this)).length;
		},
		getUnit(index: number): l_Unit | undefined {
			const unit = groupUnits(groupRecord(this))[index - 1];
			return unit !== undefined ? unitInstance(unit) : undefined;
		},
		getUnits(): l_Unit[] {
			return groupUnits(groupRecord(this)).map(unitInstance);
		},
		isExist(): boolean {
			const group = state.groups.get(idOf(this));
			return group !== undefined && group.exists;
		},
		markGroup: nothing,
	} satisfies Double<l_Group>,
	{ statics: ["getByName"] },
);

// ---------------------------------------------------------------------------------------------------
// StaticObject
// ---------------------------------------------------------------------------------------------------

export const StaticObject = defineClass(
	"StaticObject",
	{
		className_: "StaticObject",
		getByName: (name: string): l_StaticObject | undefined => {
			const record = findObject("static", name);
			return record ? staticInstance(record) : undefined;
		},
		getDescByName: (typeName: string): StaticObjectDesc | undefined =>
			typeDatabase[typeName] as unknown as StaticObjectDesc | undefined,
		chooseCargo: nothing,
		destroy: objDestroy,
		getAttributes: objGetAttributes,
		getCargoDisplayName(): string | undefined {
			return objectRecord(this).cargoDisplayName;
		},
		getCargoWeight(): number {
			return objectRecord(this).cargoWeight ?? 0;
		},
		getCategory: objGetCategory,
		getCoalition: objGetCoalition,
		getCountry: objGetCountry,
		getDesc(): StaticObjectDesc {
			return objectRecord(this).desc as unknown as StaticObjectDesc;
		},
		getDrawArgumentValue: objGetDrawArgumentValue,
		getForcesName: objGetForcesName,
		getID(): number {
			return objectRecord(this).missionId;
		},
		getLife: objGetLife,
		getName: objGetName,
		getPoint: objGetPoint,
		getPosition: objGetPosition,
		getTypeName: objGetTypeName,
		getVelocity: objGetVelocity,
		hasAttribute: objHasAttribute,
		inAir: objInAir,
		isExist: objIsExist,
	} satisfies Double<l_StaticObject>,
	{ statics: ["getByName", "getDescByName"], parent: DcsObject },
);

// ---------------------------------------------------------------------------------------------------
// Airbase
// ---------------------------------------------------------------------------------------------------

function airbaseRecord(self: unknown): ObjectRecord {
	return objectRecord(self);
}

export const Airbase = defineClass(
	"Airbase",
	{
		className_: "Airbase",
		Category: { ...airbaseCategory },
		getByName: (name: string): l_Airbase | undefined => {
			const record = findObject("airbase", name);
			return record ? airbaseInstance(record) : undefined;
		},
		getDescByName: (typeName: string): AirbaseDesc | undefined =>
			typeDatabase[typeName] as unknown as AirbaseDesc | undefined,
		getNearest: (point: l_Vec3, coalitionId: number): l_Airbase | undefined => {
			let best: ObjectRecord | undefined;
			let bestDistance = math.huge;
			for (const base of liveObjects("airbase")) {
				if (coalitionId !== undefined && base.coalition !== coalitionId)
					continue;
				const d = distance(base.point, point);
				if (d < bestDistance) {
					best = base;
					bestDistance = d;
				}
			}
			return best ? airbaseInstance(best) : undefined;
		},
		autoCapture(enabled: boolean): void {
			airbaseRecord(this).autoCapture = enabled;
		},
		autoCaptureIsOn(): boolean {
			return airbaseRecord(this).autoCapture ?? false;
		},
		destroy: objDestroy,
		getAttributes: objGetAttributes,
		getCallsign(): string {
			return airbaseRecord(this).callsign ?? "";
		},
		getCategory: objGetCategory,
		getCategoryEx: objGetCategoryEx,
		getCoalition: objGetCoalition,
		getCommunicator: nothing,
		getCountry: objGetCountry,
		getDesc(): AirbaseDesc {
			return airbaseRecord(this).desc as unknown as AirbaseDesc;
		},
		getDispatcherTowerPos(): { pos: l_Vec3 } | undefined {
			const point = airbaseRecord(this).point;
			return { pos: { x: point.x + 200, y: point.y + 20, z: point.z + 200 } };
		},
		getForcesName: objGetForcesName,
		getID(): number | string {
			return airbaseRecord(this).missionId;
		},
		getLife: objGetLife,
		getName: objGetName,
		getParking(available?: boolean): AirbaseParkingSpot[] {
			const record = airbaseRecord(this);
			const spots: AirbaseParkingSpot[] = [];
			for (let index = 1; index <= 4; index++) {
				const occupied = index === 1;
				if (available && occupied) continue;
				spots.push({
					Term_Index: index,
					Term_Index_0: index - 1,
					Term_Type: 104,
					TO_AC: occupied,
					fDistToRW: 500 + index * 50,
					vTerminalPos: {
						x: record.point.x + index * 30,
						y: record.point.y,
						z: record.point.z,
					},
				});
			}
			return spots;
		},
		getPoint: objGetPoint,
		getPosition: objGetPosition,
		getRadioSilentMode(): boolean {
			return airbaseRecord(this).radioSilent ?? false;
		},
		getRunways(): AirbaseRunway[] {
			const record = airbaseRecord(this);
			return [
				{
					Name: 13,
					course: -2.2,
					length: 2400,
					width: 60,
					position: copy(record.point),
				},
			];
		},
		getTypeName: objGetTypeName,
		getUnit(): l_Unit | undefined {
			airbaseRecord(this);
			return undefined;
		},
		getVelocity: objGetVelocity,
		getWarehouse(): l_Warehouse {
			return warehouseInstance(airbaseRecord(this).warehouseId ?? 0);
		},
		getWorldID(): number {
			return airbaseRecord(this).id;
		},
		hasAttribute: objHasAttribute,
		inAir: objInAir,
		isExist: objIsExist,
		setCoalition(coalitionId: number): void {
			airbaseRecord(this).coalition = coalitionId;
		},
		setRadioSilentMode(enabled: boolean): void {
			airbaseRecord(this).radioSilent = enabled;
		},
	} satisfies Double<l_Airbase>,
	{ statics: ["getByName", "getDescByName", "getNearest"], parent: DcsObject },
);

// ---------------------------------------------------------------------------------------------------
// Weapon
// ---------------------------------------------------------------------------------------------------

export const Weapon = defineClass(
	"Weapon",
	{
		className_: "Weapon",
		Category: { ...weaponCategory },
		GuidanceType: { ...guidanceType },
		MissileCategory: { ...missileCategory },
		WarheadType: { ...warheadType },
		flag: { ...weaponFlag },
		destroy: objDestroy,
		getAttributes: objGetAttributes,
		getCategory: objGetCategory,
		getCategoryEx: objGetCategoryEx,
		getCoalition: objGetCoalition,
		getCountry: objGetCountry,
		getDesc(): Record<string, unknown> {
			return { ...objectRecord(this).desc };
		},
		getForcesName: objGetForcesName,
		getLauncher(): l_Unit | undefined {
			const id = objectRecord(this).launcherId;
			const launcher = id === undefined ? undefined : state.objects.get(id);
			return launcher?.exists ? unitInstance(launcher) : undefined;
		},
		getName: objGetName,
		getPoint: objGetPoint,
		getPosition: objGetPosition,
		getTarget(): l_Object | undefined {
			const id = objectRecord(this).targetId;
			const target = id === undefined ? undefined : state.objects.get(id);
			return target?.exists ? objectInstance(target) : undefined;
		},
		getTypeName: objGetTypeName,
		getVelocity: objGetVelocity,
		hasAttribute: objHasAttribute,
		inAir: objInAir,
		isExist: objIsExist,
	} satisfies Double<l_Weapon>,
	{ statics: [], parent: DcsObject },
);

// ---------------------------------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------------------------------

function controlledUnits(controller: ControllerRecord): ObjectRecord[] {
	if (controller.ownerUnitId !== undefined) {
		const unit = state.objects.get(controller.ownerUnitId);
		return unit?.exists ? [unit] : [];
	}
	const group =
		controller.ownerGroupId === undefined
			? undefined
			: state.groups.get(controller.ownerGroupId);
	return group ? groupUnits(group) : [];
}

const detectionRange = 10000;

function enemiesInRange(controller: ControllerRecord): ObjectRecord[] {
	const own = controlledUnits(controller);
	if (own.length === 0) return [];
	const ownSide = own[0].coalition;
	return liveObjects("unit").filter(
		(unit) =>
			unit.coalition !== ownSide &&
			unit.coalition !== side.NEUTRAL &&
			own.some((mine) => distance(mine.point, unit.point) <= detectionRange),
	);
}

export const Controller = defineClass(
	"Controller",
	{
		className_: "Controller",
		Detection: { ...detection },
		getDetectedTargets(): DetectedTarget[] {
			return enemiesInRange(controllerRecord(this)).map((unit) => ({
				object: objectInstance(unit),
				visible: true,
				type: true,
				distance: true,
			}));
		},
		hasTask(): boolean {
			return controllerRecord(this).tasks.length > 0;
		},
		isTargetDetected(
			target: l_Object,
		): LuaMultiReturn<
			[boolean, boolean, number, boolean, boolean, l_Vec3, l_Vec3]
		> {
			const detected = enemiesInRange(controllerRecord(this)).some(
				(unit) => unit.id === idOf(target),
			);
			const record = state.objects.get(idOf(target));
			const point =
				record !== undefined ? copy(record.point) : { x: 0, y: 0, z: 0 };
			const velocity =
				record !== undefined ? copy(record.velocity) : { x: 0, y: 0, z: 0 };
			return $multi(
				detected,
				detected,
				state.time,
				detected,
				detected,
				point,
				velocity,
			);
		},
		knowTarget(): boolean {
			controllerRecord(this);
			return true;
		},
		popTask(): void {
			controllerRecord(this).tasks.pop();
		},
		pushTask(task): void {
			controllerRecord(this).tasks.push(task);
		},
		resetTask(): void {
			controllerRecord(this).tasks = [];
		},
		setAltitude(
			altitude: number,
			keep?: boolean,
			altitudeType?: "BARO" | "RADIO",
		): void {
			controllerRecord(this).altitude = { altitude, keep, type: altitudeType };
		},
		setCommand(command): void {
			controllerRecord(this).commands.push(command);
		},
		setOnOff(value: boolean): void {
			controllerRecord(this).onOff = value;
		},
		setOption(
			optionId: number,
			optionValue: number | boolean | string,
		): boolean {
			controllerRecord(this).options[optionId] = optionValue;
			return true;
		},
		setSpeed(speed: number, keep?: boolean): void {
			controllerRecord(this).speed = { speed, keep };
		},
		setTask(task): void {
			controllerRecord(this).tasks = [task];
		},
	} satisfies Double<l_Controller>,
	{ statics: [] },
);

// ---------------------------------------------------------------------------------------------------
// Warehouse
// ---------------------------------------------------------------------------------------------------

function itemKey(item: WarehouseItem): string {
	return typeof item === "string" ? item : item.join(".");
}

function isWeapon(key: string): boolean {
	const [digit] = string.find(key, "^%d");
	return string.sub(key, 1, 8) === "weapons." || digit !== undefined;
}

export function warehouseOf(record: ObjectRecord): l_Warehouse | undefined {
	return record.warehouseId === undefined
		? undefined
		: warehouseInstance(record.warehouseId);
}

export const Warehouse = defineClass(
	"Warehouse",
	{
		className_: "Warehouse",
		getByName: (name: string): l_Warehouse | undefined => {
			const record = findObject("airbase", name) ?? findObject("static", name);
			return record ? warehouseOf(record) : undefined;
		},
		getCargoAsWarehouse: (cargo: l_StaticObject): l_Warehouse | undefined => {
			const record = state.objects.get(idOf(cargo));
			if (!record?.exists || record.category !== objectCategory.CARGO)
				return undefined;
			return warehouseOf(record);
		},
		getResourceMap: (): Record<string, unknown> => {
			const map: Record<string, unknown> = {};
			for (const [, warehouse] of pairs(state.warehouses))
				for (const [key] of pairs(warehouse.items)) map[key] = true;
			return map;
		},
		addItem(item: WarehouseItem, count: number): void {
			const warehouse = warehouseRecord(this);
			const key = itemKey(item);
			warehouse.items[key] = (warehouse.items[key] ?? 0) + count;
		},
		addLiquid(liquid: number, amount: number): void {
			const warehouse = warehouseRecord(this);
			warehouse.liquids[liquid] = (warehouse.liquids[liquid] ?? 0) + amount;
		},
		getInventory(): WarehouseInventory {
			const warehouse = warehouseRecord(this);
			const inventory = {
				liquids: { ...warehouse.liquids },
				aircraft: {} as Record<string, number>,
				weapon: {} as Record<string, number>,
			};
			for (const [key, count] of pairs(warehouse.items)) {
				if (isWeapon(key)) inventory.weapon[key] = count;
				else inventory.aircraft[key] = count;
			}
			return inventory as WarehouseInventory;
		},
		getItemCount(item: WarehouseItem): number {
			return warehouseRecord(this).items[itemKey(item)] ?? 0;
		},
		getLiquidAmount(liquid: number): number {
			return warehouseRecord(this).liquids[liquid] ?? 0;
		},
		getOwner(): l_Object {
			const owner = state.objects.get(
				warehouseRecord(this).ownerId,
			) as ObjectRecord;
			return objectInstance(owner);
		},
		removeItem(item: WarehouseItem, count: number): void {
			const warehouse = warehouseRecord(this);
			const key = itemKey(item);
			warehouse.items[key] = math.max(0, (warehouse.items[key] ?? 0) - count);
		},
		removeLiquid(liquid: number, amount: number): void {
			const warehouse = warehouseRecord(this);
			warehouse.liquids[liquid] = math.max(
				0,
				(warehouse.liquids[liquid] ?? 0) - amount,
			);
		},
		setItem(item: WarehouseItem, count: number): void {
			warehouseRecord(this).items[itemKey(item)] = count;
		},
		setLiquidAmount(liquid: number, amount: number): void {
			warehouseRecord(this).liquids[liquid] = amount;
		},
	} satisfies Double<l_Warehouse>,
	{ statics: ["getByName", "getCargoAsWarehouse", "getResourceMap"] },
);
