/**
 * @example
 * {
 *     "WorldID": 32,
 *     "OldID": "Ground Attack",
 *     "Name": "Ground Attack"
 *   }
 */
export type l_GroupTask = {
	WorldID: number;
	OldID: string;
	Name: string;
};

export type l_DatabaseObject = {
	type: string;
	Name: string;
	DisplayName: string;
};

export type l_Car = l_DatabaseObject & {
	DisplayNameShort: string;
	ThreatRangeMin: number;
	ThreatRange: number;
	tags: string[];
	category: string;
};

export type l_Pylon = {
	Number: number;
	Type: number;
	Order: number;
	Launchers: { CLSID: string }[];
};

export type l_Plane = l_DatabaseObject & {
	MaxFuelWeight: string;
	M_fuel_max: number;
	V_max_sea_level: number;
	V_max_h: number;
	V_land: number;
	V_take_off: number;
	H_max: number;
	DefaultTask: l_GroupTask;
	Tasks: l_GroupTask[];
	passivCounterm?: {
		flare?: {
			increment: number;
			default: number;
			chargeSz: number;
		};
		chaff?: {
			increment: number;
			default: number;
			chargeSz: number;
		};
	};
	Pylons: l_Pylon[];
};

export type l_Helicopter = l_DatabaseObject & {
	MaxFuelWeight: string;
	M_fuel_max: number;
	DefaultTask: l_GroupTask;
	Tasks: l_GroupTask[];
	V_max: number;
	V_max_cruise: number;
	MaxHeight: string;
	range: number;
	passivCounterm: {
		SingleChargeTotal: number;
		CMDS_Edit: boolean;
		flare: {
			increment: number;
			default: number;
			chargeSz: number;
		};
		chaff: {
			increment: number;
			default: number;
			chargeSz: number;
		};
		ChaffNoEdit: boolean;
	};
};

/**
 * @example
 * {
 *     "swapped_names": true,
 *     "type": ".Command Center",
 *     "Name": "Command Center",
 *     "category": "Fortification",
 *     "ShapeName": "ComCenter",
 *     "Rate": 100,
 *     "DisplayName": "Command Center"
 *   }
 */
export type l_Fortification = {
	swapped_names: boolean;
	type: string;
	Name: string;
	category: "Fortification";
	ShapeName: string;
	Rate: number;
	DisplayName: string;
	SeaObject?: boolean;
	encyclopedia_hidden?: boolean;
	fireIntencity?: number;
	mapclasskey?: string;
	ShapeNameDestr?: string;
	shape_table_data?: {
		username?: string;
		life?: number;
		positioning?: string;
		name: string;
		file: string;
		classname?: string;
		desrt?: string;
		iscrashmodel?: boolean;
		expMass?: number;
		fire?: number[];
	}[];
	attribute?: number[];
	_file?: string;
	enablePlayerCanDrive?: boolean;
	_origin?: string;
	Life?: number;
	positioning?: string;
	isPutToWater?: boolean;
	explMass?: number;
	fireTime?: number;
	seaObject?: boolean;
	classname?: string;
	desrt?: string;
	Countries?: string[];
};

/**
 * @example
 * {
 *     "swapped_names": true,
 *     "type": ".Ammunition depot",
 *     "Name": "Ammunition depot",
 *     "category": "Warehouse",
 *     "ShapeName": "SkladC",
 *     "Rate": 100,
 *     "DisplayName": "Ammunition depot"
 *   }
 */
export type l_Warehouse = {
	swapped_names: boolean;
	type: string;
	Name: string;
	category: "Warehouse";
	ShapeName: string;
	Rate: number;
	DisplayName: string;
};

/**
 * @example
 * {
 *     "type": "FARP",
 *     "CLSID": "{24FC9197-F225-4f2a-8A31-BD51DC7BDAB6}",
 *     "swapped_names": true,
 *     "DisplayName": "FARP",
 *     "Name": "FARP",
 *     "category": "Heliport",
 *     "numParking": 4,
 *     "isPutToWater": true,
 *     "ShapeName": "FARPS"
 *   }
 */
export type l_Heliport = {
	type: string;
	CLSID?: string;
	swapped_names: boolean;
	DisplayName: string;
	Name: string;
	category: "Heliport";
	numParking: number;
	isPutToWater: boolean;
	ShapeName: string;
	mapclasskey?: string;
	SeaObject?: boolean;
	attribute?: number[];
	_file?: string;
	enablePlayerCanDrive?: boolean;
	Rate?: number;
	_origin?: string;
	Life?: number;
	positioning?: string;
	shape_table_data?: {
		username: string;
		life: number;
		positioning: string;
		name: string;
		file: string;
		classname: string;
		desrt: string;
	}[];
	classname?: string;
	subCategory?: string;
};

/**
 * @example
 * {
 *     "swapped_names": true,
 *     "mapclasskey": "P0091000352",
 *     "type": "ammo_cargo",
 *     "life": 5,
 *     "canExplode": false,
 *     "couldCargo": true,
 *     "Rate": 100,
 *     "DisplayName": "Ammo",
 *     "ShapeNameDstr": "ammo_box_cargo_dam",
 *     "mass": 1500,
 *     "Name": "Ammo",
 *     "category": "Cargo",
 *     "ShapeName": "ammo_box_cargo",
 *     "maxMass": 2000,
 *     "attribute": [
 *       "Cargos"
 *     ],
 *     "minMass": 1000
 *   }
 */
export type l_Cargos = {
	swapped_names: boolean;
	mapclasskey: string;
	type: string;
	life?: number;
	canExplode: boolean;
	couldCargo: boolean;
	Rate: number;
	DisplayName: string;
	ShapeNameDstr?: string;
	mass: number;
	Name: string;
	category: "Cargo";
	ShapeName: string;
	maxMass: number;
	attribute: string[];
	minMass: number;
	shape_table_data?: {
		username: string;
		life: number;
		name: string;
		file: string;
	}[];
	_file?: string;
	Life?: number;
	enablePlayerCanDrive?: boolean;
	_origin?: string;
};

/**
 * @example
 * {
 * 		"Count": 6,
 * 		"_file": "Scripts/Database/db_weapons_data.lua",
 * 		"Elements": [{"ShapeName":"MK-82"}],
 * 		"Weight": 1446,
 * 		"CLSID": "{027563C9-D87E-4A85-B317-597B510E3F03}",
 * 		"Picture": "FAB250.png",
 * 		"attribute": [4,5,9,31],
 * 		"displayName": "6 x Mk-82 - 500lb GP Bombs LD"
 * 	}
 */
export type l_Weapon = {
	Elements: unknown;
	Picture: string;
	displayName: string;
	Count?: number;
	Weight: number;
	attribute: unknown;
	CLSID: string;
};

/**
 * @version 2.9.1.48335
 * @noSelf
 **/
export interface l_db {
	Units: {
		Cars: { Car: Array<l_Car> };
		Planes: { Plane: Array<l_Plane>; Tasks: Array<l_GroupTask> };
		Helicopters: { Helicopter: Array<l_Helicopter> };
		Fortifications: { Fortification: Array<l_Fortification> };
		Warehouses: { Warehouse: Array<l_Warehouse> };
		Heliports: { Heliport: Array<l_Heliport> };
		Cargos: { Cargo: Array<l_Cargos> };
	};
	Weapons: {
		ByCLSID: Record<string, l_Weapon>;
	};
}
