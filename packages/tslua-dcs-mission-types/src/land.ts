import type { l_Vec2, l_Vec3 } from "./coord";
import type { _land } from "./exports/land.export";

/**
 * @see [Authoritative executable examples](https://github.com/flying-dice/tslua-dcs/blob/main/packages/tslua-dcs-mission-types_test/src/land_test.ts)
 * @noSelf
 */
export interface l_land extends _land {
	/**
	 * Finds a route through the map road or rail network. DCS currently expects `"rails"` for rail routes, unlike `getClosestPointOnRoads`.
	 *
	 * @param roadType Network to follow.
	 * @param x Start X/north coordinate.
	 * @param y Start Y/east coordinate.
	 * @param destinationX Destination X/north.
	 * @param destinationY Destination Y/east.
	 * @returns Ordered route points.
	 * @example `const route = land.findPathOnRoads("roads", 0, 0, 10000, 10000);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_findPathOnRoads
	 */
	findPathOnRoads(
		roadType: "roads" | "rails",
		x: number,
		y: number,
		destinationX: number,
		destinationY: number,
	): l_Vec2[];

	/**
	 * Returns the distance from sea level (y-axis) of a given vec2 point.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getHeight
	 * @param point Ground-plane coordinate where `x` is north and `y` is east.
	 * @returns Terrain elevation above sea level in metres.
	 * @example
	 * ```ts
	 * const elevation = land.getHeight({ x: 1000, y: 2000 });
	 * env.info(`Terrain elevation: ${elevation} m`);
	 * ```
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
	 * @param roadType Network to search: paved/unpaved roads or railways.
	 * @param x Local X/north coordinate in metres.
	 * @param y Local Y/east ground-plane coordinate (world Z) in metres.
	 * @returns X/north and Y/east coordinates of the nearest network point.
	 * @example
	 * ```ts
	 * const [roadX, roadY] = land.getClosestPointOnRoads("roads", 1000, 2000);
	 * ```
	 */
	getClosestPointOnRoads(
		roadType: "roads" | "railroads",
		x: number,
		y: number,
	): LuaMultiReturn<[number, number]>;

	/**
	 * Traces a ray against terrain.
	 *
	 * @param origin Ray origin.
	 * @param direction Normalized direction.
	 * @param distance Maximum trace distance in metres.
	 * @returns Intersection point, or `undefined` when no terrain is hit.
	 * @example `const impact = land.getIP(weapon.getPoint(), weapon.getPosition().x, 20000);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getIP
	 */
	getIP(
		origin: l_Vec3,
		direction: l_Vec3,
		distance: number,
	): l_Vec3 | undefined;

	/**
	 * Returns surface elevation and water depth, both positive.
	 *
	 * @param point Ground-plane coordinate.
	 * @returns Surface elevation then seabed depth in metres.
	 * @example `const [elevation, depth] = land.getSurfaceHeightWithSeabed(point);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getSurfaceHeightWithSeabed
	 */
	getSurfaceHeightWithSeabed(point: l_Vec2): LuaMultiReturn<[number, number]>;

	/**
	 * Returns the terrain classification at a point.
	 *
	 * @param point Ground-plane coordinate.
	 * @returns Value from `land.SurfaceType`.
	 * @example `const isWater = land.getSurfaceType(point) === land.SurfaceType.WATER;`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getSurfaceType
	 */
	getSurfaceType(point: l_Vec2): number;

	/**
	 * Tests terrain-only line of sight. Buildings and other objects do not block this trace.
	 *
	 * @param origin Start point; offset ground objects upward to avoid clipping terrain.
	 * @param destination End point.
	 * @returns `true` when terrain does not obstruct the line.
	 * @example `const visible = land.isVisible(observer, target);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_isVisible
	 */
	isVisible(origin: l_Vec3, destination: l_Vec3): boolean;

	/**
	 * Samples the terrain profile between two points.
	 *
	 * @param origin Start point.
	 * @param destination End point.
	 * @returns Ordered terrain-profile points.
	 * @example `const profile = land.profile(start, finish);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_profile
	 */
	profile(origin: l_Vec3, destination: l_Vec3): l_Vec3[];
}
