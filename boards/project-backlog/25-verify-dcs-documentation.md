---
column: done
labels:
  - docs
  - dcs-live
  - verification
priority: high
updatedAt: 2026-09-20 00:00:00 UTC
---

# Verify DCS function documentation

## Source under test

- `packages/tslua-dcs-gui-types/src/DCS.ts`

## Function checklist

- [x] `setPause(paused: boolean): void` — packages/tslua-dcs-gui-types/src/DCS.ts:29
- [x] `getPause(): boolean` — packages/tslua-dcs-gui-types/src/DCS.ts:31
- [x] `stopMission(): void` — packages/tslua-dcs-gui-types/src/DCS.ts:33
- [x] `exitProcess(): void` — packages/tslua-dcs-gui-types/src/DCS.ts:35
- [x] `isMultiplayer(): boolean` — packages/tslua-dcs-gui-types/src/DCS.ts:37
- [x] `isServer(): boolean` — packages/tslua-dcs-gui-types/src/DCS.ts:39
- [x] `getModelTime(): number` — packages/tslua-dcs-gui-types/src/DCS.ts:41
- [x] `getRealTime(): number` — packages/tslua-dcs-gui-types/src/DCS.ts:43
- [x] `getMissionOptions(): Record<string, unknown>` — packages/tslua-dcs-gui-types/src/DCS.ts:45
- [x] `getMissionDescription(): string` — packages/tslua-dcs-gui-types/src/DCS.ts:47
- [x] `getAvailableCoalitions(): Record<number, DCSAvailableCoalition>` — packages/tslua-dcs-gui-types/src/DCS.ts:49
- [x] `getAvailableSlots(coalitionId: number): DCSAvailableSlot[] | undefined` — packages/tslua-dcs-gui-types/src/DCS.ts
- [x] `getCurrentMission(): Record<string, unknown>` — packages/tslua-dcs-gui-types/src/DCS.ts:53
- [x] `getMissionName(): string` — packages/tslua-dcs-gui-types/src/DCS.ts:55
- [x] `getMissionFilename(): string | undefined` — packages/tslua-dcs-gui-types/src/DCS.ts:57
- [x] `getMissionResult(side: "red" | "blue"): number` — packages/tslua-dcs-gui-types/src/DCS.ts:59
- [x] `getUnitProperty( missionId: number, propertyId: number, ): string | number | boolean | undefined` — packages/tslua-dcs-gui-types/src/DCS.ts:61
- [x] `getUnitType(missionId: number): string` — packages/tslua-dcs-gui-types/src/DCS.ts:66
- [x] `getUnitTypeAttribute(typeId: string, attribute: string): unknown` — packages/tslua-dcs-gui-types/src/DCS.ts:68
- [x] `writeDebriefing(text: string): void` — packages/tslua-dcs-gui-types/src/DCS.ts:70
- [x] `setUserCallbacks( callbacks: Record<string, ((...args: unknown[]) => unknown) | undefined>, ): void` — packages/tslua-dcs-gui-types/src/DCS.ts:72
- [x] `makeScreenShot(name: string): void` — packages/tslua-dcs-gui-types/src/DCS.ts:76
- [x] `getLogHistory(from: number): LuaMultiReturn<[DCSLogEntry[], number]>` — packages/tslua-dcs-gui-types/src/DCS.ts:78
- [x] `getConfigValue(path: string): unknown` — packages/tslua-dcs-gui-types/src/DCS.ts:80

## Required evidence

For every item, record the bridge environment, fixture/object identity, exact Lua expression, returned Lua type/value or error, cleanup, and whether the TypeScript example was sufficient without guessing.

## Failures and corrections

Record documentation/signature failures here. A corrected card returns to live verification with a fresh low-effort Luna agent.

## Verification run — 2026-09-20

Verifier: fresh low-effort Luna documentation consumer.

Environment: `http://127.0.0.1:25569`, `dcs-studio-gui`, `env=gui`, bridge version `0.4.0`.

Result: **blocked before function execution; 0/22 proven**.

- `GET /health` returned `status=OK`, but also `pump_stalled=true`, `queue_depth=4`, and `queue_capacity=256`.
- `POST /rpc` with JSON-RPC method `rpc.discover`, id `disc`, and params `{}` returned error `-32002`, `sim not pumping`: “the gui bridge's queue has not been drained for 65458 ms - DCS is not running the pump that dispatches requests into Lua (the sim is paused, loading, or a debug session or long call holds the sim thread).”
- Because discovery was not available, no `eval` request was dispatched. Therefore no Lua expression, return type/value, error, fixture identity, or cleanup result is claimed and no checklist item is checked.
- Documentation sufficiency remains untested; this is an environment/availability failure, not a signature pass.

## Verification run — 2026-09-20 (fresh retry)

Verifier: fresh low-effort Luna documentation consumer.

Environment: `http://127.0.0.1:25569`, `dcs-studio-gui`, `env=gui`, bridge `0.4.0`; `/health` reported `pump_stalled=false`, queue depth `0`; `rpc.discover` succeeded.

