/**
 * @version 2.9.29.27468
 */
export interface _Unit {
	Category: {
		AIRPLANE: number;
		GROUND_UNIT: number;
		HELICOPTER: number;
		SHIP: number;
		STRUCTURE: number;
	};
	LoadOnBoard(...args: any[]): unknown;
	OldCarrierMenuShow(...args: any[]): unknown;
	OpticType: {
		IR: number;
		LLTV: number;
		TV: number;
	};
	RadarType: {
		AS: number;
		SS: number;
	};
	RefuelingSystem: {
		BOOM_AND_RECEPTACLE: number;
		PROBE_AND_DROGUE: number;
	};
	SensorType: {
		IRST: number;
		OPTIC: number;
		RADAR: number;
		RWR: number;
	};
	UnloadCargo(...args: any[]): unknown;
	canShipLanding(...args: any[]): unknown;
	checkOpenRamp(...args: any[]): unknown;
	className_: string;
	disembarking(...args: any[]): unknown;
	enableEmission(...args: any[]): unknown;
	getAirbase(...args: any[]): unknown;
	getAmmo(...args: any[]): unknown;
	getByName(...args: any[]): unknown;
	getCallsign(...args: any[]): unknown;
	getCargosOnBoard(...args: any[]): unknown;
	getCategory(...args: any[]): unknown;
	getCategoryEx(...args: any[]): unknown;
	getCoalition(...args: any[]): unknown;
	getCommunicator(...args: any[]): unknown;
	getController(...args: any[]): unknown;
	getCountry(...args: any[]): unknown;
	getDesc(...args: any[]): unknown;
	getDescByName(...args: any[]): unknown;
	getDescentCapacity(...args: any[]): unknown;
	getDescentOnBoard(...args: any[]): unknown;
	getDrawArgumentValue(...args: any[]): unknown;
	getForcesName(...args: any[]): unknown;
	getFuel(...args: any[]): unknown;
	getFuelLowState(...args: any[]): unknown;
	getGroup(...args: any[]): unknown;
	getID(...args: any[]): unknown;
	getLife(...args: any[]): unknown;
	getLife0(...args: any[]): unknown;
	getName(...args: any[]): unknown;
	getNearestCargos(...args: any[]): unknown;
	getNearestCargosForAircraft(...args: any[]): unknown;
	getNumber(...args: any[]): unknown;
	getObjectID(...args: any[]): unknown;
	getPlayerName(...args: any[]): unknown;
	getRadar(...args: any[]): unknown;
	getSeats(...args: any[]): unknown;
	getSensors(...args: any[]): unknown;
	getTypeName(...args: any[]): unknown;
	hasCarrier(...args: any[]): unknown;
	hasSensors(...args: any[]): unknown;
	isActive(...args: any[]): unknown;
	isAlive(...args: any[]): unknown;
	isBroken(...args: any[]): unknown;
	isDead(...args: any[]): unknown;
	isEffective(...args: any[]): unknown;
	markDisembarkingTask(...args: any[]): unknown;
	openRamp(...args: any[]): unknown;
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
	vtolableLA(...args: any[]): unknown;
}
