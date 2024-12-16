/**
 * @version 2.9.10.4160
 **/
export interface _StaticObject {
	getDrawArgumentValue(...args: any[]): unknown;
	getDesc(...args: any[]): unknown;
	className_: string;
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
	getByName(...args: any[]): unknown;
	getForcesName(...args: any[]): unknown;
	chooseCargo(...args: any[]): unknown;
	tonumber(...args: any[]): unknown;
	getLife(...args: any[]): unknown;
	getName(...args: any[]): unknown;
	getID(...args: any[]): unknown;
	getCoalition(...args: any[]): unknown;
	getDescByName(...args: any[]): unknown;
	getTypeName(...args: any[]): unknown;
	getCargoWeight(...args: any[]): unknown;
	getCargoDisplayName(...args: any[]): unknown;
	getCountry(...args: any[]): unknown;
}
