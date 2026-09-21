import type { l_Position3, l_Vec3 } from "./coord";
import type { _StaticObject } from "./exports/StaticObject.export";

/**
 * @example
 * {
 *   "life": 5,
 *   "_origin": "World War II AI Units by Eagle Dynamics",
 *   "category": 4,
 *   "displayName": "Barrel",
 *   "typeName": "Beer Bomb",
 *   "box": {
 *     "min": {
 *       "y": -0.036429971456528,
 *       "x": -0.47995102405548,
 *       "z": -0.55243939161301
 *     },
 *     "max": {
 *       "y": 1.066880106926,
 *       "x": 0.47995102405548,
 *       "z": 0.55087059736252
 *     }
 *   }
 * }
 */
export type StaticObjectDesc = {
	/**
	 * Maximum life of the static object type.
	 */
	life: number;
	/**
	 * DCS database attributes supported by the object.
	 */
	attributes: Record<string, boolean>;
	/**
	 * Database module that supplied the definition.
	 */
	_origin: string;
	/**
	 * Descriptor category identifier.
	 */
	category: number;
	/**
	 * Internal DCS type name.
	 */
	typeName: string;
	/**
	 * Localized display name.
	 */
	displayName: string;
};

export interface l_StaticObject extends _StaticObject {
	/**
	 * Returns the force/localization name used by engine UI systems.
	 *
	 * @example `const name = cargo.getForcesName();`
	 */
	getForcesName(): string;
	/**
	 * TODO: cargo-selection UI payload is engine-native and undocumented in the installed Lua sources.
	 */
	chooseCargo(...arguments_: unknown[]): unknown;
	/**
	 * Removes the static object.
	 *
	 * @returns Nothing.
	 * @example `if (object.isExist()) object.destroy();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_destroy
	 */
	destroy(): void;
	/**
	 * Returns all database attributes assigned to this type. Some static-object descriptors omit the attributes table.
	 *
	 * @returns Attribute membership flags, or `undefined` when the descriptor has none.
	 * @example `const attributes = object.getAttributes() ?? {};`
	 * @see %DCS_INSTALL_DIR%/Scripts/ScriptingSystem.lua:106
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getAttributes
	 */
	getAttributes(): Record<string, boolean> | undefined;
	/**
	 * Returns the broad object category.
	 *
	 * @returns Value from `Object.Category`.
	 * @example `const category = object.getCategory();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCategory
	 */
	getCategory(): number;
	/**
	 * Returns the internal DCS database type name.
	 *
	 * @returns Type name.
	 * @example `env.info(object.getTypeName());`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getTypeName
	 */
	getTypeName(): string;
	/**
	 * Returns velocity in world axes.
	 *
	 * @returns Metres per second.
	 * @example `const velocity = object.getVelocity();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getVelocity
	 */
	getVelocity(): l_Vec3;
	/**
	 * Tests a database attribute.
	 *
	 * @param attribute Attribute name.
	 * @returns Whether it is present.
	 * @example `const cargo = object.hasAttribute("Cargos");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_hasAttribute
	 */
	hasAttribute(attribute: string): boolean;
	/**
	 * Reports whether the object is airborne.
	 *
	 * @returns In-air state.
	 * @example `const airborne = object.inAir();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_inAir
	 */
	inAir(): boolean;
	/**
	 * Reports whether the object still exists.
	 *
	 * @returns Existence state.
	 * @example `if (object.isExist()) env.info(object.getName());`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_isExist
	 */
	isExist(): boolean;

	/**
	 * Returns descriptor data for a static type without requiring an instance.
	 *
	 * @param typeName Internal DCS type name.
	 * @returns Descriptor, or `undefined` when unknown.
	 * @example `const desc = StaticObject.getDescByName("ammo_cargo");`
	 * @noSelf
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getDescByName
	 */
	getDescByName(typeName: string): StaticObjectDesc | undefined;

	/**
	 * Returns the static object's runtime mission identifier.
	 *
	 * @returns Numeric runtime object ID.
	 *
	 * @example
	 * ```ts
	 * const object = StaticObject.getByName("Ammo depot");
	 * if (object) env.info(`Static ID: ${object.getID()}`);
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getID
	 */
	getID(): number;

