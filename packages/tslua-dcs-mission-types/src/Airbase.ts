import type { l_Unit } from "./Unit";
import type { l_Warehouse } from "./Warehouse";
import type { l_Position3, l_Vec3 } from "./coord";
import type { _Airbase } from "./exports/Airbase.export";

export interface AirbaseParkingSpot {
	Term_Index: number;
	vTerminalPos: l_Vec3;
	TO_AC: boolean;
	Term_Index_0: number;
	Term_Type: number;
	fDistToRW: number;
}

export interface AirbaseRunway {
	course: number;
	Name: number | string;
	position: l_Vec3;
	length: number;
	width: number;
}

export type AirbaseDesc = {
	/**
	 * Maximum life of the airbase object.
	 */
	life: number;
	/**
	 * DCS database attributes supported by the airbase.
	 */
	attributes: Record<string, boolean>;
	/**
	 * Database module that supplied the object definition.
	 */
	_origin: "";
	/**
	 * Descriptor category identifier.
	 */
	category: number;
	/**
	 * Internal DCS type name.
	 */
	typeName: string;
	/**
	 * Localized display name.
	 */
	displayName: string;
};

export interface l_Airbase extends _Airbase {
	/**
	 * Returns current airbase hit points.
	 *
	 * @example `const life = base.getLife();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getLife
	 */
	getLife(): number;
	/**
	 * Finds the nearest airbase belonging to `coalitionId`. This is a static function on `Airbase`.
	 *
	 * @noSelf
	 * @example `const nearest = Airbase.getNearest(point, coalition.side.BLUE);`
	 * @see %DCS_INSTALL_DIR%/Scripts/GeneratedTasks/modules/one_plane_airborn_4sq_blue.lua:486
	 */
	getNearest(point: l_Vec3, coalitionId: number): l_Airbase | undefined;
	/**
	 * Returns the engine world identifier used by lower-level GUI/mission systems.
	 *
	 * @example `const id = base.getWorldID();`
	 */
	getWorldID(): number;
	/**
	 * Returns the force/localization name used by engine UI systems.
	 *
	 * @example `const name = base.getForcesName();`
	 */
	getForcesName(): string;
	/**
	 * TODO: native engine communicator object is exported but its userdata API is not present in installed Lua sources.
	 */
	getCommunicator(): unknown;
	/**
	 * Removes the airbase object from the mission when DCS permits it.
	 *
	 * @returns Nothing.
	 * @example `if (base.isExist()) base.destroy();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_destroy
	 */
	destroy(): void;
	/**
	 * Returns all database attributes assigned to the airbase.
	 *
	 * @returns Attribute membership flags.
	 * @example `const attributes = base.getAttributes();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getAttributes
	 */
	getAttributes(): Record<string, boolean>;
	/**
	 * Returns the airbase transform.
	 *
	 * @returns Position and orientation axes.
	 * @example `const transform = base.getPosition();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getPosition
	 */
	getPosition(): l_Position3;
	/**
	 * Returns airbase velocity in world axes.
	 *
	 * @returns Metres per second.
	 * @example `const velocity = base.getVelocity();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getVelocity
	 */
	getVelocity(): l_Vec3;
	/**
	 * Tests a database attribute.
	 *
	 * @param attribute Attribute name.
	 * @returns Whether it is present.
	 * @example `const carrier = base.hasAttribute("AircraftCarrier");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_hasAttribute
	 */
	hasAttribute(attribute: string): boolean;
	/**
	 * Reports whether the airbase is airborne, principally for ship airbases.
	 *
	 * @returns In-air state.
	 * @example `const airborne = base.inAir();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_inAir
	 */
	inAir(): boolean;
	/**
	 * Reports whether the airbase still exists.
	 *
	 * @returns Existence state.
	 * @example `if (base.isExist()) env.info(base.getName());`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_isExist
	 */
	isExist(): boolean;
	/**
	 * Returns the internal DCS database type name.
	 *
	 * @returns Type name.
	 * @example `env.info(base.getTypeName());`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getTypeName
	 */
	getTypeName(): string;

