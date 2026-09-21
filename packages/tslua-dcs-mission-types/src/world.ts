import type { l_Airbase } from "./Airbase";
import type { l_Object } from "./Object";
import type { l_Unit } from "./Unit";
import type { l_Vec3 } from "./coord";
import type { _world } from "./exports/world.export";

export interface WorldVolume {
	id: number;
	params: Record<string, unknown>;
}

export interface WorldMarkPanel {
	idx: number;
	time: number;
	initiator?: l_Unit;
	coalition: number;
	groupID: number;
	text: string;
	pos: l_Vec3;
}

export type FogAnimationKey = [
	time: number,
	visibility: number,
	thickness: number,
];

/**
 * Dynamic fog controls introduced in DCS 2.9.10.
 */
export interface l_WorldWeather {
	/**
	 * Returns fog-layer thickness at sea level.
	 *
	 * @returns Metres, or `0` when fog is disabled.
	 * @example `const thickness = world.weather.getFogThickness();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getFogThickness
	 */
	getFogThickness(): number;
	/**
	 * Returns horizontal fog visibility.
	 *
	 * @returns Visibility in metres.
	 * @example `const visibility = world.weather.getFogVisibilityDistance();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getFogVisibilityDistance
	 */
	getFogVisibilityDistance(): number;
	/**
	 * Animates fog using time/visibility/thickness keys; an empty array cancels animation.
	 *
	 * @param keys Keys relative to call time.
	 * @returns Nothing.
	 * @example `world.weather.setFogAnimation([[60, 10000, 1000]]);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setFogAnimation
	 */
	setFogAnimation(keys: FogAnimationKey[]): void;
	/**
	 * Sets fog thickness and cancels active animation. Valid fog range is 100–5000 m; `0` removes fog.
	 *
	 * @param thickness Metres.
	 * @returns Nothing.
	 * @example `world.weather.setFogThickness(1000);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setFogThickness
	 */
	setFogThickness(thickness: number): void;
	/**
	 * Sets fog visibility and cancels active animation.
	 *
	 * @param visibility Metres.
	 * @returns Nothing.
	 * @example `world.weather.setFogVisibilityDistance(10000);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setFogVisibilityDistance
	 */
	setFogVisibilityDistance(visibility: number): void;
}

/**
 * A simulator event delivered to a world event handler.
 * Event-specific fields are optional because different event IDs carry
 * different payloads.
 *
 * @see https://wiki.hoggitworld.com/view/Category:Events
 */
export interface l_WorldEvent {
	/**
	 * Event identifier from `world.event`.
	 */
	id: number;
	/**
	 * Mission model time at which the event occurred.
	 */
	time: number;
	/**
	 * Object that initiated the event; its exact type depends on the event ID.
	 */
	initiator?: unknown;
	/**
	 * Object targeted by the event; its exact type depends on the event ID.
	 */
	target?: unknown;
	/**
	 * Place associated with the event; its exact type depends on the event ID.
	 */
	place?: unknown;
	/**
	 * Weapon associated with the event; its exact type depends on the event ID.
	 */
	weapon?: unknown;
	/**
	 * Additional event-specific fields not shared by every event payload.
	 */
	[key: string]: unknown;
}

/**
 * Receives simulator events after registration with `world.addEventHandler`.
 * DCS invokes the method with the handler object as `self`.
 *
 * @example
 * ```ts
 * const handler: l_WorldEventHandler = {
 * 	onEvent(event) {
 * 		if (event.id === world.event.S_EVENT_BIRTH) {
 * 			env.info("A unit was born");
 * 		}
 * 	},
 * };
 * world.addEventHandler(handler);
 * ```
 */
export interface l_WorldEventHandler {
	/**
	 * Handles one event dispatched by DCS.
	 *
	 * @param event Event table. Inspect `event.id` before using event-specific fields.
	 * @returns Nothing.
	 * @example
	 * ```ts
	 * const handler: l_WorldEventHandler = {
	 * 	onEvent(event) {
	 * 		env.info(`DCS event ${event.id}`);
	 * 	},
	 * };
	 * ```
	 */
	onEvent(event: l_WorldEvent): void;
}

/**
 * @noSelf
 */
export interface l_world extends _world {
	/**
	 * Typed dynamic-weather controls.
	 */
	weather: l_WorldWeather;

	/**
	 * Registers an object that receives every simulator event through its
	 * `onEvent` method. Register the same object only once and retain the object
	 * if it may need to be removed later.
	 *
	 * @param handler Object containing the callback DCS invokes for each event.
	 * @returns Nothing.
	 *
	 * @example
	 * ```ts
	 * const handler: l_WorldEventHandler = {
	 * 	onEvent(event) {
	 * 		env.info(`DCS event ${event.id}`);
	 * 	},
	 * };
	 * world.addEventHandler(handler);
	 * ```
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/World/EventHandlers.lua:3
	 * @see https://wiki.hoggitworld.com/view/DCS_func_addEventHandler
	 */
	addEventHandler(handler: l_WorldEventHandler): void;

