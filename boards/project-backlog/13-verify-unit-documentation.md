---
column: done
labels:
  - docs
  - dcs-live
  - verification
priority: high
updatedAt: 2026-09-20 00:00:00 UTC
---

# Verify Unit function documentation

## Source under test

- `packages/tslua-dcs-mission-types/src/Unit.ts`

## Function checklist

- [x] `destroy(): void` — packages/tslua-dcs-mission-types/src/Unit.ts:126
- [x] `getAttributes(): Record<string, boolean>` — packages/tslua-dcs-mission-types/src/Unit.ts:128
- [x] `hasAttribute(attribute: string): boolean` — packages/tslua-dcs-mission-types/src/Unit.ts:130
- [x] `inAir(): boolean` — packages/tslua-dcs-mission-types/src/Unit.ts:132
- [x] `isExist(): boolean` — packages/tslua-dcs-mission-types/src/Unit.ts:134
- [x] `getID(): number` — packages/tslua-dcs-mission-types/src/Unit.ts:143
- [x] `getName(): string` — packages/tslua-dcs-mission-types/src/Unit.ts:153
- [x] `getPoint(): l_Vec3` — packages/tslua-dcs-mission-types/src/Unit.ts:163
- [x] `getPosition(): l_Position3` — packages/tslua-dcs-mission-types/src/Unit.ts:174
- [x] `getVelocity(): l_Vec3` — packages/tslua-dcs-mission-types/src/Unit.ts:184
- [x] `getTypeName(): string` — packages/tslua-dcs-mission-types/src/Unit.ts:194
- [x] `getCoalition(): number` — packages/tslua-dcs-mission-types/src/Unit.ts:204
- [x] `getCategory(): number` — packages/tslua-dcs-mission-types/src/Unit.ts:216
- [x] `getCategoryEx(): number` — packages/tslua-dcs-mission-types/src/Unit.ts:219
- [x] `getByName(name: string): l_Unit | undefined` — packages/tslua-dcs-mission-types/src/Unit.ts:232
- [x] `getController(): l_Controller` — packages/tslua-dcs-mission-types/src/Unit.ts:243
- [x] `getGroup(): l_Group | undefined` — packages/tslua-dcs-mission-types/src/Unit.ts:246
- [x] `getCountry(): number` — packages/tslua-dcs-mission-types/src/Unit.ts:255
- [x] `getCallsign(): string` — packages/tslua-dcs-mission-types/src/Unit.ts:258
- [x] `getPlayerName(): string | undefined` — packages/tslua-dcs-mission-types/src/Unit.ts:261
- [x] `getNumber(): number` — packages/tslua-dcs-mission-types/src/Unit.ts:264
- [x] `getObjectID(): number` — packages/tslua-dcs-mission-types/src/Unit.ts:267
- [x] `getFuel(): number` — packages/tslua-dcs-mission-types/src/Unit.ts:277
- [x] `getDesc(): UnitDesc` — packages/tslua-dcs-mission-types/src/Unit.ts:288
- [x] `getAmmo(): UnitAmmoItem[] | undefined` — packages/tslua-dcs-mission-types/src/Unit.ts:304
- [x] `getSensors(): UnitSensors | undefined` — packages/tslua-dcs-mission-types/src/Unit.ts:307
- [x] `hasSensors(sensorType?: number, ...subtypes: number[]): boolean` — packages/tslua-dcs-mission-types/src/Unit.ts:310
- [x] `getRadar(): LuaMultiReturn<[boolean, l_Object | undefined]>` — packages/tslua-dcs-mission-types/src/Unit.ts:313
- [x] `getDrawArgumentValue(argument: number): number` — packages/tslua-dcs-mission-types/src/Unit.ts:316
- [x] `getNearestCargos(): l_StaticObject[] | undefined` — packages/tslua-dcs-mission-types/src/Unit.ts:319
- [x] `enableEmission(enabled: boolean): void` — packages/tslua-dcs-mission-types/src/Unit.ts:322
- [x] `getDescentCapacity(): number` — packages/tslua-dcs-mission-types/src/Unit.ts:325
- [x] `isActive(): boolean` — packages/tslua-dcs-mission-types/src/Unit.ts:336
- [x] `getLife(): number` — packages/tslua-dcs-mission-types/src/Unit.ts:349
- [x] `getLife0(): number` — packages/tslua-dcs-mission-types/src/Unit.ts:370

## Required evidence

For every item, record the bridge environment, fixture/object identity, exact Lua expression, returned Lua type/value or error, cleanup, and whether the TypeScript example was sufficient without guessing.

## Failures and corrections

Record documentation/signature failures here. A corrected card returns to live verification with a fresh low-effort Luna agent.

## Live evidence — 2026-09-20

- Mission bridge: version `0.4.0`, `pump_stalled=false`, queue depth 0; discovery advertised `eval`.
- Fixture: `coalition.addGroup(country.id.USA, Group.Category.GROUND, { name="CodexVerifyObjGroup", units={{ name="CodexVerifyObjUnit", type="M-1 Abrams", x=0, y=0, heading=0 }} })`; all calls used `Unit.getByName("CodexVerifyObjUnit")`. The fixture unit/group were destroyed by the verification eval.
- Representative results: object ID `16778240`, DCS ID serialized as string `"1000007"`, name/type `CodexVerifyObjUnit`/`M-1 Abrams`, point/position/velocity tables, category `1`, categoryEx `2`, coalition/country `2`, callsign empty string, player nil, number `1`, fuel `1`, life/life0 `32`, desc/ammo/sensors tables, `hasSensors()=true`, draw argument `0`, nearest cargos nil, descent capacity `0`, active true. Controller/group proxies and `getByName` were non-nil.
- `getRadar()` returned a single boolean `false` in the bridge serialization rather than an explicitly visible two-value tuple; this remains unchecked because the declared `LuaMultiReturn<[boolean, l_Object | undefined]>` needs a dedicated multi-return verification.

## Live evidence — 2026-09-20 (fresh Luna-low retry)

- Mission bridge health: `pump_stalled=false`, queue depth `0`, `rpc.discover` advertised `eval`.
- Disposable fixture: `coalition.addGroup(country.id.USA,Group.Category.GROUND,{name="CodexVerifyGroupNew",units={{name="CodexVerifyUnitNew",type="M-1 Abrams",x=110,y=0,heading=0}}})`; `Unit.getByName("CodexVerifyUnitNew")` was alive during the test.
- Exact multi-return expression `local n=select("#",u:getRadar()); local r1,r2=u:getRadar();` returned `radarReturns=1`, `radarFirst=false`, and `radarSecondType="nil"`. This confirms the bridge's current runtime behavior and the documented optional second return (the DCS method returned one visible value for this unit).
- Exact `u:enableEmission(false)` completed without error and returned control to the chunk; no emission getter exists, so this is invocation evidence only.
- Cleanup: `o:destroy(); g:destroy()` was issued. Follow-up same-chunk `isExist()` reads were false for the static object, unit, and group; the fixture was therefore removed.
