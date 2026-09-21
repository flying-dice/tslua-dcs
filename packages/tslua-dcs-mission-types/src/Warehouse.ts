import type { l_Object } from "./Object";
import type { l_StaticObject } from "./StaticObject";
import type { _Warehouse } from "./exports/Warehouse.export";

/**
 * Internal type name or four-level DCS wsType identifier.
 */
export type WarehouseItem = string | [number, number, number, number];

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
	/**
	 * Liquid quantities keyed by `LiquidType`.
	 */
	liquids: Record<LiquidType, number>;
	/**
	 * Available aircraft counts keyed by internal type name.
	 */
	aircraft: Record<string, number>;
	/**
	 * Available weapon counts keyed by internal type name.
	 */
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
	 * Adds an item quantity to finite warehouse stock.
	 *
	 * @param item Internal type name or wsType.
	 * @param count Quantity to add.
	 * @returns Nothing.
	 * @example `warehouse.addItem("weapons.bombs.GBU_31", 4);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_addItem
	 */
	addItem(item: WarehouseItem, count: number): void;

	/**
	 * Adds liquid stock.
	 *
	 * @param liquid Value from `LiquidType`.
	 * @param amount Quantity to add.
	 * @returns Nothing.
	 * @example `warehouse.addLiquid(LiquidType.JETFUEL, 1000);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_addLiquid
	 */
	addLiquid(liquid: LiquidType, amount: number): void;

	/**
	 * Returns the warehouse embedded in a cargo static object.
	 *
	 * @param cargo Cargo static.
	 * @returns Embedded warehouse, or `undefined` when the cargo has none.
	 * @example `const cargoWarehouse = Warehouse.getCargoAsWarehouse(cargo);`
	 * @noSelf
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCargoAsWarehouse
	 */
	getCargoAsWarehouse(cargo: l_StaticObject): l_Warehouse | undefined;

	/**
	 * Returns current stock for one item.
	 *
	 * @param item Internal type name or wsType.
	 * @returns Available count.
	 * @example `const count = warehouse.getItemCount("weapons.bombs.GBU_31");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getItemCount
	 */
	getItemCount(item: WarehouseItem): number;

	/**
	 * Returns the current amount of a liquid.
	 *
	 * @param liquid Value from `LiquidType`.
	 * @returns Available quantity.
	 * @example `const fuel = warehouse.getLiquidAmount(LiquidType.JETFUEL);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getLiquidAmount
	 */
	getLiquidAmount(liquid: LiquidType): number;

	/**
	 * Returns the airbase, carrier, FARP, or cargo object owning the warehouse.
	 *
	 * @returns Owning object.
	 * @example `const ownerName = warehouse.getOwner().getName();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getOwner
	 */
	getOwner(): l_Object;

	/**
	 * Returns DCS's resource-name mapping used by warehouse APIs.
	 *
	 * @returns Resource metadata keyed by internal name.
	 * @example `const resources = Warehouse.getResourceMap();`
	 * @noSelf
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getResourceMap
	 */
	getResourceMap(): Record<string, unknown>;

	/**
	 * Removes an item quantity from finite stock.
	 *
	 * @param item Internal type name or wsType.
	 * @param count Quantity to remove.
	 * @returns Nothing.
	 * @example `warehouse.removeItem("weapons.bombs.GBU_31", 1);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_removeItemWarehouse
	 */
	removeItem(item: WarehouseItem, count: number): void;

	/**
	 * Removes liquid stock.
	 *
	 * @param liquid Value from `LiquidType`.
	 * @param amount Quantity to remove.
	 * @returns Nothing.
	 * @example `warehouse.removeLiquid(LiquidType.JETFUEL, 500);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_removeLiquid
	 */
	removeLiquid(liquid: LiquidType, amount: number): void;

	/**
	 * Sets an item's finite stock directly.
	 *
	 * @param item Internal type name or wsType.
	 * @param count New quantity.
	 * @returns Nothing.
	 * @example `warehouse.setItem("weapons.bombs.GBU_31", 20);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setItem
	 */
	setItem(item: WarehouseItem, count: number): void;

	/**
	 * Sets a liquid quantity directly.
	 *
	 * @param liquid Value from `LiquidType`.
	 * @param amount New quantity.
	 * @returns Nothing.
	 * @example `warehouse.setLiquidAmount(LiquidType.JETFUEL, 100000);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setLiquidAmount
	 */
	setLiquidAmount(liquid: LiquidType, amount: number): void;

	/**
	 * Returns the warehouse's current liquid, aircraft, and weapon inventory.
	 * A category configured as unlimited is represented by an empty table rather
	 * than an infinite numeric count.
	 *
	 * @returns Snapshot of the current inventory.
	 * @example
	 * ```ts
	 * const inventory = Airbase.getByName("Batumi")?.getWarehouse().getInventory();
	 * if (inventory) env.info(`F-16s available: ${inventory.aircraft["F-16C_50"] ?? 0}`);
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getInventory
	 */
	getInventory(): WarehouseInventory;

	/**
	 * Looks up a warehouse by the name of its associated airbase, FARP, carrier,
	 * or warehouse-capable object.
	 *
	 * Some DCS builds return `undefined` for an airbase name even though retrieving
	 * the same warehouse from `Airbase.getByName(name)?.getWarehouse()` succeeds.
	 * Prefer the Airbase instance path when the owner is known to be an airbase.
	 *
	 * @param name Exact warehouse-owning object name.
	 * @returns Matching warehouse, or `undefined` when no warehouse is available.
	 * @example
	 * ```ts
	 * const name = "Anapa-Vityazevo";
	 * const warehouse =
	 * 	Warehouse.getByName(name) ?? Airbase.getByName(name)?.getWarehouse();
	 * ```
	 *
	 * @noSelf
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getByName
	 * @see https://wiki.hoggitworld.com/view/DCS_Class_Warehouse
	 */
	getByName(name: string): l_Warehouse | undefined;
}
