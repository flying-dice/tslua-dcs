import type { _Object } from "./exports/Object.export";

export interface l_Object extends _Object {
	/**
	 * Returns the category of the object.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCategory
	 */
	getCategory(): number;
}
