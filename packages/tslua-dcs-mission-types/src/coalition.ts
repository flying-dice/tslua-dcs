import type { l_Airbase } from "./Airbase";
import type { l_Group } from "./Group";
import type { l_StaticObject } from "./StaticObject";
import type { l_Unit } from "./Unit";
import type { l_Vec3 } from "./coord";
import type { _coalition } from "./exports/coalition.export";

/**
 * Mission-table data accepted by dynamic group/static creation APIs.
 */
export type CoalitionSpawnData = Record<string, unknown>;

export interface CoalitionReferencePoint {
	/**
	 * Numeric JTAC reference-point callsign.
	 */
	callsign: number;
	/**
	 * DCS reference-point type identifier.
	 */
	type: number;
	/**
	 * Reference-point position in local DCS coordinates.
	 */
	point: l_Vec3;
	/**
	 * Optional editor/display name retained by some missions.
	 */
	name?: string;
	[key: string]: unknown;
}

/**
 * @noSelf
 */
export interface l_coalition extends _coalition {
	/**
	 * TODO: dynamic-group UI helper exported by DCS; installed Lua sources do not expose its stable payload contract. Prefer `addGroup`.
	 */
	add_dyn_group(...arguments_: unknown[]): unknown;
	/**
	 * TODO: removes a group through an engine-native dynamic-spawn identifier whose type is not published. Prefer `Group.destroy` when an object is available.
	 */
	remove_dyn_group(...arguments_: unknown[]): unknown;
	/**
	 * TODO: cargo-choice validation uses an engine-native payload absent from installed scripting documentation.
	 */
	checkChooseCargo(...arguments_: unknown[]): unknown;
	/**
	 * TODO: troop-descent validation uses an engine-native payload absent from installed scripting documentation.
	 */
	checkDescent(...arguments_: unknown[]): unknown;
	/**
	 * TODO: returned descent records have an unpublished, version-dependent engine schema.
	 */
	getAllDescents(...arguments_: unknown[]): unknown;
	/**
	 * TODO: returned onboard-descent records have an unpublished, version-dependent engine schema.
	 */
	getDescentsOnBoard(...arguments_: unknown[]): unknown;
	/**
	 * Dynamically creates a group for a country. The mission-table schema depends on group category.
	 *
	 * @param countryId Value from `country.id`.
	 * @param groupCategory Value from `Group.Category`.
	 * @param groupData Mission-format group data.
	 * @returns Created group.
	 * @example `const group = coalition.addGroup(country.id.USA, Group.Category.GROUND, groupData);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_addGroup
	 */
	addGroup(
		countryId: number,
		groupCategory: number,
		groupData: CoalitionSpawnData,
	): l_Group;

	/**
	 * Adds a coalition JTAC reference/navigation point. The callsign, type, and full three-dimensional point are required by DCS.
	 *
	 * @param coalitionId Value from `coalition.side`.
	 * @param referencePoint Complete reference-point data.
	 * @returns Nothing.
	 * @example `coalition.addRefPoint(coalition.side.BLUE, { callsign: 1, type: 0, point: { x: 0, y: 0, z: 0 } });`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_addRefPoint
	 */
	addRefPoint(
		coalitionId: number,
		referencePoint: CoalitionReferencePoint,
	): void;

	/**
	 * Dynamically creates a static object for a country.
	 *
	 * @param countryId Value from `country.id`.
	 * @param objectData Mission-format static-object data.
	 * @returns Created static object.
	 * @example `const object = coalition.addStaticObject(country.id.USA, objectData);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_addStaticObject
	 */
	addStaticObject(
		countryId: number,
		objectData: CoalitionSpawnData,
	): l_StaticObject;

	/**
	 * Returns groups belonging to a coalition. Supplying `groupCategory`
	 * restricts the result to that category; omitting it returns groups from all
	 * categories. Category values are defined by `Group.Category`.
	 *
	 * @param coalitionId Coalition identifier, normally `coalition.side.RED`, `BLUE`, or `NEUTRAL`.
	 * @param groupCategory Optional group category such as `Group.Category.AIRPLANE` or `GROUND`.
	 * @returns Group objects currently belonging to the requested coalition and category.
	 *
	 * @example
	 * ```ts
	 * const blueAircraft = coalition.getGroups(
	 * 	coalition.side.BLUE,
	 * 	Group.Category.AIRPLANE,
	 * );
	 * for (const group of blueAircraft) env.info(group.getName());
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getGroups
	 */
	getGroups(coalitionId: number, groupCategory?: number): l_Group[];

	/**
	 * Returns airbase-like objects assigned to a coalition. Results may include
	 * map airfields, FARPs, and ships that expose airbase services.
	 *
	 * @param coalitionId Coalition identifier whose airbases should be returned.
	 * @returns Airbases currently assigned to the coalition.
	 *
	 * @example
	 * ```ts
	 * for (const airbase of coalition.getAirbases(coalition.side.BLUE)) {
	 * 	env.info(`${airbase.getName()} is blue`);
	 * }
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getAirbases
	 */
	getAirbases(coalitionId: number): l_Airbase[];

	/**
	 * Returns static objects belonging to a coalition. This does not return
	 * active unit objects or scenery objects.
	 *
	 * @param coalitionId Coalition identifier whose static objects should be returned.
	 * @returns Static objects currently assigned to the coalition.
	 *
	 * @example
	 * ```ts
	 * const redStatics = coalition.getStaticObjects(coalition.side.RED);
	 * for (const object of redStatics) env.info(object.getName());
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getStaticObjects
	 */
	getStaticObjects(coalitionId: number): l_StaticObject[];

	/**
	 * Returns player-controlled units currently spawned for a coalition. Combined Arms-controlled units may be omitted.
	 *
	 * @param coalitionId Value from `coalition.side`.
	 * @returns Player units.
	 * @example `const bluePlayers = coalition.getPlayers(coalition.side.BLUE);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getPlayers
	 */
	getPlayers(coalitionId: number): l_Unit[];

	/**
	 * Returns units providing a coalition service such as tanker, AWACS, or FAC.
	 *
	 * @param coalitionId Value from `coalition.side`.
	 * @param service Value from `coalition.service`.
	 * @returns Service-provider units.
	 * @example `const tankers = coalition.getServiceProviders(coalition.side.BLUE, coalition.service.TANKER);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getServiceProviders
	 */
	getServiceProviders(coalitionId: number, service: number): l_Unit[];

	/**
	 * Returns all reference points belonging to a coalition. Missions without reference points can return nothing.
	 *
	 * @param coalitionId Value from `coalition.side`.
	 * @returns Reference-point records, or `undefined` when none are configured.
	 * @example `const points = coalition.getRefPoints(coalition.side.BLUE) ?? [];`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getRefPoints
	 */
	getRefPoints(coalitionId: number): CoalitionReferencePoint[] | undefined;

	/**
	 * Returns the coalition's primary reference point.
	 *
	 * @param coalitionId Value from `coalition.side`.
	 * @returns Main reference point, or `undefined` when none exists.
	 * @example `const bullseye = coalition.getMainRefPoint(coalition.side.BLUE);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getMainRefPoint
	 */
	getMainRefPoint(coalitionId: number): CoalitionReferencePoint | undefined;

	/**
	 * Maps a country to its current coalition.
	 *
	 * @param countryId Value from `country.id`.
	 * @returns Value from `coalition.side`.
	 * @example `const side = coalition.getCountryCoalition(country.id.USA);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCountryCoalition
	 */
	getCountryCoalition(countryId: number): number;
}
