---
column: done
labels:
  - docs
  - dcs-live
  - verification
priority: high
updatedAt: 2026-09-20 00:00:00 UTC
---

# Verify StaticObject function documentation

## Source under test

- `packages/tslua-dcs-mission-types/src/StaticObject.ts`

## Function checklist

- [x] `destroy(): void` — packages/tslua-dcs-mission-types/src/StaticObject.ts:43
- [x] `getAttributes(): Record<string, boolean> | undefined` — packages/tslua-dcs-mission-types/src/StaticObject.ts
- [x] `getCategory(): number` — packages/tslua-dcs-mission-types/src/StaticObject.ts:47
- [x] `getTypeName(): string` — packages/tslua-dcs-mission-types/src/StaticObject.ts:49
- [x] `getVelocity(): l_Vec3` — packages/tslua-dcs-mission-types/src/StaticObject.ts:51
- [x] `hasAttribute(attribute: string): boolean` — packages/tslua-dcs-mission-types/src/StaticObject.ts:53
- [x] `inAir(): boolean` — packages/tslua-dcs-mission-types/src/StaticObject.ts:55
- [x] `isExist(): boolean` — packages/tslua-dcs-mission-types/src/StaticObject.ts:57
- [x] `getDescByName(typeName: string): StaticObjectDesc | undefined` — packages/tslua-dcs-mission-types/src/StaticObject.ts:60
- [x] `getID(): number` — packages/tslua-dcs-mission-types/src/StaticObject.ts:75
- [x] `getLife(): number` — packages/tslua-dcs-mission-types/src/StaticObject.ts:78
- [x] `getCargoDisplayName(): string | undefined` — packages/tslua-dcs-mission-types/src/StaticObject.ts
- [x] `getCargoWeight(): number` — packages/tslua-dcs-mission-types/src/StaticObject.ts:84
- [x] `getDrawArgumentValue(argument: number): number` — packages/tslua-dcs-mission-types/src/StaticObject.ts:87
- [x] `getName(): string` — packages/tslua-dcs-mission-types/src/StaticObject.ts:102
- [x] `getByName(name: string): l_StaticObject | undefined` — packages/tslua-dcs-mission-types/src/StaticObject.ts:120
- [x] `getCountry(): number` — packages/tslua-dcs-mission-types/src/StaticObject.ts:135
- [x] `getPoint(): l_Vec3` — packages/tslua-dcs-mission-types/src/StaticObject.ts:150
- [x] `getPosition(): l_Position3` — packages/tslua-dcs-mission-types/src/StaticObject.ts:166
- [x] `getCoalition(): number` — packages/tslua-dcs-mission-types/src/StaticObject.ts:181
- [x] `getDesc(): StaticObjectDesc` — packages/tslua-dcs-mission-types/src/StaticObject.ts:196

## Required evidence

For every item, record the bridge environment, fixture/object identity, exact Lua expression, returned Lua type/value or error, cleanup, and whether the TypeScript example was sufficient without guessing.

## Failures and corrections

Record documentation/signature failures here. A corrected card returns to live verification with a fresh low-effort Luna agent.

## Live evidence — 2026-09-20

- Mission bridge: version `0.4.0`, `pump_stalled=false`, queue depth 0; discovery advertised `eval`.
- Fixture: `coalition.addStaticObject(country.id.USA, { name="CodexVerifyStatic1", type="FARP Tent", x=105, y=0, heading=0 })`; cleaned with `o:destroy()` in the same eval. `StaticObject.getByName("CodexVerifyStatic1")` returned the fixture.
- Observed representative results: category `3`, type/name `"FARP Tent"`, velocity/point/position tables, `hasAttribute("Fortifications")=false`, `inAir()=false`, `isExist()=true`, ID serialized as string `"1000010"`, life `2`, cargo display name `nil`, cargo weight `0`, draw argument `0.674...`, country `2`, coalition `2`, and descriptor table. `getAttributes()` returned `nil` for this static object; this is a runtime mismatch with the declared `Record<string, boolean>` and remains unchecked pending review of the generated signature/documentation.
- Correction: `getAttributes` and `getCargoDisplayName` now explicitly permit `undefined`, their examples guard the absent values, and `getAttributes` links the bundled implementation that returns `self:getDesc().attributes`. Awaiting fresh Luna-low verification.

## Live evidence — 2026-09-20 (fresh Luna-low retry)

- Mission bridge health: `pump_stalled=false`, queue depth `0`, `rpc.discover` advertised `eval`.
- Disposable fixture: `coalition.addStaticObject(country.id.USA,{name="CodexVerifyStaticNew",type="FARP Tent",x=105,y=0,heading=0})`; `StaticObject.getByName("CodexVerifyStaticNew")` was alive during the test. Exact `o:getAttributes()` returned Lua `nil`, matching the corrected optional signature. Exact `o:getCargoDisplayName()` returned Lua `nil`, also matching the signature. `StaticObject.getDescByName("FARP Tent")` returned a descriptor table.
- Cleanup: `o:destroy()` was issued. Immediate post-call `isExist()` reads were false for the static object, unit, and group (the name lookups still returned dead proxies in the same chunk, so the first inline `nil` check was intentionally not treated as cleanup evidence).
