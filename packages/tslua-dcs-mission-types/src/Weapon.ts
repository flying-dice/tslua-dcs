import type { l_Object } from "./Object";
import type { l_Unit } from "./Unit";
import type { l_Position3, l_Vec3 } from "./coord";
import type { _Weapon } from "./exports/Weapon.export";

export interface l_Weapon extends _Weapon {
	/**
	 * Returns the force/localization name used by engine UI systems.
	 *
	 * @example `const name = weapon.getForcesName();`
	 */
	getForcesName(): string;
	/**
	 * Removes the weapon from the mission.
	 *
	 * @returns Nothing.
	 * @example `if (weapon.isExist()) weapon.destroy();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_destroy
	 */
	destroy(): void;
	/**
	 * Returns all database attributes assigned to this weapon type.
	 *
	 * @returns Attribute membership flags.
	 * @example `const attributes = weapon.getAttributes();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getAttributes
	 */
	getAttributes(): Record<string, boolean>;
	/**
	 * Returns the broad object category.
	 *
	 * @returns Value from `Object.Category`.
	 * @example `const category = weapon.getCategory();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCategory
	 */
	getCategory(): number;
	/**
	 * Returns the weapon object's runtime name.
	 *
	 * @returns Object name.
	 * @example `env.info(weapon.getName());`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getName
	 */
	getName(): string;
	/**
	 * Returns the weapon position in local world coordinates.
	 *
	 * @returns Position in metres.
	 * @example `const point = weapon.getPoint();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getPoint
	 */
	getPoint(): l_Vec3;
	/**
	 * Returns weapon position and orientation.
	 *
	 * @returns World transform.
	 * @example `const transform = weapon.getPosition();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getPosition
	 */
	getPosition(): l_Position3;
	/**
	 * Returns the internal DCS database type name.
	 *
	 * @returns Type name.
	 * @example `env.info(weapon.getTypeName());`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getTypeName
	 */
	getTypeName(): string;
	/**
	 * Returns velocity in world axes.
	 *
	 * @returns Metres per second.
	 * @example `const velocity = weapon.getVelocity();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getVelocity
	 */
	getVelocity(): l_Vec3;
	/**
	 * Tests a database attribute.
	 *
	 * @param attribute Attribute name.
	 * @returns Whether it is present.
	 * @example `const missile = weapon.hasAttribute("Missiles");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_hasAttribute
	 */
	hasAttribute(attribute: string): boolean;
	/**
	 * Reports whether the weapon is airborne.
	 *
	 * @returns In-air state.
	 * @example `const airborne = weapon.inAir();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_inAir
	 */
	inAir(): boolean;
	/**
	 * Reports whether the weapon still exists.
	 *
	 * @returns Existence state.
	 * @example `if (weapon.isExist()) env.info(weapon.getTypeName());`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_isExist
	 */
	isExist(): boolean;

	/**
	 * Returns the coalition associated with the launching object.
	 *
	 * @returns Value from `coalition.side`.
	 * @example `const side = weapon.getCoalition();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCoalition
	 */
	getCoalition(): number;

	/**
	 * Returns the weapon-specific category in addition to the broad object category.
	 *
	 * @returns Value from `Weapon.Category`.
	 * @example `const category = weapon.getCategoryEx();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCategoryEx
	 */
	getCategoryEx(): number;

	/**
	 * Returns database metadata for the weapon type. Exact fields vary by weapon category.
	 *
	 * @returns Weapon descriptor.
	 * @example `const desc = weapon.getDesc();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getDesc
	 */
	getDesc(): Record<string, unknown>;

	/**
	 * Returns the unit that launched the weapon.
	 *
	 * @returns Launching unit, or `undefined` when unavailable.
	 * @example `const shooter = weapon.getLauncher();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getLauncher
	 */
	getLauncher(): l_Unit | undefined;

	/**
	 * Returns the object currently targeted by a guided weapon.
	 *
	 * @returns Target object, or `undefined` when no target is assigned.
	 * @example `const target = weapon.getTarget();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getTarget
	 */
	getTarget(): l_Object | undefined;

	/**
	 * Returns the country associated with the weapon's launching object.
	 *
	 * @returns Country identifier from `country.id`.
	 *
	 * @example
	 * ```ts
	 * const weaponCountry = event.weapon?.getCountry();
	 * if (weaponCountry !== undefined) env.info(`Weapon country: ${weaponCountry}`);
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCountry
	 */
	getCountry(): number;
}
