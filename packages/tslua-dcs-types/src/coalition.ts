import { l_Airbase } from "./Airbase";
import { l_Group } from "./Group";
import { _coalition } from "./exports/coalition.export";

/** @noSelf **/
export interface l_coalition extends _coalition {
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
	 * @param groupCategory
	 */
	getGroups(coalitionId: number, groupCategory?: number): l_Group[];

	/**
	 * Returns a table of airbase objects belonging to the specified coalition.
	 * Objects can be ships, static objects(FARP), or airbases on the map.
	 *
	 * When the function is run as world.getAirbases() no input values required,
	 * and the function returns all airbases, ships, and farps on the map.
	 *
	 * @param coalitionId
	 */
	getAirbases(coalitionId: number): l_Airbase[];
}
