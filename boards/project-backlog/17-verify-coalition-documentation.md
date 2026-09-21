---
column: done
labels:
  - docs
  - dcs-live
  - verification
priority: high
updatedAt: 2026-09-20 00:00:00 UTC
---

# Verify coalition function documentation

## Source under test

- `packages/tslua-dcs-mission-types/src/coalition.ts`

## Function checklist

- [x] `addGroup( countryId: number, groupCategory: number, groupData: CoalitionSpawnData, ): l_Group` — packages/tslua-dcs-mission-types/src/coalition.ts:19
- [x] `addRefPoint(coalitionId: number, referencePoint: CoalitionReferencePoint): void` — packages/tslua-dcs-mission-types/src/coalition.ts
- [x] `addStaticObject( countryId: number, objectData: CoalitionSpawnData, ): l_StaticObject` — packages/tslua-dcs-mission-types/src/coalition.ts:32
- [x] `getGroups(coalitionId: number, groupCategory?: number): l_Group[]` — packages/tslua-dcs-mission-types/src/coalition.ts:57
- [x] `getAirbases(coalitionId: number): l_Airbase[]` — packages/tslua-dcs-mission-types/src/coalition.ts:75
- [x] `getStaticObjects(coalitionId: number): l_StaticObject[]` — packages/tslua-dcs-mission-types/src/coalition.ts:92
- [x] `getPlayers(coalitionId: number): l_Unit[]` — packages/tslua-dcs-mission-types/src/coalition.ts:95
- [x] `getServiceProviders(coalitionId: number, service: number): l_Unit[]` — packages/tslua-dcs-mission-types/src/coalition.ts:98
- [x] `getRefPoints(coalitionId: number): CoalitionReferencePoint[]` — packages/tslua-dcs-mission-types/src/coalition.ts:101
- [x] `getMainRefPoint(coalitionId: number): CoalitionReferencePoint | undefined` — packages/tslua-dcs-mission-types/src/coalition.ts:104
- [x] `getCountryCoalition(countryId: number): number` — packages/tslua-dcs-mission-types/src/coalition.ts:107

## Required evidence

For every item, record the bridge environment, fixture/object identity, exact Lua expression, returned Lua type/value or error, cleanup, and whether the TypeScript example was sufficient without guessing.

## Failures and corrections

Record documentation/signature failures here. A corrected card returns to live verification with a fresh low-effort Luna agent.

## Live evidence — 2026-09-20

- Bridge: `http://127.0.0.1:25570`, `dcs-studio-mission`, `env=mission`, version `0.4.0`; `/health` reported `pump_stalled=false`, queue depth `0`; `rpc.discover` advertised `repl_inspect`/`eval`.
- Fixture: `coalition.addGroup(country.id.USA, Group.Category.GROUND, {name="CodexGlobalGroup", units={{name="CodexGlobalUnit", type="M-1 Abrams", x=10, y=10, heading=0}}})` and `coalition.addStaticObject(country.id.USA, {name="CodexGlobalStatic", type="FARP Tent", x=20, y=20, heading=0})`. Both returned Lua tables and were destroyed after testing.
- Exact observed calls: `coalition.getGroups(coalition.side.BLUE)` → `table` length 1; category-filtered call → `table`; `getAirbases` → table length 0; `getStaticObjects`, `getPlayers`, `getServiceProviders` → tables; `getRefPoints` → `nil` before adding a point; `getMainRefPoint` → table; `getCountryCoalition(country.id.USA)` → number `2`.
- `coalition.addRefPoint(coalition.side.BLUE, {name="CodexRef2", point={x=10,y=20}})` failed with DCS runtime error: `Parameter #2 is non-consistent (reference point callsign missed)`. The current `CoalitionReferencePoint` type/docs omit the required `callsign` field; this is a documentation/signature failure requiring correction and re-dispatch. No point was created by the failed call.
- TypeScript examples were sufficient for all successful calls. The addRefPoint example was not sufficient because it omitted the required callsign.
- Cleanup: `Group.getByName("CodexGlobalGroup"):destroy()` and `StaticObject.getByName("CodexGlobalStatic"):destroy()`; no surviving fixtures claimed.
- Correction: `CoalitionReferencePoint` now requires numeric `callsign` and `type` plus a full `l_Vec3` point, and the example supplies all three required fields. Awaiting fresh Luna-low verification.

## Fresh Luna-low verification — 2026-09-20

- Bridge: `http://127.0.0.1:25570`, `dcs-studio-mission`, `env=mission`, version `0.4.0`; `/health` reported `pump_stalled=false`, queue depth `0`.
- Exact expression: `coalition.addRefPoint(coalition.side.BLUE, {callsign=901, type=0, point={x=0,y=0,z=0}, name="CodexRefFresh"})`.
- Result: call succeeded; `coalition.getRefPoints(coalition.side.BLUE)` returned a table containing `{callsign=901, type=0, point={x=0,y=0,z=0}}`. This confirms the corrected required fields and full 3D point shape. The TypeScript example was sufficient without guessing.
- Cleanup: DCS exposes no matching `removeRefPoint` API. The uniquely named point `CodexRefFresh` is therefore intentionally recorded as a persistent mission fixture for removal on the next mission reload.
