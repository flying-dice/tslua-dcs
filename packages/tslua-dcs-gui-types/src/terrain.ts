/**
 * A point in DCS terrain's two-dimensional X/Y ground plane.
 */
export interface TerrainPoint {
	x: number;
	y: number;
}

/**
 * Values returned by `Terrain.GetSurfaceType`.
 */
export type TerrainSurfaceType = "land" | "sea" | "road" | "shallowWater";

/**
 * Native terrain services exposed to GUI, Mission Editor, hook, and mod scripts.
 *
 * @noSelf
 * @see [Authoritative executable examples](https://github.com/flying-dice/tslua-dcs/blob/main/packages/tslua-dcs-gui-types_test/src/terrain_test.ts)
 */
export interface l_terrain {
	/**
	 * Converts decimal latitude/longitude to local terrain metres.
	 *
	 * @example `const [x, y] = terrain.convertLatLonToMeters(41.6103, 41.5997);`
	 * @see %DCS_INSTALL_DIR%/dxgui/bind/NewMapView.lua:329
	 */
	convertLatLonToMeters(
		latitude: number,
		longitude: number,
	): LuaMultiReturn<[number, number]>;
	/**
	 * Converts local terrain metres to decimal latitude/longitude.
	 *
	 * @example `const [lat, lon] = terrain.convertMetersToLatLon(x, y);`
	 * @see %DCS_INSTALL_DIR%/dxgui/bind/NewMapView.lua:329
	 */
	convertMetersToLatLon(x: number, y: number): LuaMultiReturn<[number, number]>;
	/**
	 * Converts local metres to a formatted MGRS coordinate.
	 *
	 * @example `const mgrs = terrain.GetMGRScoordinates(x, y);`
	 * @see %DCS_INSTALL_DIR%/Scripts/UI/coords_info.lua:133
	 */
	GetMGRScoordinates(x: number, y: number): string;
	/**
	 * Converts a DCS-formatted MGRS coordinate to local metres.
	 *
	 * @example `const [x, y] = terrain.convertMGRStoMeters("38T KM 12345 67890");`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/me_setCoordPanel.lua:168
	 */
	convertMGRStoMeters(mgrs: string): LuaMultiReturn<[number, number]>;

	/**
	 * Returns terrain elevation above sea level in metres.
	 *
	 * @example `const elevation = terrain.GetHeight(x, y);`
	 */
	GetHeight(x: number, y: number): number;
	/**
	 * Returns surface elevation and seabed depth in metres.
	 *
	 * @example `const [height, depth] = terrain.GetSurfaceHeightWithSeabed(x, y);`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/me_map_window.lua:1114
	 */
	GetSurfaceHeightWithSeabed(
		x: number,
		y: number,
	): LuaMultiReturn<[number, number]>;
	/**
	 * Classifies the terrain surface at a point.
	 *
	 * @example `const surface = terrain.GetSurfaceType(x, y);`
	 * @see %DCS_INSTALL_DIR%/Scripts/UI/InstantActionGenerator/InstantActionEditor.lua:1216
	 */
	GetSurfaceType(x: number, y: number): TerrainSurfaceType;
	/**
	 * Tests line of sight between two terrain points with explicit altitudes.
	 *
	 * @example `const visible = terrain.isVisible(x1, altitude1, y1, x2, altitude2, y2);`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/me_utilities.lua:1292
	 */
	isVisible(
		x1: number,
		altitude1: number,
		y1: number,
		x2: number,
		altitude2: number,
		y2: number,
	): boolean;

	/**
	 * Finds an optimal cross-country path.
	 *
	 * @returns Ordered ground-plane points.
	 * @example `const path = terrain.FindOptimalPath(x1, y1, x2, y2);`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/me_mission.lua:6469
	 */
	FindOptimalPath(
		x1: number,
		y1: number,
		x2: number,
		y2: number,
	): TerrainPoint[];
	/**
	 * Finds a route following the requested road network.
	 *
	 * @example `const path = terrain.findPathOnRoads("roads", x1, y1, x2, y2);`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/me_mission.lua:6467
	 */
	findPathOnRoads(
		roadType: "roads" | "railroads",
		x1: number,
		y1: number,
		x2: number,
		y2: number,
	): TerrainPoint[];
	/**
	 * Finds the nearest navigable point within `radius` metres.
	 *
	 * @example `const [roadX, roadY] = terrain.FindNearestPoint(x, y, 40000);`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/me_mission.lua:6490
	 */
	FindNearestPoint(
		x: number,
		y: number,
		radius: number,
	): LuaMultiReturn<[number, number]>;
	/**
	 * Finds the closest point on a road or railroad network.
	 *
	 * @example `const [roadX, roadY] = terrain.getClosestPointOnRoads("roads", x, y);`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/me_mission.lua:6488
	 */
	getClosestPointOnRoads(
		roadType: "roads" | "railroads",
		x: number,
		y: number,
	): LuaMultiReturn<[number, number]>;
	/**
	 * Finds the closest point with the requested surface classification.
	 *
	 * @example `const [landX, landY] = terrain.getClosestValidPoint("land", x, y);`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/me_vehicle.lua:1794
	 */
	getClosestValidPoint(
		surfaceType: TerrainSurfaceType,
		x: number,
		y: number,
	): LuaMultiReturn<[number, number]>;

