import { l_Controller } from "./Controller";
import { IVec3 } from "./coord";
import { _Unit } from "./exports/Unit.export";

export interface l_Unit extends _Unit {
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
	getByName(name: string): l_Unit | undefined;

	/**
	 * Returns the controller of the specified object.
	 * Ships and ground units can only be controlled at a group level.
	 *
	 * Airplanes and helicopters can be controlled at both a group and unit level
	 */
	getController(): l_Controller;

	/**
	 * Returns an enumerator that defines the country that an object currently belongs to
	 */
	getCountry(): number;

	/**
	 * Returns a percentage of the current fuel remaining in an aircraft's inventory based on the maximum possible fuel load.
	 * Value ranges from 0.00 to 1.00. If external fuel tanks are present the value may display above 1.0. Fuel is always drained from the external tanks before moving to internal tanks.
	 * Ground vehicles and ships will always return a value of 1.
	 */
	getFuel(): number;
}
