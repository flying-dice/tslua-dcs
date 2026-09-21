---
column: done
labels:
  - docs
  - dcs-live
  - verification
priority: high
updatedAt: 2026-09-20 00:00:00 UTC
---

# Verify Export function documentation

## Source under test

- `packages/tslua-dcs-gui-types/src/Export.ts`

## Function checklist

- [x] `assign_dedicated_viewport?( x: number, y: number, width: number, height: number, ): void` — packages/tslua-dcs-gui-types/src/Export.ts:285
- [x] `LoCreateCameraRequest(): ExportCameraRequest | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoForceCamera(request: ExportCameraRequest): void` — packages/tslua-dcs-gui-types/src/Export.ts:314
- [x] `LoGetUserBookmarks(): ExportCameraBookmark[] | undefined` — packages/tslua-dcs-gui-types/src/Export.ts:317
- [x] `LoCreateUserBookmarkRequest(name: string): ExportCameraRequest | undefined` — packages/tslua-dcs-gui-types/src/Export.ts:320
- [x] `LoGetLocalPlayer(): ExportPlayer | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetPlayers(): ExportPlayer[] | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoSetAllowRemoteForceCameraRequests(allowed: boolean): void` — packages/tslua-dcs-gui-types/src/Export.ts:329
- [x] `LoSendForceCamera(hostId: number, request: ExportCameraRequest): void` — packages/tslua-dcs-gui-types/src/Export.ts:332
- [x] `LoIsObjectExportAllowed(): boolean` — packages/tslua-dcs-gui-types/src/Export.ts:334
- [x] `LoGetAccelerationUnits(): ExportVec3 | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetObjectById(objectId: number): ExportObject | undefined` — packages/tslua-dcs-gui-types/src/Export.ts:340
- [x] `LoGetCameraPosition(): ExportPosition` — packages/tslua-dcs-gui-types/src/Export.ts:343
- [x] `LoGetMachNumber(): number | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetNavigationInfo(): ExportNavigationInfo | undefined` — packages/tslua-dcs-gui-types/src/Export.ts:349
- [x] `LoGetControlPanel_HSI(): ExportHSI | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetSlipBallPosition(): number | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoSimulationOnActivePause(): boolean` — packages/tslua-dcs-gui-types/src/Export.ts:358
- [x] `LoGetADIPitchBankYaw(): LuaMultiReturn<[number | undefined, number | undefined, number | undefined]>` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetEngineInfo(): ExportEngineInfo | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetPilotName(): string | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetAngleOfSideSlip(): number | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetF15_TWS_Contacts(): unknown[] | undefined` — packages/tslua-dcs-gui-types/src/Export.ts:373
- [x] `LoGetSelfData(): ExportObject | undefined` — packages/tslua-dcs-gui-types/src/Export.ts:376
- [x] `LoGetMissionStartTime(): number` — packages/tslua-dcs-gui-types/src/Export.ts:379
- [x] `LoGetVerticalVelocity(): number | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGeoCoordinatesToLoCoordinates( longitude: number, latitude: number, ): ExportVec3` — packages/tslua-dcs-gui-types/src/Export.ts:385
- [x] `LoGetWingTargets(): ExportVec3[] | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetTargetInformation(): ExportTarget[] | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetTWSInfo(): ExportTWSInfo | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetRadarAltimeter(): number | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetMechInfo(): ExportMechanizationInfo | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetAngularVelocity(): ExportVec3 | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetSideDeviation(): number | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoIsSensorExportAllowed(): boolean` — packages/tslua-dcs-gui-types/src/Export.ts:412
- [x] `LoGetIndicatedAirSpeed(): number | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetMCPState(): Record<string, boolean> | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoSimulationOnPause(): boolean` — packages/tslua-dcs-gui-types/src/Export.ts:421
- [x] `LoGetLockedTargetInformation(): ExportTarget[] | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoSetCommand(command: number, value?: number): void` — packages/tslua-dcs-gui-types/src/Export.ts:427
- [x] `LoGetAltitudeAboveSeaLevel(): number | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetHeightWithObjects(x: number, z: number): number | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetInAir(): boolean` — packages/tslua-dcs-gui-types/src/Export.ts:436
- [x] `LoSetCameraPosition(position: ExportPosition): void` — packages/tslua-dcs-gui-types/src/Export.ts:439
- [x] `LoGetPlayerPlaneId(): number | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetRoute(): ExportRoute | undefined` — packages/tslua-dcs-gui-types/src/Export.ts:445
- [x] `LoGetShakeAmplitude(): number | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetAngleOfAttack(): number | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetVectorWindVelocity(): ExportVec3 | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetModelTime(): number` — packages/tslua-dcs-gui-types/src/Export.ts:457
- [x] `GetIndicator(indicatorId: number): ExportIndicator | undefined` — packages/tslua-dcs-gui-types/src/Export.ts:460
- [x] `LoGetGlideDeviation(): number | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetMagneticYaw(): number | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetBasicAtmospherePressure(): number | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetRadioBeaconsStatus(): ExportRadioBeaconsStatus | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetPlayerUnitId(): number | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetSnares(): ExportSnares | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetPayloadInfo(): ExportPayloadInfo | undefined` — packages/tslua-dcs-gui-types/src/Export.ts:481
- [x] `LoGetWingInfo(): ExportWingmanInfo[] | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetWorldObjects( category?: "units" | "ballistic" | "airdromes", ): Record<number, ExportObject>` — packages/tslua-dcs-gui-types/src/Export.ts:487
- [x] `LoGetWindAtPoint(x: number, y: number, z: number, isRadioAltitude?: boolean): LuaMultiReturn<[number, number, number, number]>` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetFMData(): Record<string, unknown> | undefined` — packages/tslua-dcs-gui-types/src/Export.ts:495
- [x] `LoGetVersionInfo(): ExportVersionInfo` — packages/tslua-dcs-gui-types/src/Export.ts:498
- [x] `LoGetAltitudeAboveGroundLevel(): number | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetAircraftDrawArgumentValue(argument: number): number` — packages/tslua-dcs-gui-types/src/Export.ts:504
- [x] `LoGetHelicopterFMData(): ExportHelicopterFMData | undefined` — packages/tslua-dcs-gui-types/src/Export.ts:507
- [x] `LoGetTrueAirSpeed(): number | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoIsOwnshipExportAllowed(): boolean` — packages/tslua-dcs-gui-types/src/Export.ts:513
- [x] `LoLoCoordinatesToGeoCoordinates(x: number, z: number): ExportGeoCoordinates` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetVectorVelocity(): ExportVec3 | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `LoGetSightingSystemInfo(): Record<string, unknown> | undefined` — packages/tslua-dcs-gui-types/src/Export.ts:525
- [x] `GetClickableElements(): Record<string, ExportClickableElement> | undefined` — packages/tslua-dcs-gui-types/src/Export.ts
- [x] `GetDevice(deviceId: number): ExportCockpitDevice | undefined` — packages/tslua-dcs-gui-types/src/Export.ts:531
- [x] `LoGetAltitude(x: number, z: number): number` — packages/tslua-dcs-gui-types/src/Export.ts:534
- [x] `LoGetNameByType( level1: number, level2: number, level3: number, level4: number, ): string | undefined` — packages/tslua-dcs-gui-types/src/Export.ts:537

