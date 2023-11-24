import { _coord } from "./exports/coord.export";
/** @noSelf **/
export interface Icoord extends _coord {
	/**
	 * Returns a point from latitude and longitude in the vec3 format.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_LLtoLO
	 *
	 * @param lat
	 * @param lon
	 * @param alt
	 */
	LLtoLO(
		lat: number,
		lon: number,
		alt: number,
	): { x: number; y: number; z: number };
}
