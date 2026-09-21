---
column: done
labels:
  - docs
  - dcs-live
  - verification
priority: high
updatedAt: 2026-09-20 00:00:00 UTC
---

# Verify net function documentation

## Source under test

- `packages/tslua-dcs-gui-types/src/net.ts`

## Function checklist

- [x] `dostring_in(env: string, luaScript: string): string | undefined` — packages/tslua-dcs-gui-types/src/net.ts:21

## Required evidence

For every item, record the bridge environment, fixture/object identity, exact Lua expression, returned Lua type/value or error, cleanup, and whether the TypeScript example was sufficient without guessing.

## Failures and corrections

Record documentation/signature failures here. A corrected card returns to live verification with a fresh low-effort Luna agent.

## Live verification (2026-09-20)

- Bridge: `http://127.0.0.1:25569`, `dcs-studio-gui`, `env=gui`, version `0.4.0`; `/health` returned `pump_stalled=false`, `queue_depth=0`; `rpc.discover` advertised `repl_inspect`.
- `repl_inspect("net.dostring_in(\"gui\", \"return 1 + 1\")", { env: "gui" })` returned `ok=true`, Lua `string`, value `"2"`, confirming the documented argument order and string result.
- `repl_inspect("net.dostring_in(\"not-an-environment\", \"return 1\")", { env: "gui" })` returned `ok=true`, Lua `nil`, confirming the documented unavailable-environment `undefined` case.
- No state-changing script or cleanup was needed. The documentation was sufficient without guessing.
