/**
 * @version 2.9.10.3948
 **/
export interface _trigger {
	misc: {
		addTrigger(...args: any[]): unknown;
		getZone(...args: any[]): unknown;
		getUserFlag(...args: any[]): unknown;
		addZone(...args: any[]): unknown;
	};
	flareColor: { White: number; Yellow: number; Red: number; Green: number };
	className_: string;
	action: {
		markToCoalition(...args: any[]): unknown;
		setMarkupRadius(...args: any[]): unknown;
		groupStopMoving(...args: any[]): unknown;
		outSoundForCoalition(...args: any[]): unknown;
		outTextForCoalition(...args: any[]): unknown;
		lineToAll(...args: any[]): unknown;
		setUnitInternalCargo(...args: any[]): unknown;
		outTextForUnit(...args: any[]): unknown;
		groupContinueMoving(...args: any[]): unknown;
		addOtherCommandForGroup(...args: any[]): unknown;
		setMarkupPositionEnd(...args: any[]): unknown;
		setGroupAIOn(...args: any[]): unknown;
		pushAITask(...args: any[]): unknown;
		radioTransmission(...args: any[]): unknown;
		deactivateGroup(...args: any[]): unknown;
		activateGroup(...args: any[]): unknown;
		removeMark(...args: any[]): unknown;
		rectToAll(...args: any[]): unknown;
		removeOtherCommandForCoalition(...args: any[]): unknown;
		outSound(...args: any[]): unknown;
		addOtherCommandForCoalition(...args: any[]): unknown;
		removeOtherCommand(...args: any[]): unknown;
		effectSmokeBig(...args: any[]): unknown;
		signalFlare(...args: any[]): unknown;
		outSoundForUnit(...args: any[]): unknown;
		setMarkupTypeLine(...args: any[]): unknown;
		setMarkupFontSize(...args: any[]): unknown;
		markToGroup(...args: any[]): unknown;
		outTextForGroup(...args: any[]): unknown;
		setGroupAIOff(...args: any[]): unknown;
		smoke(...args: any[]): unknown;
		circleToAll(...args: any[]): unknown;
		setMarkupText(...args: any[]): unknown;
		markToAll(...args: any[]): unknown;
		stopRadioTransmission(...args: any[]): unknown;
		textToAll(...args: any[]): unknown;
		outText(...args: any[]): unknown;
		outTextForCountry(...args: any[]): unknown;
		illuminationBomb(...args: any[]): unknown;
		markupToAll(...args: any[]): unknown;
		setMarkupColor(...args: any[]): unknown;
		addOtherCommand(...args: any[]): unknown;
		quadToAll(...args: any[]): unknown;
		arrowToAll(...args: any[]): unknown;
		outSoundForGroup(...args: any[]): unknown;
		explosion(...args: any[]): unknown;
		effectSmokeStop(...args: any[]): unknown;
		setMarkupColorFill(...args: any[]): unknown;
		outSoundForCountry(...args: any[]): unknown;
		removeOtherCommandForGroup(...args: any[]): unknown;
		ctfColorTag(...args: any[]): unknown;
		outSoundStop(...args: any[]): unknown;
		setUserFlag(...args: any[]): unknown;
		setMarkupPositionStart(...args: any[]): unknown;
		setAITask(...args: any[]): unknown;
	};
	smokeColor: {
		Blue: number;
		Green: number;
		Red: number;
		Orange: number;
		White: number;
	};
}
