import { IVec3 } from "./coord";
import { _Airbase } from "./exports/Airbase.export";

export interface IAirbase extends _Airbase {
	/**
	 * Returns a number which defines the unique mission id of a given object.
	 */
	getID(): number;

	/**
	 * Returns a vec3 table of the x, y, and z coordinates for the position of the given object in 3D space.
	 * Coordinates are dependent on the position of the maps origin.
	 *
	 * In the case of the Caucuses theater, the origin is located in the Crimean region of the map.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getPoint
	 */
	getPoint(): IVec3;

	/**
	 * Returns the name of the airbase.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getName
	 */
	getName(): string;

	/**
	 * Returns the coalition of the airbase.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCoalition
	 */
	getCoalition(): number;

	/**
	 * Returns the category of the airbase.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCategory
	 */
	getCategory(): number;
}
