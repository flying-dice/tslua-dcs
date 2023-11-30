import { IVec3 } from "./coord";
import { _Unit } from "./exports/Unit.export";

export interface IUnit extends _Unit {
	/**
	 * Returns a number which defines the unique mission id of a given object.
	 */
	getID(): number;

	/**
	 * Returns the name of the group.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getName
	 */
	getName(): string;

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
	 * Return a string of the objects type name.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getTypeName
	 */
	getTypeName(): string;

	/**
	 * Returns the coalition of the Unit.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCoalition
	 */
	getCoalition(): number;

	/**
	 * Returns the category of the Unit.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCategory
	 */
	getCategory(): number;
}
