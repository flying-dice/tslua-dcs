import type { l_Controller } from "./Controller";
import type { l_Position3, l_Vec3 } from "./coord";
import type { _Unit } from "./exports/Unit.export";

/**
 * Unit Ammo table from DCS World.
 * @example
 * [
 *   {
 *     "count": 940,
 *     "desc": {
 *       "life": 2,
 *       "warhead": {
 *         "explosiveMass": 0.1,
 *         "type": 1,
 *         "caliber": 20,
 *         "mass": 0.1
 *       },
 *       "_origin": "",
 *       "category": 0,
 *       "box": {
 *         "min": {
 *           "y": -0.12504199147224,
 *           "x": -6.61008644104,
 *           "z": -0.12113920599222
 *         },
 *         "max": {
 *           "y": 0.12504191696644,
 *           "x": 2.2344591617584,
 *           "z": 0.12113922089338
 *         }
 *       },
 *       "typeName": "weapons.shells.M61_20_HE",
 *       "displayName": "20mm HE"
 *     }
 *   }
 * ]
 */
export interface UnitAmmoItem {
	count: number;
	desc: {
		life: number;
		_origin: string;
		category: number;
		typeName: string;
		displayName: string;
	};
}

/**
 * Unit Desc table from DCS World.
 * @example
 * {
 *   "speedMax0": 111.11111450195,
 *   "massEmpty": 2223,
 *   "range": 5920,
 *   "box": {
 *     "min": {
 *       "y": -2.491916179657,
 *       "x": -6.523097038269,
 *       "z": -10.887048721313
 *     },
 *     "max": {
 *       "y": 2.491916179657,
 *       "x": 6.523097038269,
 *       "z": 10.829894065857
 *     }
 *   },
 *   "Hmax": 15000,
 *   "Kmax": 0.10000000149012,
 *   "_origin": "MQ-9 Reaper AI",
 *   "speedMax10K": 111.11111450195,
 *   "NyMin": -1,
 *   "fuelMassMax": 1300,
 *   "speedMax": 111.11111450195,
 *   "NyMax": 3,
 *   "massMax": 4760,
 *   "RCS": 0.5,
 *   "displayName": "MQ-9 Reaper",
 *   "life": 18,
 *   "VyMax": 5,
 *   "Kab": 0,
 *   "attributes": {
 *     "UAVs": true,
 *     "Battle airplanes": true,
 *     "NonAndLightArmoredUnits": true,
 *     "Battleplanes": true,
 *     "NonArmoredUnits": true,
 *     "All": true,
 *     "Planes": true,
 *     "Air": true
 *   },
 *   "typeName": "MQ-9 Reaper",
 *   "category": 0
 * }
 */
export type UnitDesc = {
	massEmpty: number;
	riverCrossing: boolean;
	maxSlopeAngle: number;
	Kmax: number;
	RCS: number;
	box: { min: l_Vec3; max: l_Vec3 };
	speedMax: number;
	life: number;
	attributes: Record<string, boolean>;
	category: number;
	speedMaxOffRoad: number;
	_origin: string;
	displayName: string;
};

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
	 * Returns a vec3 table of the objects velocity vectors.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getVelocity
	 */
	getVelocity(): l_Vec3;

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

	// Original Methods from l_Unit that need committing back to @flying-dice/tslua-dcs-mission-types
	/**
	 * Return a description table of the given object.
	 * Table entries are dependent on the category of object and the sub-categories that may exist within that object type.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getDesc
	 */
	getDesc(): UnitDesc;

	/**
	 * Returns an ammo table for all types of loaded ammunition on a given object.
	 * Ammo table is indexed by ammo type and contains a weapon description table and a count variable defining "how much" is on board.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getAmmo
	 */
	getAmmo(): UnitAmmoItem[] | undefined;

	/**
	 * Returns a boolean value if the unit is activated. Units set to late activation would return false if checked by this function.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_isActive
	 */
	isActive(): boolean;

	/**
	 * Returns the current "life" of a unit. Also referred to as "hit points".
	 * All units in DCS have a value that defines how much life is left.
	 * If this value is less than 1 the unit is considered "dead".
	 * Ground and ship units that are on fire and in the process of "cooking off" will return a life value of 0 until the object explodes.
	 * Aircraft are more complex due to sub-systems and damage models which will effect the life value.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getLife
	 */
	getLife(): number;

	/**
	 * Returns the initial life value of a unit. All units spawn with "max HP" and this value will never change.
	 * Can be used with Unit.getLife() to determine the percentage of a units life as each unit has a unique life value.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getLife0
	 */
	getLife0(): number;
}
