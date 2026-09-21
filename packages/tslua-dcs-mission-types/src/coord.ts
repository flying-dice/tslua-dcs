import type { _coord } from "./exports/coord.export";
/**
 * @see [Authoritative executable examples](https://github.com/flying-dice/tslua-dcs/blob/main/packages/tslua-dcs-mission-types_test/src/coord_test.ts)
 * @noSelf
 */
export interface l_coord extends _coord {
	/**
	 * Converts local DCS coordinates to geographic coordinates.
	 *
	 * @param vec3 Local point in metres. `x` is north, `z` is east, and `y` is altitude.
	 * @returns Latitude in degrees, longitude in degrees, and altitude in metres.
	 * @example
	 * ```ts
	 * const [latitude, longitude, altitude] = coord.LOtoLL(unit.getPoint());
	 * env.info(`${latitude}, ${longitude}, ${altitude} m`);
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_LOtoLL
	 */
	LOtoLL(vec3: l_Vec3): LuaMultiReturn<[number, number, number]>;

	/**
	 * Converts geographic coordinates to a local DCS world point.
	 *
	 * @param lat Latitude in decimal degrees.
	 * @param lon Longitude in decimal degrees.
	 * @param alt Altitude in metres.
	 * @returns Local point in DCS coordinates.
	 * @example
	 * ```ts
	 * const point = coord.LLtoLO(41.6103, 41.5997, 0);
	 * trigger.action.smoke(point, trigger.smokeColor.Green);
	 * ```
	 * @see https://wiki.hoggitworld.com/view/DCS_func_LLtoLO
	 */
	LLtoLO(
		lat: number,
		lon: number,
		alt: number,
	): { x: number; y: number; z: number };

	/**
	 * Converts latitude and longitude into a Military Grid Reference System value.
	 *
	 * @param lat Latitude in decimal degrees.
	 * @param lon Longitude in decimal degrees.
	 * @returns Structured MGRS coordinate.
	 * @example `const grid = coord.LLtoMGRS(41.6103, 41.5997);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_LLtoMGRS
	 */
	LLtoMGRS(lat: number, lon: number): l_MGRS;

	/**
	 * Converts a structured MGRS coordinate to geographic coordinates.
	 * DCS returns two Lua values; unlike `LOtoLL`, it does not return altitude.
	 *
	 * @param mgrs MGRS coordinate to convert.
	 * @returns Latitude and longitude in decimal degrees.
	 * @example
	 * ```ts
	 * const grid = coord.LLtoMGRS(41.6103, 41.5997);
	 * const [latitude, longitude] = coord.MGRStoLL(grid);
	 * env.info(`${latitude}, ${longitude}`);
	 * ```
	 * @see https://wiki.hoggitworld.com/view/DCS_func_MGRStoLL
	 */
	MGRStoLL(mgrs: l_MGRS): LuaMultiReturn<[number, number]>;
}

/**
 * Represents an MGRS (Military Grid Reference System) point.
 *
 * - 4Q ......................GZD only, precision level 6° × 8° (in most cases)
 * - 4Q FJ ...................GZD and 100 km Grid Square ID, precision level 100 km
 * - 4Q FJ 1 6 ...............precision level 10 km
 * - 4Q FJ 12 67 .............precision level 1 km
 * - 4Q FJ 123 678 ...........precision level 100 m
 * - 4Q FJ 1234 6789 .........precision level 10 m
 * - 4Q FJ 12345 67890 .......precision level 1 m
 *
 * @see https://www.digitalcombatsimulator.com/en/support/faq/1256/
 * @noSelf
 */
export interface l_MGRS {
	/**
	 * Easting value of the MGRS point.
	 */
	Easting: number;
	/**
	 * MGRS digraph (grid square identifier).
	 */
	MGRSDigraph: string;
	/**
	 * Northing value of the MGRS point.
	 */
	Northing: number;
	/**
	 * UTM zone of the MGRS point.
	 */
	UTMZone: string;
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
