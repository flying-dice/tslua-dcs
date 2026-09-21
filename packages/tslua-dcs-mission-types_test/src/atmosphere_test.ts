import { describe, expect, test } from "@flying-dice/tslua-luatest";

const samplePoint = { x: 0, y: 1000, z: 0 };

describe("atmosphere examples", () => {
	test("getTemperatureAndPressure returns two physical values", () => {
		const [temperature, pressure] =
			atmosphere.getTemperatureAndPressure(samplePoint);
		expect(temperature > 150).toBe(true);
		expect(pressure > 0).toBe(true);
	});

	test("getWind returns a complete vector", () => {
		const wind = atmosphere.getWind(samplePoint);
		expect(type(wind.x)).toBe("number");
		expect(type(wind.y)).toBe("number");
		expect(type(wind.z)).toBe("number");
	});

	test("getWindWithTurbulence returns a complete vector", () => {
		const wind = atmosphere.getWindWithTurbulence(samplePoint);
		expect(type(wind.x)).toBe("number");
		expect(type(wind.y)).toBe("number");
		expect(type(wind.z)).toBe("number");
	});
});