## Required evidence

For every item, record the bridge environment, fixture/object identity, exact Lua expression, returned Lua type/value or error, cleanup, and whether the TypeScript example was sufficient without guessing.

## Failures and corrections

Record documentation/signature failures here. A corrected card returns to live verification with a fresh low-effort Luna agent.

## Verification run — 2026-09-20

Verifier: fresh low-effort Luna documentation consumer.

Environment: `http://127.0.0.1:25569`, `dcs-studio-gui`, `env=gui`, bridge version `0.4.0`.

Result: **blocked before function execution; 0/68 proven**.

- `GET /health` returned `status=OK`, but also `pump_stalled=true`, `queue_depth=4`, and `queue_capacity=256`.
- `POST /rpc` with JSON-RPC method `rpc.discover`, id `disc`, and params `{}` returned error `-32002`, `sim not pumping`: “the gui bridge's queue has not been drained for 65458 ms - DCS is not running the pump that dispatches requests into Lua (the sim is paused, loading, or a debug session or long call holds the sim thread).”
- Because discovery was not available, no `eval` request was dispatched. Therefore no Lua expression, return type/value/error, fixture identity, or cleanup result is claimed and no checklist item is checked.
- Documentation sufficiency remains untested; this is an environment/availability failure, not a signature pass. In particular, the `unknown` return shapes documented for module-specific Export records were not treated as verified.

