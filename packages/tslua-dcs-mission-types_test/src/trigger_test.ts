import type { TriggerColor } from "@flying-dice/tslua-dcs-mission-types";
import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { groupFixture, unitFixture } from "./fixtures";

describe("trigger examples", () => {
	test("all exported trigger actions are callable functions", () => {
		const actions = [
			trigger.action.activateGroup,
			trigger.action.addOtherCommand,
			trigger.action.addOtherCommandForCoalition,
			trigger.action.addOtherCommandForGroup,
			trigger.action.arrowToAll,
			trigger.action.circleToAll,
			trigger.action.ctfColorTag,
			trigger.action.deactivateGroup,
			trigger.action.effectSmokeBig,
			trigger.action.effectSmokeStop,
			trigger.action.explosion,
			trigger.action.groupContinueMoving,
			trigger.action.groupStopMoving,
			trigger.action.illuminationBomb,
			trigger.action.lineToAll,
			trigger.action.markToAll,
			trigger.action.markToCoalition,
			trigger.action.markToGroup,
			trigger.action.markupToAll,
			trigger.action.outSound,
			trigger.action.outSoundForCoalition,
			trigger.action.outSoundForCountry,
			trigger.action.outSoundForGroup,
			trigger.action.outSoundForUnit,
			trigger.action.outSoundStop,
			trigger.action.outText,
			trigger.action.outTextForCoalition,
			trigger.action.outTextForCountry,
			trigger.action.outTextForGroup,
			trigger.action.outTextForUnit,
			trigger.action.pushAITask,
			trigger.action.quadToAll,
			trigger.action.radioTransmission,
			trigger.action.rectToAll,
			trigger.action.removeMark,
			trigger.action.removeOtherCommand,
			trigger.action.removeOtherCommandForCoalition,
			trigger.action.removeOtherCommandForGroup,
			trigger.action.setAITask,
			trigger.action.setGroupAIOff,
			trigger.action.setGroupAIOn,
			trigger.action.setMarkupColor,
			trigger.action.setMarkupColorFill,
			trigger.action.setMarkupFontSize,
			trigger.action.setMarkupPositionEnd,
			trigger.action.setMarkupPositionStart,
			trigger.action.setMarkupRadius,
			trigger.action.setMarkupText,
			trigger.action.setMarkupTypeLine,
			trigger.action.setUnitInternalCargo,
			trigger.action.setUserFlag,
			trigger.action.signalFlare,
			trigger.action.smoke,
			trigger.action.stopRadioTransmission,
			trigger.action.textToAll,
			trigger.action.userEvent,
		];
		for (const action of actions) expect(type(action)).toBe("function");
	});

	test("user flags can be set, read, and restored", () => {
		const flag = "tslua_dcs_example_flag";
		const previous = trigger.misc.getUserFlag(flag);
		trigger.action.setUserFlag(flag, 73);
		expect(trigger.misc.getUserFlag(flag)).toBe(73);
		trigger.action.setUserFlag(flag, previous);
	});

	test("marks and markup shapes can be created, changed, and removed", () => {
		const group = groupFixture();
		const unit = unitFixture();
		const point = unit.getPoint();
		const end = { x: point.x + 50, y: point.y, z: point.z + 50 };
		const third = { x: point.x + 100, y: point.y, z: point.z };
		const fourth = { x: point.x, y: point.y, z: point.z + 100 };
		const red: TriggerColor = [1, 0, 0, 1];
		const fill: TriggerColor = [1, 0, 0, 0.15];

		trigger.action.markToAll(987001, "tslua-dcs", point, true);
		trigger.action.markToCoalition(
			987002,
			"tslua-dcs",
			point,
			coalition.side.BLUE,
			true,
		);
		trigger.action.markToGroup(987003, "tslua-dcs", point, group.getID(), true);
		trigger.action.lineToAll(-1, 987004, point, end, red, 1, true);
		trigger.action.arrowToAll(-1, 987005, point, end, red, fill, 1, true);
		trigger.action.circleToAll(-1, 987006, point, 25, red, fill, 1, true);
		trigger.action.rectToAll(-1, 987007, point, end, red, fill, 1, true);
		trigger.action.quadToAll(
			-1,
			987008,
			point,
			end,
			third,
			fourth,
			red,
			fill,
			1,
			true,
		);
		trigger.action.textToAll(
			-1,
			987009,
			point,
			red,
			fill,
			14,
			true,
			"tslua-dcs",
		);
		trigger.action.setMarkupColor(987006, red);
		trigger.action.setMarkupColorFill(987006, fill);
		trigger.action.setMarkupRadius(987006, 30);
		trigger.action.setMarkupTypeLine(987006, 2);
		trigger.action.setMarkupPositionStart(987004, point);
		trigger.action.setMarkupPositionEnd(987004, end);
		trigger.action.setMarkupText(987009, "tslua-dcs verified");
		trigger.action.setMarkupFontSize(987009, 16);

		for (let id = 987001; id <= 987009; id++) trigger.action.removeMark(id);
		expect(true).toBe(true);
	});

	test("trigger misc exports have stable runtime kinds", () => {
		expect(type(trigger.misc.getUserFlag)).toBe("function");
		expect(type(trigger.misc.getZone)).toBe("function");
		expect(type(trigger.misc.addTrigger)).toBe("function");
		expect(type(trigger.misc.addZone)).toBe("function");
		expect(trigger.misc.getZone("__tslua_dcs_missing_zone__")).toBe(undefined);
	});
});
