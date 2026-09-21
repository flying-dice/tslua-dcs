import type { l_Group } from "./Group";
import type { l_Vec3 } from "./coord";
import type { _trigger } from "./exports/trigger.export";

/**
 * RGBA components in the inclusive range 0..1.
 */
export type TriggerColor = [number, number, number, number];

/**
 * F10-map line style: none, solid, dashed, dotted, dot-dash, long-dash, or two-dash.
 */
export type TriggerLineType = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Shape identifiers accepted by `trigger.action.markupToAll`.
 */
export type TriggerMarkupShape = 2 | 3 | 4 | 5 | 6 | 7;

/**
 * @noSelf
 */
export interface l_TriggerAction {
	/**
	 * Adds an F10 Other command that sets a user flag for all coalitions.
	 * If `userFlagValue` is omitted, DCS sets the flag to `true`.
	 *
	 * @param name Text displayed in the F10 Other radio menu.
	 * @param userFlagName Name or numeric identifier of the mission user flag.
	 * @param userFlagValue Value assigned when a player selects the command. Defaults to `true`.
	 * @returns Nothing.
	 *
	 * @example
	 * ```ts
	 * trigger.action.addOtherCommand("Open the range", "range_open", 1);
	 * ```
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/ScriptingSystem.lua:37
	 * @see https://wiki.hoggitworld.com/view/DCS_func_addOtherCommand
	 */
	addOtherCommand(
		name: string,
		userFlagName: string,
		userFlagValue?: unknown,
	): void;

	/**
	 * Removes an F10 Other command available to all coalitions.
	 * The name must match the one passed to `addOtherCommand`.
	 *
	 * @param name Menu command name to remove.
	 * @returns Nothing.
	 *
	 * @example
	 * ```ts
	 * trigger.action.removeOtherCommand("Open the range");
	 * ```
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/ScriptingSystem.lua:41
	 * @see https://wiki.hoggitworld.com/view/DCS_func_removeOtherCommand
	 */
	removeOtherCommand(name: string): void;

	/**
	 * Adds an F10 Other command that sets a user flag for one coalition.
	 * Players in other coalitions do not see the command. If `userFlagValue`
	 * is omitted, DCS sets the flag to `true`.
	 *
	 * @param coalitionId Coalition identifier, normally `coalition.side.RED`, `BLUE`, or `NEUTRAL`.
	 * @param name Text displayed in the coalition's F10 Other menu.
	 * @param userFlagName Name or numeric identifier of the mission user flag.
	 * @param userFlagValue Value assigned when selected. Defaults to `true`.
	 * @returns Nothing.
	 *
	 * @example
	 * ```ts
	 * trigger.action.addOtherCommandForCoalition(
	 * 	coalition.side.BLUE,
	 * 	"Request support",
	 * 	"blue_support",
	 * 	1,
	 * );
	 * ```
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/ScriptingSystem.lua:45
	 * @see https://wiki.hoggitworld.com/view/DCS_func_addOtherCommandForCoalition
	 */
	addOtherCommandForCoalition(
		coalitionId: number,
		name: string,
		userFlagName: string,
		userFlagValue?: unknown,
	): void;

	/**
	 * Removes an F10 Other command from one coalition.
	 * Both arguments must match those used to create the command.
	 *
	 * @param coalitionId Coalition whose menu contains the command.
	 * @param name Menu command name to remove.
	 * @returns Nothing.
	 *
	 * @example
	 * ```ts
	 * trigger.action.removeOtherCommandForCoalition(
	 * 	coalition.side.BLUE,
	 * 	"Request support",
	 * );
	 * ```
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/ScriptingSystem.lua:49
	 * @see https://wiki.hoggitworld.com/view/DCS_func_removeOtherCommandForCoalition
	 */
	removeOtherCommandForCoalition(coalitionId: number, name: string): void;