	/**
	 * Removes a previously registered event handler. Removal uses object
	 * identity, so pass the same object originally supplied to
	 * `addEventHandler`.
	 *
	 * @param handler Registered handler object to remove.
	 * @returns Nothing.
	 *
	 * @example
	 * ```ts
	 * world.removeEventHandler(handler);
	 * ```
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/World/EventHandlers.lua:7
	 * @see https://wiki.hoggitworld.com/view/DCS_func_removeEventHandler
	 */
	removeEventHandler(handler: l_WorldEventHandler): void;

	/**
	 * Dispatches an event to every registered handler by calling each
	 * handler's `onEvent` method. DCS uses this internally; mission scripts
	 * normally register handlers instead of calling it directly.
	 *
	 * @param event Event payload to dispatch.
	 * @returns Nothing.
	 * @example
	 * ```ts
	 * world.onEvent({ id: world.event.S_EVENT_MISSION_END });
	 * ```
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/World/EventHandlers.lua:11
	 */
	onEvent(event: l_WorldEvent): void;

	/**
	 * Registers a named persistence callback. The name may contain letters,
	 * numbers, spaces, underscores, and hyphens.
	 * Calling `runPersistenceHandlers` later invokes the callback and forwards
	 * its result to the supplied storage function.
	 *
	 * @param name Stable key used when the value is stored.
	 * @param handler Callback that produces the value to persist.
	 * @returns Nothing. Throws a Lua error if `name` contains unsupported characters.
	 *
	 * @example
	 * ```ts
	 * world.setPersistenceHandler("mission_score", () => ({ blue: 10, red: 5 }));
	 * ```
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/World/PersistenceHandlers.lua:5
	 */
	setPersistenceHandler(name: string, handler: () => unknown): void;

	/**
	 * Runs each persistence callback and passes its name and result to storage.
	 * The storage callback is invoked once for every registered handler.
	 *
	 * @param storageFunc Receives each registered name and its newly produced value.
	 * @returns Nothing.
	 *
	 * @example
	 * ```ts
	 * world.runPersistenceHandlers((name, value) => {
	 * 	env.info(`${name}: ${JSON.stringify(value)}`);
	 * });
	 * ```
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/World/PersistenceHandlers.lua:14
	 */
	runPersistenceHandlers(
		storageFunc: (name: string, value: unknown) => void,
	): void;

	/**
	 * Returns the mission's single `Player`-skill unit. Multiplayer client units are not returned.
	 *
	 * @returns Player unit, or `undefined` when unavailable.
	 * @example `const player = world.getPlayer();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getPlayer
	 */
	getPlayer(): l_Unit | undefined;

	/**
	 * Returns map marks and markup shapes currently present.
	 *
	 * @returns Mark records.
	 * @example `for (const mark of world.getMarkPanels()) env.info(mark.text);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getMarkPanels
	 */
	getMarkPanels(): WorldMarkPanel[];

	/**
	 * Searches a volume and calls the handler for each matching object. Return `false` from the handler to stop early. DCS returns the number of matching objects visited; collect objects in the callback when their references are needed.
	 *
	 * @param category One or more values from `Object.Category`.
	 * @param volume Search volume.
	 * @param handler Callback receiving each object and optional data.
	 * @param data Value forwarded to the callback.
	 * @returns Number of objects passed to the handler.
	 * @example `const found: l_Object[] = []; const count = world.searchObjects(Object.Category.UNIT, volume, object => { found.push(object); return true; });`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_searchObjects
	 */
	searchObjects<T>(
		category: number | number[],
		volume: WorldVolume,
		handler: (this: void, object: l_Object, data: T) => boolean,
		data?: T,
	): number;

	/**
	 * Removes wreckage, craters, and debris inside a volume; scenery wreckage is retained.
	 *
	 * @param volume Search volume.
	 * @returns Number of removed junk objects.
	 * @example `const removed = world.removeJunk(volume);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_removeJunk
	 */
	removeJunk(volume: WorldVolume): number;

	/**
	 * Reads persistence data supplied by the host persistence system. DCS exposes the function but does not publish a stable value schema.
	 *
	 * @param name Registered persistence name.
	 * @returns Stored value when present.
	 * @example `const score = world.getPersistenceData("mission_score");`
	 * @see %DCS_INSTALL_DIR%/Scripts/World/PersistenceHandlers.lua:3
	 */
	getPersistenceData(name: string): unknown;

	/**
	 * Configures the host persistence pass-through callback. The installed Lua wrapper does not define the host-specific callback protocol.
	 *
	 * @param handler Host pass-through callback.
	 * @returns Nothing.
	 * @example `world.setPersistencePassthrough(handler);`
	 */
	setPersistencePassthrough(handler: (...args: unknown[]) => unknown): void;

	/**
	 * Returns every airbase-like object in the mission, including map airfields,
	 * FARPs, and ships that provide airbase services.
	 *
	 * @returns Array of all available airbase objects.
	 *
	 * @example
	 * ```ts
	 * for (const airbase of world.getAirbases()) {
	 * 	env.info(airbase.getName());
	 * }
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getAirbases
	 */
	getAirbases(): l_Airbase[];
}
