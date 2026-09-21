---
column: done
labels:
  - docs
  - dcs-live
  - verification
priority: high
updatedAt: 2026-09-20 00:00:00 UTC
---

# Verify world function documentation

## Source under test

- `packages/tslua-dcs-mission-types/src/world.ts`

## Function checklist

- [x] `getFogThickness(): number` — packages/tslua-dcs-mission-types/src/world.ts:31
- [x] `getFogVisibilityDistance(): number` — packages/tslua-dcs-mission-types/src/world.ts:33
- [x] `setFogAnimation(keys: FogAnimationKey[]): void` — packages/tslua-dcs-mission-types/src/world.ts:35
- [x] `setFogThickness(thickness: number): void` — packages/tslua-dcs-mission-types/src/world.ts:37
- [x] `setFogVisibilityDistance(visibility: number): void` — packages/tslua-dcs-mission-types/src/world.ts:39
- [x] `onEvent(event: l_WorldEvent): void` — verified through retained handler dispatch
- [x] `addEventHandler(handler: l_WorldEventHandler): void` — packages/tslua-dcs-mission-types/src/world.ts:126
- [x] `removeEventHandler(handler: l_WorldEventHandler): void` — packages/tslua-dcs-mission-types/src/world.ts:144
- [x] `onEvent(event: l_WorldEvent): void` — packages/tslua-dcs-mission-types/src/world.ts:160
- [x] `setPersistenceHandler(name: string, handler: () => unknown): void` — packages/tslua-dcs-mission-types/src/world.ts:179
- [x] `runPersistenceHandlers( storageFunc: (name: string, value: unknown) => void, ): void` — packages/tslua-dcs-mission-types/src/world.ts:197
- [x] `getPlayer(): l_Unit | undefined` — packages/tslua-dcs-mission-types/src/world.ts:202
- [x] `getMarkPanels(): WorldMarkPanel[]` — packages/tslua-dcs-mission-types/src/world.ts:205
- [x] `searchObjects<T>(category: number | number[], volume: WorldVolume, handler: (object: l_Object, data: T) => boolean, data?: T): number` — packages/tslua-dcs-mission-types/src/world.ts
- [x] `removeJunk(volume: WorldVolume): number` — packages/tslua-dcs-mission-types/src/world.ts:216
- [x] `getPersistenceData(name: string): unknown` — packages/tslua-dcs-mission-types/src/world.ts:219
- [x] `setPersistencePassthrough(handler: (...args: unknown[]) => unknown): void` — packages/tslua-dcs-mission-types/src/world.ts:222
- [x] `getAirbases(): l_Airbase[]` — packages/tslua-dcs-mission-types/src/world.ts:239

## Required evidence

For every item, record the bridge environment, fixture/object identity, exact Lua expression, returned Lua type/value or error, cleanup, and whether the TypeScript example was sufficient without guessing.

## Failures and corrections

Record documentation/signature failures here. A corrected card returns to live verification with a fresh low-effort Luna agent.

## Live evidence — 2026-09-20

- Bridge: `http://127.0.0.1:25570`, mission `0.4.0`, healthy (`pump_stalled=false`, queue depth `0`).
- Exact observations: `world.weather.getFogThickness()` and `getFogVisibilityDistance()` returned Lua numbers; the three setters returned nil for `setFogAnimation({{0,10000,100}})`, `setFogThickness(100)`, and `setFogVisibilityDistance(10000)`. `world.onEvent({id=world.event.S_EVENT_MISSION_START,time=timer.getTime()})`, persistence registration/execution, `getPlayer()` → nil, `getMarkPanels()` → table length 0, `removeJunk(sphere)` → number, `getPersistenceData("CodexPersist")` → nil, `setPersistencePassthrough(function(...) return ... end)` → nil, and `getAirbases()` → table length 21 all succeeded.
- `world.addEventHandler` was invoked successfully, but the anonymous handler was not retained and therefore `removeEventHandler` was not safely tested. Both handler checklist entries remain unchecked pending a retained-handler verification.
- `world.searchObjects(Object.Category.UNIT, {id=world.VolumeType.SPHERE, params={point={x=0,y=0,z=0},radius=100}}, function(o,d) return true end, "x")` returned Lua `number`, not `l_Object[]`. This is a confirmed signature mismatch requiring correction: the callback-driven DCS API returns the number of matches, while the current declaration claims an object array. The item remains unchecked.
- Correction: `searchObjects` now returns `number`; the docs explain that object references must be collected in the callback and include a complete counting/collection example. Awaiting fresh Luna-low verification.

## Fresh Luna-low verification — 2026-09-20

- Bridge: `http://127.0.0.1:25570`, `dcs-studio-mission`, `env=mission`, version `0.4.0`; `/health` reported `pump_stalled=false`, queue depth `0`.
- Retained-handler expression: `local seen=0; local handler={onEvent=function(self,event) if event and event.id then seen=seen+1 end end}; world.addEventHandler(handler); world.onEvent({id=world.event.S_EVENT_MISSION_START,time=timer.getTime()}); world.removeEventHandler(handler); world.onEvent({id=world.event.S_EVENT_MISSION_START,time=timer.getTime()})`.
- Result: `before=0`, `afterAdd=1`, `afterRemove=1`. The retained table's `onEvent(self,event)` was called once while registered and not called after removal, confirming both object identity removal and the documented event-handler shape. No handler remained registered.
- Search expression: `world.searchObjects(Object.Category.UNIT, {id=world.VolumeType.SPHERE,params={point={x=0,y=0,z=0},radius=100000}}, function(o,data) cb=cb+1; return true end, "CodexSearch")`.
- Result: `count=1`, callback count `cb=1`, confirming the corrected numeric visited-count return. No disposable object was created; no cleanup was required. The documented callback usage was sufficient without guessing.