	/**
	 * Adds an F10 Other command that sets a user flag for one group.
	 * If `userFlagValue` is omitted, DCS sets the flag to `true`.
	 *
	 * @param groupId Runtime ID returned by `Group.getID()`.
	 * @param name Text displayed in the group's F10 Other menu.
	 * @param userFlagName Name or numeric identifier of the mission user flag.
	 * @param userFlagValue Value assigned when selected. Defaults to `true`.
	 * @returns Nothing.
	 *
	 * @example
	 * ```ts
	 * const group = Group.getByName("Springfield 1");
	 * if (group) {
	 * 	trigger.action.addOtherCommandForGroup(
	 * 		group.getID(),
	 * 		"Mark target",
	 * 		"springfield_mark",
	 * 		1,
	 * 	);
	 * }
	 * ```
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/ScriptingSystem.lua:53
	 * @see https://wiki.hoggitworld.com/view/DCS_func_addOtherCommandForGroup
	 */
	addOtherCommandForGroup(
		groupId: number,
		name: string,
		userFlagName: string,
		userFlagValue?: unknown,
	): void;

	/**
	 * Removes an F10 Other command from one group.
	 * Both arguments must match those used to create the command.
	 *
	 * @param groupId Runtime ID of the group whose menu contains the command.
	 * @param name Menu command name to remove.
	 * @returns Nothing.
	 *
	 * @example
	 * ```ts
	 * const group = Group.getByName("Springfield 1");
	 * if (group) {
	 * 	trigger.action.removeOtherCommandForGroup(group.getID(), "Mark target");
	 * }
	 * ```
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/ScriptingSystem.lua:57
	 * @see https://wiki.hoggitworld.com/view/DCS_func_removeOtherCommandForGroup
	 */
	removeOtherCommandForGroup(groupId: number, name: string): void;

	/**
	 * Activates a group through `Group.activate`.
	 * This is normally used with a group configured for late activation.
	 *
	 * @param group Group object to activate.
	 * @returns Nothing.
	 *
	 * @example
	 * ```ts
	 * const reinforcements = Group.getByName("Red Reinforcements");
	 * if (reinforcements) trigger.action.activateGroup(reinforcements);
	 * ```
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/ScriptingSystem.lua:61
	 * @see https://wiki.hoggitworld.com/view/DCS_func_activateGroup
	 */
	activateGroup(group: l_Group): void;

	/**
	 * Destroys a group through `Group.destroy`.
	 * The group and all of its units are removed from the mission.
	 *
	 * @param group Group object to deactivate and destroy.
	 * @returns Nothing.
	 *
	 * @example
	 * ```ts
	 * const convoy = Group.getByName("Convoy");
	 * if (convoy) trigger.action.deactivateGroup(convoy);
	 * ```
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/ScriptingSystem.lua:65
	 * @see https://wiki.hoggitworld.com/view/DCS_func_deactivateGroup
	 */
	deactivateGroup(group: l_Group): void;

	/**
	 * Enables the group's AI controller.
	 *
	 * @param group Group whose controller should be enabled.
	 * @returns Nothing.
	 *
	 * @example
	 * ```ts
	 * const patrol = Group.getByName("CAP");
	 * if (patrol) trigger.action.setGroupAIOn(patrol);
	 * ```
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/ScriptingSystem.lua:69
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setGroupAIOn
	 */
	setGroupAIOn(group: l_Group): void;

	/**
	 * Disables the group's AI controller.
	 *
	 * @param group Group whose controller should be disabled.
	 * @returns Nothing.
	 *
	 * @example
	 * ```ts
	 * const patrol = Group.getByName("CAP");
	 * if (patrol) trigger.action.setGroupAIOff(patrol);
	 * ```
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/ScriptingSystem.lua:73
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setGroupAIOff
	 */
	setGroupAIOff(group: l_Group): void;

	/**
	 * Stops the group by sending its controller a `StopRoute` command.
	 * This pauses route movement without disabling the AI controller.
	 *
	 * @param group Group whose route should be stopped.
	 * @returns Nothing.
	 *
	 * @example
	 * ```ts
	 * const convoy = Group.getByName("Convoy");
	 * if (convoy) trigger.action.groupStopMoving(convoy);
	 * ```
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/ScriptingSystem.lua:77
	 * @see https://wiki.hoggitworld.com/view/DCS_func_groupStopMoving
	 */
	groupStopMoving(group: l_Group): void;

