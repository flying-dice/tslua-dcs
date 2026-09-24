/** @noSelfInFile */

/**
 * The doubles' model of the Caucasus theatre: a flat-earth projection and a simple, deterministic
 * landscape. It is not DCS's projection; it is exact and invertible, so round trips compare equal.
 *
 * - Local X points north and local Y (Export's Z) east, in metres, from `ORIGIN` (41.6103 N,
 *   41.5997 E, near Kobuleti) at `x = ORIGIN_X`, `y = ORIGIN_Y`.
 * - Land rises 1 m per km northwards from 18 m at the origin's latitude; everything west of
 *   `COAST_Y` is the Black Sea (height 0, depth 50 m).
 * - A road runs north-south along `y = ROAD_Y` and a railway along `y = RAIL_Y`; a point is on
 *   the road within `ROAD_HALF_WIDTH` metres of it.
 */

export const ORIGIN = { latitude: 41.6103, longitude: 41.5997 };
export const ORIGIN_X = -317948;
export const ORIGIN_Y = 636639;
export const METRES_PER_DEGREE = 111320;
export const COAST_Y = 630000;
export const ROAD_Y = 640000;
export const RAIL_Y = 641000;
export const ROAD_HALF_WIDTH = 5;
export const SEA_DEPTH = 50;

const cosine = math.cos(math.rad(ORIGIN.latitude));

export function geoToLocal(
	latitude: number,
	longitude: number,
): LuaMultiReturn<[number, number]> {
	return $multi(
		ORIGIN_X + (latitude - ORIGIN.latitude) * METRES_PER_DEGREE,
		ORIGIN_Y + (longitude - ORIGIN.longitude) * METRES_PER_DEGREE * cosine,
	);
}

export function localToGeo(
	x: number,
	y: number,
): LuaMultiReturn<[number, number]> {
	return $multi(
		ORIGIN.latitude + (x - ORIGIN_X) / METRES_PER_DEGREE,
		ORIGIN.longitude + (y - ORIGIN_Y) / (METRES_PER_DEGREE * cosine),
	);
}

export function isSea(_x: number, y: number): boolean {
	return y < COAST_Y;
}

/** Terrain elevation in metres (0 over the sea). */
export function heightAt(x: number, y: number): number {
	if (isSea(x, y)) return 0;
	return math.max(18 + (x - ORIGIN_X) / 1000, 1);
}