	/**
	 * Enables automatic coalition capture for the airbase.
	 *
	 * @param enabled Desired capture behavior.
	 * @returns Nothing.
	 * @example `base.autoCapture(true);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_autoCapture
	 */
	autoCapture(enabled: boolean): void;

	/**
	 * Reports whether automatic coalition capture is enabled.
	 *
	 * @returns Auto-capture state.
	 * @example `const capturable = base.autoCaptureIsOn();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_autoCaptureIsOn
	 */
	autoCaptureIsOn(): boolean;

	/**
	 * Returns an airbase descriptor without requiring an instance in the mission. This is a static function on the global `Airbase` table; do not call it on an `l_Airbase` instance.
	 *
	 * @param typeName Internal airbase type name.
	 * @returns Descriptor, or `undefined` when unknown.
	 * @example `const desc = Airbase.getDescByName("Batumi");`
	 * @noSelf
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getDescByName
	 */
	getDescByName(typeName: string): AirbaseDesc | undefined;

	/**
	 * Returns the localized airbase callsign.
	 *
	 * @returns Callsign.
	 * @example `env.info(base.getCallsign());`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCallsign
	 */
	getCallsign(): string;

	/**
	 * Returns the unit represented by a ship airbase; land airbases normally return `undefined`.
	 *
	 * @returns Associated ship unit when applicable.
	 * @example `const carrier = base.getUnit();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getUnit
	 */
	getUnit(): l_Unit | undefined;

	/**
	 * Returns all parking positions, or only presently available positions.
	 *
	 * @param available When `true`, filter out occupied/unavailable spots.
	 * @returns Parking records.
	 * @example `const freeParking = base.getParking(true);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getParking
	 */
	getParking(available?: boolean): AirbaseParkingSpot[];

	/**
	 * Returns runway geometry and identifiers.
	 *
	 * @returns Runway records.
	 * @example `for (const runway of base.getRunways()) env.info(`${runway.Name}`);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getRunways
	 */
	getRunways(): AirbaseRunway[];

	/**
	 * Returns the dispatcher/tower position record.
	 *
	 * @returns Tower position, or `undefined` when unavailable.
	 * @example `const tower = base.getDispatcherTowerPos()?.pos;`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getDispatcherTowerPos
	 */
	getDispatcherTowerPos(): { pos: l_Vec3 } | undefined;

	/**
	 * Reports whether the airbase radio is in silent mode.
	 *
	 * @returns Radio-silent state.
	 * @example `const silent = base.getRadioSilentMode();`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getRadioSilentMode
	 */
	getRadioSilentMode(): boolean;

	/**
	 * Enables or disables airbase radio-silent mode.
	 *
	 * @param enabled Desired state.
	 * @returns Nothing.
	 * @example `base.setRadioSilentMode(true);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setRadioSilentMode
	 */
	setRadioSilentMode(enabled: boolean): void;

	/**
	 * Changes the coalition controlling the airbase.
	 *
	 * @param coalitionId Value from `coalition.side`.
	 * @returns Nothing.
	 * @example `base.setCoalition(coalition.side.BLUE);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_setCoalition
	 */
	setCoalition(coalitionId: number): void;
	/**
	 * Returns the airbase identifier. Map aerodromes use numeric IDs, while ships
	 * and helipads may use strings. IDs are unique within an airbase category;
	 * different categories can contain overlapping values.
	 *
	 * @returns Numeric aerodrome ID or string ship/helipad ID.
	 *
	 * @example
	 * ```ts
	 * const base = Airbase.getByName("Batumi");
	 * if (base) env.info(`Airbase ID: ${base.getID()}`);
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getID
	 */
	getID(): number | string;

