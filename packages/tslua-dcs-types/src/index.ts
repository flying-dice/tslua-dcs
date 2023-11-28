import { IAI } from "./AI";
import { IAirbase } from "./Airbase";
import { IController } from "./Controller";
import { IGroup } from "./Group";
import { IStaticObject } from "./StaticObject";
import { IUnit } from "./Unit";
import { IWarehouse } from "./Warehouse";
import { IWeapon } from "./Weapon";
import { Iatmosphere } from "./atmosphere";
import { Icoalition } from "./coalition";
import { Icoord } from "./coord";
import { Ienv } from "./env";
import { Iland } from "./land";
import { ImissionCommands } from "./missionCommands";
import { Inet } from "./net";
import { Iradio } from "./radio";
import { Itimer } from "./timer";
import { Itrigger } from "./trigger";
import { Iworld } from "./world";

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
	const AI: IAI;

	/** @noSelf **/
	const Airbase: IAirbase;

	/** @noSelf **/
	const atmosphere: Iatmosphere;

	/** @noSelf **/
	const coalition: Icoalition;

	/** @noSelf **/
	const Controller: IController;

	/** @noSelf **/
	const coord: Icoord;

	/** @noSelf **/
	const env: Ienv;

	/** @noSelf **/
	const Group: IGroup;

	/** @noSelf **/
	const land: Iland;

	/** @noSelf **/
	const missionCommands: ImissionCommands;

	/** @noSelf **/
	const net: Inet;

	/** @noSelf **/
	const radio: Iradio;

	/** @noSelf **/
	const StaticObject: IStaticObject;

	/** @noSelf **/
	const timer: Itimer;

	/** @noSelf **/
	const trigger: Itrigger;

	/** @noSelf **/
	const Unit: IUnit;

	/** @noSelf **/
	const Warehouse: IWarehouse;

	/** @noSelf **/
	const Weapon: IWeapon;

	/** @noSelf **/
	const world: Iworld;
}
