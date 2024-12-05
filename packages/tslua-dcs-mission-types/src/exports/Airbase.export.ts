/**
 * @version 2.9.10.3948
 **/
export interface _Airbase {
	getWarehouse(...args: any[]): unknown;
	className_: string;
	autoCaptureIsOn(...args: any[]): unknown;
	getParking(...args: any[]): unknown;
	getCategory(...args: any[]): unknown;
	Category: { AIRDROME: number; HELIPAD: number; SHIP: number };
	getForcesName(...args: any[]): unknown;
	getNearest(...args: any[]): unknown;
	getCategoryEx(...args: any[]): unknown;
	getID(...args: any[]): unknown;
	setCoalition(...args: any[]): unknown;
	getDesc(...args: any[]): unknown;
	getCallsign(...args: any[]): unknown;
	setRadioSilentMode(...args: any[]): unknown;
	parentClass_: {
		isExist(...args: any[]): unknown;
		className_: string;
		parentClass_: { className_: string };
		getCategory(...args: any[]): unknown;
		cancelChoosingCargo(...args: any[]): unknown;
		database_: { getCategoryEx(...args: any[]): unknown };
		Category: {
			VOID: number;
			SCENERY: number;
			BASE: number;
			CARGO: number;
			UNIT: number;
			STATIC: number;
			WEAPON: number;
		};
		hasAttribute(...args: any[]): unknown;
		destroy(...args: any[]): unknown;
		getAttributes(...args: any[]): unknown;
		tonumber(...args: any[]): unknown;
		getName(...args: any[]): unknown;
		getPoint(...args: any[]): unknown;
		getPosition(...args: any[]): unknown;
		getVelocity(...args: any[]): unknown;
		inAir(...args: any[]): unknown;
		getTypeName(...args: any[]): unknown;
	};
	autoCapture(...args: any[]): unknown;
	tonumber(...args: any[]): unknown;
	getCommunicator(...args: any[]): unknown;
	getRunways(...args: any[]): unknown;
	getWorldID(...args: any[]): unknown;
	getDescByName(...args: any[]): unknown;
	getName(...args: any[]): unknown;
	getDispatcherTowerPos(...args: any[]): unknown;
	getRadioSilentMode(...args: any[]): unknown;
	getByName(...args: any[]): unknown;
	getLife(...args: any[]): unknown;
	getTypeName(...args: any[]): unknown;
	getCoalition(...args: any[]): unknown;
	getCountry(...args: any[]): unknown;
	getUnit(...args: any[]): unknown;
}
