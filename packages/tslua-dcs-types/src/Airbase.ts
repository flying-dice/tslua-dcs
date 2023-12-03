import { l_Warehouse } from "./Warehouse";
import { l_Vec3 } from "./coord";
import { _Airbase } from "./exports/Airbase.export";

export interface l_Airbase extends _Airbase {
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
	getPoint(): l_Vec3;

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

	/**
	 * Returns the warehouse object associated with the airbase object.
	 * Can then be used to call the warehouse class functions to modify the contents of the warehouse.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getWarehouse
	 */
	getWarehouse(): l_Warehouse;

	/**
	 * Returns an instance of the calling class for the object of a specified name.
	 * The objects name is defined either in the mission editor or within functions that can dynamically spawn objects.
	 * All static objects and unit names must be unique.
	 * However, groups may have the same name as a unit or static object.
	 *
	 * This function can provide access to non activated units and groups.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getByName
	 *
	 * @param name
	 *
	 * @noSelf
	 */
	getByName(name: string): l_Airbase | undefined;

	/**
	 * Returns an enumerator that defines the country that an object currently belongs to
	 */
	getCountry(): number;
}
