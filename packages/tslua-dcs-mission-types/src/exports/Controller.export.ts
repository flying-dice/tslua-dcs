/**
 * @version 2.9.29.27468
 */
export interface _Controller {
	Detection: {
		DLINK: number;
		IRST: number;
		OPTIC: number;
		RADAR: number;
		RWR: number;
		VISUAL: number;
	};
	className_: string;
	getDetectedTargets(...args: any[]): unknown;
	hasTask(...args: any[]): unknown;
	isTargetDetected(...args: any[]): unknown;
	knowTarget(...args: any[]): unknown;
	parentClass_: {
		className_: string;
	};
	popTask(...args: any[]): unknown;
	pushTask(...args: any[]): unknown;
	resetTask(...args: any[]): unknown;
	setAltitude(...args: any[]): unknown;
	setCommand(...args: any[]): unknown;
	setOnOff(...args: any[]): unknown;
	setOption(...args: any[]): unknown;
	setSpeed(...args: any[]): unknown;
	setTask(...args: any[]): unknown;
	tonumber(...args: any[]): unknown;
}
