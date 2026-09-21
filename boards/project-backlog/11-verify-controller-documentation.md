---
column: done
labels:
  - docs
  - dcs-live
  - verification
priority: high
updatedAt: 2026-09-20 00:00:00 UTC
---

# Verify Controller function documentation

## Source under test

- `packages/tslua-dcs-mission-types/src/Controller.ts`

## Function checklist

- [x] `getDetectedTargets(...detectionMethods: number[]): DetectedTarget[]` — packages/tslua-dcs-mission-types/src/Controller.ts:20
- [x] `hasTask(): boolean` — packages/tslua-dcs-mission-types/src/Controller.ts:23
- [x] `isTargetDetected( target: l_Object, ...detectionMethods: number[] ): LuaMultiReturn< [boolean, boolean, number, boolean, boolean, l_Vec3, l_Vec3] >` — packages/tslua-dcs-mission-types/src/Controller.ts:26
- [x] `knowTarget(object: l_Object, type: boolean, distance: boolean): boolean` — packages/tslua-dcs-mission-types/src/Controller.ts
- [x] `popTask(): void` — packages/tslua-dcs-mission-types/src/Controller.ts:37
- [x] `pushTask(task: ControllerAction): void` — packages/tslua-dcs-mission-types/src/Controller.ts:40
- [x] `resetTask(): void` — packages/tslua-dcs-mission-types/src/Controller.ts:43
- [x] `setAltitude( altitude: number, keep?: boolean, altitudeType?: "BARO" | "RADIO", ): void` — packages/tslua-dcs-mission-types/src/Controller.ts:46
- [x] `setCommand(command: ControllerAction): void` — packages/tslua-dcs-mission-types/src/Controller.ts:53
- [x] `setOnOff(value: boolean): void` — packages/tslua-dcs-mission-types/src/Controller.ts:56
- [x] `setOption(optionId: number, optionValue: number | boolean | string): boolean` — packages/tslua-dcs-mission-types/src/Controller.ts
- [x] `setSpeed(speed: number, keep?: boolean): void` — packages/tslua-dcs-mission-types/src/Controller.ts:62
- [x] `setTask(task: ControllerAction): void` — packages/tslua-dcs-mission-types/src/Controller.ts:65

## Required evidence

For every item, record the bridge environment, fixture/object identity, exact Lua expression, returned Lua type/value or error, cleanup, and whether the TypeScript example was sufficient without guessing.

## Failures and corrections

Record documentation/signature failures here. A corrected card returns to live verification with a fresh low-effort Luna agent.

## Live evidence — Luna low-effort verifier, 2026-09-20

- Bridge: `http://127.0.0.1:25570`, `dcs-studio-mission` 0.4.0, `pump_stalled=false`; `rpc.discover` advertised `eval`.
- Fixture: `CodexControllerWarehouse` / `CodexControllerUnit` (M-1 Abrams), created with `coalition.addGroup`; destroyed after verification and confirmed `Group.getByName(...) == nil`.
- Exact calls: `g:getController():getDetectedTargets()` returned a table; `hasTask()` returned `false`; `isTargetDetected(g:getUnit(1))` succeeded and returned the documented multi-value API; `knowTarget(g:getUnit(1), true, true)`, `popTask()`, `pushTask({id='Hold',params={}})`, `resetTask()`, `setAltitude(1000,true,'RADIO')`, `setCommand({id='StopRoute',params={}})`, `setOnOff(true)`, `setSpeed(100,true)`, and `setTask({id='Hold',params={}})` all succeeded under `pcall` with no error. `setOption(0,true)` also succeeded.
- Runtime return note (corrected by direct vararg observation): the prior `pcall` result was not the native return value. A direct vararg capture showed that both methods return one native boolean in this DCS build:
  - `observe('knowTarget', c:knowTarget(u, true, true))` → `count=1`, first value `true`, first type `boolean`.
  - `observe('setOption', c:setOption(0, true))` → `count=1`, first value `true`, first type `boolean`.
  The direct capture used `select('#', ...)` inside `observe(label, ...)`, so it distinguishes zero return values from one return value. The current `void` declarations and `@returns Nothing` documentation are therefore not faithful to the verified runtime and should be corrected to `boolean` with the meaning documented as native operation success. This is a documentation/signature failure requiring a fresh verifier pass after correction.

## Direct return-value verification — Luna low-effort follow-up, 2026-09-20

- Bridge: `http://127.0.0.1:25570`, `dcs-studio-mission` 0.4.0, healthy (`pump_stalled=false`, `queue_depth=0`), `eval` available through `rpc.discover`.
- Fixture: `CodexControllerReturnCheck3` / `CodexControllerReturnUnit3` (M-1 Abrams), created with `coalition.addGroup`; `g:destroy()` was requested in the same evaluation. Earlier failed probes left `CodexControllerReturnCheck` and `CodexControllerReturnCheck2`; cleanup was attempted for all three names, with the first and third confirmed absent. The second stale name returned `false` from `Group.getByName(...) == nil` after destruction and needs a subsequent cleanup check before the next live pass.
- Exact Lua observation helper: `local function observe(label, ...) local n=select('#', ...); local first; if n > 0 then first=select(1, ...) end; return {label=label, count=n, firstType=n>0 and type(first) or 'no-value', first=first} end`.
- Exact calls: `observe('knowTarget', c:knowTarget(u, true, true))` returned `{count=1, firstType='boolean', first=true}`; `observe('setOption', c:setOption(0, true))` returned `{count=1, firstType='boolean', first=true}`.
- The TypeScript examples supplied the call shapes without guessing. The declarations incorrectly discard a real native boolean return; re-document and re-dispatch after changing both signatures.
- Documentation sufficiency: examples supplied enough call shapes; `ControllerAction` remains intentionally generic because task/command parameter schemas vary by ID.
- Correction: direct `select("#", ...)` verification proved that `knowTarget` and `setOption` each return one native boolean `true`, not `pcall` status. Both declarations and examples now expose the acceptance result.

## Fresh corrected-signature verification — Luna low-effort verifier, 2026-09-20

- Bridge: `http://127.0.0.1:25570`, `dcs-studio-mission` 0.4.0; `/health` reported `pump_stalled=false`, `queue_depth=0` and `rpc.discover` advertised `eval`.
- Fixture: disposable `CodexControllerCorrections` / `CodexControllerCorrectionsUnit` (M-1 Abrams), group ID `1000038`; the group was destroyed and a follow-up lookup confirmed `Group.getByName(...) == nil`. Earlier stale verifier fixtures were also cleaned and confirmed absent.
- Exact return observation: `observe('knowTarget', c:knowTarget(u, true, true))` returned `count=1`, `firstType='boolean'`, `first=true`; `observe('setOption', c:setOption(0, true))` returned `count=1`, `firstType='boolean'`, `first=true`. The direct vararg observer distinguishes the native return from `pcall` status.
- The corrected TypeScript signatures and examples were sufficient to form both calls without guessing. Both corrected checklist items pass.
