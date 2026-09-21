---
column: done
labels:
  - docs
  - dcs-live
  - verification
priority: high
updatedAt: 2026-09-20 00:00:00 UTC
---

# Verify lfs function documentation

## Source under test

- `packages/tslua-dcs-gui-types/src/lfs.ts`

## Function checklist

- [x] `tempdir(): string` — packages/tslua-dcs-gui-types/src/lfs.ts:17
- [x] `writedir(): string` — packages/tslua-dcs-gui-types/src/lfs.ts:29
- [x] `currentdir(): string` — packages/tslua-dcs-gui-types/src/lfs.ts:41

## Required evidence

For every item, record the bridge environment, fixture/object identity, exact Lua expression, returned Lua type/value or error, cleanup, and whether the TypeScript example was sufficient without guessing.

## Failures and corrections

Record documentation/signature failures here. A corrected card returns to live verification with a fresh low-effort Luna agent.

## Live verification (2026-09-20)

- Bridge: `http://127.0.0.1:25569`, `dcs-studio-gui`, `env=gui`, version `0.4.0`; `/health` returned `pump_stalled=false`, `queue_depth=0`; `rpc.discover` advertised `repl_inspect`.
- `repl_inspect("lfs.tempdir()", { env: "gui" })` returned `ok=true`, Lua `string`, value `"C:\\Users\\jonat\\AppData\\Local\\Temp\\DCS.openbeta\\"`.
- `repl_inspect("lfs.writedir()", { env: "gui" })` returned `ok=true`, Lua `string`, value `"C:\\Users\\jonat\\Saved Games\\DCS.openbeta\\"`.
- `repl_inspect("lfs.currentdir()", { env: "gui" })` returned `ok=true`, Lua `string`, value `"D:\\Program Files\\Eagle Dynamics\\DCS World OpenBeta\\"`.
- No fixture or cleanup was needed. The TypeScript examples and return descriptions were sufficient without guessing.
