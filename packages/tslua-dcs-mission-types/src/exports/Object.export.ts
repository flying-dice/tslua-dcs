/**
 * @version 2.9.29.27468
 */
export interface _Object {
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
}
