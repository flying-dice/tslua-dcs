/**
 * @version 2.9.29.27468
 * @noSelf
 */
export interface _env {
	Mode: {
		FINISH: number;
		INIT: number;
		SIMULATION: number;
		START: number;
		STOP: number;
		USER: number;
	};
	crash(...args: any[]): unknown;
	error(...args: any[]): unknown;
	getMissionName(...args: any[]): unknown;
	getMode(...args: any[]): unknown;
	getValueDictByKey(...args: any[]): unknown;
	info(...args: any[]): unknown;
	mission: {
		coalition: {
			blue: {
				bullseye: {
					x: number;
					y: number;
				};
				country: {
				};
				name: string;
				nav_points: {
				};
			};
			neutrals: {
				bullseye: {
					x: number;
					y: number;
				};
				country: {
				};
				name: string;
				nav_points: {
				};
			};
			red: {
				bullseye: {
					x: number;
					y: number;
				};
				country: {
				};
				name: string;
				nav_points: {
				};
			};
		};
		coalitions: {
			blue: {
				[1]: number;
				[10]: number;
				[11]: number;
				[12]: number;
				[13]: number;
				[14]: number;
				[15]: number;
				[16]: number;
				[17]: number;
				[18]: number;
				[19]: number;
				[2]: number;
				[20]: number;
				[21]: number;
				[22]: number;
				[3]: number;
				[4]: number;
				[5]: number;
				[6]: number;
				[7]: number;
				[8]: number;
				[9]: number;
			};
			neutrals: {
				[1]: number;
				[10]: number;
				[11]: number;
				[12]: number;
				[13]: number;
				[14]: number;
				[15]: number;
				[16]: number;
				[17]: number;
				[18]: number;
				[19]: number;
				[2]: number;
				[20]: number;
				[21]: number;
				[22]: number;
				[23]: number;
				[24]: number;
				[25]: number;
				[26]: number;
				[27]: number;
				[28]: number;
				[29]: number;
				[3]: number;
				[30]: number;
				[31]: number;
				[32]: number;
				[33]: number;
				[34]: number;
				[35]: number;
				[36]: number;
				[37]: number;
				[38]: number;
				[39]: number;
				[4]: number;
				[40]: number;
				[41]: number;
				[42]: number;
				[43]: number;
				[44]: number;
				[45]: number;
				[46]: number;
				[47]: number;
				[48]: number;
				[49]: number;
				[5]: number;
				[50]: number;
				[51]: number;
				[52]: number;
				[53]: number;
				[54]: number;
				[55]: number;
				[56]: number;
				[57]: number;
				[58]: number;
				[59]: number;
				[6]: number;
				[7]: number;
				[8]: number;
				[9]: number;
			};
			red: {
				[1]: number;
				[10]: number;
				[11]: number;
				[2]: number;
				[3]: number;
				[4]: number;
				[5]: number;
				[6]: number;
				[7]: number;
				[8]: number;
				[9]: number;
			};
		};
		currentKey: number;
		date: {
			Day: number;
			Month: number;
			Year: number;
		};
		descriptionBlueTask: string;
		descriptionNeutralsTask: string;
		descriptionRedTask: string;
		descriptionText: string;
		failures: {
		};
		forcedOptions: {
		};
		goals: {
		};
		groundControl: {
			isPilotControlVehicles: boolean;
			passwords: {
				artillery_commander: {
				};
				forward_observer: {
				};
				instructor: {
				};
				observer: {
				};
			};
			roles: {
				artillery_commander: {
					blue: number;
					neutrals: number;
					red: number;
				};
				forward_observer: {
					blue: number;
					neutrals: number;
					red: number;
				};
				instructor: {
					blue: number;
					neutrals: number;
					red: number;
				};
				observer: {
					blue: number;
					neutrals: number;
					red: number;
				};
			};
		};
		map: {
			centerX: number;
			centerY: number;
			zoom: number;
		};
		maxDictId: number;
		pictureFileNameB: {
		};
		pictureFileNameN: {
		};
		pictureFileNameR: {
		};
		pictureFileNameServer: {
		};
		requiredModules: {
		};
		result: {
			blue: {
				actions: {
				};
				conditions: {
				};
				func: {
				};
			};
			offline: {
				actions: {
				};
				conditions: {
				};
				func: {
				};
			};
			red: {
				actions: {
				};
				conditions: {
				};
				func: {
				};
			};
			total: number;
		};
		sortie: string;
		start_time: number;
		theatre: string;
		trig: {
			actions: {
			};
			conditions: {
			};
			custom: {
			};
			customStartup: {
			};
			events: {
			};
			flag: {
			};
			func: {
			};
			funcStartup: {
			};
		};
		triggers: {
			zones: {
			};
		};
		trigrules: {
		};
		version: number;
		weather: {
			atmosphere_type: number;
			clouds: {
				base: number;
				density: number;
				iprecptns: number;
				preset: string;
				thickness: number;
			};
			cyclones: {
			};
			dust_density: number;
			enable_dust: boolean;
			enable_fog: boolean;
			fog: {
				thickness: number;
				visibility: number;
			};
			groundTurbulence: number;
			halo: {
				preset: string;
			};
			modifiedTime: boolean;
			name: string;
			qnh: number;
			season: {
				temperature: number;
			};
			type_weather: number;
			visibility: {
				distance: number;
			};
			wind: {
				at2000: {
					dir: number;
					speed: number;
				};
				at8000: {
					dir: number;
					speed: number;
				};
				atGround: {
					dir: number;
					speed: number;
				};
			};
		};
	};
	setErrorMessageBoxEnabled(...args: any[]): unknown;
	showTraining(...args: any[]): unknown;
	warehouses: {
		airports: {
			[12]: {
				OperatingLevel_Air: number;
				OperatingLevel_Eqp: number;
				OperatingLevel_Fuel: number;
				aircrafts: {
				};
				allowHotStart: boolean;
				coalition: string;
				diesel: {
					InitFuel: number;
				};
				dynamicCargo: boolean;
				dynamicSpawn: boolean;
				gasoline: {
					InitFuel: number;
				};
				jet_fuel: {
					InitFuel: number;
				};
				methanol_mixture: {
					InitFuel: number;
				};
				periodicity: number;
				size: number;
				speed: number;
				suppliers: {
				};
				unlimitedAircrafts: boolean;
				unlimitedFuel: boolean;
				unlimitedMunitions: boolean;
				weapons: {
				};
			};
			[13]: {
				OperatingLevel_Air: number;
				OperatingLevel_Eqp: number;
				OperatingLevel_Fuel: number;
				aircrafts: {
				};
				allowHotStart: boolean;
				coalition: string;
				diesel: {
					InitFuel: number;
				};
				dynamicCargo: boolean;
				dynamicSpawn: boolean;
				gasoline: {
					InitFuel: number;
				};
				jet_fuel: {
					InitFuel: number;
				};
				methanol_mixture: {
					InitFuel: number;
				};
				periodicity: number;
				size: number;
				speed: number;
				suppliers: {
				};
				unlimitedAircrafts: boolean;
				unlimitedFuel: boolean;
				unlimitedMunitions: boolean;
				weapons: {
				};
			};
			[14]: {
				OperatingLevel_Air: number;
				OperatingLevel_Eqp: number;
				OperatingLevel_Fuel: number;
				aircrafts: {
				};
				allowHotStart: boolean;
				coalition: string;
				diesel: {
					InitFuel: number;
				};
				dynamicCargo: boolean;
				dynamicSpawn: boolean;
				gasoline: {
					InitFuel: number;
				};
				jet_fuel: {
					InitFuel: number;
				};
				methanol_mixture: {
					InitFuel: number;
				};
				periodicity: number;
				size: number;
				speed: number;
				suppliers: {
				};
				unlimitedAircrafts: boolean;
				unlimitedFuel: boolean;
				unlimitedMunitions: boolean;
				weapons: {
				};
			};
			[15]: {
				OperatingLevel_Air: number;
				OperatingLevel_Eqp: number;
				OperatingLevel_Fuel: number;
				aircrafts: {
				};
				allowHotStart: boolean;
				coalition: string;
				diesel: {
					InitFuel: number;
				};
				dynamicCargo: boolean;
				dynamicSpawn: boolean;
				gasoline: {
					InitFuel: number;
				};
				jet_fuel: {
					InitFuel: number;
				};
				methanol_mixture: {
					InitFuel: number;
				};
				periodicity: number;
				size: number;
				speed: number;
				suppliers: {
				};
				unlimitedAircrafts: boolean;
				unlimitedFuel: boolean;
				unlimitedMunitions: boolean;
				weapons: {
				};
			};
			[16]: {
				OperatingLevel_Air: number;
				OperatingLevel_Eqp: number;
				OperatingLevel_Fuel: number;
				aircrafts: {
				};
				allowHotStart: boolean;
				coalition: string;
				diesel: {
					InitFuel: number;
				};
				dynamicCargo: boolean;
				dynamicSpawn: boolean;
				gasoline: {
					InitFuel: number;
				};
				jet_fuel: {
					InitFuel: number;
				};
				methanol_mixture: {
					InitFuel: number;
				};
				periodicity: number;
				size: number;
				speed: number;
				suppliers: {
				};
				unlimitedAircrafts: boolean;
				unlimitedFuel: boolean;
				unlimitedMunitions: boolean;
				weapons: {
				};
			};
			[17]: {
				OperatingLevel_Air: number;
				OperatingLevel_Eqp: number;
				OperatingLevel_Fuel: number;
				aircrafts: {
				};
				allowHotStart: boolean;
				coalition: string;
				diesel: {
					InitFuel: number;
				};
				dynamicCargo: boolean;
				dynamicSpawn: boolean;
				gasoline: {
					InitFuel: number;
				};
				jet_fuel: {
					InitFuel: number;
				};
				methanol_mixture: {
					InitFuel: number;
				};
				periodicity: number;
				size: number;
				speed: number;
				suppliers: {
				};
				unlimitedAircrafts: boolean;
				unlimitedFuel: boolean;
				unlimitedMunitions: boolean;
				weapons: {
				};
			};
			[18]: {
				OperatingLevel_Air: number;
				OperatingLevel_Eqp: number;
				OperatingLevel_Fuel: number;
				aircrafts: {
				};
				allowHotStart: boolean;
				coalition: string;
				diesel: {
					InitFuel: number;
				};
				dynamicCargo: boolean;
				dynamicSpawn: boolean;
				gasoline: {
					InitFuel: number;
				};
				jet_fuel: {
					InitFuel: number;
				};
				methanol_mixture: {
					InitFuel: number;
				};
				periodicity: number;
				size: number;
				speed: number;
				suppliers: {
				};
				unlimitedAircrafts: boolean;
				unlimitedFuel: boolean;
				unlimitedMunitions: boolean;
				weapons: {
				};
			};
			[19]: {
				OperatingLevel_Air: number;
				OperatingLevel_Eqp: number;
				OperatingLevel_Fuel: number;
				aircrafts: {
				};
				allowHotStart: boolean;
				coalition: string;
				diesel: {
					InitFuel: number;
				};
				dynamicCargo: boolean;
				dynamicSpawn: boolean;
				gasoline: {
					InitFuel: number;
				};
				jet_fuel: {
					InitFuel: number;
				};
				methanol_mixture: {
					InitFuel: number;
				};
				periodicity: number;
				size: number;
				speed: number;
				suppliers: {
				};
				unlimitedAircrafts: boolean;
				unlimitedFuel: boolean;
				unlimitedMunitions: boolean;
				weapons: {
				};
			};
			[20]: {
				OperatingLevel_Air: number;
				OperatingLevel_Eqp: number;
				OperatingLevel_Fuel: number;
				aircrafts: {
				};
				allowHotStart: boolean;
				coalition: string;
				diesel: {
					InitFuel: number;
				};
				dynamicCargo: boolean;
				dynamicSpawn: boolean;
				gasoline: {
					InitFuel: number;
				};
				jet_fuel: {
					InitFuel: number;
				};
				methanol_mixture: {
					InitFuel: number;
				};
				periodicity: number;
				size: number;
				speed: number;
				suppliers: {
				};
				unlimitedAircrafts: boolean;
				unlimitedFuel: boolean;
				unlimitedMunitions: boolean;
				weapons: {
				};
			};
			[21]: {
				OperatingLevel_Air: number;
				OperatingLevel_Eqp: number;
				OperatingLevel_Fuel: number;
				aircrafts: {
				};
				allowHotStart: boolean;
				coalition: string;
				diesel: {
					InitFuel: number;
				};
				dynamicCargo: boolean;
				dynamicSpawn: boolean;
				gasoline: {
					InitFuel: number;
				};
				jet_fuel: {
					InitFuel: number;
				};
				methanol_mixture: {
					InitFuel: number;
				};
				periodicity: number;
				size: number;
				speed: number;
				suppliers: {
				};
				unlimitedAircrafts: boolean;
				unlimitedFuel: boolean;
				unlimitedMunitions: boolean;
				weapons: {
				};
			};
			[22]: {
				OperatingLevel_Air: number;
				OperatingLevel_Eqp: number;
				OperatingLevel_Fuel: number;
				aircrafts: {
				};
				allowHotStart: boolean;
				coalition: string;
				diesel: {
					InitFuel: number;
				};
				dynamicCargo: boolean;
				dynamicSpawn: boolean;
				gasoline: {
					InitFuel: number;
				};
				jet_fuel: {
					InitFuel: number;
				};
				methanol_mixture: {
					InitFuel: number;
				};
				periodicity: number;
				size: number;
				speed: number;
				suppliers: {
				};
				unlimitedAircrafts: boolean;
				unlimitedFuel: boolean;
				unlimitedMunitions: boolean;
				weapons: {
				};
			};
			[23]: {
				OperatingLevel_Air: number;
				OperatingLevel_Eqp: number;
				OperatingLevel_Fuel: number;
				aircrafts: {
				};
				allowHotStart: boolean;
				coalition: string;
				diesel: {
					InitFuel: number;
				};
				dynamicCargo: boolean;
				dynamicSpawn: boolean;
				gasoline: {
					InitFuel: number;
				};
				jet_fuel: {
					InitFuel: number;
				};
				methanol_mixture: {
					InitFuel: number;
				};
				periodicity: number;
				size: number;
				speed: number;
				suppliers: {
				};
				unlimitedAircrafts: boolean;
				unlimitedFuel: boolean;
				unlimitedMunitions: boolean;
				weapons: {
				};
			};
			[24]: {
				OperatingLevel_Air: number;
				OperatingLevel_Eqp: number;
				OperatingLevel_Fuel: number;
				aircrafts: {
				};
				allowHotStart: boolean;
				coalition: string;
				diesel: {
					InitFuel: number;
				};
				dynamicCargo: boolean;
				dynamicSpawn: boolean;
				gasoline: {
					InitFuel: number;
				};
				jet_fuel: {
					InitFuel: number;
				};
				methanol_mixture: {
					InitFuel: number;
				};
				periodicity: number;
				size: number;
				speed: number;
				suppliers: {
				};
				unlimitedAircrafts: boolean;
				unlimitedFuel: boolean;
				unlimitedMunitions: boolean;
				weapons: {
				};
			};
			[25]: {
				OperatingLevel_Air: number;
				OperatingLevel_Eqp: number;
				OperatingLevel_Fuel: number;
				aircrafts: {
				};
				allowHotStart: boolean;
				coalition: string;
				diesel: {
					InitFuel: number;
				};
				dynamicCargo: boolean;
				dynamicSpawn: boolean;
				gasoline: {
					InitFuel: number;
				};
				jet_fuel: {
					InitFuel: number;
				};
				methanol_mixture: {
					InitFuel: number;
				};
				periodicity: number;
				size: number;
				speed: number;
				suppliers: {
				};
				unlimitedAircrafts: boolean;
				unlimitedFuel: boolean;
				unlimitedMunitions: boolean;
				weapons: {
				};
			};
			[26]: {
				OperatingLevel_Air: number;
				OperatingLevel_Eqp: number;
				OperatingLevel_Fuel: number;
				aircrafts: {
				};
				allowHotStart: boolean;
				coalition: string;
				diesel: {
					InitFuel: number;
				};
				dynamicCargo: boolean;
				dynamicSpawn: boolean;
				gasoline: {
					InitFuel: number;
				};
				jet_fuel: {
					InitFuel: number;
				};
				methanol_mixture: {
					InitFuel: number;
				};
				periodicity: number;
				size: number;
				speed: number;
				suppliers: {
				};
				unlimitedAircrafts: boolean;
				unlimitedFuel: boolean;
				unlimitedMunitions: boolean;
				weapons: {
				};
			};
			[27]: {
				OperatingLevel_Air: number;
				OperatingLevel_Eqp: number;
				OperatingLevel_Fuel: number;
				aircrafts: {
				};
				allowHotStart: boolean;
				coalition: string;
				diesel: {
					InitFuel: number;
				};
				dynamicCargo: boolean;
				dynamicSpawn: boolean;
				gasoline: {
					InitFuel: number;
				};
				jet_fuel: {
					InitFuel: number;
				};
				methanol_mixture: {
					InitFuel: number;
				};
				periodicity: number;
				size: number;
				speed: number;
				suppliers: {
				};
				unlimitedAircrafts: boolean;
				unlimitedFuel: boolean;
				unlimitedMunitions: boolean;
				weapons: {
				};
			};
			[28]: {
				OperatingLevel_Air: number;
				OperatingLevel_Eqp: number;
				OperatingLevel_Fuel: number;
				aircrafts: {
				};
				allowHotStart: boolean;
				coalition: string;
				diesel: {
					InitFuel: number;
				};
				dynamicCargo: boolean;
				dynamicSpawn: boolean;
				gasoline: {
					InitFuel: number;
				};
				jet_fuel: {
					InitFuel: number;
				};
				methanol_mixture: {
					InitFuel: number;
				};
				periodicity: number;
				size: number;
				speed: number;
				suppliers: {
				};
				unlimitedAircrafts: boolean;
				unlimitedFuel: boolean;
				unlimitedMunitions: boolean;
				weapons: {
				};
			};
			[29]: {
				OperatingLevel_Air: number;
				OperatingLevel_Eqp: number;
				OperatingLevel_Fuel: number;
				aircrafts: {
				};
				allowHotStart: boolean;
				coalition: string;
				diesel: {
					InitFuel: number;
				};
				dynamicCargo: boolean;
				dynamicSpawn: boolean;
				gasoline: {
					InitFuel: number;
				};
				jet_fuel: {
					InitFuel: number;
				};
				methanol_mixture: {
					InitFuel: number;
				};
				periodicity: number;
				size: number;
				speed: number;
				suppliers: {
				};
				unlimitedAircrafts: boolean;
				unlimitedFuel: boolean;
				unlimitedMunitions: boolean;
				weapons: {
				};
			};
			[30]: {
				OperatingLevel_Air: number;
				OperatingLevel_Eqp: number;
				OperatingLevel_Fuel: number;
				aircrafts: {
				};
				allowHotStart: boolean;
				coalition: string;
				diesel: {
					InitFuel: number;
				};
				dynamicCargo: boolean;
				dynamicSpawn: boolean;
				gasoline: {
					InitFuel: number;
				};
				jet_fuel: {
					InitFuel: number;
				};
				methanol_mixture: {
					InitFuel: number;
				};
				periodicity: number;
				size: number;
				speed: number;
				suppliers: {
				};
				unlimitedAircrafts: boolean;
				unlimitedFuel: boolean;
				unlimitedMunitions: boolean;
				weapons: {
				};
			};
			[31]: {
				OperatingLevel_Air: number;
				OperatingLevel_Eqp: number;
				OperatingLevel_Fuel: number;
				aircrafts: {
				};
				allowHotStart: boolean;
				coalition: string;
				diesel: {
					InitFuel: number;
				};
				dynamicCargo: boolean;
				dynamicSpawn: boolean;
				gasoline: {
					InitFuel: number;
				};
				jet_fuel: {
					InitFuel: number;
				};
				methanol_mixture: {
					InitFuel: number;
				};
				periodicity: number;
				size: number;
				speed: number;
				suppliers: {
				};
				unlimitedAircrafts: boolean;
				unlimitedFuel: boolean;
				unlimitedMunitions: boolean;
				weapons: {
				};
			};
			[32]: {
				OperatingLevel_Air: number;
				OperatingLevel_Eqp: number;
				OperatingLevel_Fuel: number;
				aircrafts: {
				};
				allowHotStart: boolean;
				coalition: string;
				diesel: {
					InitFuel: number;
				};
				dynamicCargo: boolean;
				dynamicSpawn: boolean;
				gasoline: {
					InitFuel: number;
				};
				jet_fuel: {
					InitFuel: number;
				};
				methanol_mixture: {
					InitFuel: number;
				};
				periodicity: number;
				size: number;
				speed: number;
				suppliers: {
				};
				unlimitedAircrafts: boolean;
				unlimitedFuel: boolean;
				unlimitedMunitions: boolean;
				weapons: {
				};
			};
		};
		warehouses: {
		};
	};
	warning(...args: any[]): unknown;
}
