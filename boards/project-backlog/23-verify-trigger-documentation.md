---
column: done
labels:
  - docs
  - dcs-live
  - verification
priority: high
updatedAt: 2026-09-20 00:00:00 UTC
---

# Verify trigger function documentation

## Source under test

- `packages/tslua-dcs-mission-types/src/trigger.ts`

## Function checklist

- [x] `addOtherCommand( name: string, userFlagName: string, userFlagValue?: unknown, ): void` — packages/tslua-dcs-mission-types/src/trigger.ts:36
- [x] `removeOtherCommand(name: string): void` — packages/tslua-dcs-mission-types/src/trigger.ts:57
- [x] `addOtherCommandForCoalition( coalitionId: number, name: string, userFlagName: string, userFlagValue?: unknown, ): void` — packages/tslua-dcs-mission-types/src/trigger.ts:83
- [x] `removeOtherCommandForCoalition(coalitionId: number, name: string): void` — packages/tslua-dcs-mission-types/src/trigger.ts:109
- [x] `addOtherCommandForGroup( groupId: number, name: string, userFlagName: string, userFlagValue?: unknown, ): void` — packages/tslua-dcs-mission-types/src/trigger.ts:137
- [x] `removeOtherCommandForGroup(groupId: number, name: string): void` — packages/tslua-dcs-mission-types/src/trigger.ts:163
- [x] `activateGroup(group: l_Group): void` — packages/tslua-dcs-mission-types/src/trigger.ts:181
- [x] `deactivateGroup(group: l_Group): void` — packages/tslua-dcs-mission-types/src/trigger.ts:199
- [x] `setGroupAIOn(group: l_Group): void` — packages/tslua-dcs-mission-types/src/trigger.ts:216
- [x] `setGroupAIOff(group: l_Group): void` — packages/tslua-dcs-mission-types/src/trigger.ts:233
- [x] `groupStopMoving(group: l_Group): void` — packages/tslua-dcs-mission-types/src/trigger.ts:251
- [x] `groupContinueMoving(group: l_Group): void` — packages/tslua-dcs-mission-types/src/trigger.ts:268

## Required evidence

For every item, record the bridge environment, fixture/object identity, exact Lua expression, returned Lua type/value or error, cleanup, and whether the TypeScript example was sufficient without guessing.

## Failures and corrections

Record documentation/signature failures here. A corrected card returns to live verification with a fresh low-effort Luna agent.

## Live evidence — 2026-09-20

- Bridge: `http://127.0.0.1:25570`, mission `0.4.0`, `pump_stalled=false`, queue depth `0`.
- Disposable group `CodexGlobalGroup` (ID `1000000`) was used for group-scoped calls. Exact calls `trigger.action.addOtherCommand("CodexOther","CodexFlag",1)`, matching remove, coalition add/remove, group add/remove, `activateGroup`, `deactivateGroup`, `setGroupAIOn`, `setGroupAIOff`, `groupStopMoving`, and `groupContinueMoving` all completed successfully and returned Lua `nil`. The documented examples were sufficient without guessing.
- Cleanup: all named Other commands were removed and the disposable group was destroyed.
