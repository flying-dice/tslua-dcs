/** @noSelfInFile */

import type { l_terrain, TerrainPoint, TerrainSurfaceType } from "../../../src";
import { copy, type DoubleContext } from "../context";
import {
	COAST_Y,
	geoToLocal,
	heightAt,
	isSea,
	localToGeo,
	RAIL_Y,
	ROAD_HALF_WIDTH,
	ROAD_Y,
	SEA_DEPTH,
} from "../geography";

/** MGRS-like letters (I and O omitted, as in MGRS). */
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const SQUARE = 100000;
/** Northings are negative in the fixture theatre (x around -300 km), so their letters are offset. */
const OFFSET = 12;

/**
 * Formats a local point as `"37T <east letter><north letter> <easting> <northing>"`. The letters
 * encode the 100 km square and the digits the metres inside it, so the double's
 * `convertMGRStoMeters` inverts it to the metre. It looks like MGRS but is not a real conversion.
 */
function toMgrs(x: number, y: number): string {
	const east = math.floor(y / SQUARE);
	const north = math.floor(x / SQUARE);
	const eastLetter = string.sub(LETTERS, east + 1, east + 1);
	const northLetter = string.sub(
		LETTERS,
		north + OFFSET + 1,
		north + OFFSET + 1,
	);
	return string.format(
		"37T %s%s %05d %05d",
		eastLetter,
		northLetter,
		math.floor(y - east * SQUARE),
		math.floor(x - north * SQUARE),
	);
}

function fromMgrs(mgrs: string): LuaMultiReturn<[number, number]> {
	const [, , eastLetter, northLetter, easting, northing] = string.find(
		mgrs,
		"^%d+%a (%a)(%a) (%d+) (%d+)$",
	);
	if (eastLetter === undefined)
		return error(`convertMGRStoMeters: malformed MGRS "${mgrs}"`, 2);
	const [east] = string.find(LETTERS, eastLetter as string, 1, true);
	const [north] = string.find(LETTERS, northLetter as string, 1, true);
	return $multi(
		((north as number) - 1 - OFFSET) * SQUARE + (tonumber(northing) as number),
		((east as number) - 1) * SQUARE + (tonumber(easting) as number),
	);
}

function surfaceAt(x: number, y: number): TerrainSurfaceType {
	if (isSea(x, y)) return y < COAST_Y - 1000 ? "sea" : "shallowWater";
	if (math.abs(y - ROAD_Y) <= ROAD_HALF_WIDTH) return "road";
	return "land";
}

function season(month: number): string {
	if (month === 12 || month <= 2) return "winter";
	if (month <= 5) return "spring";
	if (month <= 8) return "summer";
	return "autumn";
}

/**
 * `terrain` double over the flat-earth model in `geography.ts`. Paths are straight lines, the road
 * network is one road and one railway, and line of sight samples the terrain along the segment.
 */
