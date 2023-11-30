import { IUnit } from "./Unit";
import { _Group } from "./exports/Group.export";

export interface IGroup extends _Group {
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
	getUnits(): IUnit[];

	/**
	 * Returns the unit object of the specified unitIndex within the group.
	 * If the index is not valid, this function will return nil.
	 *
	 * @param index
	 */
	getUnit(index: number): IUnit | undefined;
}
