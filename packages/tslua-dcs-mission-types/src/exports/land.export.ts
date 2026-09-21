/**
 * @version 2.9.29.27468
 * @noSelf
 */
export interface _land {
	SurfaceType: {
		LAND: number;
		ROAD: number;
		RUNWAY: number;
		SHALLOW_WATER: number;
		WATER: number;
	};
	findPathOnRoads(...args: any[]): unknown;
	getClosestPointOnRoads(...args: any[]): unknown;
	getHeight(...args: any[]): unknown;
	getIP(...args: any[]): unknown;
	getSurfaceHeightWithSeabed(...args: any[]): unknown;
	getSurfaceType(...args: any[]): unknown;
	isVisible(...args: any[]): unknown;
	profile(...args: any[]): unknown;
}
