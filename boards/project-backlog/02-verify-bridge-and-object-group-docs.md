---
column: done
labels:
  - docs
  - dcs-live
  - verification
priority: high
updatedAt: 2026-09-20 00:00:00 UTC
---

# Verify bridge readiness and Object/Group documentation

## Sources under test

- `packages/tslua-dcs-mission-types/src/Object.ts`
- `packages/tslua-dcs-mission-types/src/Group.ts`
- `%DCS_INSTALL_DIR%/Scripts/ScriptingSystem.lua`
- Linked Hoggit pages in each declaration

## Bridge prerequisites

- Mission bridge: `http://127.0.0.1:25570`
- Expected health: `name=dcs-studio-mission`, `env=mission`, `pump_stalled=false`
- `rpc.discover` advertises `eval`
- Mission is running and unpaused

## Function checklist

### Object

- [x] `destroy(): void`
- [x] `getName(): string`
- [x] `getPoint(): l_Vec3`
- [x] `getPosition(): l_Position3`
- [x] `getTypeName(): string`
- [x] `getVelocity(): l_Vec3`
- [x] `inAir(): boolean`
- [x] `isExist(): boolean`
- [x] `hasAttribute(attribute: string): boolean`
- [x] `getAttributes(): Record<string, boolean>`
- [x] `getCategory(): number`

### Group

- [x] `activate(): void`
- [x] `destroy(): void`
- [x] `enableEmission(enabled: boolean): void`
- [x] `getID(): number`
- [x] `getName(): string`
- [x] `getCategory(): number`
- [x] `getCoalition(): number`
- [x] `getSize(): number`
- [x] `getInitialSize(): number`
- [x] `getUnits(): l_Unit[]`
- [x] `getUnit(unitNumber: number): l_Unit | undefined`
- [x] `getController(): l_Controller`
- [x] `isExist(): boolean`
- [x] `getByName(name: string): l_Group | undefined`

## Execution rules

- Prefer existing mission groups for read-only calls.
- Test `activate`, `enableEmission`, and `destroy` only against a disposable group created or selected expressly for verification.
- Capture Lua return types and representative values, not just successful HTTP status.
- Always clean up disposable mission objects.
- If the documented TypeScript example cannot guide the call unambiguously, mark it failed even when a guessed Lua call succeeds.

## Evidence

Record health/discovery output, fixture names/IDs, each evaluated expression, observed Lua type/value, cleanup, and failures here.

## Verification run 2026-09-20

### Fresh Luna verification run

- Health before testing: `name=dcs-studio-mission`, `env=mission`, `pump_stalled=false`,
  `queue_depth=0`; `rpc.discover` advertised `eval` with `{ code: string }`.
- Fixture: `CodexVerifyGroup3` with unit `CodexVerifyUnit3`, dynamically created by
  the documented `coalition.addGroup` shape.
- Group calls: `getByName("CodexVerifyGroup3")` returned a group; `getUnits()` returned
  an array containing one unit; `getController()` returned a controller; `getUnit(99)`
  returned `nil`; `enableEmission(false)`, `activate()`, and `destroy()` returned Lua
  `nil` (void); lookup after destroy returned `nil`.
- Object calls on the spawned unit: `getName()` returned `"CodexVerifyUnit3"`;
  `getPoint()` returned `{x=20.0000069,y=88.4056163,z=19.9999925}`;
  `getPosition()` returned a position table with `p` and axis tables;
  `getTypeName()` returned `"M-1 Abrams"`; `getVelocity()` returned `{x=0,y=0,z=0}`;
  `inAir()` returned `false`; `isExist()` returned `true`;
  `hasAttribute("Ground Units")` returned `true`; `getAttributes()` returned a
  non-nil attribute table; `getCategory()` returned `1`.
- Object `destroy()` was invoked on the unit and the owning group was then destroyed;
  final lookup confirmed the fixture group no longer existed. The unit's retained
  Lua reference did not immediately report `isExist=false`, so cleanup is confirmed
  by the group lookup rather than by that stale reference.
- Result: all Object/Group signatures and examples were sufficient to perform the
  documented calls. No documentation or signature failure was found in this pass.

### Bridge evidence

- `GET http://127.0.0.1:25570/health` initially returned `name=dcs-studio-mission`,
  `env=mission`, `status=OK`, `version=0.4.0`, and `pump_stalled=false`.
- `POST http://127.0.0.1:25570/rpc`, method `rpc.discover`, returned an OpenRPC
  document advertising `eval` with the required `{ code: string }` parameter.
- After the fixture was spawned, the bridge stopped being pumped by DCS. Health
  subsequently reported `pump_stalled=true`, `queue_depth=4`; later eval calls
  returned JSON-RPC `-32002 sim not pumping`. The mission was therefore not in the
  required running/unpaused state for the rest of this verification run.

### Fixture

The following disposable fixture was created successfully with `coalition.addGroup`:

```lua
local g = coalition.addGroup(country.id.USA, Group.Category.GROUND, {
  name = "CodexVerifyGroup",
  units = {{ name = "CodexVerifyUnit", type = "M-1 Abrams", x = 0, y = 0, heading = 0 }},
})
```

Observed from the create expression: `g:getName()` returned `"CodexVerifyGroup"`,
`g:getID()` returned `1000000`, `g:getSize()` returned `1`,
`g:getInitialSize()` returned `1`, `g:getCategory()` returned `2`,
`g:getCoalition()` returned `2`, `g:isExist()` returned `true`, and
`g:getUnit(1):getName()` returned `"CodexVerifyUnit"`.

### Result

- **Partial pass:** the documented Group lookup/creation shape and the scalar
  signatures listed above are consistent with live Lua values.
- **Not verified:** all Object methods, all remaining Group methods, and cleanup;
  the bridge became stalled before the verification expression could run.
- **Outstanding cleanup:** `CodexVerifyGroup` / `CodexVerifyUnit` must be destroyed
  by a follow-up run once the mission is unpaused. No destroy call was claimed as
  successful after the bridge entered the stalled state.
- **Failure to re-dispatch:** re-dispatching while `pump_stalled=true` only queues
  calls and violates this card's running/unpaused prerequisite; do not guess or mark
  those methods checked until the bridge is pumping again.

### Recovery and cleanup

- A later health check returned `pump_stalled=false`, `pump_idle_ms=39`, and
  `queue_depth=0` for the mission bridge.
- Cleanup found the original fixture, called `g:destroy()`, and a follow-up lookup
  confirmed `Group.getByName("CodexVerifyGroup") == nil` and `exists=false`.
- Cleanup evidence does not by itself verify the documented `destroy()` signature;
  a fresh documentation-driven verifier must still exercise and record that method.