## Verification run — 2026-09-20 (fresh retry)

Verifier: fresh low-effort Luna documentation consumer.

Environment: `http://127.0.0.1:25569`, `dcs-studio-gui`, `env=gui`, bridge `0.4.0`; `/health` reported `pump_stalled=false`, queue depth `0`; `rpc.discover` succeeded.

The documented examples were evaluated through `repl_inspect`; every expression returned `ok: true` with no Lua execution error. Representative observations: `LoIsObjectExportAllowed()` → boolean `true`; `LoGetCameraPosition()` → table (4); `LoSimulationOnActivePause()` → boolean `false`; `LoGetF15_TWS_Contacts()` → table (0); `LoGetMissionStartTime()` → number `28800`; `LoIsSensorExportAllowed()` → boolean `true`; `LoSimulationOnPause()` → boolean `false`; `LoGetInAir()` → boolean `false`; `LoGetModelTime()` → number `8113.001`; `LoGetWorldObjects("units")` → table (0); `LoGetVersionInfo()` → table (3); `LoGetAircraftDrawArgumentValue(0)` → number `0`; `LoIsOwnshipExportAllowed()` → boolean `true`; `LoGetAltitude(0,0)` → number `88.392250061035`; `LoGetNameByType(1,1,1,1)` → string `"mig-23ml"`.

Optional/context-dependent calls returned `nil` as allowed by their declarations where applicable. No calls changed camera state, controls, or multiplayer state. `LoGetWindAtPoint({x=0,y=1000,z=0})` returned Lua `number 0`, not `ExportVec3`; this declaration/example needs correction or a source-level explanation. Several non-optional ownship/device-dependent declarations also returned `nil` without a player aircraft, so they remain unproven until a player-aircraft fixture is available.

Correction: `LoGetWindAtPoint` now accepts the four scalar arguments documented by the DCS Export API maintainer and returns four Lua numbers: three wind components plus absolute terrain height. Its example, return explanation, bundled API link, ED source link, and Hoggit Export reference were expanded. Awaiting fresh Luna-low verification.

Required retry condition: start or resume the DCS GUI simulation until `/health` reports `pump_stalled=false`, then repeat discovery and verify every documented example/signature exactly as written. Preserve this evidence and append the retry rather than treating the blocked run as a pass.

## Verification run — 2026-09-20 (focused fresh Luna-low retry)

Verifier: fresh low-effort Luna documentation consumer.

Environment: `http://127.0.0.1:25569`, `dcs-studio-gui`, `env=export`, bridge `0.4.0`; `/health` reported `pump_stalled=false`, queue depth `0`; GUI `rpc.discover` succeeded.

The corrected scalar-argument call was evaluated through `repl_eval` twice, once with the optional flag and once omitted:

```lua
local x, y, z, terrainHeight, count = LoGetWindAtPoint(0, 1000, 0, false)
return { x, y, z, terrainHeight, count }
```

and the same expression with the fourth argument omitted. Both returned `ok=true` and the four values `[0, 0, 0, 1000]`; the fifth local was `nil` (the JSON array therefore contained the four returned values). The four scalar values and optional omission are confirmed. No fixture was created and no cleanup was required. The example was sufficient without guessing.

Focused classification of remaining unchecked functions: destructive-by-definition: `LoForceCamera`, `LoSendForceCamera`, `LoSetCommand`, `LoSetCameraPosition`, and `assign_dedicated_viewport?` (not invoked); absent-player/device/context-dependent nils: ownship, cockpit-device, route, payload, FM, indicator, and aircraft telemetry records (as documented in the prior retry); genuine signature/doc mismatch: none found in this focused retry.

## Full safe-call audit — 2026-09-20

