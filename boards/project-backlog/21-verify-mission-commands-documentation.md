---
column: done
labels:
  - docs
  - dcs-live
  - verification
priority: high
updatedAt: 2026-09-20 00:00:00 UTC
---

# Verify missionCommands function documentation

## Source under test

- `packages/tslua-dcs-mission-types/src/missionCommands.ts`

## Function checklist

- [x] `addCommand<T>( name: string, path: MissionCommandPath | undefined, callback: (argument: T) => void, argument: T, ): MissionCommandPath` — packages/tslua-dcs-mission-types/src/missionCommands.ts:9
- [x] `addCommandForCoalition<T>( coalitionId: number, name: string, path: MissionCommandPath | undefined, callback: (argument: T) => void, argument: T, ): MissionCommandPath` — packages/tslua-dcs-mission-types/src/missionCommands.ts:17
- [x] `addCommandForGroup<T>( groupId: number, name: string, path: MissionCommandPath | undefined, callback: (argument: T) => void, argument: T, ): MissionCommandPath` — packages/tslua-dcs-mission-types/src/missionCommands.ts:26
- [x] `addSubMenu(name: string, path?: MissionCommandPath): MissionCommandPath` — packages/tslua-dcs-mission-types/src/missionCommands.ts:35
- [x] `addSubMenuForCoalition( coalitionId: number, name: string, path?: MissionCommandPath, ): MissionCommandPath` — packages/tslua-dcs-mission-types/src/missionCommands.ts:38
- [x] `addSubMenuForGroup( groupId: number, name: string, path?: MissionCommandPath, ): MissionCommandPath` — packages/tslua-dcs-mission-types/src/missionCommands.ts:45
- [x] `doAction(actionId: number): void` — source-verified, intentionally not invoked without a DCS-issued action index
- [x] `removeItem(path?: MissionCommandPath): void` — packages/tslua-dcs-mission-types/src/missionCommands.ts:55
- [x] `removeItemForCoalition(coalitionId: number, path?: MissionCommandPath): void` — packages/tslua-dcs-mission-types/src/missionCommands.ts:58
- [x] `removeItemForGroup(groupId: number, path?: MissionCommandPath): void` — packages/tslua-dcs-mission-types/src/missionCommands.ts:61

## Required evidence

For every item, record the bridge environment, fixture/object identity, exact Lua expression, returned Lua type/value or error, cleanup, and whether the TypeScript example was sufficient without guessing.

## Failures and corrections

Record documentation/signature failures here. A corrected card returns to live verification with a fresh low-effort Luna agent.

## Live evidence — 2026-09-20

- Bridge: `http://127.0.0.1:25570`, `dcs-studio-mission`, version `0.4.0`, healthy and pumping during the batch.
- Fixture: disposable group `CodexGlobalGroup` (runtime ID `1000000`) supplied to group-scoped menu calls. `addCommand*` and `addSubMenu*` returned Lua `table` paths, matching `MissionCommandPath = string[]`; all remove calls returned `nil`.
- Exact successful expressions included `missionCommands.addCommand("CodexCmd",nil,function(a) end,"x")`, `addCommandForCoalition(coalition.side.BLUE,"CodexCmdC",nil,function(a) end,"x")`, `addCommandForGroup(1000000,"CodexCmdG",nil,function(a) end,"x")`, the three submenu variants, and the three remove variants. The examples were sufficient without guessing.
- `missionCommands.doAction({})` failed with DCS runtime error `Parameter #1 (action id) missed`. The current `action: unknown` type is appropriately opaque, but the example `missionCommands.doAction(action)` is not executable without documenting the required action-record shape or using an explicitly typed action value. This item remains unchecked for documentation correction/re-dispatch.
- Menu cleanup used the corresponding remove functions; the disposable group/static fixtures were destroyed after the batch.
- Correction: bundled DCS UI source passes a numeric `actionIndex`, so the declaration now accepts `number`, explains that the ID is normally supplied by DCS UI internals, and links `%DCS_INSTALL_DIR%/Scripts/UI/RadioCommandDialogPanel/RadioCommandDialogsPanel.lua:177`. Awaiting fresh Luna-low verification.

## Fresh Luna-low verification — 2026-09-20

- Bridge: `http://127.0.0.1:25570`, `dcs-studio-mission`, version `0.4.0`, `/health` reported `pump_stalled=false`, queue depth `0`.
- `missionCommands.doAction` was not invoked. The only safe numeric values available to a mission script are guesses; the documented DCS UI source supplies an action index from the radio-command UI, and invoking an arbitrary index could trigger an unrelated command. No genuine runtime action index was available from the bridge session.
- Result: intentionally unverified, not a documentation failure. The declaration remains `doAction(actionId: number): void`, and the docs correctly state that callers must use a real DCS-supplied action index. No fixture or cleanup was required.
