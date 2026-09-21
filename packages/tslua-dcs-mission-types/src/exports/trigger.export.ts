/**
 * @version 2.9.29.27468
 */
export interface _trigger {
	action: {
		activateGroup(...args: any[]): unknown;
		addOtherCommand(...args: any[]): unknown;
		addOtherCommandForCoalition(...args: any[]): unknown;
		addOtherCommandForGroup(...args: any[]): unknown;
		arrowToAll(...args: any[]): unknown;
		circleToAll(...args: any[]): unknown;
		ctfColorTag(...args: any[]): unknown;
		deactivateGroup(...args: any[]): unknown;
		effectSmokeBig(...args: any[]): unknown;
		effectSmokeStop(...args: any[]): unknown;
		explosion(...args: any[]): unknown;
		groupContinueMoving(...args: any[]): unknown;
		groupStopMoving(...args: any[]): unknown;
		illuminationBomb(...args: any[]): unknown;
		lineToAll(...args: any[]): unknown;
		markToAll(...args: any[]): unknown;
		markToCoalition(...args: any[]): unknown;
		markToGroup(...args: any[]): unknown;
		markupToAll(...args: any[]): unknown;
		outSound(...args: any[]): unknown;
		outSoundForCoalition(...args: any[]): unknown;
		outSoundForCountry(...args: any[]): unknown;
		outSoundForGroup(...args: any[]): unknown;
		outSoundForUnit(...args: any[]): unknown;
		outSoundStop(...args: any[]): unknown;
		outText(...args: any[]): unknown;
		outTextForCoalition(...args: any[]): unknown;
		outTextForCountry(...args: any[]): unknown;
		outTextForGroup(...args: any[]): unknown;
		outTextForUnit(...args: any[]): unknown;
		pushAITask(...args: any[]): unknown;
		quadToAll(...args: any[]): unknown;
		radioTransmission(...args: any[]): unknown;
		rectToAll(...args: any[]): unknown;
		removeMark(...args: any[]): unknown;
		removeOtherCommand(...args: any[]): unknown;
		removeOtherCommandForCoalition(...args: any[]): unknown;
		removeOtherCommandForGroup(...args: any[]): unknown;
		setAITask(...args: any[]): unknown;
		setGroupAIOff(...args: any[]): unknown;
		setGroupAIOn(...args: any[]): unknown;
		setMarkupColor(...args: any[]): unknown;
		setMarkupColorFill(...args: any[]): unknown;
		setMarkupFontSize(...args: any[]): unknown;
		setMarkupPositionEnd(...args: any[]): unknown;
		setMarkupPositionStart(...args: any[]): unknown;
		setMarkupRadius(...args: any[]): unknown;
		setMarkupText(...args: any[]): unknown;
		setMarkupTypeLine(...args: any[]): unknown;
		setUnitInternalCargo(...args: any[]): unknown;
		setUserFlag(...args: any[]): unknown;
		signalFlare(...args: any[]): unknown;
		smoke(...args: any[]): unknown;
		stopRadioTransmission(...args: any[]): unknown;
		textToAll(...args: any[]): unknown;
		userEvent(...args: any[]): unknown;
	};
	className_: string;
	flareColor: {
		Green: number;
		Red: number;
		White: number;
		Yellow: number;
	};
	misc: {
		addTrigger(...args: any[]): unknown;
		addZone(...args: any[]): unknown;
		getUserFlag(...args: any[]): unknown;
		getZone(...args: any[]): unknown;
	};
	smokeColor: {
		Blue: number;
		Green: number;
		Orange: number;
		Red: number;
		White: number;
	};
}
