import type { l_Airbase } from "./Airbase";
import type { l_Controller } from "./Controller";
import type { l_Group } from "./Group";
import type { l_Object } from "./Object";
import type { l_StaticObject } from "./StaticObject";
import type { l_Position3, l_Vec3 } from "./coord";
import type { _Unit } from "./exports/Unit.export";

export interface UnitSensor {
	typeName: string;
	type: number;
	opticType?: number;
}

export type UnitSensors = Record<number, UnitSensor[]>;

/**
 * Unit Ammo table from DCS World.
 * @example
 * [
 *   {
 *     "count": 940,
 *     "desc": {
 *       "life": 2,
 *       "warhead": {
 *         "explosiveMass": 0.1,
 *         "type": 1,
 *         "caliber": 20,
 *         "mass": 0.1
 *       },
 *       "_origin": "",
 *       "category": 0,
 *       "box": {
 *         "min": {
 *           "y": -0.12504199147224,
 *           "x": -6.61008644104,
 *           "z": -0.12113920599222
 *         },
 *         "max": {
 *           "y": 0.12504191696644,
 *           "x": 2.2344591617584,
 *           "z": 0.12113922089338
 *         }
 *       },
 *       "typeName": "weapons.shells.M61_20_HE",
 *       "displayName": "20mm HE"
 *     }
 *   }
 * ]
 */
export interface UnitAmmoItem {
	count: number;
	desc: {
		life: number;
		_origin: string;
		category: number;
		typeName: string;
		displayName: string;
	};
}

/**
 * Unit Desc table from DCS World.
 * @example
 * {
 *   "speedMax0": 111.11111450195,
 *   "massEmpty": 2223,
 *   "range": 5920,
 *   "box": {
 *     "min": {
 *       "y": -2.491916179657,
 *       "x": -6.523097038269,
 *       "z": -10.887048721313
 *     },
 *     "max": {
 *       "y": 2.491916179657,
 *       "x": 6.523097038269,
 *       "z": 10.829894065857
 *     }
 *   },
 *   "Hmax": 15000,
 *   "Kmax": 0.10000000149012,
 *   "_origin": "MQ-9 Reaper AI",
 *   "speedMax10K": 111.11111450195,
 *   "NyMin": -1,
 *   "fuelMassMax": 1300,
 *   "speedMax": 111.11111450195,
 *   "NyMax": 3,
 *   "massMax": 4760,
 *   "RCS": 0.5,
 *   "displayName": "MQ-9 Reaper",
 *   "life": 18,
 *   "VyMax": 5,
 *   "Kab": 0,
 *   "attributes": {
 *     "UAVs": true,
 *     "Battle airplanes": true,
 *     "NonAndLightArmoredUnits": true,
 *     "Battleplanes": true,
 *     "NonArmoredUnits": true,
 *     "All": true,
 *     "Planes": true,
 *     "Air": true
 *   },
 *   "typeName": "MQ-9 Reaper",
 *   "category": 0
 * }
 */
export type UnitDesc = {
	massEmpty: number;
	riverCrossing: boolean;
	maxSlopeAngle: number;
	Kmax: number;
	RCS: number;
	box: { min: l_Vec3; max: l_Vec3 };
	speedMax: number;
	life: number;
	attributes: Record<string, boolean>;
	category: number;
	speedMaxOffRoad: number;
	_origin: string;
	displayName: string;
};

