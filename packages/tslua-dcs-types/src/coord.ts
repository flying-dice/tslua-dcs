import { _coord } from "./exports/coord.export";
/** @noSelf **/
export interface Icoord extends _coord {
	/**
	 * Returns multiple values of a given vec3 point in latitude, longitude, and altitude
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_LOtoLL
	 * @tupleReturn
	 */
	LOtoLL(vec3: IVec3): [number, number, number];

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

/**
 * DCS world has 3-dimensional coordinate system. DCS ground is an infinite plain.
 *
 * Main axes:
 *
 * x is directed to the north
 * z is directed to the east
 * y is directed up
 *
 * Vec3 type is a 3D-vector. It is a table that has the following format:
 *
 *  {
 *    x: number,
 *    y: number,
 *    z: number
 *  }
 *
 * @see https://www.digitalcombatsimulator.com/en/support/faq/1256/
 */
/** @noSelf **/
export interface IVec3 {
	x: number;
	y: number;
	z: number;
}