	/**
	 * Resumes the group by clearing its controller's `StopRoute` command.
	 *
	 * @param group Group whose route should resume.
	 * @returns Nothing.
	 *
	 * @example
	 * ```ts
	 * const convoy = Group.getByName("Convoy");
	 * if (convoy) trigger.action.groupContinueMoving(convoy);
	 * ```
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/ScriptingSystem.lua:87
	 * @see https://wiki.hoggitworld.com/view/DCS_func_groupContinueMoving
	 */
	groupContinueMoving(group: l_Group): void;

	/**
	 * Creates an explosion at a world point. `power` is TNT equivalent in kilograms.
	 *
	 * @example `trigger.action.explosion({ x: 0, y: 0, z: 0 }, 10);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_explosion
	 */
	explosion(point: l_Vec3, power: number): void;
	/**
	 * Creates coloured marker smoke at a world point.
	 *
	 * @example `trigger.action.smoke(point, trigger.smokeColor.Green);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_smoke
	 */
	smoke(point: l_Vec3, color: number): void;
	/**
	 * Starts a named large smoke/fire effect. Density is 0..1. Hoggit's example omits `name`, but its syntax and `effectSmokeStop` require the name, so this signature follows the complete contract.
	 *
	 * @example `trigger.action.effectSmokeBig(point, 1, 0.5, "factory-fire");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_effectSmokeBig
	 */
	effectSmokeBig(
		point: l_Vec3,
		preset: number,
		density: number,
		name: string,
	): void;
	/**
	 * Stops the named effect created by `effectSmokeBig`.
	 *
	 * @example `trigger.action.effectSmokeStop("factory-fire");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_effectSmokeStop
	 */
	effectSmokeStop(name: string): void;
	/**
	 * Creates an illumination bomb above a world point. `power` controls luminous intensity.
	 *
	 * @example `trigger.action.illuminationBomb(point, 1000000);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_illuminationBomb
	 */
	illuminationBomb(point: l_Vec3, power: number): void;
	/**
	 * Fires a signal flare at `point`; azimuth is in radians.
	 *
	 * @example `trigger.action.signalFlare(point, trigger.flareColor.Green, 0);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_signalFlare
	 */
	signalFlare(point: l_Vec3, color: number, azimuth: number): void;
	/**
	 * Enables or disables the CTF smoke trail for a named aircraft. Color 0 disables it; 1..5 select smoke colors.
	 *
	 * @example `trigger.action.ctfColorTag("Ford 1-1", 5);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_ctfColorTag
	 */
	ctfColorTag(unitName: string, color: number, altitude?: number): void;

	/**
	 * Broadcasts a mission audio resource from a world point. Frequency is Hz and power is watts.
	 *
	 * @example `trigger.action.radioTransmission("l10n/DEFAULT/beacon.ogg", point, 0, true, 124000000, 100, "beacon");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_radioTransmission
	 */
	radioTransmission(
		fileName: string,
		point: l_Vec3,
		modulation: 0 | 1,
		loop: boolean,
		frequency: number,
		power: number,
		name: string,
	): void;
	/**
	 * Stops a named transmission.
	 *
	 * @example `trigger.action.stopRadioTransmission("beacon");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_stopRadioTransmission
	 */
	stopRadioTransmission(name: string): void;

	/**
	 * Plays a mission audio resource for every player.
	 *
	 * @example `trigger.action.outSound("l10n/DEFAULT/briefing.ogg");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_outSound
	 */
	outSound(fileName: string): void;
	/**
	 * Plays a mission audio resource for one coalition.
	 *
	 * @example `trigger.action.outSoundForCoalition(coalition.side.BLUE, "l10n/DEFAULT/briefing.ogg");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_outSoundForCoalition
	 */
	outSoundForCoalition(coalitionId: number, fileName: string): void;
	/**
	 * Plays a mission audio resource for one country.
	 *
	 * @example `trigger.action.outSoundForCountry(2, "l10n/DEFAULT/briefing.ogg");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_outSoundForCountry
	 */
	outSoundForCountry(countryId: number, fileName: string): void;
	/**
	 * Plays a mission audio resource for one group.
	 *
	 * @example `trigger.action.outSoundForGroup(group.getID(), "l10n/DEFAULT/briefing.ogg");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_outSoundForGroup
	 */
	outSoundForGroup(groupId: number, fileName: string): void;
	/**
	 * Plays a mission audio resource for one unit.
	 *
	 * @example `trigger.action.outSoundForUnit(unit.getID() as number, "l10n/DEFAULT/briefing.ogg");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_outSoundForUnit
	 */
	outSoundForUnit(unitId: number, fileName: string): void;
	/**
	 * TODO: DCS exports this native function but the installed scripts and Hoggit do not expose its parameter contract.
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/ScriptingSystem.lua
	 * @see https://wiki.hoggitworld.com/view/DCS_singleton_trigger
	 */
	outSoundStop(...arguments_: unknown[]): void;