export interface l_Unit extends _Unit {
	/**
	 * Returns descriptor data for a unit type without requiring an instance. This is a static function on `Unit`.
	 *
	 * @noSelf
	 * @example `const desc = Unit.getDescByName("F-16C_50");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getDescByName
	 */
	getDescByName(typeName: string): UnitDesc | undefined;
	/**
	 * Returns the airbase currently associated with the unit, when any.
	 *
	 * @example `const base = unit.getAirbase();`
	 */
	getAirbase(): l_Airbase | undefined;
	/**
	 * Returns the force/localization name used by engine UI systems.
	 *
	 * @example `const name = unit.getForcesName();`
	 */
	getForcesName(): string;
	/**
	 * Reports whether the unit is alive according to the engine damage state.
	 *
	 * @example `if (unit.isAlive()) env.info(unit.getName());`
	 */
	isAlive(): boolean;
	/**
	 * Reports whether the unit is dead according to the engine damage state.
	 *
	 * @example `const dead = unit.isDead();`
	 */
	isDead(): boolean;
	/**
	 * Reports whether damage has broken the unit.
	 *
	 * @example `const broken = unit.isBroken();`
	 */
	isBroken(): boolean;
	/**
	 * Reports whether the unit remains operationally effective.
	 *
	 * @example `const effective = unit.isEffective();`
	 */
	isEffective(): boolean;
	/**
	 * Returns the engine's low-fuel state code. DCS 2.9.29 exposes a number.
	 *
	 * @example `const lowFuelState = unit.getFuelLowState();`
	 */
	getFuelLowState(): number;
	/**
	 * Returns seat metadata for multi-seat aircraft. Schema varies by module.
	 *
	 * @example `const seats = unit.getSeats();`
	 */
	getSeats(): unknown[] | undefined;
	/**
	 * Returns cargo objects currently loaded aboard this transport.
	 *
	 * @example `const cargos = unit.getCargosOnBoard();`
	 */
	getCargosOnBoard(): l_StaticObject[] | undefined;
	/**
	 * Returns one loaded troop/descent record. Its schema is engine-native.
	 *
	 * @example `const descent = unit.getDescentOnBoard();`
	 */
	getDescentOnBoard(): unknown;
	/**
	 * Returns nearby cargo candidates for aircraft cargo UI.
	 *
	 * @example `const cargos = unit.getNearestCargosForAircraft();`
	 */
	getNearestCargosForAircraft(): l_StaticObject[] | undefined;
	/**
	 * Reports whether this unit has a carrier/transport association; unsupported unit types return nothing.
	 *
	 * @example `const carried = unit.hasCarrier();`
	 */
	hasCarrier(): boolean | undefined;
	/**
	 * Reports whether this unit can perform a ship landing; unsupported unit types return nothing.
	 *
	 * @example `const allowed = unit.canShipLanding();`
	 */
	canShipLanding(): boolean | undefined;
	/**
	 * Reports whether the unit's cargo ramp is open.
	 *
	 * @example `const open = unit.checkOpenRamp();`
	 */
	checkOpenRamp(): boolean;
	/**
	 * Opens the unit's cargo ramp.
	 *
	 * @example `unit.openRamp();`
	 */
	openRamp(): void;
	/**
	 * Returns VTOL landing-area information. TODO: the native return schema is not exposed by installed Lua sources.
	 */
	vtolableLA(...arguments_: unknown[]): unknown;
	/**
	 * TODO: engine-native communicator userdata has no published scripting shape.
	 */
	getCommunicator(): unknown;
	/**
	 * TODO: transport loading contract is engine-native and absent from installed Lua sources.
	 */
	LoadOnBoard(...arguments_: unknown[]): unknown;
	/**
	 * TODO: transport unloading contract is engine-native and absent from installed Lua sources.
	 */
	UnloadCargo(...arguments_: unknown[]): unknown;
	/**
	 * TODO: legacy carrier-menu contract is engine-native and absent from installed Lua sources.
	 */
	OldCarrierMenuShow(...arguments_: unknown[]): unknown;
	/**
	 * TODO: disembarkation task payload is engine-native and absent from installed Lua sources.
	 */
	disembarking(...arguments_: unknown[]): unknown;
	/**
	 * TODO: disembarkation marker payload is engine-native and absent from installed Lua sources.
	 */
	markDisembarkingTask(...arguments_: unknown[]): unknown;
	/**
	 * Removes the unit from the mission.
	 *
	 * @returns Nothing.
	 * @example `if (unit.isExist()) unit.destroy();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_destroy
	 */
	destroy(): void;
	/**
	 * Returns all database attributes assigned to this unit type.
	 *
	 * @returns Attribute membership flags.
	 * @example `const attributes = unit.getAttributes();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getAttributes
	 */
	getAttributes(): Record<string, boolean>;
	/**
	 * Tests a database attribute.
	 *
	 * @param attribute Attribute name.
	 * @returns Whether it is present.
	 * @example `const fighter = unit.hasAttribute("Fighters");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_hasAttribute
	 */
	hasAttribute(attribute: string): boolean;
	/**
	 * Reports whether the unit is airborne.
	 *
	 * @returns In-air state.
	 * @example `if (unit.inAir()) env.info("Airborne");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_inAir
	 */
	inAir(): boolean;
	/**
	 * Reports whether the unit still exists.
	 *
	 * @returns Existence state.
	 * @example `if (unit.isExist()) env.info(unit.getName());`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_isExist
	 */
	isExist(): boolean;

	/**
	 * Returns the unit's runtime mission identifier.
	 *
	 * @returns Numeric runtime unit ID.
	 * @example `Unit.getByName("Pilot #001")?.getID()`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getID
	 */
	getID(): number | string;

	/**
	 * Returns the unit's exact mission name, not its type or callsign.
	 *
	 * @returns Mission Editor or dynamically assigned unit name.
	 * @example `Unit.getByName("Pilot #001")?.getName()`
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getName
	 */
	getName(): string;

