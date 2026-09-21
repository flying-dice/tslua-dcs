/**
 * @version 2.9.29.27468
 */
export interface _Group {
	Category: {
		AIRPLANE: number;
		GROUND: number;
		HELICOPTER: number;
		SHIP: number;
		TRAIN: number;
	};
	activate(...args: any[]): unknown;
	className_: string;
	destroy(...args: any[]): unknown;
	embarking(...args: any[]): unknown;
	enableEmission(...args: any[]): unknown;
	getByName(...args: any[]): unknown;
	getCategory(...args: any[]): unknown;
	getCategoryEx(...args: any[]): unknown;
	getCoalition(...args: any[]): unknown;
	getController(...args: any[]): unknown;
	getID(...args: any[]): unknown;
	getInitialSize(...args: any[]): unknown;
	getName(...args: any[]): unknown;
	getSize(...args: any[]): unknown;
	getUnit(...args: any[]): unknown;
	getUnits(...args: any[]): unknown;
	isExist(...args: any[]): unknown;
	markGroup(...args: any[]): unknown;
	parentClass_: {
		className_: string;
	};
	tonumber(...args: any[]): unknown;
}
