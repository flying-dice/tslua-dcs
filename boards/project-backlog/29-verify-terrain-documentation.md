---
column: done
labels:
  - docs
  - dcs-live
  - verification
priority: high
updatedAt: 2026-09-20 00:00:00 UTC
---

# Verify terrain function documentation

## Source under test

- `packages/tslua-dcs-gui-types/src/terrain.ts`

## Function checklist

- [x] `convertLatLonToMeters( lat: number, lon: number, ): LuaMultiReturn<[number, number]>` — packages/tslua-dcs-gui-types/src/terrain.ts:19
- [x] `GetHeight(x: number, y: number): number` — packages/tslua-dcs-gui-types/src/terrain.ts:36

## Required evidence

For every item, record the bridge environment, fixture/object identity, exact Lua expression, returned Lua type/value or error, cleanup, and whether the TypeScript example was sufficient without guessing.

## Failures and corrections

Record documentation/signature failures here. A corrected card returns to live verification with a fresh low-effort Luna agent.

## Live verification (2026-09-20)

- Bridge: `http://127.0.0.1:25569`, `dcs-studio-gui`, `env=gui`, version `0.4.0`; `/health` returned `pump_stalled=false`, `queue_depth=0`; `rpc.discover` advertised `repl_inspect` and `repl_expand`.
- `repl_inspect("({terrain.convertLatLonToMeters(41.6103, 41.5997)})", { env: "gui" })` returned `ok=true`, Lua `table (2)`. Expanding the returned ref produced index `1` number `-355737.03583254` and index `2` number `617333.54232213`, confirming the two-value `LuaMultiReturn`.
- `repl_inspect("terrain.GetHeight(0, 0)", { env: "gui" })` returned `ok=true`, Lua `number`, value `88.392246900459`.
- No fixture or cleanup was needed. The examples and parameter/return documentation were sufficient without guessing.
