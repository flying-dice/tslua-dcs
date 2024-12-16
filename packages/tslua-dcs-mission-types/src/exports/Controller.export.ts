/**
 * @version 2.9.10.4160
 **/
export interface _Controller {
	isTargetDetected(...args: any[]): unknown;
	pushTask(...args: any[]): unknown;
	popTask(...args: any[]): unknown;
	className_: string;
	getDetectedTargets(...args: any[]): unknown;
	setAltitude(...args: any[]): unknown;
	setTask(...args: any[]): unknown;
	resetTask(...args: any[]): unknown;
	setOption(...args: any[]): unknown;
	setCommand(...args: any[]): unknown;
	setSpeed(...args: any[]): unknown;
	parentClass_: { className_: string };
	tonumber(...args: any[]): unknown;
	hasTask(...args: any[]): unknown;
	setOnOff(...args: any[]): unknown;
	Detection: {
		VISUAL: number;
		DLINK: number;
		OPTIC: number;
		RWR: number;
		IRST: number;
		RADAR: number;
	};
	knowTarget(...args: any[]): unknown;
}