	/**
	 * Displays text to every player for `displayTime` seconds.
	 *
	 * @example `trigger.action.outText("Range open", 5, false);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_outText
	 */
	outText(text: string, displayTime: number, clearView?: boolean): void;
	/**
	 * Displays text to one coalition.
	 *
	 * @example `trigger.action.outTextForCoalition(coalition.side.BLUE, "Range open", 5);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_outTextForCoalition
	 */
	outTextForCoalition(
		coalitionId: number,
		text: string,
		displayTime: number,
		clearView?: boolean,
	): void;
	/**
	 * Displays text to one country.
	 *
	 * @example `trigger.action.outTextForCountry(2, "Range open", 5);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_outTextForCountry
	 */
	outTextForCountry(
		countryId: number,
		text: string,
		displayTime: number,
		clearView?: boolean,
	): void;
	/**
	 * Displays text to one group.
	 *
	 * @example `trigger.action.outTextForGroup(group.getID(), "Range open", 5);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_outTextForGroup
	 */
	outTextForGroup(
		groupId: number,
		text: string,
		displayTime: number,
		clearView?: boolean,
	): void;
	/**
	 * Displays text to one unit.
	 *
	 * @example `trigger.action.outTextForUnit(unitId, "Range open", 5);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_outTextForUnit
	 */
	outTextForUnit(
		unitId: number,
		text: string,
		displayTime: number,
		clearView?: boolean,
	): void;

	/**
	 * Sets a mission flag to a boolean, number, or string value.
	 *
	 * @example `trigger.action.setUserFlag("range_open", 1);`
	 * @see %DCS_INSTALL_DIR%/Scripts/ScriptingSystem.lua:38
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setUserFlag
	 */
	setUserFlag(flag: string | number, value: boolean | number | string): void;
	/**
	 * Sets the internal cargo mass of a named unit in kilograms.
	 *
	 * @example `trigger.action.setUnitInternalCargo("Huey 1-1", 250);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setUnitInternalCargo
	 */
	setUnitInternalCargo(unitName: string, mass: number): void;
	/**
	 * Assigns the mission-editor triggered task at `taskIndex` to a group. Indices are one-based.
	 *
	 * @example `trigger.action.setAITask(group, 1);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setAITask
	 */
	setAITask(group: l_Group, taskIndex: number): void;
	/**
	 * Pushes the mission-editor triggered task at `taskIndex` onto a group's task stack. Indices are one-based.
	 *
	 * @example `trigger.action.pushAITask(group, 1);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_pushAITask
	 */
	pushAITask(group: l_Group, taskIndex: number): void;
	/**
	 * Emits a numeric mission user event.
	 *
	 * @example `trigger.action.userEvent(1);`
	 * @see https://wiki.hoggitworld.com/view/DCS_singleton_trigger
	 */
	userEvent(eventId: number): void;

	/**
	 * Adds an F10-map mark visible to all coalitions. IDs share the markup namespace and must be unique.
	 *
	 * @example `trigger.action.markToAll(900001, "Target", point, true);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_markToAll
	 */
	markToAll(
		id: number,
		text: string,
		point: l_Vec3,
		readOnly?: boolean,
		message?: string,
	): void;
	/**
	 * Adds an F10-map mark visible to one coalition.
	 *
	 * @example `trigger.action.markToCoalition(900001, "Target", point, coalition.side.BLUE, true);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_markToCoalition
	 */
	markToCoalition(
		id: number,
		text: string,
		point: l_Vec3,
		coalitionId: number,
		readOnly?: boolean,
		message?: string,
	): void;
	/**
	 * Adds an F10-map mark visible to one group.
	 *
	 * @example `trigger.action.markToGroup(900001, "Target", point, group.getID(), true);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_markToGroup
	 */
	markToGroup(
		id: number,
		text: string,
		point: l_Vec3,
		groupId: number,
		readOnly?: boolean,
		message?: string,
	): void;
	/**
	 * Removes a mark or markup shape by its unique ID.
	 *
	 * @example `trigger.action.removeMark(900001);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_removeMark
	 */
	removeMark(id: number): void;

