import type {
	l_atmosphere,
	l_coord,
	l_land,
	l_MGRS,
	l_Vec2,
	l_Vec3,
} from "@flying-dice/tslua-dcs-mission-types";
import { surfaceType } from "./constants";
import type { Double } from "./runtime";

/**
 * Geography of the doubles: a flat-earth (equirectangular) projection around a Caucasus origin, sea
 * wherever x <= -360000 (land, including Batumi, above that), gentle terrain rising inland and a road
 * grid every 1000 m. It is deterministic and invertible, not accurate.
 */
const originLatitude = 45.129497;
const originLongitude = 34.265515;
const metresPerDegree = 111320;
const cosOrigin = math.cos(math.rad(originLatitude));
const seaEdge = -360000;

function toLO(lat: number, lon: number, alt: number): l_Vec3 {
	return {
		x: (lat - originLatitude) * metresPerDegree,
		y: alt,
		z: (lon - originLongitude) * metresPerDegree * cosOrigin,
	};
}

function toLL(point: l_Vec3): LuaMultiReturn<[number, number, number]> {
	return $multi(
		originLatitude + point.x / metresPerDegree,
		originLongitude + point.z / (metresPerDegree * cosOrigin),
		point.y,
	);
}

function isSea(x: number): boolean {
	return x <= seaEdge;
}

/** Terrain height at (x, z): 0 at sea, rising slowly inland. */
export function terrainHeight(x: number, z: number): number {
	if (isSea(x)) return 0;
	return 10 + math.abs(math.sin(z / 5000)) * 5 + (x - seaEdge) / 1000;
}

function roundToGrid(value: number): number {
	return math.floor(value / 1000 + 0.5) * 1000;
}

export const coord = {
	LLtoLO: (lat: number, lon: number, alt: number) => toLO(lat, lon, alt),
	LOtoLL: (vec3: l_Vec3) => toLL(vec3),
	LLtoMGRS: (lat: number, lon: number): l_MGRS => {
		const point = toLO(lat, lon, 0);
		return {
			UTMZone: "37T",
			MGRSDigraph: "GG",
			Easting: math.floor(point.z + 0.5),
			Northing: math.floor(point.x + 0.5),
		};
	},
	MGRStoLL: (mgrs: l_MGRS): LuaMultiReturn<[number, number]> => {
		const [lat, lon] = toLL({ x: mgrs.Northing, y: 0, z: mgrs.Easting });
		return $multi(lat, lon);
	},
} satisfies Double<l_coord>;

export const land = {
	SurfaceType: { ...surfaceType },
	getHeight: (point: l_Vec2) => terrainHeight(point.x, point.y),
	getSurfaceHeightWithSeabed: (
		point: l_Vec2,
	): LuaMultiReturn<[number, number]> => {
		if (isSea(point.x)) return $multi(0, 50);
		return $multi(terrainHeight(point.x, point.y), 0);
	},
	getSurfaceType: (point: l_Vec2) => {
		if (isSea(point.x)) return surfaceType.WATER;
		if (point.x % 1000 === 0 || point.y % 1000 === 0) return surfaceType.ROAD;
		return surfaceType.LAND;
	},
	getIP: (
		origin: l_Vec3,
		direction: l_Vec3,
		distance: number,
	): l_Vec3 | undefined => {
		const length = math.sqrt(
			direction.x * direction.x +
				direction.y * direction.y +
				direction.z * direction.z,
		);
		if (length === 0) return undefined;
		const step = 10;
		for (let travelled = 0; travelled <= distance; travelled += step) {
			const point = {
				x: origin.x + (direction.x / length) * travelled,
				y: origin.y + (direction.y / length) * travelled,
				z: origin.z + (direction.z / length) * travelled,
			};
			const ground = terrainHeight(point.x, point.z);
			if (point.y <= ground) return { x: point.x, y: ground, z: point.z };
		}
		return undefined;
	},
	isVisible: (origin: l_Vec3, destination: l_Vec3): boolean => {
		const samples = 20;
		for (let index = 0; index <= samples; index++) {
			const t = index / samples;
			const x = origin.x + (destination.x - origin.x) * t;
			const y = origin.y + (destination.y - origin.y) * t;
			const z = origin.z + (destination.z - origin.z) * t;
			if (y < terrainHeight(x, z)) return false;
		}
		return true;
	},
	profile: (origin: l_Vec3, destination: l_Vec3): l_Vec3[] => {
		const samples = 10;
		const result: l_Vec3[] = [];
		for (let index = 0; index <= samples; index++) {
			const t = index / samples;
			const x = origin.x + (destination.x - origin.x) * t;
			const z = origin.z + (destination.z - origin.z) * t;
			result.push({ x, y: terrainHeight(x, z), z });
		}
		return result;
	},
	findPathOnRoads: (
		_roadType: "roads" | "rails",
		x: number,
		y: number,
		destinationX: number,
		destinationY: number,
	): l_Vec2[] => [
		{ x: roundToGrid(x), y: roundToGrid(y) },
		{ x: roundToGrid(destinationX), y: roundToGrid(y) },
		{ x: roundToGrid(destinationX), y: roundToGrid(destinationY) },
	],
	getClosestPointOnRoads: (
		_roadType: "roads" | "railroads",
		x: number,
		y: number,
	): LuaMultiReturn<[number, number]> => {
		const gridX = roundToGrid(x);
		const gridY = roundToGrid(y);
		if (math.abs(gridX - x) < math.abs(gridY - y)) return $multi(gridX, y);
		return $multi(x, gridY);
	},
} satisfies Double<l_land>;

/** International Standard Atmosphere below 11 km, with a steady wind from the south-west. */
export const atmosphere = {
	getTemperatureAndPressure: (
		point: l_Vec3,
	): LuaMultiReturn<[number, number]> => {
		const altitude = math.min(math.max(point.y, 0), 11000);
		const temperature = 288.15 - 0.0065 * altitude;
		const pressure = 101325 * (temperature / 288.15) ** 5.25588;
		return $multi(temperature, pressure);
	},
	getWind: (point: l_Vec3): l_Vec3 => {
		const scale = 1 + math.max(point.y, 0) / 3000;
		return { x: 3 * scale, y: 0, z: 4 * scale };
	},
	getWindWithTurbulence: (point: l_Vec3): l_Vec3 => {
		const scale = 1 + math.max(point.y, 0) / 3000;
		const gust = math.sin(point.x / 100 + point.z / 100) * 0.5;
		return { x: 3 * scale + gust, y: gust / 2, z: 4 * scale - gust };
	},
} satisfies Double<l_atmosphere>;
