---
column: done
labels:
  - docs
  - dcs-live
  - verification
priority: high
updatedAt: 2026-09-20 00:00:00 UTC
---

# Verify timer function documentation

## Source under test

- `packages/tslua-dcs-mission-types/src/timer.ts`

## Function checklist

- [x] `getPause(): boolean` — packages/tslua-dcs-mission-types/src/timer.ts:12
- [x] `getAbsTime(): number` — packages/tslua-dcs-mission-types/src/timer.ts:27
- [x] `setFunctionTime(functionId: number, modelTime: number): number` — packages/tslua-dcs-mission-types/src/timer.ts
- [x] `scheduleFunction<T>( functionToCall: ScheduledFunction<T>, functionArgument: T, modelTime: number, ): number` — packages/tslua-dcs-mission-types/src/timer.ts:65
- [x] `removeFunction(functionId: number): void` — packages/tslua-dcs-mission-types/src/timer.ts:81
- [x] `getTime(): number` — packages/tslua-dcs-mission-types/src/timer.ts:91
- [x] `getTime0(): number` — packages/tslua-dcs-mission-types/src/timer.ts:101

## Required evidence

For every item, record the bridge environment, fixture/object identity, exact Lua expression, returned Lua type/value or error, cleanup, and whether the TypeScript example was sufficient without guessing.

## Failures and corrections

Record documentation/signature failures here. A corrected card returns to live verification with a fresh low-effort Luna agent.

## Verification attempt — 2026-09-20 (fresh Luna low-effort pass)

- Bridge health: `dcs-studio-mission` / `mission`, version `0.4.0`, `pump_stalled: false`, queue depth `0`; `rpc.discover` succeeded and advertised `eval`.
- `timer.getPause()` returned boolean `false`; `timer.getAbsTime()` returned number `36896.7`; `timer.getTime()` returned number `8096`; `timer.getTime0()` returned number `28800`.
- `timer.scheduleFunction(function(arg,t) return nil end,"codex",timer.getTime()+60)` returned numeric id `8`; `timer.removeFunction(8)` returned nil. The documented callback shape, argument, schedule time, numeric id, and cleanup example were sufficient.
- `timer.setFunctionTime(id,timer.getTime()+120)` on disposable id `9` returned number `8216.1`, not nil as declared. The operation succeeded and was cleaned up with `timer.removeFunction(9)`, but the declaration's `void` return is contradicted by live DCS and requires correction/re-dispatch.
- Correction: the declaration now returns `number`, documents that value as the new scheduled model time, captures it in the expanded example, and links the bundled DCS call site at `%DCS_INSTALL_DIR%/Scripts/UI/RadioCommandDialogPanel/CommandDialogsPanel.lua:140`. Awaiting fresh Luna-low verification.
- No persistent fixture remained; both scheduled callbacks were removed.

## Verification attempt — 2026-09-20 (fresh Luna low-effort correction pass)

- Bridge health: `dcs-studio-mission` / `mission`, version `0.4.0`, `pump_stalled: false`, queue depth `0`; `rpc.discover` succeeded and advertised `eval`.
- Exact expression: `(function() local id=timer.scheduleFunction(function(arg,t) return nil end,'codex-setFunctionTime',timer.getTime()+120); local requested=timer.getTime()+240; local returned=timer.setFunctionTime(id,requested); timer.removeFunction(id); return {id=id,requested=requested,returned=returned,returnedType=type(returned)} end)()`.
- `repl_inspect` returned a table; expansion gave disposable callback `id=8`, `requested=8551.7` (`number`), `returned=8551.7` (`number`), `returnedType="number"`. The returned number equals the requested model time, confirming the corrected signature and documented meaning.
- Cleanup: `timer.removeFunction(8)` was called in the expression after rescheduling; no callback remained. The corrected docs were sufficient without guessing.

- Bridge health: `GET http://127.0.0.1:25570/health` returned `status: OK`, but `pump_stalled: true`, `queue_depth: 4`, and `pump_idle_ms: 34239`.
- Discovery request: `POST http://127.0.0.1:25570/rpc` with `rpc.discover` was rejected with JSON-RPC `-32002`: `the mission bridge's queue has not been drained ... DCS is not running the pump ... (the sim is paused, loading, or a debug session or long call holds the sim thread)`.
- No Lua expression could be dispatched, so all seven checklist items remain unchecked. No fixture or mission state was created and no cleanup was required.
- This is an environment blocker, not evidence that the documented signatures are correct; re-dispatch after DCS is actively pumping a running mission.
