import { l_Vec2 } from "./coord";
import { _land } from "./exports/land.export";

/** @noSelf **/
export interface l_land extends _land {
	/**
	 * Returns the distance from sea level (y-axis) of a given vec2 point.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getHeight
	 * @param point The point to get the height of.
	 * @returns The height of the point.
	 */
	getHeight(point: l_Vec2): number;

	/**
	 * Returns the X and Y values of a coordinate on the nearest road from the given point.
	 * NOTE that this function does not use vec2 or vec3. It uses individual values representing a vec2 for x and y.
	 *
	 * Valid road type values: 'roads' and 'railroads'
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getClosestPointOnRoads
	 *
	 * @param roadType {"roads" | "railroads"} The type of road to get the closest point from.
	 * @param x {number} The X value of the point to get the closest road point from.
	 * @param y {number} The Y value of the point to get the closest road point from.
	 */
	getClosestPointOnRoads(
		roadType: "roads" | "railroads",
		x: number,
		y: number,
	): LuaMultiReturn<[number, number]>;
}
