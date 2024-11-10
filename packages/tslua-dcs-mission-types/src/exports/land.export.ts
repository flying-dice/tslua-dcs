/**
 * @version 2.9.9.2474
 * @noSelf
 **/
export interface _land {
	getSurfaceType(...args: any[]): unknown;
	getIP(...args: any[]): unknown;
	findPathOnRoads(...args: any[]): unknown;
	profile(...args: any[]): unknown;
	getHeight(...args: any[]): unknown;
	SurfaceType: {
		SHALLOW_WATER: number;
		WATER: number;
		ROAD: number;
		RUNWAY: number;
		LAND: number;
	};
	getClosestPointOnRoads(...args: any[]): unknown;
	isVisible(...args: any[]): unknown;
	getSurfaceHeightWithSeabed(...args: any[]): unknown;
}
