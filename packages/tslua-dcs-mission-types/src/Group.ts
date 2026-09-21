import type { l_Controller } from "./Controller";
import type { l_Unit } from "./Unit";
import type { _Group } from "./exports/Group.export";

export interface l_Group extends _Group {
	/**
	 * Returns the engine's extended group category.
	 *
	 * @example `const category = group.getCategoryEx();`
	 */
	getCategoryEx(): number;
	/**
	 * TODO: troop-embarkation payload is an undocumented engine-native structure. This explicit override prevents an `any[]` API.
	 */
	embarking(...arguments_: unknown[]): unknown;
	/**
	 * TODO: engine-native group marking contract is absent from installed Lua sources and Hoggit.
	 */
	markGroup(...arguments_: unknown[]): unknown;
	/**
	 * Activates a late-activation group and inserts its units into the simulation.
	 *
	 * @returns Nothing.
	 * @example `Group.getByName("Reinforcements")?.activate();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_activate
	 */
	activate(): void;

	/**
	 * Destroys the group and all of its units.
	 *
	 * @returns Nothing.
	 * @example `Group.getByName("Convoy")?.destroy();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_destroy
	 */
	destroy(): void;

	/**
	 * Enables or disables supported sensor emissions for the group.
	 *
	 * @param enabled Desired emission state.
	 * @returns Nothing.
	 * @example `group.enableEmission(false);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_enableEmission
	 */
	enableEmission(enabled: boolean): void;

	/**
	 * Returns the group's runtime mission identifier. The ID is suitable for APIs
	 * such as `trigger.action.addOtherCommandForGroup`, but should not be treated
	 * as a stable identifier across separate mission runs.
	 *
	 * @returns Numeric runtime group ID.
	 *
	 * @example
	 * ```ts
	 * const group = Group.getByName("Springfield 1");
	 * if (group) env.info(`Group ID: ${group.getID()}`);
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getID
	 */
	getID(): number;

	/**
	 * Returns the group's mission name as assigned in the Mission Editor or when
	 * the group was spawned dynamically.
	 *
	 * @returns Group name.
	 *
	 * @example
	 * ```ts
	 * const name = Group.getByName("Springfield 1")?.getName();
	 * if (name) env.info(name);
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getName
	 */
	getName(): string;

	/**
	 * Returns the coalition that currently owns the group. Compare the result
	 * with `coalition.side.NEUTRAL`, `RED`, or `BLUE` rather than relying on the
	 * underlying numeric values.
	 *
	 * @returns Coalition identifier from `coalition.side`.
	 *
	 * @example
	 * ```ts
	 * const group = Group.getByName("Springfield 1");
	 * if (group?.getCoalition() === coalition.side.BLUE) {
	 * 	env.info("Springfield 1 belongs to blue");
	 * }
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCoalition
	 */
	getCoalition(): number;

	/**
	 * Returns the group's platform category, such as airplane, helicopter,
	 * ground, or ship.
	 *
	 * @returns Category identifier from `Group.Category`.
	 *
	 * @example
	 * ```ts
	 * const group = Group.getByName("Convoy");
	 * if (group?.getCategory() === Group.Category.GROUND) env.info("Ground group");
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCategory
	 */
	getCategory(): number;

	/**
	 * Returns the number of units currently present in the group. The value falls
	 * as units are destroyed and may therefore be lower than the initial size.
	 *
	 * @returns Current unit count.
	 *
	 * @example
	 * ```ts
	 * const group = Group.getByName("Convoy");
	 * if (group) env.info(`${group.getSize()} vehicles remain`);
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getSize
	 */
	getSize(): number;

	/**
	 * Returns the number of units with which the group was created. Unlike `getSize`, this does not fall as units are destroyed.
	 *
	 * @returns Initial unit count.
	 * @example `const losses = group.getInitialSize() - group.getSize();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getInitialSize
	 */
	getInitialSize(): number;

	/**
	 * Returns the group's surviving units in their current group order.
	 *
	 * @returns Array of unit objects. An empty array indicates no remaining units.
	 *
	 * @example
	 * ```ts
	 * const group = Group.getByName("Convoy");
	 * for (const unit of group?.getUnits() ?? []) env.info(unit.getName());
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getUnits
	 */
	getUnits(): l_Unit[];

	/**
	 * Returns the unit at a one-based Lua group index. DCS returns `nil` when the
	 * index is outside the group's current range.
	 *
	 * @param index One-based unit index between `1` and `getSize()`.
	 * @returns Unit at the requested index, or `undefined` when it does not exist.
	 *
	 * @example
	 * ```ts
	 * const lead = Group.getByName("Springfield 1")?.getUnit(1);
	 * if (lead) env.info(`Lead unit: ${lead.getName()}`);
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getUnit
	 */
	getUnit(index: number): l_Unit | undefined;

	/**
	 * Looks up a group by its exact mission name. The function can return groups
	 * configured for late activation, and returns `nil` when no matching group is
	 * known to the mission.
	 *
	 * @param name Exact Mission Editor or dynamically assigned group name.
	 * @returns Matching group object, or `undefined` when not found.
	 *
	 * @example
	 * ```ts
	 * const group = Group.getByName("Springfield 1");
	 * if (!group) env.warning("Springfield 1 was not found");
	 * ```
	 *
	 * @noSelf
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getByName
	 */
	getByName(name: string): l_Group | undefined;

	/**
	 * Returns the AI controller used to assign tasks and commands to the group.
	 * Ships and ground units are controlled at group level; aircraft may also
	 * expose unit-level controllers.
	 *
	 * @returns Group controller.
	 *
	 * @example
	 * ```ts
	 * const group = Group.getByName("CAP");
	 * if (group) group.getController().setOnOff(true);
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getController
	 */
	getController(): l_Controller;

	/**
	 * Reports whether the group still exists.
	 *
	 * @returns Existence state.
	 * @example `if (group.isExist()) env.info(group.getName());`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_isExist
	 */
	isExist(): boolean;
}
