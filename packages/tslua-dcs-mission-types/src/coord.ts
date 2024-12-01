import type { _coord } from "./exports/coord.export";
/** @noSelf **/
export interface l_coord extends _coord {
	/**
	 * Returns multiple values of a given vec3 point in latitude, longitude, and altitude
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_LOtoLL
	 */
	LOtoLL(vec3: l_Vec3): LuaMultiReturn<[number, number, number]>;

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
 * @noSelf
 */
export interface l_Vec3 {
	x: number;
	y: number;
	z: number;
}

/**
 * Vec2 is a 2D-vector for the ground plane as a reference plane.
 *
 *  {
 *    x: number,
 *    y: number
 *  }
 *
 *  To get a Vec2 from a Vec3, use the following transformation:
 *  l_Vec2.x = l_Vec3.x
 *  l_Vec2.y = l_Vec3.z
 *
 * @see https://www.digitalcombatsimulator.com/en/support/faq/1256/
 * @noSelf
 */
export interface l_Vec2 {
	x: number;
	y: number;
}

/**
 * Position is a composite structure. It consists of both coordinate vector and orientation matrix.
 *
 * Position3 (also known as "Pos3" for short) is a table that has the following format:
 * {
 * 	p: l_Vec3,
 *  x: l_Vec3,
 *  y: l_Vec3,
 *  z: l_Vec3
 * }
 *
 * @see https://www.digitalcombatsimulator.com/en/support/faq/1256/
 * @noSelf
 */
export interface l_Position3 {
	p: l_Vec3;
	x: l_Vec3;
	y: l_Vec3;
	z: l_Vec3;
}
