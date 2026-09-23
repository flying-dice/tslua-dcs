/**
 * Type descriptors (`getDesc()` / `getDescByName()`) for every type the fixture world uses. Shapes follow
 * the descriptors in the declarations (`UnitDesc`, `StaticObjectDesc`, `AirbaseDesc`).
 */
export interface TypeDesc {
	typeName: string;
	displayName: string;
	_origin: string;
	category: number;
	life: number;
	attributes: Record<string, boolean>;
	[key: string]: unknown;
}

const box = (size: number) => ({
	min: { x: -size, y: -size / 4, z: -size },
	max: { x: size, y: size / 4, z: size },
});

export const typeDatabase: Record<string, TypeDesc> = {
	"F-16C_50": {
		typeName: "F-16C_50",
		displayName: "F-16CM bl.50",
		_origin: "",
		category: 0,
		life: 20,
		massEmpty: 8853,
		riverCrossing: false,
		maxSlopeAngle: 0,
		Kmax: 0.1,
		RCS: 4,
		box: box(8),
		speedMax: 617,
		speedMaxOffRoad: 0,
		attributes: {
			Planes: true,
			Air: true,
			Fighters: true,
			"Battle airplanes": true,
			All: true,
		},
	},
	"M-818": {
		typeName: "M-818",
		displayName: "Truck M939 Heavy",
		_origin: "",
		category: 2,
		life: 3,
		massEmpty: 9000,
		riverCrossing: true,
		maxSlopeAngle: 0.5,
		Kmax: 0,
		RCS: 0,
		box: box(4),
		speedMax: 25,
		speedMaxOffRoad: 12,
		attributes: {
			Trucks: true,
			"Ground vehicles": true,
			"Ground Units": true,
			Vehicles: true,
			All: true,
		},
	},
	"Leopard-2": {
		typeName: "Leopard-2",
		displayName: "MBT Leopard-2A6M",
		_origin: "",
		category: 2,
		life: 27,
		massEmpty: 62000,
		riverCrossing: true,
		maxSlopeAngle: 0.52,
		Kmax: 0.3,
		RCS: 5,
		box: box(5),
		speedMax: 19,
		speedMaxOffRoad: 16,
		attributes: {
			Tanks: true,
			"Modern Tanks": true,
			"Armored vehicles": true,
			"Ground vehicles": true,
			"Ground Units": true,
			Vehicles: true,
			All: true,
		},
	},
	"Hangar A": {
		typeName: "Hangar A",
		displayName: "Hangar A",
		_origin: "",
		category: 4,
		life: 100,
		attributes: { Buildings: true, All: true },
	},
	ammo_cargo: {
		typeName: "ammo_cargo",
		displayName: "Ammo",
		_origin: "",
		category: 6,
		life: 1,
		attributes: { Cargos: true, All: true },
	},
	Batumi: {
		typeName: "Batumi",
		displayName: "Batumi",
		_origin: "",
		category: 0,
		life: 3600,
		attributes: { Airfields: true },
	},
	Kobuleti: {
		typeName: "Kobuleti",
		displayName: "Kobuleti",
		_origin: "",
		category: 0,
		life: 3600,
		attributes: { Airfields: true },
	},
	"Senaki-Kolkhi": {
		typeName: "Senaki-Kolkhi",
		displayName: "Senaki-Kolkhi",
		_origin: "",
		category: 0,
		life: 3600,
		attributes: { Airfields: true },
	},
	AIM_120C: {
		typeName: "AIM_120C",
		displayName: "AIM-120C AMRAAM",
		_origin: "",
		category: 1,
		life: 2,
		guidance: 3,
		missileCategory: 1,
		warhead: { type: 1, mass: 22 },
		attributes: { Missiles: true, All: true },
	},
};

/** Names of the objects the fixture world starts with, for tests that look them up. */
export const fixtureNames = {
	airbases: ["Batumi", "Kobuleti", "Senaki-Kolkhi"],
	blueAirGroup: "Enfield-1",
	blueGroundGroup: "Uzi-1",
	redGroundGroup: "Red Armor",
	playerUnit: "Enfield-1-1",
	statics: ["Blue Hangar", "Ammo Crate", "Red Depot"],
	cargo: "Ammo Crate",
	zone: "Batumi Zone",
	missionName: "tslua-dcs mission doubles",
	appVersion: "2.9.29.27468",
};
