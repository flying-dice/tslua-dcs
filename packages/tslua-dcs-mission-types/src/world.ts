import type { l_Airbase } from "./Airbase";
import type { _world } from "./exports/world.export";

/** @noSelf **/
export interface l_world extends _world {
	/**
	 * Returns a table of airbase objects belonging to the specified coalition.
	 * Objects can be ships, static objects(FARP), or airbases on the map.
	 *
	 * When the function is run as world.getAirbases() no input values required,
	 * and the function returns all airbases, ships, and farps on the map.
	 */
	getAirbases(): l_Airbase[];
}
