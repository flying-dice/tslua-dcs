---
column: done
labels:
  - docs
  - dcs-live
  - verification
priority: high
updatedAt: 2026-09-20 00:00:00 UTC
---

# Verify env function documentation

## Source under test

- `packages/tslua-dcs-mission-types/src/env.ts`

## Function checklist

- [x] `info(message: string, showMessageBox?: boolean): void` — packages/tslua-dcs-mission-types/src/env.ts:5
- [x] `warning(message: string, showMessageBox?: boolean): void` — packages/tslua-dcs-mission-types/src/env.ts:8
- [x] `error(message: string, showMessageBox?: boolean): void` — packages/tslua-dcs-mission-types/src/env.ts:11
- [x] `setErrorMessageBoxEnabled(enabled: boolean): void` — packages/tslua-dcs-mission-types/src/env.ts:14
- [x] `getMissionName(): string` — packages/tslua-dcs-mission-types/src/env.ts:17

## Required evidence

For every item, record the bridge environment, fixture/object identity, exact Lua expression, returned Lua type/value or error, cleanup, and whether the TypeScript example was sufficient without guessing.

## Failures and corrections

Record documentation/signature failures here. A corrected card returns to live verification with a fresh low-effort Luna agent.

## Verification attempt — 2026-09-20 (fresh Luna low-effort pass)

- Bridge health: `dcs-studio-mission` / `mission`, version `0.4.0`, `pump_stalled: false`, queue depth `0`; `rpc.discover` succeeded and advertised `eval`.
- `env.info("Codex verification info",false)`, `env.warning("Codex verification warning",false)`, and `env.error("Codex verification error",false)` each returned Lua `nil`; examples were sufficient and no modal boxes were requested.
- `env.setErrorMessageBoxEnabled(false)` returned Lua `nil`; example was sufficient.
- `env.getMissionName()` returned Lua `string` `C:\\Users\\jonat\\AppData\\Local\\Temp\\DCS.openbeta\\tempMission.miz`; example was sufficient.
- No fixture was created; no cleanup required.

- Bridge health: `GET http://127.0.0.1:25570/health` returned `status: OK`, but `pump_stalled: true`, `queue_depth: 4`, and `pump_idle_ms: 34239`.
- Discovery request: `POST http://127.0.0.1:25570/rpc` with `rpc.discover` was rejected with JSON-RPC `-32002`: `the mission bridge's queue has not been drained ... DCS is not running the pump ... (the sim is paused, loading, or a debug session or long call holds the sim thread)`.
- No Lua expression could be dispatched, so all five checklist items remain unchecked. No fixture or mission state was created and no cleanup was required.
- This is an environment blocker, not evidence that the documented signatures are correct; re-dispatch after DCS is actively pumping a running mission.
