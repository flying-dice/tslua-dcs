import type { l_Vec3 } from "./coord";
import type { _atmosphere } from "./exports/atmosphere.export";

/**
 * @see [Authoritative executable examples](https://github.com/flying-dice/tslua-dcs/blob/main/packages/tslua-dcs-mission-types_test/src/atmosphere_test.ts)
 * @noSelf
 */
export interface l_atmosphere extends _atmosphere {
	/**
	 * Returns atmospheric temperature and pressure at a world point.
	 * @param point Sample position in local DCS coordinates and metres.
	 * @returns Temperature in kelvin followed by pressure in pascals.
	 * @example `const [temperature, pressure] = atmosphere.getTemperatureAndPressure({ x: 0, y: 1000, z: 0 });`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getTemperatureAndPressure
	 */
	getTemperatureAndPressure(point: l_Vec3): LuaMultiReturn<[number, number]>;

	/**
	 * Returns the steady wind vector at a world point, excluding turbulence.
	 * @param point Sample position in local DCS coordinates and metres.
	 * @returns Wind velocity in metres per second using world axes.
	 * @example `const wind = atmosphere.getWind(unit.getPoint());`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getWind
	 */
	getWind(point: l_Vec3): l_Vec3;

	/**
	 * Returns instantaneous wind including turbulence. Points at or below terrain
	 * level return a zero vector.
	 * @param point Sample position in local DCS coordinates and metres.
	 * @returns Wind velocity in metres per second using world axes.
	 * @example `const wind = atmosphere.getWindWithTurbulence(unit.getPoint());`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getWindWithTurbulence
	 */
	getWindWithTurbulence(point: l_Vec3): l_Vec3;
}