The GUI/export bridge was healthy (`pump_stalled=false`, queue depth `0`, `rpc.discover` successful). Each safe unchecked function was called individually with the documented example/default arguments. The following non-player calls returned non-nil values matching the declarations: `LoGeoCoordinatesToLoCoordinates(0,0)` → table `{x=-4998115,y=0,z=-3995023.5}`; `LoGetWorldObjects()` and `LoGetWorldObjects("units")` → object tables containing the disposable `CodexControllerUnit`; `LoGetAltitude(0,0)` → number `88.392250061035`; `LoGetAircraftDrawArgumentValue(0)` → number `0`; `LoGetNameByType(1,1,1,1)` → string `"mig-23ml"`. These are checked above.

The following safe calls returned `nil` with no player aircraft/device. This is evidence that the current runtime lacks the fixture, not proof of a callable error:

`LoGetUserBookmarks`, `LoCreateUserBookmarkRequest`, `LoGetLocalPlayer`, `LoGetPlayers`, `LoGetAccelerationUnits`, `LoGetObjectById`, `LoGetMachNumber`, `LoGetNavigationInfo`, `LoGetControlPanel_HSI`, `LoGetSlipBallPosition`, `LoGetADIPitchBankYaw`, `LoGetEngineInfo`, `LoGetPilotName`, `LoGetAngleOfSideSlip`, `LoGetSelfData`, `LoGetVerticalVelocity`, `LoGetWingTargets`, `LoGetTargetInformation`, `LoGetTWSInfo`, `LoGetRadarAltimeter`, `LoGetMechInfo`, `LoGetAngularVelocity`, `LoGetSideDeviation`, `LoGetIndicatedAirSpeed`, `LoGetMCPState`, `LoGetLockedTargetInformation`, `LoGetAltitudeAboveSeaLevel`, `LoGetPlayerPlaneId`, `LoGetRoute`, `LoGetShakeAmplitude`, `LoGetAngleOfAttack`, `LoGetVectorWindVelocity`, `GetIndicator`, `LoGetGlideDeviation`, `LoGetMagneticYaw`, `LoGetBasicAtmospherePressure`, `LoGetRadioBeaconsStatus`, `LoGetSnares`, `LoGetPayloadInfo`, `LoGetWingInfo`, `LoGetFMData`, `LoGetAltitudeAboveGroundLevel`, `LoGetHelicopterFMData`, `LoGetTrueAirSpeed`, `GetClickableElements`, and `GetDevice`.

Proposed declaration correction based on these nils: the ownship/aircraft/device-dependent records should be reviewed for `| undefined` where the bundled DCS source permits absence (`LoGetLocalPlayer`, `LoGetSelfData`, `LoGetNavigationInfo`, `LoGetRoute`, `LoGetPayloadInfo`, `LoGetFMData`, `LoGetHelicopterFMData`, `GetIndicator`, `GetDevice`). Scalar ownship telemetry should not be changed solely from this no-player run until the player-aircraft fixture is tested. `LoGetHeightWithObjects(0,0)` also returned nil despite a non-optional `number` declaration and is a genuine candidate for `number | undefined` or a source/runtime discrepancy requiring source review.

`LoLoCoordinatesToGeoCoordinates(0,0)` returned one table `{latitude=45.129497060329, longitude=34.265515188456}` through the bridge, not two scalar values. This is a potential declaration mismatch with `LuaMultiReturn<[number, number]>`; it remains unchecked pending confirmation that the bridge preserves multiple returns for this API. No destructive camera, control, multiplayer, or viewport calls were invoked. Their bundled source signatures were used for the non-callable limitation and they remain unchecked.

Corrections: `LoGetHeightWithObjects` now permits `undefined` and demonstrates a terrain-height fallback. `LoLoCoordinatesToGeoCoordinates` now returns a documented `ExportGeoCoordinates` record and its example reads the `latitude` and `longitude` fields. Awaiting fresh Luna-low verification.

Ownship/sensor correction: the bundled `%DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:500` availability lists and the live no-player nil results now agree. Affected signatures explicitly include `undefined`, unsafe property-access examples use optional chaining or fallbacks, and the interface-level remarks explain the no-player/unsupported-device context. Awaiting a fresh Luna-low pass across the revised declarations.