	/**
	 * Returns current life (hit points). Values below `1` are generally destroyed.
	 *
	 * @returns Current life.
	 * @example `if (object.getLife() < 1) env.info("Destroyed");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getLife
	 */
	getLife(): number;

	/**
	 * Returns the display name used for a cargo static. Non-cargo static objects can return nothing.
	 *
	 * @returns Cargo display name, or `undefined` when the object is not cargo.
	 * @example `const cargoName = object.getCargoDisplayName(); if (cargoName) env.info(cargoName);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCargoDisplayName
	 */
	getCargoDisplayName(): string | undefined;

	/**
	 * Returns cargo mass in kilograms.
	 *
	 * @returns Cargo mass.
	 * @example `const massKg = cargo.getCargoWeight();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCargoWeight
	 */
	getCargoWeight(): number;

	/**
	 * Returns a model draw argument in its normalized range.
	 *
	 * @param argument Draw-argument index.
	 * @returns Current value.
	 * @example `const value = object.getDrawArgumentValue(0);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getDrawArgumentValue
	 */
	getDrawArgumentValue(argument: number): number;

	/**
	 * Returns the static object's exact mission name.
	 *
	 * @returns Static-object name.
	 *
	 * @example
	 * ```ts
	 * const name = StaticObject.getByName("Ammo depot")?.getName();
	 * if (name) env.info(name);
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getName
	 */
	getName(): string;

	/**
	 * Looks up a static object by its exact Mission Editor or dynamically assigned
	 * name. Static-object names must be unique within the mission.
	 *
	 * @param name Exact static-object name.
	 * @returns Matching object, or `undefined` when no object has that name.
	 *
	 * @example
	 * ```ts
	 * const depot = StaticObject.getByName("Ammo depot");
	 * if (!depot) env.warning("Ammo depot was not found");
	 * ```
	 *
	 * @noSelf
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getByName
	 */
	getByName(name: string): l_StaticObject | undefined;

	/**
	 * Returns the country assigned to the static object.
	 *
	 * @returns Country identifier from `country.id`.
	 *
	 * @example
	 * ```ts
	 * const countryId = StaticObject.getByName("Ammo depot")?.getCountry();
	 * if (countryId !== undefined) env.info(`Country ID: ${countryId}`);
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCountry
	 */
	getCountry(): number;

	/**
	 * Returns the object's origin in local DCS world coordinates.
	 *
	 * @returns Position in metres using DCS's X/north, Y/up, Z/east axes.
	 *
	 * @example
	 * ```ts
	 * const point = StaticObject.getByName("Ammo depot")?.getPoint();
	 * if (point) env.info(`Position: ${point.x}, ${point.z}`);
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getPoint
	 */
	getPoint(): l_Vec3;

	/**
	 * Returns the object's position and orientation matrix in local world space.
	 * The `p` member is the point; `x`, `y`, and `z` are orientation unit vectors.
	 *
	 * @returns Position and orientation matrix.
	 *
	 * @example
	 * ```ts
	 * const position = StaticObject.getByName("Ammo depot")?.getPosition();
	 * if (position) env.info(`Heading vector: ${position.x.x}, ${position.x.z}`);
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getPosition
	 */
	getPosition(): l_Position3;

	/**
	 * Returns the coalition that owns the static object.
	 *
	 * @returns Coalition identifier from `coalition.side`.
	 *
	 * @example
	 * ```ts
	 * const depot = StaticObject.getByName("Ammo depot");
	 * if (depot?.getCoalition() === coalition.side.RED) env.info("Red depot");
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCoalition
	 */
	getCoalition(): number;

	/**
	 * Returns database metadata describing the static object's type.
	 *
	 * @returns Static-object descriptor.
	 *
	 * @example
	 * ```ts
	 * const desc = StaticObject.getByName("Ammo depot")?.getDesc();
	 * if (desc) env.info(`${desc.displayName}: ${desc.life} life`);
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getDesc
	 */
	getDesc(): StaticObjectDesc;
}
