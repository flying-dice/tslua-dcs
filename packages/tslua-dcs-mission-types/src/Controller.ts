import type { l_Object } from "./Object";
import type { l_Vec3 } from "./coord";
import type { _Controller } from "./exports/Controller.export";

/**
 * Common DCS task/command shape; each ID defines its own parameters.
 */
export interface ControllerAction {
	id: string;
	params: Record<string, unknown>;
}

export interface DetectedTarget {
	object: l_Object;
	visible: boolean;
	type: boolean;
	distance: boolean;
}

export interface l_Controller extends _Controller {
	/**
	 * Returns targets found by any requested method. Omitting methods checks all.
	 *
	 * @param detectionMethods Values from `Controller.Detection`.
	 * @returns Detected target records.
	 * @example `const targets = controller.getDetectedTargets(Controller.Detection.RADAR);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getDetectedTargets
	 */
	getDetectedTargets(...detectionMethods: number[]): DetectedTarget[];

	/**
	 * Reports whether the controller has a task.
	 *
	 * @returns Task presence.
	 * @example `if (!controller.hasTask()) assignPatrol();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_hasTask
	 */
	hasTask(): boolean;

	/**
	 * Checks what the controller knows about a target.
	 *
	 * @param target Target object.
	 * @param detectionMethods Values from `Controller.Detection`; omit to check all.
	 * @returns Detected, visible, last-seen time, known-type, known-distance, last position, and last velocity.
	 * @example `const [detected, visible] = controller.isTargetDetected(target);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_isTargetDetected
	 */
	isTargetDetected(
		target: l_Object,
		...detectionMethods: number[]
	): LuaMultiReturn<
		[boolean, boolean, number, boolean, boolean, l_Vec3, l_Vec3]
	>;

	/**
	 * Forces a unit controller to know a target; group controllers do not support it.
	 *
	 * @param object Target to reveal.
	 * @param type Whether its type is revealed.
	 * @param distance Whether its distance is revealed.
	 * @returns `true` when DCS accepts the operation.
	 * @example `const accepted = controller.knowTarget(target, true, true);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_knowTarget
	 */
	knowTarget(object: l_Object, type: boolean, distance: boolean): boolean;

	/**
	 * Removes the current task and activates the next queued task.
	 *
	 * @returns Nothing.
	 * @example `controller.popTask();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_popTask
	 */
	popTask(): void;

	/**
	 * Pushes a task to the front of the queue.
	 *
	 * @param task DCS task table.
	 * @returns Nothing.
	 * @example `controller.pushTask({ id: "Orbit", params: {} });`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_pushTask
	 */
	pushTask(task: ControllerAction): void;

	/**
	 * Clears the active task and task queue.
	 *
	 * @returns Nothing.
	 * @example `controller.resetTask();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_resetTask
	 */
	resetTask(): void;

	/**
	 * Commands an aircraft altitude.
	 *
	 * @param altitude Metres.
	 * @param keep Preserve it across waypoints.
	 * @param altitudeType `"BARO"` for MSL or `"RADIO"` for AGL.
	 * @returns Nothing.
	 * @example `controller.setAltitude(1000, true, "RADIO");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setAltitude
	 */
	setAltitude(
		altitude: number,
		keep?: boolean,
		altitudeType?: "BARO" | "RADIO",
	): void;

	/**
	 * Executes an instantaneous command without replacing the active task.
	 *
	 * @param command DCS command table.
	 * @returns Nothing.
	 * @example `controller.setCommand({ id: "StopRoute", params: { value: true } });`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setCommand
	 */
	setCommand(command: ControllerAction): void;

	/**
	 * Enables/disables ground or naval AI. Disabled AI cannot move, fire, or detect.
	 *
	 * @param value Desired state.
	 * @returns Nothing.
	 * @example `controller.setOnOff(false);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setOnOff
	 */
	setOnOff(value: boolean): void;

	/**
	 * Sets an option from the applicable `AI.Option` table.
	 *
	 * @param optionId Option ID.
	 * @param optionValue Option value.
	 * @returns `true` when DCS accepts the option.
	 * @example `const accepted = controller.setOption(AI.Option.Air.id.ROE, AI.Option.Air.val.ROE.WEAPON_HOLD);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setOption
	 */
	setOption(
		optionId: number,
		optionValue: number | boolean | string,
	): boolean;

	/**
	 * Commands speed in metres per second.
	 *
	 * @param speed Desired speed.
	 * @param keep Preserve it across waypoints.
	 * @returns Nothing.
	 * @example `controller.setSpeed(125, true);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setSpeed
	 */
	setSpeed(speed: number, keep?: boolean): void;

	/**
	 * Replaces the active task and clears the queue.
	 *
	 * @param task DCS task table.
	 * @returns Nothing.
	 * @example `controller.setTask({ id: "Hold", params: {} });`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setTask
	 */
	setTask(task: ControllerAction): void;
}
