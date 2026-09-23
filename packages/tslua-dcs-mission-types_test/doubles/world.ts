import type {
	CoalitionReferencePoint,
	CoalitionSpawnData,
	l_Airbase,
	l_coalition,
	l_Group,
	l_Object,
	l_StaticObject,
	l_Unit,
	l_Vec3,
	l_world,
	l_WorldEvent,
	l_WorldEventHandler,
	WorldMarkPanel,
	WorldVolume,
} from "@flying-dice/tslua-dcs-mission-types";
import {
	birthPlace,
	coalitionService,
	country,
	objectCategory,
	side,
	volumeType,
	worldEvent,
} from "./constants";
import {
	airbaseInstance,
	groupInstance,
	objectInstance,
	staticInstance,
	unitInstance,
} from "./objects";
import type { Double } from "./runtime";
import {
	addGroup,
	addStatic,
	destroyGroup,
	distance,
	findGroup,
	findObject,
	type NewUnit,
	type ObjectRecord,
	liveGroups,
	liveObjects,
	state,
} from "./state";

/** Delivers an event to every handler the way DCS does: `handler:onEvent(event)`. */
export function dispatchEvent(event: l_WorldEvent): void {
	for (const handler of [...state.eventHandlers]) handler.onEvent(event);
}

function objectsOfCategory(category: number): ObjectRecord[] {
	return liveObjects().filter((record) => {
		if (category === objectCategory.UNIT) return record.kind === "unit";
		if (category === objectCategory.STATIC)
			return (
				record.kind === "static" && record.category === objectCategory.STATIC
			);
		if (category === objectCategory.CARGO)
			return (
				record.kind === "static" && record.category === objectCategory.CARGO
			);
		if (category === objectCategory.BASE) return record.kind === "airbase";
		if (category === objectCategory.WEAPON) return record.kind === "weapon";
		return false;
	});
}

function vec(value: unknown): l_Vec3 {
	return value as l_Vec3;
}

function inVolume(point: l_Vec3, volume: WorldVolume): boolean {
	const params = volume.params;
	if (volume.id === volumeType.SPHERE)
		return distance(point, vec(params.point)) <= (params.radius as number);
	if (volume.id === volumeType.BOX) {
		const min = vec(params.min);
		const max = vec(params.max);
		return (
			point.x >= min.x &&
			point.x <= max.x &&
			point.y >= min.y &&
			point.y <= max.y &&
			point.z >= min.z &&
			point.z <= max.z
		);
	}
	error(
		`world.searchObjects double supports SPHERE and BOX volumes, got volume id ${tostring(volume.id)}`,
		3,
	);
	return false;
}

function markPanel(mark: (typeof state.marks)[number]): WorldMarkPanel {
	return {
		idx: mark.idx,
		time: mark.time,
		coalition: mark.coalition,
		groupID: mark.groupID,
		text: mark.text,
		pos: { ...mark.pos },
	};
}

export const world = {
	BirthPlace: { ...birthPlace },
	VolumeType: { ...volumeType },
	event: { ...worldEvent },
	addEventHandler: (handler: l_WorldEventHandler) => {
		if (state.eventHandlers.indexOf(handler) === -1)
			state.eventHandlers.push(handler);
	},
	removeEventHandler: (handler: l_WorldEventHandler) => {
		state.eventHandlers = state.eventHandlers.filter(
			(candidate) => candidate !== handler,
		);
	},
	onEvent: (event: l_WorldEvent) => dispatchEvent(event),
	getPlayer: (): l_Unit | undefined => {
		for (const unit of liveObjects("unit"))
			if (unit.skill === "Player") return unitInstance(unit);
		return undefined;
	},
	getAirbases: (): l_Airbase[] => liveObjects("airbase").map(airbaseInstance),
	getMarkPanels: (): WorldMarkPanel[] => state.marks.map(markPanel),
	searchObjects: <T>(
		category: number | number[],
		volume: WorldVolume,
		handler: (this: void, object: l_Object, data: T) => boolean,
		data?: T,
	): number => {
		const categories =
			type(category) === "table"
				? (category as number[])
				: [category as number];
		let visited = 0;
		for (const item of categories) {
			for (const record of objectsOfCategory(item)) {
				if (!inVolume(record.point, volume)) continue;
				visited += 1;
				if (handler(objectInstance(record), data as T) === false)
					return visited;
			}
		}
		return visited;
	},
	removeJunk: (volume: WorldVolume): number => {
		inVolume({ x: 0, y: 0, z: 0 }, volume);
		return 0;
	},
	setPersistenceHandler: (name: string, handler: (this: void) => unknown) => {
		if (state.persistenceHandlers[name] === undefined)
			state.persistenceOrder.push(name);
		state.persistenceHandlers[name] = handler;
	},
	runPersistenceHandlers: (
		storageFunc: (this: void, name: string, value: unknown) => void,
	) => {
		for (const name of state.persistenceOrder) {
			const handler = state.persistenceHandlers[name];
			if (handler !== undefined) storageFunc(name, handler());
		}
	},
	getPersistenceData: (name: string): unknown => state.persistenceData[name],
	setPersistencePassthrough: (
		handler: (this: void, ...args: unknown[]) => unknown,
	) => {
		state.persistencePassthrough = handler;
	},
	weather: {
		getFogThickness: () => state.fog.thickness,
		getFogVisibilityDistance: () => state.fog.visibility,
		setFogThickness: (thickness: number) => {
			state.fog.thickness = thickness;
		},
		setFogVisibilityDistance: (visibility: number) => {
			state.fog.visibility = visibility;
		},
		setFogAnimation: (keys) => {
			state.fog.animation = keys;
		},
	},
} satisfies Double<l_world, "eventHandlers" | "persistenceHandlers">;