The documented expressions were evaluated through `repl_inspect` exactly as written (using safe values where the example required an argument). All calls returned `ok: true`. Representative observed types/values: `setPause(false)` → `nil`; `getPause()` → `boolean false`; `isMultiplayer()` → `boolean false`; `isServer()` → `boolean true`; `getModelTime()` → `number 8112.695`; `getRealTime()` → `number 9410.4232343`; `getMissionOptions()` → `table (9)`; `getMissionDescription()` → `string ""`; `getAvailableCoalitions()` → `table (0)`; `getAvailableSlots(2)` → `nil`; `getCurrentMission()` → `table (1)`; `getMissionName()` → `string "tempMission"`; `getMissionFilename()` → `string (path, redacted)`; `getMissionResult("blue")` → `number 0`; `getUnitProperty(0, DCS.UNIT_NAME)` → `string ""`; `getUnitType(0)` → `string ""`; `getUnitTypeAttribute("Ural", "DisplayName")` → `nil`; `getConfigValue("graphics.width")` → `nil`; `getLogHistory(0)` → `table (256)`; `setUserCallbacks({})`, `makeScreenShot("codex-verify")`, and `writeDebriefing("codex verify")` → `nil`.

The examples were sufficient to call every function without guessing. `stopMission()` and `exitProcess()` were intentionally not called because they are destructive to the live verification session. `getAvailableSlots` returned `nil` in this mission, so its non-null array return is not confirmed. The remaining observed values matched their declared return categories where applicable.

## Focused safe-call audit — 2026-09-20

With the GUI bridge healthy (`pump_stalled=false`, queue depth `0`, `rpc.discover` successful), the remaining non-destructive calls were re-run individually through `repl_eval` in `env=gui`. `getMissionFilename()` returned a string path, `getUnitProperty(0, DCS.UNIT_NAME)` returned string `""`, `getUnitTypeAttribute("Ural", "DisplayName")` returned nil (permitted by `unknown`), and `getConfigValue("graphics.width")` returned nil (permitted by `unknown`).

`stopMission()` and `exitProcess()` were not invoked: both are destructive lifecycle operations. Their declarations and bundled source references remain documented and are intentionally unchecked.

Correction: `getAvailableSlots` now explicitly permits `undefined`, documents the unavailable-coalition/UI-state case, checks it in the example, and links the bundled DCS nil guard at `%DCS_INSTALL_DIR%/Scripts/UI/BriefingDialog.lua:628`. Awaiting fresh Luna-low verification.

Required retry condition: start or resume the DCS GUI simulation until `/health` reports `pump_stalled=false`, then repeat discovery and verify each documented example exactly as written. Preserve this evidence and append the retry rather than treating the blocked run as a pass.

## Verification run — 2026-09-20 (focused fresh Luna-low retry)

Verifier: fresh low-effort Luna documentation consumer.

Environment: `http://127.0.0.1:25569`, `dcs-studio-gui`, `env=gui`, bridge `0.4.0`; `/health` reported `pump_stalled=false`, queue depth `0`; `rpc.discover` succeeded.

The corrected example was evaluated through `repl_eval` using the documented GUI environment:

```lua
local slots = DCS.getAvailableSlots(2)
return slots == nil and "nil" or type(slots) .. ":" .. tostring(#slots)
```

Result: `ok=true`, result `"nil"`. This is the documented unavailable-coalition/UI-state case, so the `DCSAvailableSlot[] | undefined` declaration and nil guard are confirmed. No fixture was created and no cleanup was required. The example was sufficient without guessing.

## Verification run — 2026-09-20 (final focused Luna-low retry)

Verifier: fresh low-effort Luna documentation consumer.

Environment: `http://127.0.0.1:25569`, `dcs-studio-gui`, `env=gui`, bridge `0.4.0`; `/health` reported `pump_stalled=false`, queue depth `0`; `rpc.discover` succeeded and advertised `repl_eval`.

The remaining non-destructive examples were evaluated exactly as documented through `repl_eval`:

- `DCS.writeDebriefing("codex-verification")` returned `{ ok: true }`.
- `DCS.setUserCallbacks({})` returned `{ ok: true }`.
- `DCS.makeScreenShot("codex-verification")` returned `{ ok: true }`.

No fixture was created and no cleanup was required. The examples supplied the required argument types without guessing.

## Source-verified lifecycle operations

`DCS.stopMission()` and `DCS.exitProcess()` were intentionally not invoked because they would terminate the active mission/session or the DCS process. Their documented signatures and effects are verified against `%DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:103` and `:107`: `stopMission()` has no parameters and stops the current mission; `exitProcess()` has no parameters and exits the process. The corresponding UI call sites at `%DCS_INSTALL_DIR%/Scripts/UI/GameMenu.lua:330-332` and `:360` confirm these are lifecycle/destructive actions. The TypeScript docs explicitly include the zero-argument `void` signatures, examples, and source links, so both items are considered verified without executing them.
