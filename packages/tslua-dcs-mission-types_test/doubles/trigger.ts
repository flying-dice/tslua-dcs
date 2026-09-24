import type {
	l_Group,
	l_trigger,
	l_Vec3,
	TriggerColor,
	TriggerZone,
} from "@flying-dice/tslua-dcs-mission-types";
import { flareColor, smokeColor } from "./constants";
import { type Double, idOf } from "./runtime";
import { type MarkRecord, state } from "./state";

/** Side effects the doubles do not model beyond recording them (explosions, smoke, sounds, ...). */
export interface EffectRecord {
	kind: string;
	args: unknown[];
}

export const effects: EffectRecord[] = [];

function effect(kind: string, ...args: unknown[]): void {
	effects.push({ kind, args });
}

function flagKey(flag: string | number): string {
	return tostring(flag);
}

function flagValue(value: boolean | number | string): number {
	if (value === true) return 1;
	if (value === false) return 0;
	return tonumber(value) ?? 0;
}

function text(
	kind: string,
	target: number | undefined,
	message: string,
	displayTime: number,
	clearView?: boolean,
): void {
	state.messages.push({ kind, target, text: message, displayTime, clearView });
}

function groupOf(group: l_Group): number {
	return idOf(group);
}

function setGroupActive(group: l_Group, active: boolean): void {
	const record = state.groups.get(groupOf(group));
	if (record !== undefined) record.active = active;
}

function addMark(
	mark: Omit<MarkRecord, "time" | "points"> & { points?: l_Vec3[] },
): void {
	removeMarkById(mark.idx);
	state.marks.push({
		...mark,
		points: mark.points ?? [mark.pos],
		time: state.time,
	});
}

function removeMarkById(id: number): void {
	state.marks = state.marks.filter((mark) => mark.idx !== id);
}

function updateMark(id: number, update: (mark: MarkRecord) => void): void {
	for (const mark of state.marks) if (mark.idx === id) update(mark);
}

function copyColor(color: TriggerColor): TriggerColor {
	return [color[0], color[1], color[2], color[3]];
}

const markupShapes: Record<number, string> = {
	1: "line",
	2: "circle",
	3: "rect",
	4: "arrow",
	5: "text",
	6: "quad",
	7: "freeform",
};

