/**
 * @version 2.9.29.27468
 * @noSelf
 */
export interface _terrain {
	Create(...args: any[]): unknown;
	FindNearestPoint(...args: any[]): unknown;
	FindOptimalPath(...args: any[]): unknown;
	GetHeight(...args: any[]): unknown;
	GetMGRScoordinates(...args: any[]): unknown;
	GetSeasons(...args: any[]): unknown;
	GetSurfaceHeightWithSeabed(...args: any[]): unknown;
	GetSurfaceType(...args: any[]): unknown;
	GetTerrainConfig(...args: any[]): unknown;
	Init(...args: any[]): unknown;
	InitLight(...args: any[]): unknown;
	Release(...args: any[]): unknown;
	convertLatLonToMeters(...args: any[]): unknown;
	convertMGRStoMeters(...args: any[]): unknown;
	convertMetersToLatLon(...args: any[]): unknown;
	findPathOnRoads(...args: any[]): unknown;
	getBeacons(...args: any[]): unknown;
	getClosestPointOnRoads(...args: any[]): unknown;
	getClosestValidPoint(...args: any[]): unknown;
	getCrossParam(...args: any[]): unknown;
	getObjectPosition(...args: any[]): unknown;
	getObjectsAtMapPoint(...args: any[]): unknown;
	getRadio(...args: any[]): unknown;
	getRunwayHeading(...args: any[]): unknown;
	getRunwayList(...args: any[]): unknown;
	getStandList(...args: any[]): unknown;
	getTechSkinByDate(...args: any[]): unknown;
	getTempratureRangeByDate(...args: any[]): unknown;
	getTerrainShpare(...args: any[]): unknown;
	isVisible(...args: any[]): unknown;
}