	/**
	 * Returns the unit's current origin in local DCS world coordinates.
	 *
	 * @returns Position in metres using DCS's X/north, Y/up, Z/east axes.
	 * @example `const altitude = Unit.getByName("Pilot #001")?.getPoint().y;`
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getPoint
	 */
	getPoint(): l_Vec3;

	/**
	 * Returns the unit's position and orientation matrix in local world space.
	 * `p` is the position; `x`, `y`, and `z` are orientation unit vectors.
	 *
	 * @returns Current position and orientation.
	 * @example `const forward = Unit.getByName("Pilot #001")?.getPosition().x;`
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getPosition
	 */
	getPosition(): l_Position3;

	/**
	 * Returns the unit's current world-space velocity vector.
	 *
	 * @returns Velocity components in metres per second.
	 * @example `const velocity = Unit.getByName("Pilot #001")?.getVelocity();`
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getVelocity
	 */
	getVelocity(): l_Vec3;

	/**
	 * Returns the unit's internal DCS database type name, such as `"F-16C_50"`.
	 *
	 * @returns Internal type name.
	 * @example `env.info(Unit.getByName("Pilot #001")?.getTypeName() ?? "missing");`
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getTypeName
	 */
	getTypeName(): string;

	/**
	 * Returns the coalition to which the unit currently belongs.
	 *
	 * @returns Coalition identifier from `coalition.side`.
	 * @example `const isBlue = unit.getCoalition() === coalition.side.BLUE;`
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCoalition
	 */
	getCoalition(): number;

	/**
	 * Returns the inherited broad object category. For a unit this is normally
	 * `Object.Category.UNIT`; use `getCategoryEx()` or `getDesc().category` for
	 * airplane, helicopter, ground, ship, and structure categories.
	 *
	 * @returns Category identifier from `Object.Category`.
	 * @example `const isUnitObject = unit.getCategory() === Object.Category.UNIT;`
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCategory
	 */
	getCategory(): number;

	/**
	 * Returns the unit-specific platform category.
	 *
	 * @returns Value from `Unit.Category`.
	 * @example `const isAircraft = unit.getCategoryEx() === Unit.Category.AIRPLANE;`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCategoryEx
	 */
	getCategoryEx(): number;

	/**
	 * Looks up a unit by its exact mission name. DCS may return late-activated
	 * units before activation; use `isActive()` when runtime activation matters.
	 *
	 * @param name Exact Mission Editor or dynamically assigned unit name.
	 * @returns Matching unit, or `undefined` when not found.
	 * @example `const lead = Unit.getByName("Springfield 1-1");`
	 *
	 * @noSelf
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getByName
	 */
	getByName(name: string): l_Unit | undefined;

	/**
	 * Returns the AI controller for the unit. Aircraft and helicopters support
	 * unit-level control; ships and ground units are normally controlled through
	 * their group's controller.
	 *
	 * @returns Unit controller.
	 * @example `unit.getController().setOnOff(false);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getController
	 */
	getController(): l_Controller;

	/**
	 * Returns the group containing this unit, or `undefined` after it is no longer associated with a live group.
	 *
	 * @returns Parent group when available.
	 * @example `const groupName = unit.getGroup()?.getName();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getGroup
	 */
	getGroup(): l_Group | undefined;

	/**
	 * Returns the country assigned to the unit.
	 *
	 * @returns Country identifier from `country.id`.
	 * @example `const countryId = unit.getCountry();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCountry
	 */
	getCountry(): number;

	/**
	 * Returns the unit's localized callsign.
	 *
	 * @returns Callsign text.
	 * @example `env.info(unit.getCallsign());`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCallsign
	 */
	getCallsign(): string;

	/**
	 * Returns the player's name when human-controlled, otherwise `undefined`.
	 *
	 * @returns Player name or `undefined`.
	 * @example `const playerName = unit.getPlayerName();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getPlayerName
	 */
	getPlayerName(): string | undefined;

	/**
	 * Returns the unit's fixed Mission Editor position within its group. This number does not change as other units are destroyed.
	 *
	 * @returns One-based group position.
	 * @example `const formationNumber = unit.getNumber();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getNumber
	 */
	getNumber(): number;

	/**
	 * Returns the object's runtime identifier used by lower-level object APIs.
	 *
	 * @returns Runtime object ID.
	 * @example `const objectId = unit.getObjectID();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getObjectID
	 */
	getObjectID(): number;

	/**
	 * Returns fuel as a fraction of maximum internal capacity. External tanks can
	 * make the result greater than `1`; ground units and ships normally return `1`.
	 *
	 * @returns Remaining fuel fraction, where `1` is full internal fuel.
	 * @example `env.info(`Fuel: ${unit.getFuel() * 100}%`);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getFuel
	 */
	getFuel(): number;