	/**
	 * Returns the airbase reference point in local DCS world coordinates. For a
	 * moving ship, the point follows the ship.
	 *
	 * @returns Position in metres using DCS's X/north, Y/up, Z/east axes.
	 *
	 * @example
	 * ```ts
	 * const point = Airbase.getByName("Batumi")?.getPoint();
	 * if (point) env.info(`Batumi elevation: ${point.y} m`);
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getPoint
	 */
	getPoint(): l_Vec3;

	/**
	 * Returns the airbase's mission-visible name.
	 *
	 * @returns Airbase name.
	 *
	 * @example
	 * ```ts
	 * for (const base of world.getAirbases()) env.info(base.getName());
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getName
	 */
	getName(): string;

	/**
	 * Returns the coalition currently controlling the airbase. A capturable base
	 * can change coalition during a mission.
	 *
	 * @returns Coalition identifier from `coalition.side`.
	 *
	 * @example
	 * ```ts
	 * const base = Airbase.getByName("Batumi");
	 * if (base?.getCoalition() === coalition.side.BLUE) env.info("Batumi is blue");
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCoalition
	 */
	getCoalition(): number;

	/**
	 * Returns the inherited broad object category. Use `getCategoryEx()` to
	 * distinguish airdromes, helipads/FARPs, and ships.
	 *
	 * @returns Category identifier from `Object.Category`.
	 *
	 * @example
	 * ```ts
	 * const base = Airbase.getByName("Batumi");
	 * if (base?.getCategory() === Object.Category.BASE) env.info("Airbase object");
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCategory
	 */
	getCategory(): number;

	/**
	 * Returns whether the airbase is an airdrome, helipad/FARP, or ship.
	 *
	 * @returns Value from `Airbase.Category`.
	 * @example `const isAirfield = base.getCategoryEx() === Airbase.Category.AIRDROME;`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCategoryEx
	 */
	getCategoryEx(): number;

	/**
	 * Returns the warehouse associated with the airbase. Use it to inspect or
	 * modify aircraft, weapon, and fuel stocks when warehouse logistics are in use.
	 *
	 * @returns Airbase warehouse object.
	 *
	 * @example
	 * ```ts
	 * const base = Airbase.getByName("Batumi");
	 * const inventory = base?.getWarehouse().getInventory();
	 * if (inventory) env.info(`Jet fuel: ${inventory.liquids[LiquidType.JETFUEL]}`);
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getWarehouse
	 */
	getWarehouse(): l_Warehouse;

	/**
	 * Looks up an airbase, FARP, or airbase-capable ship by its exact name.
	 *
	 * @param name Exact airbase name.
	 * @returns Matching airbase object, or `undefined` when not found.
	 *
	 * @example
	 * ```ts
	 * const batumi = Airbase.getByName("Batumi");
	 * if (!batumi) env.warning("Batumi is unavailable");
	 * ```
	 *
	 * @noSelf
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getByName
	 */
	getByName(name: string): l_Airbase | undefined;

	/**
	 * Returns the country assigned to the airbase object.
	 *
	 * @returns Country identifier from `country.id`.
	 *
	 * @example
	 * ```ts
	 * const countryId = Airbase.getByName("Batumi")?.getCountry();
	 * if (countryId !== undefined) env.info(`Country ID: ${countryId}`);
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getCountry
	 */
	getCountry(): number;

	/**
	 * Returns database metadata describing the airbase object. Descriptor values
	 * describe the type rather than its changing runtime state.
	 *
	 * @returns Airbase descriptor.
	 *
	 * @example
	 * ```ts
	 * const desc = Airbase.getByName("Batumi")?.getDesc();
	 * if (desc) env.info(`${desc.displayName}: ${desc.life} life`);
	 * ```
	 *
	 * @see https://wiki.hoggitworld.com/view/DCS_func_getDesc
	 */
	getDesc(): AirbaseDesc;
}
