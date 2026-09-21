import type { l_Position3, l_Vec3 } from "./coord";
import type { _Object } from "./exports/Object.export";

export interface l_Object extends _Object {
	/**
	 * TODO: cargo-selection cancellation is engine-native and its parameter/return contract is not exposed by installed scripts.
	 */
	cancelChoosingCargo(...arguments_: unknown[]): unknown;
	/**
	 * Removes the object from the mission. Once destroyed, the object reference
	 * must not be used for further operations.
	 * @returns Nothing.
	 * @example `if (object.isExist()) object.destroy();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_destroy
	 */
	destroy(): void;

	/**
	 * Returns the object's exact mission name.
	 *
	 * @returns Object name.
	 * @example `env.info(object.getName());`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getName
	 */
	getName(): string;

	/**
	 * Returns the object's origin in local world coordinates.
	 *
	 * @returns Position in metres.
	 * @example `const altitude = object.getPoint().y;`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getPoint
	 */
	getPoint(): l_Vec3;

	/**
	 * Returns position and orientation; `p` is position and `x/y/z` are unit axes.
	 *
	 * @returns World transform.
	 * @example `const forward = object.getPosition().x;`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getPosition
	 */
	getPosition(): l_Position3;

	/**
	 * Returns the internal DCS database type name.
	 *
	 * @returns Type name.
	 * @example `env.info(object.getTypeName());`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getTypeName
	 */
	getTypeName(): string;

	/**
	 * Returns world-axis velocity in metres per second.
	 *
	 * @returns Velocity vector.
	 * @example `const velocity = object.getVelocity();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getVelocity
	 */
	getVelocity(): l_Vec3;

	/**
	 * Reports whether the object is airborne.
	 *
	 * @returns In-air state.
	 * @example `if (object.inAir()) env.info("Airborne");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_inAir
	 */
	inAir(): boolean;

	/**
	 * Reports whether the object still exists in the simulation.
	 *
	 * @returns Existence state.
	 * @example `if (!object.isExist()) return;`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_isExist
	 */
	isExist(): boolean;

	/**
	 * Tests whether the object's descriptor contains an attribute whose value
	 * is exactly `true`. Attribute names are DCS database strings such as
	 * `"Air"`, `"Ground Units"`, or `"Ships"`.
	 *
	 * @param attribute DCS database attribute name to test.
	 * @returns `true` only when the descriptor contains that attribute with the value `true`.
	 *
	 * @example
	 * ```ts
	 * const unit = Unit.getByName("Target");
	 * if (unit?.hasAttribute("Air Defence")) {
	 * 	env.info("Target is an air-defence unit");
	 * }
	 * ```
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/ScriptingSystem.lua:99
	 * @see https://wiki.hoggitworld.com/view/DCS_func_hasAttribute
	 */
	hasAttribute(attribute: string): boolean;

	/**
	 * Returns the attributes table directly from the object's descriptor.
	 * DCS returns `nil` when the descriptor has no attributes table.
	 *
	 * @returns Attribute-name map, or `undefined` when the object has no attributes.
	 *
	 * @example
	 * ```ts
	 * const unit = Unit.getByName("Target");
	 * const attributes = unit?.getAttributes();
	 * if (attributes?.["Ground Units"] === true) {
	 * 	env.info("Target is a ground unit");
	 * }
	 * ```
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/ScriptingSystem.lua:106
	 */
	getAttributes(): Record<string, unknown> | undefined;

	/**
	 * Returns the object's broad category identifier, such as unit, weapon,
	 * static object, airbase, or scenery.
	 *
	 * @returns Numeric category from `Object.Category`.
	 *
	 * @example
	 * ```ts
	 * const unit = Unit.getByName("Target");
	 * if (unit) env.info(`Object category: ${unit.getCategory()}`);
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCategory
	 */
	getCategory(): number;
}