export function createTerrain(ctx: DoubleContext): l_terrain {
	const s = () => ctx.state();
	const lineY = (roadType: "roads" | "railroads") =>
		roadType === "roads" ? ROAD_Y : RAIL_Y;
	const runways = () => [
		{
			name: "07",
			heading: 1.22,
			start: { x: -318000, y: 635000 },
			finish: { x: -317000, y: 638000 },
		},
	];

	return {
		convertLatLonToMeters: (latitude, longitude) =>
			geoToLocal(latitude, longitude),
		convertMetersToLatLon: (x, y) => localToGeo(x, y),
		GetMGRScoordinates: (x, y) => toMgrs(x, y),
		convertMGRStoMeters: (mgrs) => fromMgrs(mgrs),

		GetHeight: (x, y) => heightAt(x, y),
		GetSurfaceHeightWithSeabed: (x, y) => {
			if (isSea(x, y)) return $multi(0, SEA_DEPTH);
			return $multi(heightAt(x, y), 0);
		},
		GetSurfaceType: (x, y) => surfaceAt(x, y),
		isVisible: (x1, altitude1, y1, x2, altitude2, y2) => {
			const steps = 32;
			for (let step = 0; step <= steps; step++) {
				const t = step / steps;
				const x = x1 + (x2 - x1) * t;
				const y = y1 + (y2 - y1) * t;
				if (altitude1 + (altitude2 - altitude1) * t < heightAt(x, y))
					return false;
			}
			return true;
		},

		FindOptimalPath: (x1, y1, x2, y2) => [
			{ x: x1, y: y1 },
			{ x: x2, y: y2 },
		],
		findPathOnRoads: (roadType, x1, _y1, x2, _y2) => {
			const y = lineY(roadType);
			const path: TerrainPoint[] = [
				{ x: x1, y },
				{ x: x2, y },
			];
			return path;
		},
		FindNearestPoint: (x, y, radius) => {
			if (math.abs(y - ROAD_Y) <= radius) return $multi(x, ROAD_Y);
			return $multi(x, y);
		},
		getClosestPointOnRoads: (roadType, x) => $multi(x, lineY(roadType)),
		getClosestValidPoint: (surfaceType, x, y) => {
			if (surfaceType === "road") return $multi(x, ROAD_Y);
			const wantSea = surfaceType === "sea" || surfaceType === "shallowWater";
			if (wantSea === isSea(x, y)) return $multi(x, y);
			return $multi(x, wantSea ? COAST_Y - 2000 : COAST_Y);
		},

		GetTerrainConfig: <T>(key: string) => copy(s().terrainConfig[key]) as T,
		GetSeasons: () => [
			{ name: "winter", months: [12, 1, 2] },
			{ name: "spring", months: [3, 4, 5] },
			{ name: "summer", months: [6, 7, 8] },
			{ name: "autumn", months: [9, 10, 11] },
		],
		getTechSkinByDate: (_day, month) => season(month),
		getTempratureRangeByDate: (_day, month) => {
			const name = season(month);
			if (name === "winter") return $multi(-5, 8);
			if (name === "summer") return $multi(18, 32);
			return $multi(6, 20);
		},
		getBeacons: () => [
			{
				beaconId: "airfield21_0",
				type: 4,
				callsign: "KBL",
				frequency: 870000,
				position: [-317948, 18, 636639],
			},
		],
		getRadio: () => [
			{
				radioId: "airfield21_0",
				frequency: [[0, 133000000]],
				callsign: [[0, "Kobuleti"]],
			},
		],
		getRunwayList: () => runways(),
		getRunwayHeading: () => runways()[0].heading,
		getStandList: (_roadnet, fields) => {
			const stands: Record<string, unknown>[] = [
				{ id: 1, name: "01", SHELTER: false, WIDTH: 20, x: -317900, y: 636600 },
				{ id: 2, name: "02", SHELTER: true, WIDTH: 25, x: -317880, y: 636620 },
			];
			if (fields === undefined) return stands;
			return stands.map((stand) => {
				const projected: Record<string, unknown> = {
					id: stand.id,
					x: stand.x,
					y: stand.y,
				};
				for (const field of fields) projected[field] = stand[field];
				return projected;
			});
		},
		getObjectsAtMapPoint: () => [],
		getObjectPosition: () => $multi(-317948, 636639),

		Init: (configFile, reason, date) => {
			ctx.native("terrain.Init", [configFile, reason, date]);
			s().terrainInitialized = true;
			return true;
		},
		InitLight: (configFile, reason, date) => {
			ctx.native("terrain.InitLight", [configFile, reason, date]);
			s().terrainInitialized = true;
			return true;
		},
		Release: () => {
			ctx.native("terrain.Release", []);
			s().terrainInitialized = false;
		},
		Create: (...arguments_) => ctx.native("terrain.Create", arguments_),
		getCrossParam: (...arguments_) =>
			ctx.native("terrain.getCrossParam", arguments_),
		getTerrainShpare: (...arguments_) =>
			ctx.native("terrain.getTerrainShpare", arguments_),
	};
}