export const trigger = {
	className_: "trigger",
	smokeColor: { ...smokeColor },
	flareColor: { ...flareColor },
	action: {
		activateGroup: (group) => setGroupActive(group, true),
		deactivateGroup: (group) => setGroupActive(group, false),
		setGroupAIOn: (group) => effect("setGroupAIOn", groupOf(group)),
		setGroupAIOff: (group) => effect("setGroupAIOff", groupOf(group)),
		groupStopMoving: (group) => effect("groupStopMoving", groupOf(group)),
		groupContinueMoving: (group) =>
			effect("groupContinueMoving", groupOf(group)),
		setAITask: (group, taskIndex) =>
			effect("setAITask", groupOf(group), taskIndex),
		pushAITask: (group, taskIndex) =>
			effect("pushAITask", groupOf(group), taskIndex),
		addOtherCommand: (name, userFlagName, userFlagValue) =>
			effect("addOtherCommand", name, userFlagName, userFlagValue),
		addOtherCommandForCoalition: (
			coalitionId,
			name,
			userFlagName,
			userFlagValue,
		) =>
			effect(
				"addOtherCommandForCoalition",
				coalitionId,
				name,
				userFlagName,
				userFlagValue,
			),
		addOtherCommandForGroup: (groupId, name, userFlagName, userFlagValue) =>
			effect(
				"addOtherCommandForGroup",
				groupId,
				name,
				userFlagName,
				userFlagValue,
			),
		removeOtherCommand: (name) => effect("removeOtherCommand", name),
		removeOtherCommandForCoalition: (coalitionId, name) =>
			effect("removeOtherCommandForCoalition", coalitionId, name),
		removeOtherCommandForGroup: (groupId, name) =>
			effect("removeOtherCommandForGroup", groupId, name),
		explosion: (point, power) => effect("explosion", point, power),
		smoke: (point, color) => effect("smoke", point, color),
		effectSmokeBig: (point, preset, density, name) =>
			effect("effectSmokeBig", point, preset, density, name),
		effectSmokeStop: (name) => effect("effectSmokeStop", name),
		illuminationBomb: (point, power) =>
			effect("illuminationBomb", point, power),
		signalFlare: (point, color, azimuth) =>
			effect("signalFlare", point, color, azimuth),
		ctfColorTag: (unitName, color, altitude) =>
			effect("ctfColorTag", unitName, color, altitude),
		radioTransmission: (
			fileName,
			point,
			modulation,
			loop,
			frequency,
			power,
			name,
		) =>
			effect(
				"radioTransmission",
				fileName,
				point,
				modulation,
				loop,
				frequency,
				power,
				name,
			),
		stopRadioTransmission: (name) => effect("stopRadioTransmission", name),
		outSound: (fileName) => effect("outSound", fileName),
		outSoundForCoalition: (coalitionId, fileName) =>
			effect("outSoundForCoalition", coalitionId, fileName),
		outSoundForCountry: (countryId, fileName) =>
			effect("outSoundForCountry", countryId, fileName),
		outSoundForGroup: (groupId, fileName) =>
			effect("outSoundForGroup", groupId, fileName),
		outSoundForUnit: (unitId, fileName) =>
			effect("outSoundForUnit", unitId, fileName),
		outSoundStop: () => effect("outSoundStop"),
		outText: (message, displayTime, clearView) =>
			text("outText", undefined, message, displayTime, clearView),
		outTextForCoalition: (coalitionId, message, displayTime, clearView) =>
			text("outTextForCoalition", coalitionId, message, displayTime, clearView),
		outTextForCountry: (countryId, message, displayTime, clearView) =>
			text("outTextForCountry", countryId, message, displayTime, clearView),
		outTextForGroup: (groupId, message, displayTime, clearView) =>
			text("outTextForGroup", groupId, message, displayTime, clearView),
		outTextForUnit: (unitId, message, displayTime, clearView) =>
			text("outTextForUnit", unitId, message, displayTime, clearView),
		setUserFlag: (flag, value) => {
			state.flags[flagKey(flag)] = flagValue(value);
		},
		setUnitInternalCargo: (unitName, mass) =>
			effect("setUnitInternalCargo", unitName, mass),
		userEvent: (eventId) => effect("userEvent", eventId),
		markToAll: (id, message, point, readOnly) =>
			addMark({
				idx: id,
				shape: "mark",
				text: message,
				pos: point,
				coalition: -1,
				groupID: -1,
				readOnly: readOnly ?? false,
			}),
		markToCoalition: (id, message, point, coalitionId, readOnly) =>
			addMark({
				idx: id,
				shape: "mark",
				text: message,
				pos: point,
				coalition: coalitionId,
				groupID: -1,
				readOnly: readOnly ?? false,
			}),
		markToGroup: (id, message, point, groupId, readOnly) =>
			addMark({
				idx: id,
				shape: "mark",
				text: message,
				pos: point,
				coalition: -1,
				groupID: groupId,
				readOnly: readOnly ?? false,
			}),
		removeMark: (id) => removeMarkById(id),
		lineToAll: (
			coalitionId,
			id,
			startPoint,
			endPoint,
			color,
			lineType,
			readOnly,
			message,
		) =>
			addMark({
				idx: id,
				shape: "line",
				text: message ?? "",
				pos: startPoint,
				points: [startPoint, endPoint],
				coalition: coalitionId,
				groupID: -1,
				color: copyColor(color),
				lineType,
				readOnly: readOnly ?? false,
			}),
		arrowToAll: (
			coalitionId,
			id,
			startPoint,
			endPoint,
			color,
			fillColor,
			lineType,
			readOnly,
			message,
		) =>
			addMark({
				idx: id,
				shape: "arrow",
				text: message ?? "",
				pos: startPoint,
				points: [startPoint, endPoint],
				coalition: coalitionId,
				groupID: -1,
				color: copyColor(color),
				fillColor: copyColor(fillColor),
				lineType,
				readOnly: readOnly ?? false,
			}),
		circleToAll: (
			coalitionId,
			id,
			center,
			radius,
			color,
			fillColor,
			lineType,
			readOnly,
			message,
		) =>
			addMark({
				idx: id,
				shape: "circle",
				text: message ?? "",
				pos: center,
				radius,
				coalition: coalitionId,
				groupID: -1,
				color: copyColor(color),
				fillColor: copyColor(fillColor),
				lineType,
				readOnly: readOnly ?? false,
			}),
		rectToAll: (
			coalitionId,
			id,
			startPoint,
			endPoint,
			color,
			fillColor,
			lineType,
			readOnly,
			message,
		) =>
			addMark({
				idx: id,
				shape: "rect",
				text: message ?? "",
				pos: startPoint,
				points: [startPoint, endPoint],
				coalition: coalitionId,
				groupID: -1,
				color: copyColor(color),
				fillColor: copyColor(fillColor),
				lineType,
				readOnly: readOnly ?? false,
			}),
		quadToAll: (
			coalitionId,
			id,
			point1,
			point2,
			point3,
			point4,
			color,
			fillColor,
			lineType,
			readOnly,
			message,
		) =>
			addMark({
				idx: id,
				shape: "quad",
				text: message ?? "",
				pos: point1,
				points: [point1, point2, point3, point4],
				coalition: coalitionId,
				groupID: -1,
				color: copyColor(color),
				fillColor: copyColor(fillColor),
				lineType,
				readOnly: readOnly ?? false,
			}),
		textToAll: (
			coalitionId,
			id,
			point,
			color,
			fillColor,
			fontSize,
			readOnly,
			message,
		) =>
			addMark({
				idx: id,
				shape: "text",
				text: message,
				pos: point,
				coalition: coalitionId,
				groupID: -1,
				color: copyColor(color),
				fillColor: copyColor(fillColor),
				fontSize,
				readOnly,
			}),
		markupToAll: (shape, coalitionId, id, ...parameters) => {
			const points = parameters.filter(
				(parameter) =>
					type(parameter) === "table" && (parameter as l_Vec3).z !== undefined,
			) as l_Vec3[];
			addMark({
				idx: id,
				shape: markupShapes[shape] ?? "freeform",
				text: "",
				pos: points[0] ?? { x: 0, y: 0, z: 0 },
				points,
				coalition: coalitionId,
				groupID: -1,
				readOnly: false,
			});
		},
		setMarkupColor: (id, color) =>
			updateMark(id, (mark) => {
				mark.color = copyColor(color);
			}),
		setMarkupColorFill: (id, color) =>
			updateMark(id, (mark) => {
				mark.fillColor = copyColor(color);
			}),
		setMarkupFontSize: (id, fontSize) =>
			updateMark(id, (mark) => {
				mark.fontSize = fontSize;
			}),
		setMarkupPositionStart: (id, point) =>
			updateMark(id, (mark) => {
				mark.pos = point;
				mark.points[0] = point;
			}),
		setMarkupPositionEnd: (id, point) =>
			updateMark(id, (mark) => {
				mark.points[mark.points.length > 1 ? mark.points.length - 1 : 1] =
					point;
			}),
		setMarkupRadius: (id, radius) =>
			updateMark(id, (mark) => {
				mark.radius = radius;
			}),
		setMarkupText: (id, message) =>
			updateMark(id, (mark) => {
				mark.text = message;
			}),
		setMarkupTypeLine: (id, lineType) =>
			updateMark(id, (mark) => {
				mark.lineType = lineType;
			}),
	},
	misc: {
		getUserFlag: (flag) => state.flags[flagKey(flag)] ?? 0,
		getZone: (name): TriggerZone | undefined => {
			const zone = state.zones.find((candidate) => candidate.name === name);
			return zone
				? { ...zone, point: zone.point ? { ...zone.point } : undefined }
				: undefined;
		},
		addTrigger: (definition) => {
			effect("addTrigger", definition);
			return undefined;
		},
		addZone: (definition) => {
			const zone = definition as TriggerZone;
			if (type(zone) === "table" && type(zone.name) === "string")
				state.zones.push(zone);
			return zone;
		},
	},
} satisfies Double<l_trigger>;

export function resetEffects(): void {
	effects.length = 0;
}
