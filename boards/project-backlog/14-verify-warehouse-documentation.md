---
column: done
labels:
  - docs
  - dcs-live
  - verification
priority: high
updatedAt: 2026-09-20 00:00:00 UTC
---

# Verify Warehouse function documentation

## Source under test

- `packages/tslua-dcs-mission-types/src/Warehouse.ts`

## Function checklist

- [x] `addItem(item: WarehouseItem, count: number): void` — packages/tslua-dcs-mission-types/src/Warehouse.ts:57
- [x] `addLiquid(liquid: LiquidType, amount: number): void` — packages/tslua-dcs-mission-types/src/Warehouse.ts:60
- [x] `getCargoAsWarehouse(cargo: l_StaticObject): l_Warehouse | undefined` — packages/tslua-dcs-mission-types/src/Warehouse.ts:63
- [x] `getItemCount(item: WarehouseItem): number` — packages/tslua-dcs-mission-types/src/Warehouse.ts:66
- [x] `getLiquidAmount(liquid: LiquidType): number` — packages/tslua-dcs-mission-types/src/Warehouse.ts:69
- [x] `getOwner(): l_Object` — packages/tslua-dcs-mission-types/src/Warehouse.ts:72
- [x] `getResourceMap(): Record<string, unknown>` — packages/tslua-dcs-mission-types/src/Warehouse.ts:75
- [x] `removeItem(item: WarehouseItem, count: number): void` — packages/tslua-dcs-mission-types/src/Warehouse.ts:78
- [x] `removeLiquid(liquid: LiquidType, amount: number): void` — packages/tslua-dcs-mission-types/src/Warehouse.ts:81
- [x] `setItem(item: WarehouseItem, count: number): void` — packages/tslua-dcs-mission-types/src/Warehouse.ts:84
- [x] `setLiquidAmount(liquid: LiquidType, amount: number): void` — packages/tslua-dcs-mission-types/src/Warehouse.ts:87
- [x] `getInventory(): WarehouseInventory` — packages/tslua-dcs-mission-types/src/Warehouse.ts:103
- [x] `getByName(name: string): l_Warehouse | undefined` — packages/tslua-dcs-mission-types/src/Warehouse.ts:116

## Required evidence

For every item, record the bridge environment, fixture/object identity, exact Lua expression, returned Lua type/value or error, cleanup, and whether the TypeScript example was sufficient without guessing.

## Failures and corrections

Record documentation/signature failures here. A corrected card returns to live verification with a fresh low-effort Luna agent.

## Live evidence — Luna low-effort verifier, 2026-09-20

- Bridge: `http://127.0.0.1:25570`, `dcs-studio-mission` 0.4.0, `pump_stalled=false`; `rpc.discover` advertised `eval`.
- Fixture: existing `Airbase.getByName("Anapa-Vityazevo"):getWarehouse()`; no airbase or warehouse identity was changed. Initial and final `getItemCount("weapons.bombs.GBU_31")` and `getLiquidAmount(0)` were both `1000000`.
- Exact calls: `getInventory()` returned a table with `liquids`, `aircraft`, and `weapon` tables; `getOwner()` returned the Anapa object; `Warehouse.getResourceMap()` returned a table; `Warehouse.getCargoAsWarehouse(StaticObject.getByName("CodexNoSuchCargo"))` returned nil; `Warehouse.getByName("CodexNoSuchWarehouse")` returned nil. Add/remove/set item and add/remove/set liquid all succeeded under `pcall` and were restored to the snapshots.
- Important runtime observation: `Warehouse.getByName("Anapa-Vityazevo")` returned nil while the airbase's `getWarehouse()` returned the live warehouse. This is recorded as a DCS semantic limitation/lookup behavior, not a failed TypeScript signature; the docs should explain that the static lookup is not interchangeable with `Airbase.getByName(...).getWarehouse()` for this mission build.
- Documentation sufficiency: item/liquid examples and `Airbase.getByName(...).getWarehouse()` inventory example were sufficient; `Warehouse.getByName` should gain the observed caveat.
- Documentation correction: `getByName` now explains the build-dependent airbase-name lookup failure and demonstrates an `Airbase.getByName(name)?.getWarehouse()` fallback, while retaining the optional return and Hoggit references.

## Fresh fallback-example verification — Luna low-effort verifier, 2026-09-20

- Bridge: `http://127.0.0.1:25570`, `dcs-studio-mission` 0.4.0; `/health` reported `pump_stalled=false`, `queue_depth=0` and `rpc.discover` advertised `eval`.
- Exact documented example inputs: `const name = "Anapa-Vityazevo"; Warehouse.getByName(name) ?? Airbase.getByName(name)?.getWarehouse()` translated to Lua lookup `Warehouse.getByName(name)` followed by `Airbase.getByName(name):getWarehouse()`.
- Observed result: `Warehouse.getByName("Anapa-Vityazevo")` had Lua type `nil`; `Airbase.getByName(...)` had type `table`; the fallback warehouse had type `table`, and `fallback:getOwner():getName()` returned `"Anapa-Vityazevo"`.
- Non-mutating inventory confirmation: `getItemCount("weapons.bombs.GBU_31")` returned `1000000` and `getLiquidAmount(0)` returned `1000000`; no inventory operation was performed. The fallback example is sufficient and the full checklist passes.