	/**
	 * Returns database metadata for the unit's type. Descriptor data is static;
	 * use other methods for changing runtime state.
	 *
	 * @returns Type-specific unit descriptor.
	 * @example `env.info(unit.getDesc().displayName);`
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getDesc
	 */
	getDesc(): UnitDesc;

	/**
	 * Returns each ammunition type currently loaded and its remaining count. DCS
	 * returns `nil` when ammunition information is unavailable.
	 *
	 * @returns Ammunition entries, or `undefined` when no table is available.
	 * @example
	 * ```ts
	 * for (const item of unit.getAmmo() ?? []) {
	 * 	env.info(`${item.desc.displayName}: ${item.count}`);
	 * }
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getAmmo
	 */
	getAmmo(): UnitAmmoItem[] | undefined;

	/**
	 * Returns all sensors grouped by values from `Unit.SensorType`.
	 *
	 * @returns Sensor map, or `undefined` when unavailable.
	 * @example `const radars = unit.getSensors()?.[Unit.SensorType.RADAR] ?? [];`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getSensors
	 */
	getSensors(): UnitSensors | undefined;

	/**
	 * Checks for any sensor, or a sensor type and optional subtype values.
	 *
	 * @param sensorType Value from `Unit.SensorType`; omit to test for any sensor.
	 * @param subtypes Optic/radar subtype values.
	 * @returns Whether a matching sensor exists.
	 * @example `const hasRadar = unit.hasSensors(Unit.SensorType.RADAR);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_hasSensors
	 */
	hasSensors(sensorType?: number, ...subtypes: number[]): boolean;

	/**
	 * Returns whether a radar is operating and the object it is tracking. When no object is tracked, Lua still returns the radar state but the second value is `nil`.
	 *
	 * @returns Radar-on state and tracked object, when present.
	 * @example `const [radarOn, target] = unit.getRadar(); if (radarOn && target) env.info(target.getName());`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getRadar
	 */
	getRadar(): LuaMultiReturn<[boolean, l_Object | undefined]>;

	/**
	 * Returns a model draw argument in its normalized range.
	 *
	 * @param argument Draw-argument index.
	 * @returns Current value, normally `0` to `1`.
	 * @example `const gear = unit.getDrawArgumentValue(0);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getDrawArgumentValue
	 */
	getDrawArgumentValue(argument: number): number;

	/**
	 * Returns friendly cargo objects sorted nearest-first. Only helicopters provide this list.
	 *
	 * @returns Cargo objects, or `undefined` for unsupported units.
	 * @example `const nearestCargo = unit.getNearestCargos()?.[0];`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getNearestCargos
	 */
	getNearestCargos(): l_StaticObject[] | undefined;

	/**
	 * Enables or disables supported radar emissions.
	 *
	 * @param enabled Desired emission state.
	 * @returns Nothing.
	 * @example `unit.enableEmission(false);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_enableEmission
	 */
	enableEmission(enabled: boolean): void;

	/**
	 * Returns troop/descent capacity for supported transport units.
	 *
	 * @returns Capacity count.
	 * @example `const seats = unit.getDescentCapacity();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getDescentCapacity
	 */
	getDescentCapacity(): number;

	/**
	 * Reports whether the unit has been activated in the simulation. A known
	 * late-activation unit returns `false` until its group is activated.
	 *
	 * @returns `true` when the unit is active.
	 * @example `if (unit.isActive()) env.info("Unit is active");`
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_isActive
	 */
	isActive(): boolean;

	/**
	 * Returns the unit's current life (hit-point) value. Values below `1` are
	 * generally considered dead. Aircraft subsystem damage is more detailed than
	 * this aggregate value, and burning ground/ship units may report `0` before
	 * their final explosion.
	 *
	 * @returns Current life value.
	 * @example `const damage = 1 - unit.getLife() / unit.getLife0();`
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getLife
	 */
	getLife(): number;

	/**
	 * Returns the unit type's initial life value from its descriptor. This value
	 * does not change as the unit takes damage and can be compared with
	 * `getLife()` to calculate the remaining fraction.
	 *
	 * @returns Initial life value for the unit type.
	 *
	 * @example
	 * ```ts
	 * const unit = Unit.getByName("Target");
	 * if (unit) {
	 * 	const remainingFraction = unit.getLife() / unit.getLife0();
	 * 	env.info(`Life remaining: ${remainingFraction * 100}%`);
	 * }
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getLife0
	 * @see %DCS_INSTALL_DIR%/Scripts/ScriptingSystem.lua:112
	 */
	getLife0(): number;
}
