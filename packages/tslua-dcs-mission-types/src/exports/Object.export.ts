/**
 * @version 2.9.9.2474
 **/
export interface _Object {
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
}
