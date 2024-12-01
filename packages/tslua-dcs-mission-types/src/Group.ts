import type { l_Controller } from "./Controller";
import type { l_Unit } from "./Unit";
import type { _Group } from "./exports/Group.export";

export interface l_Group extends _Group {
	/**
	 * Returns a number which defines the unique mission id of a given object.
	 */
	getID(): number;

	/**
	 * Returns the name of the group.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getName
	 */
	getName(): string;

	/**
	 * Returns the coalition of the group.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCoalition
	 */
	getCoalition(): number;

	/**
	 * Returns the category of the group.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCategory
	 */
	getCategory(): number;

	/**
	 * Returns the current size of the group. This value will change as units are destroyed.
	 * Can be used in combination with getUnit to not accidentally use to big a value for that function, or to access the last unit in the group.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getSize
	 */
	getSize(): number;

	/**
	 * Returns a table of unit objects indexed in unit order.
	 * Useful for getting unit specific data for every unit in the group.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getUnits
	 */
	getUnits(): l_Unit[];

	/**
	 * Returns the unit object of the specified unitIndex within the group.
	 * If the index is not valid, this function will return nil.
	 *
	 * @param index
	 */
	getUnit(index: number): l_Unit | undefined;

	/**
	 * Returns an instance of the calling class for the object of a specified name.
	 * The objects name is defined either in the mission editor or within functions that can dynamically spawn objects.
	 * All static objects and unit names must be unique.
	 * However, groups may have the same name as a unit or static object.
	 *
	 * This function can provide access to non activated units and groups.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getByName
	 *
	 * @param name
	 *
	 * @noSelf
	 */
	getByName(name: string): l_Group | undefined;

	/**
	 * Returns the controller of the specified object.
	 * Ships and ground units can only be controlled at a group level.
	 *
	 * Airplanes and helicopters can be controlled at both a group and unit level
	 */
	getController(): l_Controller;
}