	/**
	 * Draws a line on the F10 map. Coalition -1 means all.
	 *
	 * @example `trigger.action.lineToAll(-1, 900002, start, end, [1, 0, 0, 1], 1, true);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_lineToAll
	 */
	lineToAll(
		coalitionId: number,
		id: number,
		startPoint: l_Vec3,
		endPoint: l_Vec3,
		color: TriggerColor,
		lineType: TriggerLineType,
		readOnly?: boolean,
		message?: string,
	): void;
	/**
	 * Draws an arrow on the F10 map. Coalition -1 means all.
	 *
	 * @example `trigger.action.arrowToAll(-1, 900003, start, end, [1, 0, 0, 1], [1, 0, 0, 0.2], 1, true);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_arrowToAll
	 */
	arrowToAll(
		coalitionId: number,
		id: number,
		startPoint: l_Vec3,
		endPoint: l_Vec3,
		color: TriggerColor,
		fillColor: TriggerColor,
		lineType: TriggerLineType,
		readOnly?: boolean,
		message?: string,
	): void;
	/**
	 * Draws a circle on the F10 map.
	 *
	 * @example `trigger.action.circleToAll(-1, 900004, point, 500, [0, 1, 0, 1], [0, 1, 0, 0.2], 1, true);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_circleToAll
	 */
	circleToAll(
		coalitionId: number,
		id: number,
		center: l_Vec3,
		radius: number,
		color: TriggerColor,
		fillColor: TriggerColor,
		lineType: TriggerLineType,
		readOnly?: boolean,
		message?: string,
	): void;
	/**
	 * Draws a rectangle whose opposite corners are `startPoint` and `endPoint`.
	 *
	 * @example `trigger.action.rectToAll(-1, 900005, start, end, [0, 0, 1, 1], [0, 0, 1, 0.2], 1, true);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_rectToAll
	 */
	rectToAll(
		coalitionId: number,
		id: number,
		startPoint: l_Vec3,
		endPoint: l_Vec3,
		color: TriggerColor,
		fillColor: TriggerColor,
		lineType: TriggerLineType,
		readOnly?: boolean,
		message?: string,
	): void;
	/**
	 * Draws a four-point polygon.
	 *
	 * @example `trigger.action.quadToAll(-1, 900006, p1, p2, p3, p4, [1, 1, 0, 1], [1, 1, 0, 0.2], 1, true);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_quadToAll
	 */
	quadToAll(
		coalitionId: number,
		id: number,
		point1: l_Vec3,
		point2: l_Vec3,
		point3: l_Vec3,
		point4: l_Vec3,
		color: TriggerColor,
		fillColor: TriggerColor,
		lineType: TriggerLineType,
		readOnly?: boolean,
		message?: string,
	): void;
	/**
	 * Draws text on the F10 map.
	 *
	 * @example `trigger.action.textToAll(-1, 900007, point, [1, 1, 1, 1], [0, 0, 0, 0.5], 14, true, "Target");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_textToAll
	 */
	textToAll(
		coalitionId: number,
		id: number,
		point: l_Vec3,
		color: TriggerColor,
		fillColor: TriggerColor,
		fontSize: number,
		readOnly: boolean,
		text: string,
	): void;
	/**
	 * Native variable-arity markup entry point. Prefer the shape-specific helpers above. TODO: DCS does not publish a stable tuple schema for every shape, so parameters remain unknown rather than incorrectly typed.
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_markupToAll
	 */
	markupToAll(
		shape: TriggerMarkupShape,
		coalitionId: number,
		id: number,
		...parameters: unknown[]
	): void;

