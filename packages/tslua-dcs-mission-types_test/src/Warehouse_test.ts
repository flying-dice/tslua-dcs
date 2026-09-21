import { describe, expect, test } from "@flying-dice/tslua-luatest";

describe("Warehouse examples", () => {
	test("Batumi warehouse getters return documented values", () => {
		const base = Airbase.getByName("Batumi");
		if (!base) throw new Error("Batumi is required by the test mission");
		const warehouse = base.getWarehouse();
		expect(type(warehouse.getInventory())).toBe("table");
		expect(type(warehouse.getOwner())).toBe("table");
		expect(type(warehouse.getLiquidAmount(0))).toBe("number");
		expect(type(warehouse.getItemCount("weapons.bombs.GBU_31"))).toBe("number");
		expect(type(Warehouse.getResourceMap())).toBe("table");
		const byName = Warehouse.getByName("Batumi");
		expect(byName === undefined || type(byName) === "table").toBe(true);
	});

	test("warehouse mutation helpers are present", () => {
		const warehouse = Airbase.getByName("Batumi")?.getWarehouse();
		if (!warehouse) throw new Error("Batumi warehouse is required");
		for (const value of [
			warehouse.addItem,
			warehouse.addLiquid,
			Warehouse.getCargoAsWarehouse,
			warehouse.removeItem,
			warehouse.removeLiquid,
			warehouse.setItem,
			warehouse.setLiquidAmount,
		])
			expect(type(value)).toBe("function");
	});
});
