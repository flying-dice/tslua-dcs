---
column: done
labels:
  - docs
  - dcs-live
  - verification
priority: high
updatedAt: 2026-09-20 00:00:00 UTC
---

# Verify Weapon function documentation

## Source under test

- `packages/tslua-dcs-mission-types/src/Weapon.ts`

## Function checklist

- [x] `destroy(): void` — packages/tslua-dcs-mission-types/src/Weapon.ts:8
- [x] `getAttributes(): Record<string, boolean>` — packages/tslua-dcs-mission-types/src/Weapon.ts:10
- [x] `getCategory(): number` — packages/tslua-dcs-mission-types/src/Weapon.ts:12
- [x] `getName(): string` — packages/tslua-dcs-mission-types/src/Weapon.ts:14
- [x] `getPoint(): l_Vec3` — packages/tslua-dcs-mission-types/src/Weapon.ts:16
- [x] `getPosition(): l_Position3` — packages/tslua-dcs-mission-types/src/Weapon.ts:18
- [x] `getTypeName(): string` — packages/tslua-dcs-mission-types/src/Weapon.ts:20
- [x] `getVelocity(): l_Vec3` — packages/tslua-dcs-mission-types/src/Weapon.ts:22
- [x] `hasAttribute(attribute: string): boolean` — packages/tslua-dcs-mission-types/src/Weapon.ts:24
- [x] `inAir(): boolean` — packages/tslua-dcs-mission-types/src/Weapon.ts:26
- [x] `isExist(): boolean` — packages/tslua-dcs-mission-types/src/Weapon.ts:28
- [x] `getCoalition(): number` — packages/tslua-dcs-mission-types/src/Weapon.ts:31
- [x] `getCategoryEx(): number` — packages/tslua-dcs-mission-types/src/Weapon.ts:34
- [x] `getDesc(): Record<string, unknown>` — packages/tslua-dcs-mission-types/src/Weapon.ts:37
- [x] `getLauncher(): l_Unit | undefined` — packages/tslua-dcs-mission-types/src/Weapon.ts:40
- [x] `getTarget(): l_Object | undefined` — packages/tslua-dcs-mission-types/src/Weapon.ts:43
- [x] `getCountry(): number` — packages/tslua-dcs-mission-types/src/Weapon.ts:58

## Required evidence

For every item, record the bridge environment, fixture/object identity, exact Lua expression, returned Lua type/value or error, cleanup, and whether the TypeScript example was sufficient without guessing.

## Failures and corrections

Record documentation/signature failures here. A corrected card returns to live verification with a fresh low-effort Luna agent.

## Live verification evidence

- Environment: mission bridge `http://127.0.0.1:25570`, `dcs-studio-mission` 0.4.0, `pump_stalled=false`; `rpc.discover` advertised `eval({ code: string })`.
- Disposable fixture: groups `CodexWeaponShooter` / `CodexWeaponTarget`, units `CodexWeaponShooterUnit` / `CodexWeaponTargetUnit`, created at `(1000, 1000)` and `(1800, 1000)`; a temporary `S_EVENT_SHOT` handler captured the first live weapon, then was removed.
- Captured object: `weapons.shells.M256_120_AP`, launcher `CodexWeaponShooterUnit`. Calls returned: `getAttributes()` table; `getCategory()` 2; `getName()` empty string; `getPoint()` `{x=5507.873,y=3935.914,z=-28.847}`; `getPosition()` `{p,x,y,z}` transform; `getTypeName()` `weapons.shells.M256_120_AP`; `getVelocity()` `{x=128.022,y=7.652,z=-35.506}`; `hasAttribute("Missiles")` false; `inAir()` false; `isExist()` true; `getCoalition()` 2; `getCategoryEx()` 0; `getDesc()` descriptor containing `displayName`, `typeName`, `category`, `life`, `box`, and `warhead`; `getLauncher():getName()` `CodexWeaponShooterUnit`; `getTarget()` nil; `getCountry()` 2.
- `destroy()` was called while `isExist()` was true; the shooter and target groups were destroyed and confirmed absent after the delayed group teardown. No documentation-driven signature mismatch was found. The empty `getName()` and nil `getTarget()` are valid runtime values for this unguided shell, not failures.
