import type { l_Object } from "@flying-dice/tslua-dcs-mission-types";
import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { unitFixture } from "./fixtures";

describe("Object examples", () => {
	test("common object getters return documented shapes", () => {
		const object = unitFixture();
		expect(type(object.getName())).toBe("string");
		expect(type(object.getPoint())).toBe("table");
		expect(type(object.getPosition())).toBe("table");
		expect(type(object.getTypeName())).toBe("string");
		expect(type(object.getVelocity())).toBe("table");
		expect(type(object.inAir())).toBe("boolean");
		expect(object.isExist()).toBe(true);
		expect(type(object.hasAttribute("Planes"))).toBe("boolean");
		expect(type(object.getCategory())).toBe("number");
		const attributes = object.getAttributes();
		expect(attributes === undefined || type(attributes) === "table").toBe(true);
	});

	test("cargo cancellation export is present", () => {
		const object = unitFixture() as unknown as l_Object;
		expect(type(object.cancelChoosingCargo)).toBe("function");
		expect(type(object.destroy)).toBe("function");
	});
});
