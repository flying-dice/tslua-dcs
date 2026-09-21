/**
 * @version 2.9.29.27468
 * @noSelf
 */
export interface _missionCommands {
	addCommand(...args: any[]): unknown;
	addCommandForCoalition(...args: any[]): unknown;
	addCommandForGroup(...args: any[]): unknown;
	addSubMenu(...args: any[]): unknown;
	addSubMenuForCoalition(...args: any[]): unknown;
	addSubMenuForGroup(...args: any[]): unknown;
	doAction(...args: any[]): unknown;
	removeItem(...args: any[]): unknown;
	removeItemForCoalition(...args: any[]): unknown;
	removeItemForGroup(...args: any[]): unknown;
}