	/**
	 * Reads a named value from the active theatre configuration. The value type depends on `key`.
	 *
	 * @example `const theatre = terrain.GetTerrainConfig<string>("id");`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/me_terrainDATA.lua:20
	 */
	GetTerrainConfig<T = unknown>(key: string): T;
	/**
	 * Returns season descriptors supported by the active theatre.
	 *
	 * @example `const seasons = terrain.GetSeasons();`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/me_simple_generator_dialog.lua:201
	 */
	GetSeasons(): unknown[];
	/**
	 * Returns the technical-texture season for a calendar day/month.
	 *
	 * @example `const season = terrain.getTechSkinByDate(15, 6);`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/me_static.lua:1911
	 */
	getTechSkinByDate(day: number, month: number): string;
	/**
	 * Returns the theatre's minimum and maximum temperature for a calendar day/month.
	 *
	 * @example `const [minimum, maximum] = terrain.getTempratureRangeByDate(15, 6);`
	 */
	getTempratureRangeByDate(
		day: number,
		month: number,
	): LuaMultiReturn<[number, number]>;

	/**
	 * Returns theatre beacon records. Their fields vary by beacon type and module.
	 *
	 * @example `const beacons = terrain.getBeacons();`
	 * @see %DCS_INSTALL_DIR%/Scripts/UI/DTC_manager/DTC_manager_PanelCommon.lua:540
	 */
	getBeacons(): Array<Record<string, unknown>>;
	/**
	 * Returns theatre radio metadata. Its nested schema is theatre-defined.
	 *
	 * @example `const radio = terrain.getRadio();`
	 * @see %DCS_INSTALL_DIR%/Scripts/UI/BriefingDialog.lua:384
	 */
	getRadio(): unknown;
	/**
	 * Returns runway records for an airdrome roadnet.
	 *
	 * @example `const runways = terrain.getRunwayList(airdrome.roadnet);`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/Mission/BeaconData.lua:259
	 */
	getRunwayList(roadnet: unknown): Array<Record<string, unknown>>;
	/**
	 * Returns the primary runway heading in radians for an airdrome roadnet.
	 *
	 * @example `const heading = terrain.getRunwayHeading(airdrome.roadnet);`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/Mission/AirdromeData.lua:130
	 */
	getRunwayHeading(roadnet: unknown): number;
	/**
	 * Returns parking stands, optionally projecting named stand fields.
	 *
	 * @example `const stands = terrain.getStandList(airdrome.roadnet, ["SHELTER", "WIDTH"]);`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/me_parking.lua:26
	 */
	getStandList(
		roadnet: unknown,
		fields?: string[],
	): Array<Record<string, unknown>>;
	/**
	 * Returns object identifiers located at a map point.
	 *
	 * @example `const objects = terrain.getObjectsAtMapPoint(x, y);`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/me_contextMenu.lua:118
	 */
	getObjectsAtMapPoint(x: number, y: number): unknown[];
	/**
	 * Resolves a terrain object identifier to local X/Y metres.
	 *
	 * @example `const [x, y] = terrain.getObjectPosition(objectId);`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/Mission/AirdromeData.lua:76
	 */
	getObjectPosition(objectId: unknown): LuaMultiReturn<[number, number]>;

	/**
	 * Initializes the full native terrain service. This changes global GUI terrain state.
	 *
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/me_map_window.lua:862
	 */
	Init(configFile: string, reason: unknown, date: unknown): boolean;
	/**
	 * Initializes the lightweight terrain service. This changes global GUI terrain state.
	 *
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/me_simple_generator_dialog.lua:179
	 */
	InitLight(configFile: string, reason: unknown, date: unknown): boolean;
	/**
	 * Releases the active native terrain service.
	 *
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/me_map_window.lua:755
	 */
	Release(): void;
	/**
	 * TODO: native constructor exported by this DCS build; no installed Lua callsite or public schema exposes its contract.
	 */
	Create(...arguments_: unknown[]): unknown;
	/**
	 * TODO: native cross-section helper exported by this DCS build; no installed Lua callsite proves its contract.
	 */
	getCrossParam(...arguments_: unknown[]): unknown;
	/**
	 * TODO: misspelled native shape helper exported by this DCS build; no installed Lua callsite proves its contract.
	 */
	getTerrainShpare(...arguments_: unknown[]): unknown;
}
