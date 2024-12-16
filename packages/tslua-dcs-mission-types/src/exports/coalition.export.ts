/**
 * @version 2.9.10.4160
 * @noSelf
 **/
export interface _coalition {
	service: {
		AWACS: number;
		FAC: number;
		ATC: number;
		MAX: number;
		TANKER: number;
	};
	getServiceProviders(...args: any[]): unknown;
	remove_dyn_group(...args: any[]): unknown;
	getCountryCoalition(...args: any[]): unknown;
	getMainRefPoint(...args: any[]): unknown;
	getAirbases(...args: any[]): unknown;
	getRefPoints(...args: any[]): unknown;
	side: { NEUTRAL: number; BLUE: number; RED: number };
	add_dyn_group(...args: any[]): unknown;
	getDescentsOnBoard(...args: any[]): unknown;
	addRefPoint(...args: any[]): unknown;
	addGroup(...args: any[]): unknown;
	getGroups(...args: any[]): unknown;
	checkDescent(...args: any[]): unknown;
	getAllDescents(...args: any[]): unknown;
	addStaticObject(...args: any[]): unknown;
	checkChooseCargo(...args: any[]): unknown;
	getStaticObjects(...args: any[]): unknown;
	getPlayers(...args: any[]): unknown;
}
