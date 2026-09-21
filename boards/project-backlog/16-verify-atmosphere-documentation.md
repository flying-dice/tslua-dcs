---
column: done
labels:
  - docs
  - dcs-live
  - verification
priority: high
updatedAt: 2026-09-20 00:00:00 UTC
---

# Verify atmosphere function documentation

## Source under test

- `packages/tslua-dcs-mission-types/src/atmosphere.ts`

## Function checklist

- [x] `getTemperatureAndPressure(point: l_Vec3): LuaMultiReturn<[number, number]>` — packages/tslua-dcs-mission-types/src/atmosphere.ts:13
- [x] `getWind(point: l_Vec3): l_Vec3` — packages/tslua-dcs-mission-types/src/atmosphere.ts:22
- [x] `getWindWithTurbulence(point: l_Vec3): l_Vec3` — packages/tslua-dcs-mission-types/src/atmosphere.ts:32

## Required evidence

For every item, record the bridge environment, fixture/object identity, exact Lua expression, returned Lua type/value or error, cleanup, and whether the TypeScript example was sufficient without guessing.

## Failures and corrections

Record documentation/signature failures here. A corrected card returns to live verification with a fresh low-effort Luna agent.

## Verification attempt — 2026-09-20 (fresh Luna low-effort pass)

- Bridge health: `dcs-studio-mission` / `mission`, version `0.4.0`, `pump_stalled: false`, queue depth `0`; `rpc.discover` succeeded and advertised `eval`.
- `atmosphere.getTemperatureAndPressure({x=0,y=100,z=0})` returned `{type="number,number", a=292.5, b=100149.15542774062}`; documented Vec3 input and two numeric returns were sufficient.
- `atmosphere.getWind({x=0,y=100,z=0})` returned `{type="table", x=0, y=0, z=0}`; documented Vec3 and l_Vec3 result were sufficient.
- `atmosphere.getWindWithTurbulence({x=0,y=100,z=0})` returned `{type="table", x=0, y=0, z=0}`; documented Vec3 and l_Vec3 result were sufficient.
- No fixture was created; no cleanup required.

- Bridge health: `GET http://127.0.0.1:25570/health` returned `status: OK`, but `pump_stalled: true`, `queue_depth: 4`, and `pump_idle_ms: 34239`.
- Discovery request: `POST http://127.0.0.1:25570/rpc` with `rpc.discover` was rejected with JSON-RPC `-32002`: `the mission bridge's queue has not been drained ... DCS is not running the pump ... (the sim is paused, loading, or a debug session or long call holds the sim thread)`.
- No Lua expression could be dispatched, so all three checklist items remain unchecked. No fixture or mission state was created and no cleanup was required.
- This is an environment blocker, not evidence that the documented signatures are correct; re-dispatch after DCS is actively pumping a running mission.
