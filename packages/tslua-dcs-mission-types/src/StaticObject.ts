import type { l_Position3, l_Vec3 } from "./coord";
import type { _StaticObject } from "./exports/StaticObject.export";

/**
 * @example
 * {
 *   "life": 5,
 *   "_origin": "World War II AI Units by Eagle Dynamics",
 *   "category": 4,
 *   "displayName": "Barrel",
 *   "typeName": "Beer Bomb",
 *   "box": {
 *     "min": {
 *       "y": -0.036429971456528,
 *       "x": -0.47995102405548,
 *       "z": -0.55243939161301
 *     },
 *     "max": {
 *       "y": 1.066880106926,
 *       "x": 0.47995102405548,
 *       "z": 0.55087059736252
 *     }
 *   }
 * }
 */
export type StaticObjectDesc = {
	life: number;
	attributes: Record<string, boolean>;
	_origin: string;
	category: number;
	typeName: string;
	displayName: string;
};

export interface l_StaticObject extends _StaticObject {
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
	getByName(name: string): l_StaticObject | undefined;

	/**
	 * Returns an enumerator that defines the country that an object currently belongs to
	 */
	getCountry(): number;

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
	 * Returns a Position3 table of the objects current position and orientation in 3D space.
	 * X, Y, Z values are unit vectors defining the objects orientation.
	 * Coordinates are dependent on the position of the maps origin.
	 * In the case of the Caucuses theater, the origin is located in the Crimean region of the map.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getPosition
	 */
	getPosition(): l_Position3;

	/**
	 * Returns an enumerator that defines the country that an object currently belongs to
	 */
	getCountry(): number;

	/**
	 * Returns the coalition of the Static Object.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCoalition
	 */
	getCoalition(): number;

	/**
	 * Returns the Desc table of the Static Object.
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getDesc
	 */
	getDesc(): StaticObjectDesc;
}
