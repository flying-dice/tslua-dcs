import type { _Warehouse } from "./exports/Warehouse.export";

/**
 * Warehouse inventory object containing the current inventory of a warehouse.
 *
 * Liquids are indexed by number, use LiquidType enum to access.
 *
 * @example
 * {
 *   "liquids": {
 *     1: 100000,
 *     2: 100000,
 *     3: 100000,
 *     0: 100000
 *   },
 *   "weapon": {
 *     "weapons.nurs.SNEB_TYPE253_F1B": 100,
 *     "weapons.bombs.BDU_45LGB": 100,
 *     "weapons.containers.KINGAL": 100,
 *     ...
 *   },
 *   "aircraft": {
 *     "F-16C bl.50": 100,
 *     "L-39ZA": 100,
 *     "B-17G": 100,
 *     "MiG-19P": 100,
 *     "I-16": 100,
 *     "Su-17M4": 100,
 *     "F/A-18A": 100,
 *     ...
 *   }
 * }
 */
export type WarehouseInventory = {
	liquids: Record<LiquidType, number>;
	aircraft: Record<string, number>;
	weapon: Record<string, number>;
};

export enum LiquidType {
	JETFUEL = 0,
	AVIATION_GASOLINE = 1,
	MW50 = 2,
	DIESEL = 3,
}

export interface l_Warehouse extends _Warehouse {
	/**
	 * Returns a full itemized list of everything currently in a warehouse. If a category is set to unlimited then the table will be returned empty.
	 * Aircraft and weapons are indexed by strings.
	 *
	 * Liquids are indexed by number
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getInventory
	 */
	getInventory(): WarehouseInventory;

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
	getByName(name: string): l_Warehouse | undefined;
}