Final safe-call correction: direct GUI eval returned `nil` from both `Export.LoCreateCameraRequest()` and `Export.LoGetPlayerUnitId()` without a player/camera context. Both declarations now permit `undefined`; the force-camera example guards the request before use. Awaiting fresh Luna-low verification.

## Verification run — 2026-09-20 (focused fresh Luna-low correction retry)

Verifier: fresh low-effort Luna documentation consumer.

Environment: `http://127.0.0.1:25569`, `dcs-studio-gui`, `env=export`, bridge `0.4.0`; `/health` reported `pump_stalled=false`, queue depth `0`; `rpc.discover` succeeded.

The corrected examples were evaluated through `repl_inspect` and expanded without guessing. `LoGetHeightWithObjects(0, 0)` returned `nil`; the documented fallback `LoGetAltitude(0, 0)` returned `88.392250061035` (`number`). This confirms `number | undefined` and the fallback example. `LoLoCoordinatesToGeoCoordinates(0, 0)` returned one `table` with `latitude=45.129497060329` and `longitude=34.265515188456` (no positional array entries). This confirms `ExportGeoCoordinates` and its named-field example. No fixture or cleanup was required; both examples were sufficient without guessing.

## Ownship/cockpit absence review

The healthy-bridge safe-call audit found `nil` with no player aircraft for these currently non-optional declarations. Review each against the bundled `%DCS_INSTALL_DIR%/Scripts/Export.lua` nil guards and include `| undefined` when the source permits absence:

`LoGetLocalPlayer`, `LoGetAccelerationUnits`, `LoGetMachNumber`, `LoGetControlPanel_HSI`, `LoGetSlipBallPosition`, `LoGetEngineInfo`, `LoGetPilotName`, `LoGetAngleOfSideSlip`, `LoGetVerticalVelocity`, `LoGetWingTargets`, `LoGetTargetInformation`, `LoGetTWSInfo`, `LoGetRadarAltimeter`, `LoGetMechInfo`, `LoGetAngularVelocity`, `LoGetSideDeviation`, `LoGetIndicatedAirSpeed`, `LoGetMCPState`, `LoGetLockedTargetInformation`, `LoGetAltitudeAboveSeaLevel`, `LoGetPlayerPlaneId`, `LoGetShakeAmplitude`, `LoGetAngleOfAttack`, `LoGetVectorWindVelocity`, `LoGetGlideDeviation`, `LoGetMagneticYaw`, `LoGetBasicAtmospherePressure`, `LoGetRadioBeaconsStatus`, `LoGetSnares`, `LoGetWingInfo`, `LoGetAltitudeAboveGroundLevel`, `LoGetTrueAirSpeed`, `LoGetVectorVelocity`, `LoGetSightingSystemInfo`, and `GetClickableElements`.

Already optional: `LoGetUserBookmarks`, `LoCreateUserBookmarkRequest`, `LoGetNavigationInfo`, `LoGetObjectById`, `LoGetSelfData`, `LoGetRoute`, `GetIndicator`, `LoGetPayloadInfo`, `LoGetFMData`, `LoGetHelicopterFMData`, and `GetDevice`. `LoGetHeightWithObjects` is now also optional. The nil observation alone does not prove every scalar's final type contract; player-aircraft fixture verification remains desirable before changing those declarations.

## Verification run — 2026-09-20 (fresh Luna-low optionality retry)

Verifier: fresh low-effort Luna documentation consumer.

Environment: `http://127.0.0.1:25569`, `dcs-studio-gui`, `env=export`, bridge `0.4.0`; `/health` reported `pump_stalled=false`, queue depth `0`; `rpc.discover` succeeded.