// ---------------------------------------------------------------------------------------------------
// coalition
// ---------------------------------------------------------------------------------------------------

const countryCoalition: Record<number, number> = {
	[country.USA]: side.BLUE,
	[country.GEORGIA]: side.BLUE,
	[country.RUSSIA]: side.RED,
};

function coalitionOfCountry(countryId: number): number {
	return countryCoalition[countryId] ?? side.NEUTRAL;
}

function spawnGroup(
	countryId: number,
	groupCategory: number,
	data: CoalitionSpawnData,
): l_Group {
	const name = data.name as string;
	if (type(name) !== "string")
		error("coalition.addGroup: group data needs a name", 3);
	const existing = findGroup(name);
	if (existing) destroyGroup(existing);
	const units = (data.units as NewUnit[] | undefined) ?? [];
	const group = addGroup({
		name,
		coalition: coalitionOfCountry(countryId),
		country: countryId,
		category: groupCategory,
		units,
	});
	if (data.lateActivation === true) group.active = false;
	for (const id of group.unitIds) {
		const unit = state.objects.get(id) as ObjectRecord;
		dispatchEvent({
			id: worldEvent.S_EVENT_BIRTH,
			time: state.time,
			initiator: unitInstance(unit),
		});
	}
	return groupInstance(group);
}

export const coalition = {
	side: { ...side },
	service: { ...coalitionService },
	addGroup: (countryId, groupCategory, groupData) =>
		spawnGroup(countryId, groupCategory, groupData),
	addStaticObject: (countryId, objectData): l_StaticObject => {
		const name = objectData.name as string;
		const existing = findObject("static", name);
		if (existing) existing.exists = false;
		const record = addStatic({
			name,
			type: (objectData.type as string) ?? "Hangar A",
			coalition: coalitionOfCountry(countryId),
			country: countryId,
			point: {
				x: (objectData.x as number) ?? 0,
				y: 0,
				z: (objectData.y as number) ?? 0,
			},
			heading: objectData.heading as number | undefined,
			cargo:
				objectData.canCargo === true
					? { displayName: name, weight: (objectData.mass as number) ?? 0 }
					: undefined,
		});
		return staticInstance(record);
	},
	addRefPoint: (
		coalitionId: number,
		referencePoint: CoalitionReferencePoint,
	) => {
		const points = state.refPoints[coalitionId] ?? [];
		points.push(referencePoint);
		state.refPoints[coalitionId] = points;
	},
	getGroups: (coalitionId: number, groupCategory?: number): l_Group[] =>
		liveGroups()
			.filter(
				(group) =>
					group.coalition === coalitionId &&
					(groupCategory === undefined || group.category === groupCategory),
			)
			.map(groupInstance),
	getAirbases: (coalitionId: number): l_Airbase[] =>
		liveObjects("airbase")
			.filter((base) => base.coalition === coalitionId)
			.map(airbaseInstance),
	getStaticObjects: (coalitionId: number): l_StaticObject[] =>
		liveObjects("static")
			.filter((object) => object.coalition === coalitionId)
			.map(staticInstance),
	getPlayers: (coalitionId: number): l_Unit[] =>
		liveObjects("unit")
			.filter(
				(unit) =>
					unit.coalition === coalitionId && unit.playerName !== undefined,
			)
			.map(unitInstance),
	getServiceProviders: (_coalitionId: number, _service: number): l_Unit[] => [],
	getRefPoints: (coalitionId: number) => state.refPoints[coalitionId],
	getMainRefPoint: (coalitionId: number) => state.refPoints[coalitionId]?.[0],
	getCountryCoalition: (countryId: number) => coalitionOfCountry(countryId),
	add_dyn_group: () => undefined,
	remove_dyn_group: () => undefined,
	checkChooseCargo: () => undefined,
	checkDescent: () => undefined,
	getAllDescents: () => undefined,
	getDescentsOnBoard: () => undefined,
} satisfies Double<l_coalition>;
