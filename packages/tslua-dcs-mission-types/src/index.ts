import type { l_AI } from "./AI";
import type { l_Airbase } from "./Airbase";
import type { l_Controller } from "./Controller";
import type { l_Group } from "./Group";
import type { l_StaticObject } from "./StaticObject";
import type { l_Unit } from "./Unit";
import type { l_Warehouse } from "./Warehouse";
import type { l_Weapon } from "./Weapon";
import type { l_atmosphere } from "./atmosphere";
import type { l_coalition } from "./coalition";
import type { l_coord } from "./coord";
import type { l_env } from "./env";
import type { l_land } from "./land";
import type { l_missionCommands } from "./missionCommands";
import type { l_net } from "./net";
import type { l_radio } from "./radio";
import type { l_timer } from "./timer";
import type { l_trigger } from "./trigger";
import type { l_world } from "./world";

export * from "./AI";
export * from "./Airbase";
export * from "./atmosphere";
export * from "./coalition";
export * from "./Controller";
export * from "./coord";
export * from "./env";
export * from "./Group";
export * from "./index";
export * from "./land";
export * from "./missionCommands";
export * from "./Object";
export * from "./radio";
export * from "./StaticObject";
export * from "./timer";
export * from "./trigger";
export * from "./Unit";
export * from "./Warehouse";
export * from "./Weapon";
export * from "./world";

declare global {
	const _APP_VERSION: string;
	const _ARCHITECTURE: string;

	/** @noSelf **/
	const AI: l_AI;

	/** @noSelf **/
	const Airbase: Pick<l_Airbase, "getByName" | "getDescByName" | "Category">;

	/** @noSelf **/
	const atmosphere: l_atmosphere;

	/** @noSelf **/
	const coalition: l_coalition;

	/** @noSelf **/
	const Controller: l_Controller;

	/** @noSelf **/
	const coord: l_coord;

	/** @noSelf **/
	const env: l_env;

	/** @noSelf **/
	const Group: Pick<l_Group, "getByName" | "Category">;

	/** @noSelf **/
	const land: l_land;

	/** @noSelf **/
	const missionCommands: l_missionCommands;

	/** @noSelf **/
	const net: l_net;

	/** @noSelf **/
	const radio: l_radio;

	/** @noSelf **/
	const StaticObject: Pick<l_StaticObject, "getByName" | "getDescByName">;

	/** @noSelf **/
	const timer: l_timer;

	/** @noSelf **/
	const trigger: l_trigger;

	/** @noSelf **/
	const Unit: Pick<l_Unit, "getByName" | "getDescByName" | "Category">;

	/** @noSelf **/
	const Warehouse: Pick<l_Warehouse, "getByName" | "getResourceMap">;

	/** @noSelf **/
	const Weapon: l_Weapon;

	/** @noSelf **/
	const world: l_world;
}
