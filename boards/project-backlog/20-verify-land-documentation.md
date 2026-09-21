---
column: done
labels:
  - docs
  - dcs-live
  - verification
priority: high
updatedAt: 2026-09-20 00:00:00 UTC
---

# Verify land function documentation

## Source under test

- `packages/tslua-dcs-mission-types/src/land.ts`

## Function checklist

- [x] `findPathOnRoads( roadType: "roads" | "rails", x: number, y: number, destinationX: number, destinationY: number, ): l_Vec2[]` — packages/tslua-dcs-mission-types/src/land.ts:7
- [x] `getHeight(point: l_Vec2): number` — packages/tslua-dcs-mission-types/src/land.ts:27
- [x] `getClosestPointOnRoads( roadType: "roads" | "railroads", x: number, y: number, ): LuaMultiReturn<[number, number]>` — packages/tslua-dcs-mission-types/src/land.ts:46
- [x] `getIP( origin: l_Vec3, direction: l_Vec3, distance: number, ): l_Vec3 | undefined` — packages/tslua-dcs-mission-types/src/land.ts:53
- [x] `getSurfaceHeightWithSeabed(point: l_Vec2): LuaMultiReturn<[number, number]>` — packages/tslua-dcs-mission-types/src/land.ts:60
- [x] `getSurfaceType(point: l_Vec2): number` — packages/tslua-dcs-mission-types/src/land.ts:63
- [x] `isVisible(origin: l_Vec3, destination: l_Vec3): boolean` — packages/tslua-dcs-mission-types/src/land.ts:66
- [x] `profile(origin: l_Vec3, destination: l_Vec3): l_Vec3[]` — packages/tslua-dcs-mission-types/src/land.ts:69

## Required evidence

For every item, record the bridge environment, fixture/object identity, exact Lua expression, returned Lua type/value or error, cleanup, and whether the TypeScript example was sufficient without guessing.

## Failures and corrections

Record documentation/signature failures here. A corrected card returns to live verification with a fresh low-effort Luna agent.

## Verification attempt — 2026-09-20 (fresh Luna low-effort pass)

- Bridge health: `dcs-studio-mission` / `mission`, version `0.4.0`, `pump_stalled: false`, queue depth `0`; `rpc.discover` succeeded and advertised `eval`.
- `land.findPathOnRoads("roads",0,0,100,100)` returned Lua `table` with 2 points; `land.getHeight({x=0,y=0})` returned number `88.39225006103516`; `land.getClosestPointOnRoads("roads",0,0)` returned two numbers `14410.23626974153,184281.4015576701`.
- `land.getIP({x=0,y=100,z=0},{x=0,y=-1,z=0},200)` returned Vec3 `{x=0,y=88.39215850830078,z=0}`; `land.getSurfaceHeightWithSeabed({x=0,y=0})` returned `88.39224690045928,0`; `land.getSurfaceType({x=0,y=0})` returned number `1`.
- `land.isVisible({x=0,y=100,z=0},{x=100,y=100,z=100})` returned boolean `true`; `land.profile({x=0,y=100,z=0},{x=100,y=100,z=100})` returned table length `9`. All examples/signatures were sufficient.
- No fixture was created; no cleanup required.

- Bridge health: `GET http://127.0.0.1:25570/health` returned `status: OK`, but `pump_stalled: true`, `queue_depth: 4`, and `pump_idle_ms: 34239`.
- Discovery request: `POST http://127.0.0.1:25570/rpc` with `rpc.discover` was rejected with JSON-RPC `-32002`: `the mission bridge's queue has not been drained ... DCS is not running the pump ... (the sim is paused, loading, or a debug session or long call holds the sim thread)`.
- No Lua expression could be dispatched, so all eight checklist items remain unchecked. No fixture or mission state was created and no cleanup was required.
- This is an environment blocker, not evidence that the documented signatures are correct; re-dispatch after DCS is actively pumping a running mission.
