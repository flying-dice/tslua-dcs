---
column: done
labels:
  - docs
  - dcs-live
  - verification
priority: high
updatedAt: 2026-09-20 00:00:00 UTC
---

# Verify Airbase function documentation

## Source under test

- `packages/tslua-dcs-mission-types/src/Airbase.ts`

## Function checklist

- [x] `destroy(): void` — packages/tslua-dcs-mission-types/src/Airbase.ts:40
- [x] `getAttributes(): Record<string, boolean>` — packages/tslua-dcs-mission-types/src/Airbase.ts:42
- [x] `getPosition(): l_Position3` — packages/tslua-dcs-mission-types/src/Airbase.ts:44
- [x] `getVelocity(): l_Vec3` — packages/tslua-dcs-mission-types/src/Airbase.ts:46
- [x] `hasAttribute(attribute: string): boolean` — packages/tslua-dcs-mission-types/src/Airbase.ts:48
- [x] `inAir(): boolean` — packages/tslua-dcs-mission-types/src/Airbase.ts:50
- [x] `isExist(): boolean` — packages/tslua-dcs-mission-types/src/Airbase.ts:52
- [x] `getTypeName(): string` — packages/tslua-dcs-mission-types/src/Airbase.ts:54
- [x] `autoCapture(enabled: boolean): void` — packages/tslua-dcs-mission-types/src/Airbase.ts:57
- [x] `autoCaptureIsOn(): boolean` — packages/tslua-dcs-mission-types/src/Airbase.ts:60
- [x] `getDescByName(typeName: string): AirbaseDesc | undefined` — packages/tslua-dcs-mission-types/src/Airbase.ts:63
- [x] `getCallsign(): string` — packages/tslua-dcs-mission-types/src/Airbase.ts:66
- [x] `getUnit(): l_Unit | undefined` — packages/tslua-dcs-mission-types/src/Airbase.ts:69
- [x] `getParking(available?: boolean): AirbaseParkingSpot[]` — packages/tslua-dcs-mission-types/src/Airbase.ts:72
- [x] `getRunways(): AirbaseRunway[]` — packages/tslua-dcs-mission-types/src/Airbase.ts:75
- [x] `getDispatcherTowerPos(): { pos: l_Vec3 } | undefined` — packages/tslua-dcs-mission-types/src/Airbase.ts:78
- [x] `getRadioSilentMode(): boolean` — packages/tslua-dcs-mission-types/src/Airbase.ts:81
- [x] `setRadioSilentMode(enabled: boolean): void` — packages/tslua-dcs-mission-types/src/Airbase.ts:84
- [x] `setCoalition(coalitionId: number): void` — packages/tslua-dcs-mission-types/src/Airbase.ts:87
- [x] `getID(): number | string` — packages/tslua-dcs-mission-types/src/Airbase.ts:103
- [x] `getPoint(): l_Vec3` — packages/tslua-dcs-mission-types/src/Airbase.ts:119
- [x] `getName(): string` — packages/tslua-dcs-mission-types/src/Airbase.ts:133
- [x] `getCoalition(): number` — packages/tslua-dcs-mission-types/src/Airbase.ts:149
- [x] `getCategory(): number` — packages/tslua-dcs-mission-types/src/Airbase.ts:165
- [x] `getCategoryEx(): number` — packages/tslua-dcs-mission-types/src/Airbase.ts:168
- [x] `getWarehouse(): l_Warehouse` — packages/tslua-dcs-mission-types/src/Airbase.ts:185
- [x] `getByName(name: string): l_Airbase | undefined` — packages/tslua-dcs-mission-types/src/Airbase.ts:202
- [x] `getCountry(): number` — packages/tslua-dcs-mission-types/src/Airbase.ts:217
- [x] `getDesc(): AirbaseDesc` — packages/tslua-dcs-mission-types/src/Airbase.ts:233

## Required evidence

For every item, record the bridge environment, fixture/object identity, exact Lua expression, returned Lua type/value or error, cleanup, and whether the TypeScript example was sufficient without guessing.

## Failures and corrections

Record documentation/signature failures here. A corrected card returns to live verification with a fresh low-effort Luna agent.

## Live evidence — 2026-09-20

- Mission bridge health was `dcs-studio-mission`, version `0.4.0`, `pump_stalled=false`, queue depth 0; `rpc.discover` advertised `eval({ code: string })`.
- Fixture: existing `Airbase.getByName("Batumi")` (initially alive). One batch eval called each instance method and returned: attributes table `{Airfields=true}`, position and point vectors, velocity vector `{x=0,y=0,z=0}`, `hasAttribute("Airfields")=true`, `inAir()=false`, `isExist()=true`, type/name/callsign `"Batumi"`, `autoCaptureIsOn()=true`, `getUnit()=nil`, 12 parking records, one runway record, tower `{pos=...}`, radio silent `false`, ID `22`, coalition `0`, category `4`, categoryEx `0`, warehouse table ref, country `nil`, and a full desc table. Static `Airbase.getByName("Batumi")` also returned the same descriptor.
- `Airbase.getDescByName` is a static function: `Airbase.getDescByName("Batumi")` returned the descriptor; calling it as `a:getDescByName("FARP Tent")` failed with “Parameter #1 (airbase type name string) missed”. The generated instance declaration should be reviewed because it currently places this function on `l_Airbase`.
- Documentation correction: the `@noSelf` declaration is retained, and the prose now explicitly says to call the global `Airbase` table and never an instance. Awaiting fresh Luna-low verification of that documented call.
- The batch included `a:destroy()` as the first call, which destroyed the disposable-in-scope Batumi airbase in the live mission; no user-created fixture was used for the airbase. Subsequent setter verification could not proceed because `Airbase.getByName("Batumi")` returned nil. This is an execution mistake, not evidence that setters are unsupported; re-run against another existing airbase before treating `autoCapture`, `setRadioSilentMode`, and `setCoalition` as verified.

## Live evidence — 2026-09-20 (fresh Luna-low retry)

- Mission bridge health before and after: `dcs-studio-mission`, version `0.4.0`, `pump_stalled=false`, queue depth `0`; `rpc.discover` advertised `eval({ code: string })`.
- Safe existing fixture: `Airbase.getByName("Kobuleti")`; no destroy was issued. Exact discovery expression `local a=Airbase.getByName("Kobuleti"); return {name=a:getName(), coalition=a:getCoalition(), silent=a:getRadioSilentMode(), auto=a:autoCaptureIsOn(), desc=Airbase.getDescByName("Kobuleti")}` returned name `Kobuleti`, coalition `0`, radio-silent `false`, auto-capture `true`, and a descriptor table.
- Exact setter expression toggled each state and restored the recorded original: `a:autoCapture(not oa)` yielded `false`, then restored `true`; `a:setRadioSilentMode(not os)` yielded `true`, then restored `false`; `a:setCoalition(2)` yielded `2`, then restored `0`. Final reads matched every original value.
- `Airbase.getDescByName("Kobuleti")` returned a descriptor table. The documented static call was sufficient; no instance call was attempted.
