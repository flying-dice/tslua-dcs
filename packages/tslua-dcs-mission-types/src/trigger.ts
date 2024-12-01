import type { _trigger } from "./exports/trigger.export";

export type TriggerZone = {
	radius: number;
	zoneId: number;
	color: [number, number, number, number];
	properties: {
		key: string;
		value: string;
	}[];
	hidden: boolean;
	y: number;
	x: number;
	name: string;
	type: number;
	heading: number;
};

/** @noSelf **/
export interface l_trigger extends _trigger {}
