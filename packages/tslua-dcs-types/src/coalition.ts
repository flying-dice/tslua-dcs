import { IGroup } from "./Group";
import { _coalition } from "./exports/coalition.export";

/** @noSelf **/
export interface Icoalition extends _coalition {
	/**
	 * Returns a table of group objects belonging to the specified coalition.
	 * If the groupCategory enumerator is provided the table will only contain groups that belong to the specified category.
	 * If this optional variable is not provided, all group types will be returned.
	 *
	 * See here for the list of possible group categories.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getGroups
	 *
	 * @param coalitionId
	 * @param GroupCategory
	 */
	getGroups(coalitionId: number, GroupCategory: number): IGroup[];
}