	/**
	 * Changes a markup outline color.
	 *
	 * @example `trigger.action.setMarkupColor(900004, [1, 0, 0, 1]);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setMarkupColor
	 */
	setMarkupColor(id: number, color: TriggerColor): void;
	/**
	 * Changes a markup fill color.
	 *
	 * @example `trigger.action.setMarkupColorFill(900004, [1, 0, 0, 0.2]);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setMarkupColorFill
	 */
	setMarkupColorFill(id: number, color: TriggerColor): void;
	/**
	 * Changes a text markup's font size.
	 *
	 * @example `trigger.action.setMarkupFontSize(900007, 18);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setMarkupFontSize
	 */
	setMarkupFontSize(id: number, fontSize: number): void;
	/**
	 * Changes the first point of a markup shape.
	 *
	 * @example `trigger.action.setMarkupPositionStart(900002, point);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setMarkupPositionStart
	 */
	setMarkupPositionStart(id: number, point: l_Vec3): void;
	/**
	 * Changes the last point of a markup shape.
	 *
	 * @example `trigger.action.setMarkupPositionEnd(900002, point);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setMarkupPositionEnd
	 */
	setMarkupPositionEnd(id: number, point: l_Vec3): void;
	/**
	 * Changes a circle markup's radius in metres.
	 *
	 * @example `trigger.action.setMarkupRadius(900004, 750);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setMarkupRadius
	 */
	setMarkupRadius(id: number, radius: number): void;
	/**
	 * Changes a markup's text.
	 *
	 * @example `trigger.action.setMarkupText(900007, "Updated target");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setMarkupText
	 */
	setMarkupText(id: number, text: string): void;
	/**
	 * Changes a markup's line style.
	 *
	 * @example `trigger.action.setMarkupTypeLine(900004, 2);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setMarkupTypeLine
	 */
	setMarkupTypeLine(id: number, lineType: TriggerLineType): void;
}

export type TriggerZone = {
	/**
	 * Centre point; for compatibility DCS also exposes the same X/Z values as `x` and `y`.
	 */
	point?: l_Vec3;
	/**
	 * Radius in metres.
	 */
	radius: number;
	/**
	 * Mission-editor zone identifier.
	 */
	zoneId: number;
	/**
	 * Red, green, blue, and alpha components.
	 */
	color: [number, number, number, number];
	/**
	 * Custom mission-editor properties attached to the zone.
	 */
	properties: {
		key: string;
		value: string;
	}[];
	/**
	 * Whether the zone is hidden in the mission editor.
	 */
	hidden: boolean;
	/**
	 * Map Z coordinate exposed by the scripting API as `y`.
	 */
	y: number;
	/**
	 * Map X coordinate.
	 */
	x: number;
	/**
	 * Trigger-zone name.
	 */
	name: string;
	/**
	 * DCS zone-shape identifier.
	 */
	type: number;
	/**
	 * Zone heading in radians.
	 */
	heading: number;
};

/**
 * @noSelf
 */
export interface l_TriggerMisc {
	/**
	 * Returns a mission flag as a number; unset flags return zero.
	 *
	 * @example `const enabled = trigger.misc.getUserFlag("range_open") === 1;`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getUserFlag
	 */
	getUserFlag(flag: string | number): number;
	/**
	 * Looks up a mission-editor trigger zone by name.
	 *
	 * @returns The zone record, or `undefined` if it does not exist.
	 * @example `const zone = trigger.misc.getZone("Range");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getZone
	 */
	getZone(name: string): TriggerZone | undefined;
	/**
	 * TODO: engine-native dynamic trigger schema is not present in the installed Lua sources and is version-dependent. This explicit override prevents an accidental `any[]` contract.
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/ScriptingSystem.lua
	 */
	addTrigger(definition: unknown): unknown;
	/**
	 * TODO: engine-native dynamic zone schema is not present in the installed Lua sources. Use mission-editor zones plus `getZone` when portability matters.
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/ScriptingSystem.lua
	 */
	addZone(definition: unknown): unknown;
}

/**
 * @noSelf
 */
export interface l_trigger extends _trigger {
	/**
	 * Convenience action wrappers installed by DCS.
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/ScriptingSystem.lua:35
	 */
	action: l_TriggerAction;
	/**
	 * Mission flag and trigger-zone lookup functions.
	 */
	misc: l_TriggerMisc;
}
