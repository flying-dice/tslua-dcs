/**
 * @version 2.9.29.27468
 * @noSelf
 */
export interface _coalition {
	addGroup(...args: any[]): unknown;
	addRefPoint(...args: any[]): unknown;
	addStaticObject(...args: any[]): unknown;
	add_dyn_group(...args: any[]): unknown;
	checkChooseCargo(...args: any[]): unknown;
	checkDescent(...args: any[]): unknown;
	getAirbases(...args: any[]): unknown;
	getAllDescents(...args: any[]): unknown;
	getCountryCoalition(...args: any[]): unknown;
	getDescentsOnBoard(...args: any[]): unknown;
	getGroups(...args: any[]): unknown;
	getMainRefPoint(...args: any[]): unknown;
	getPlayers(...args: any[]): unknown;
	getRefPoints(...args: any[]): unknown;
	getServiceProviders(...args: any[]): unknown;
	getStaticObjects(...args: any[]): unknown;
	remove_dyn_group(...args: any[]): unknown;
	service: {
		ATC: number;
		AWACS: number;
		FAC: number;
		MAX: number;
		TANKER: number;
	};
	side: {
		BLUE: number;
		NEUTRAL: number;
		RED: number;
	};
}