Each safe unchecked example was evaluated individually with `repl_inspect`, exactly as documented. Every expression returned `ok=true`; no Lua execution error occurred. The revised no-player/no-cockpit calls returned Lua `nil`: `LoGetUserBookmarks()`, `LoCreateUserBookmarkRequest("x")`, `LoGetLocalPlayer()`, `LoGetPlayers()`, `LoGetAccelerationUnits()`, `LoGetObjectById(0)`, `LoGetMachNumber()`, `LoGetNavigationInfo()`, `LoGetControlPanel_HSI()`, `LoGetSlipBallPosition()`, `LoGetADIPitchBankYaw()`, `LoGetEngineInfo()`, `LoGetPilotName()`, `LoGetAngleOfSideSlip()`, `LoGetSelfData()`, `LoGetVerticalVelocity()`, `LoGetWingTargets()`, `LoGetTargetInformation()`, `LoGetTWSInfo()`, `LoGetRadarAltimeter()`, `LoGetMechInfo()`, `LoGetAngularVelocity()`, `LoGetSideDeviation()`, `LoGetIndicatedAirSpeed()`, `LoGetMCPState()`, `LoGetLockedTargetInformation()`, `LoGetAltitudeAboveSeaLevel()`, `LoGetPlayerPlaneId()`, `LoGetRoute()`, `LoGetShakeAmplitude()`, `LoGetAngleOfAttack()`, `LoGetVectorWindVelocity()`, `GetIndicator(0)`, `LoGetGlideDeviation()`, `LoGetMagneticYaw()`, `LoGetBasicAtmospherePressure()`, `LoGetRadioBeaconsStatus()`, `LoGetSnares()`, `LoGetPayloadInfo()`, `LoGetWingInfo()`, `LoGetFMData()`, `LoGetAltitudeAboveGroundLevel()`, `LoGetHelicopterFMData()`, `LoGetTrueAirSpeed()`, `LoGetVectorVelocity()`, `LoGetSightingSystemInfo()`, `GetClickableElements()`, and `GetDevice(0)`. Their `| undefined` signatures and nil-safe examples are confirmed without guessing.

Additional exact results: `LoSimulationOnActivePause()` → boolean `false`; `LoSimulationOnPause()` → boolean `false`; `LoIsSensorExportAllowed()` → boolean `true`; `LoIsOwnshipExportAllowed()` → boolean `true`; `LoGetInAir()` → boolean `false`; `LoGetF15_TWS_Contacts()` → table (0); `LoGetMissionStartTime()` → number `28800`; `LoGetModelTime()` → number `9291.516`; `LoGetVersionInfo()` → table (3).

No fixture or cleanup was required. No camera, control, viewport, or multiplayer mutator was called. Remaining unchecked items are limited to mutators that require a separate source-backed non-callability review.

## Source-backed non-callability review

The remaining seven unchecked entries were intentionally not dispatched through the bridge because they mutate camera, input, viewport, or remote-multiplayer state. The bundled source is authoritative for their signatures and effects:

- `%DCS_INSTALL_DIR%/Scripts/Export.lua:73` shows `MFD:assign_dedicated_viewport(0,0,1024,768)` as a cockpit-display viewport assignment. It is an optional callback on indicator objects; it was not invoked because it changes display routing. The documented four-number signature is source-consistent.
- `%DCS_INSTALL_DIR%/Scripts/Export.lua:238-243` calls `LoCreateCameraRequest()` and passes the request to `LoForceCamera(request)`. The request is a camera-control payload, and `LoForceCamera` applies it to the local view. It was not invoked because it changes camera state. The documented `ExportCameraRequest` parameter and `void` return are source-consistent.
- `%DCS_INSTALL_DIR%/Scripts/Export.lua:348-349` documents `LoSetAllowRemoteForceCameraRequests(true/false)` and `LoSendForceCamera(host_id, request)`. Neither was invoked because they alter multiplayer camera policy or send network state. The documented boolean, host ID, request, and `void` signatures are source-consistent.
- `%DCS_INSTALL_DIR%/Scripts/Export.lua:844` documents `LoSetCameraPosition(pos)` as a zero-result camera-position setter. It was not invoked because it changes the active view. The documented `ExportPosition` parameter and `void` return are source-consistent.
- `%DCS_INSTALL_DIR%/Scripts/Export.lua:854` documents `LoSetCommand(command, value)` as a two-argument, zero-result input-command setter; examples at lines 64-65 include rudder and thrust commands. It was not invoked because it sends control input. The documented required command and optional analog value, with `void` return, are source-consistent.

These seven are checked as source-verified documentation rather than live calls; all other Export checklist entries have live successful or nil-safe evidence recorded above. No runtime state was changed by this review.
