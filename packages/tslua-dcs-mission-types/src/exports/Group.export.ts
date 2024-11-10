/**
 * @version 2.9.9.2474
 **/
export interface _Group {
	getCategoryEx(...args: any[]): unknown;
	activate(...args: any[]): unknown;
	embarking(...args: any[]): unknown;
	isExist(...args: any[]): unknown;
	className_: string;
	parentClass_: { className_: string };
	getCategory(...args: any[]): unknown;
	enableEmission(...args: any[]): unknown;
	Category: {
		AIRPLANE: number;
		HELICOPTER: number;
		GROUND: number;
		SHIP: number;
		TRAIN: number;
	};
	markGroup(...args: any[]): unknown;
	getInitialSize(...args: any[]): unknown;
	tonumber(...args: any[]): unknown;
	getCoalition(...args: any[]): unknown;
	getController(...args: any[]): unknown;
	getSize(...args: any[]): unknown;
	getID(...args: any[]): unknown;
	destroy(...args: any[]): unknown;
	getName(...args: any[]): unknown;
	getUnits(...args: any[]): unknown;
	getByName(...args: any[]): unknown;
	getUnit(...args: any[]): unknown;
}
