---
column: done
labels:
  - docs
  - dcs-live
  - verification
priority: high
updatedAt: 2026-09-20 00:00:00 UTC
---

# Verify coord function documentation

## Source under test

- `packages/tslua-dcs-mission-types/src/coord.ts`

## Function checklist

- [x] `LOtoLL(vec3: l_Vec3): LuaMultiReturn<[number, number, number]>` — packages/tslua-dcs-mission-types/src/coord.ts:17
- [x] `LLtoLO( lat: number, lon: number, alt: number, ): { x: number; y: number; z: number }` — packages/tslua-dcs-mission-types/src/coord.ts:33
- [x] `LLtoMGRS(lat: number, lon: number): l_MGRS` — packages/tslua-dcs-mission-types/src/coord.ts:48
- [x] `MGRStoLL(mgrs: l_MGRS): LuaMultiReturn<[number, number]>` — packages/tslua-dcs-mission-types/src/coord.ts

## Required evidence

For every item, record the bridge environment, fixture/object identity, exact Lua expression, returned Lua type/value or error, cleanup, and whether the TypeScript example was sufficient without guessing.

## Failures and corrections

Record documentation/signature failures here. A corrected card returns to live verification with a fresh low-effort Luna agent.

## Verification attempt — 2026-09-20 (fresh Luna low-effort pass)

- Bridge health: `dcs-studio-mission` / `mission`, version `0.4.0`, `pump_stalled: false`, queue depth `0`; `rpc.discover` succeeded and advertised `eval`.
- `coord.LOtoLL({x=0,y=0,z=0})` returned `45.129497060329136, 34.26551518845634, 0` (`number,number,number`); docs sufficient.
- `coord.LLtoLO(41.6103,41.5997,0)` returned `{x=-355737.03125,y=0,z=617333.5625}` (`table`); docs sufficient.
- `coord.LLtoMGRS(41.6103,41.5997)` returned `{UTMZone="37T",MGRSDigraph="GG",Easting=16618,Northing=9773}` (`table`); docs sufficient.
- `coord.MGRStoLL(coord.LLtoMGRS(41.6103,41.5997))` returned `41.610288251241485, 41.59969344975882, nil` (`number,number,nil`). The declaration and example promise a three-number return, but live DCS returns only latitude and longitude; this is a documentation/signature failure requiring correction and re-dispatch.
- Correction: the declaration now returns `LuaMultiReturn<[number, number]>`; the prose explicitly distinguishes it from `LOtoLL`, and the expanded example consumes only latitude and longitude. Awaiting fresh Luna-low verification.
- No fixture was created; no cleanup required.

## Verification attempt — 2026-09-20 (fresh Luna low-effort correction pass)

- Bridge health: `dcs-studio-mission` / `mission`, version `0.4.0`, `pump_stalled: false`, queue depth `0`; `rpc.discover` succeeded and advertised `eval`.
- Exact expression: `(function() local a,b,c=coord.MGRStoLL(coord.LLtoMGRS(41.6103,41.5997)); return {a=a,b=b,c=c,argc=select('#',coord.MGRStoLL(coord.LLtoMGRS(41.6103,41.5997)))} end)()`.
- `repl_inspect` returned a table; expansion gave `a=41.610288251241` (`number`), `b=41.599693449759` (`number`), `argc=2` (`number`), with no `c` entry. This confirms exactly two numeric return values and no third value.
- The corrected two-number signature and example were sufficient without guessing. No fixture or cleanup was required.

- Bridge health: `GET http://127.0.0.1:25570/health` returned `status: OK`, but `pump_stalled: true`, `queue_depth: 4`, and `pump_idle_ms: 34239`.
- Discovery request: `POST http://127.0.0.1:25570/rpc` with `rpc.discover` was rejected with JSON-RPC `-32002`: `the mission bridge's queue has not been drained ... DCS is not running the pump ... (the sim is paused, loading, or a debug session or long call holds the sim thread)`.
- No Lua expression could be dispatched, so all four checklist items remain unchecked. No fixture or mission state was created and no cleanup was required.
- This is an environment blocker, not evidence that the documented signatures are correct; re-dispatch after DCS is actively pumping a running mission.
