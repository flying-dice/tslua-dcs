import { _Airbase } from "./exports/Airbase.export";
export interface IAirbase extends _Airbase {
	/**
	 * Returns the category of the airbase.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCategory
	 */
	getCategory(): number;
}
