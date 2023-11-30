import { _Group } from "./exports/Group.export";
/** @noSelf **/
export interface IGroup extends _Group {
	/**
	 * Returns the category of the group.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCategory
	 */
	getCategory(): number;
}
