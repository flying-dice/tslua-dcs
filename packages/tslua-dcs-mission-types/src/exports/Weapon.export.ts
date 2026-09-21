/**
 * @version 2.9.29.27468
 */
export interface _Weapon {
	Category: {
		BOMB: number;
		MISSILE: number;
		ROCKET: number;
		SHELL: number;
		TORPEDO: number;
	};
	GuidanceType: {
		INS: number;
		IR: number;
		LASER: number;
		RADAR_ACTIVE: number;
		RADAR_PASSIVE: number;
		RADAR_SEMI_ACTIVE: number;
		TELE: number;
		TV: number;
	};
	MissileCategory: {
		AAM: number;
		ANTI_SHIP: number;
		BM: number;
		CRUISE: number;
		OTHER: number;
		SAM: number;
	};
	WarheadType: {
		AP: number;
		HE: number;
		SHAPED_EXPLOSIVE: number;
	};
	className_: string;
	flag: {
		AR_AAM: number;
		AllWeapon: number;
		AntiRadarMissile: number;
		AntiRadarMissile2: number;
		AntiShipMissile: number;
		AntiTankMissile: number;
		AnyAAM: number;
		AnyAAWeapon: number;
		AnyAGWeapon: number;
		AnyASM: number;
		AnyAutonomousMissile: number;
		AnyBomb: number;
		AnyMissile: number;
		AnyRocket: number;
		AnyShell: number;
		AnyTorpedo: number;
		AnyUnguidedBomb: number;
		AnyWeapon: number;
		ArmWeapon: number;
		BuiltInCannon: number;
		CandleBomb: number;
		CandleRocket: number;
		Cannons: number;
		ClusterBomb: number;
		ConventionalShell: number;
		CruiseMissile: number;
		Decoys: number;
		Dispencer: number;
		FAEBomb: number;
		FireAndForgetASM: number;
		GUN_POD: number;
		GuidedASM: number;
		GuidedBomb: number;
		GuidedShell: number;
		GuidedWeapon: number;
		HEBomb: number;
		HeavyRocket: number;
		IR_AAM: number;
		IlluminationShell: number;
		LGB: number;
		LRAAM: number;
		LaserASM: number;
		LightRocket: number;
		MRAAM: number;
		MarkerRocket: number;
		MarkerShell: number;
		MarkerWeapon: number;
		NapalmBomb: number;
		NoWeapon: number;
		ParachuteBomb: number;
		Penetrator: number;
		SAR_AAM: number;
		SNSGB: number;
		SRAAM: number;
		SmokeShell: number;
		SubmunitionDispenserShell: number;
		TacticASM: number;
		TeleASM: number;
		Torpedo: number;
		TvGB: number;
		UnguidedWeapon: number;
	};
	getCategory(...args: any[]): unknown;
	getCategoryEx(...args: any[]): unknown;
	getCoalition(...args: any[]): unknown;
	getCountry(...args: any[]): unknown;
	getDesc(...args: any[]): unknown;
	getForcesName(...args: any[]): unknown;
	getLauncher(...args: any[]): unknown;
	getTarget(...args: any[]): unknown;
	parentClass_: {
		Category: {
			BASE: number;
			CARGO: number;
			SCENERY: number;
			STATIC: number;
			UNIT: number;
			VOID: number;
			WEAPON: number;
		};
		cancelChoosingCargo(...args: any[]): unknown;
		className_: string;
		database_: {
			Batumi: {
				_origin: string;
				attributes: {
					Airfields: boolean;
				};
				category: number;
				displayName: string;
				life: number;
				typeName: string;
			};
			"Leopard-2": {
				Kmax: number;
				RCS: number;
				_origin: string;
				attributes: {
					All: boolean;
					"AntiAir Armed Vehicles": boolean;
					"Armed ground units": boolean;
					"Armed vehicles": boolean;
					"Armored vehicles": boolean;
					"Ground Units": boolean;
					"Ground Units Non Airdefence": boolean;
					"Ground vehicles": boolean;
					HeavyArmoredUnits: boolean;
					"Modern Tanks": boolean;
					Tanks: boolean;
					Vehicles: boolean;
				};
				box: {
					max: {
						x: number;
						y: number;
						z: number;
					};
					min: {
						x: number;
						y: number;
						z: number;
					};
				};
				category: number;
				displayName: string;
				life: number;
				massEmpty: number;
				maxSlopeAngle: number;
				riverCrossing: boolean;
				speedMax: number;
				speedMaxOffRoad: number;
				typeName: string;
			};
			getCategoryEx(...args: any[]): unknown;
		};
		destroy(...args: any[]): unknown;
		getAttributes(...args: any[]): unknown;
		getCategory(...args: any[]): unknown;
		getName(...args: any[]): unknown;
		getPoint(...args: any[]): unknown;
		getPosition(...args: any[]): unknown;
		getTypeName(...args: any[]): unknown;
		getVelocity(...args: any[]): unknown;
		hasAttribute(...args: any[]): unknown;
		inAir(...args: any[]): unknown;
		isExist(...args: any[]): unknown;
		parentClass_: {
			className_: string;
		};
		tonumber(...args: any[]): unknown;
	};
	tonumber(...args: any[]): unknown;
}
