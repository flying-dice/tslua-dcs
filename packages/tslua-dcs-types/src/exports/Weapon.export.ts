/**
 * @version 2.9.1.48335
 **/
export interface _Weapon {
	getDesc(...args: any[]): unknown;
	className_: string;
	parentClass_: {
		isExist(...args: any[]): unknown;
		className_: string;
		parentClass_: { className_: string };
		getCategory(...args: any[]): unknown;
		cancelChoosingCargo(...args: any[]): unknown;
		database_: {};
		Category: {
			VOID: number;
			SCENERY: number;
			BASE: number;
			CARGO: number;
			UNIT: number;
			STATIC: number;
			WEAPON: number;
		};
		hasAttribute(...args: any[]): unknown;
		destroy(...args: any[]): unknown;
		getAttributes(...args: any[]): unknown;
		tonumber(...args: any[]): unknown;
		getName(...args: any[]): unknown;
		getPoint(...args: any[]): unknown;
		getPosition(...args: any[]): unknown;
		getVelocity(...args: any[]): unknown;
		inAir(...args: any[]): unknown;
		getTypeName(...args: any[]): unknown;
	};
	getCategory(...args: any[]): unknown;
	Category: {
		SHELL: number;
		TORPEDO: number;
		BOMB: number;
		ROCKET: number;
		MISSILE: number;
	};
	getForcesName(...args: any[]): unknown;
	MissileCategory: {
		SAM: number;
		BM: number;
		AAM: number;
		OTHER: number;
		CRUISE: number;
		ANTI_SHIP: number;
	};
	tonumber(...args: any[]): unknown;
	WarheadType: { SHAPED_EXPLOSIVE: number; HE: number; AP: number };
	getCoalition(...args: any[]): unknown;
	getTarget(...args: any[]): unknown;
	flag: {
		Cannons: number;
		IlluminationShell: number;
		AntiShipMissile: number;
		AnyASM: number;
		AllWeapon: number;
		CandleBomb: number;
		HEBomb: number;
		Decoys: number;
		AntiRadarMissile: number;
		ArmWeapon: number;
		MarkerWeapon: number;
		TeleASM: number;
		ClusterBomb: number;
		AnyWeapon: number;
		BuiltInCannon: number;
		AnyRocket: number;
		CruiseMissile: number;
		SNSGB: number;
		AnyUnguidedBomb: number;
		LaserASM: number;
		NoWeapon: number;
		HeavyRocket: number;
		SAR_AAM: number;
		AR_AAM: number;
		AnyBomb: number;
		GuidedWeapon: number;
		CandleRocket: number;
		Dispencer: number;
		AntiTankMissile: number;
		UnguidedWeapon: number;
		AnyAAWeapon: number;
		GuidedBomb: number;
		AnyAGWeapon: number;
		AnyTorpedo: number;
		Torpedo: number;
		SRAAM: number;
		AntiRadarMissile2: number;
		MRAAM: number;
		AnyShell: number;
		FireAndForgetASM: number;
		MarkerShell: number;
		GUN_POD: number;
		MarkerRocket: number;
		SmokeShell: number;
		LRAAM: number;
		ParachuteBomb: number;
		AnyAAM: number;
		FAEBomb: number;
		ConventionalShell: number;
		LightRocket: number;
		GuidedShell: number;
		SubmunitionDispenserShell: number;
		GuidedASM: number;
		Penetrator: number;
		LGB: number;
		AnyAutonomousMissile: number;
		AnyMissile: number;
		IR_AAM: number;
		TacticASM: number;
		TvGB: number;
		NapalmBomb: number;
	};
	getLauncher(...args: any[]): unknown;
	getCountry(...args: any[]): unknown;
	GuidanceType: {
		RADAR_SEMI_ACTIVE: number;
		RADAR_ACTIVE: number;
		TELE: number;
		TV: number;
		LASER: number;
		IR: number;
		RADAR_PASSIVE: number;
		INS: number;
	};
}