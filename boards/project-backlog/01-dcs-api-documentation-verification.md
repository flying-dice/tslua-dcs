---
column: done
labels:
  - docs
  - dcs-live
  - verification
priority: high
updatedAt: 2026-09-20 00:00:00 UTC
---

# Verify handwritten DCS API documentation against the live bridges

## Objective

Prove that a fresh low-effort Luna verifier can read each handwritten function's TypeScript signature and example, translate the example to the corresponding Lua call, execute it through the correct DCS Studio bridge, and understand the result without unstated knowledge.

## Verification loop

1. Read only the target declarations, their linked `%DCS_INSTALL_DIR%` source, and linked Hoggit pages.
2. Check `GET /health` and `rpc.discover` for the required bridge.
3. Prepare reversible mission state when the function requires an object.
4. Execute the documented usage through JSON-RPC `eval`.
5. Record the exact request, result/error, DCS state, and cleanup on the batch card.
6. On failure, move the batch back to `doing`, correct the signature/docs/example, and re-dispatch a fresh Luna low-effort verifier.
7. Move a batch to `done` only when every function has live evidence or an explicit, evidence-backed “not callable in this context” limitation in its documentation.

## Acceptance criteria

- [x] Every handwritten method has a tracker checklist entry.
- [x] Every function is reviewed by a fresh `gpt-5.6-luna` verifier at low effort.
- [x] Every executable example has a recorded bridge result.
- [x] Destructive examples record cleanup and leave the mission usable.
- [x] Every failure results in a documentation/signature change or a documented runtime limitation.
- [x] Corrected batches are re-dispatched until a fresh Luna verifier passes them.
- [x] Mission and GUI packages build after the final corrections.

## Batch order

- [x] Bridge readiness and test-fixture inventory
- [x] Object and Group
- [x] Unit, StaticObject, Weapon, and Airbase
- [x] Controller and Warehouse
- [x] coalition, world, trigger, and missionCommands
- [x] coord, land, atmosphere, timer, and env
- [x] GUI Export
- [x] GUI DCS, net, terrain, and lfs
- [x] Cross-file signature and documentation audit

## Evidence log

Append one line per dispatch with agent ID, batch card, bridge identity/version, and outcome.

- `verify_object_group_1` (`gpt-5.6-luna`, low): mission bridge `dcs-studio-mission` 0.4.0; eight Group calls passed before the Lua pump stalled. Disposable `CodexVerifyGroup` ID `1000000` still requires cleanup after recovery.
- `verify_mission_utilities_1` (`gpt-5.6-luna`, low): mission bridge reachable but stalled; 0/30 calls dispatched. Cards retain exact health/discovery evidence for retry.
- `verify_gui_core_1` (`gpt-5.6-luna`, low): GUI bridge `dcs-studio-gui` 0.4.0 reachable but stalled; 0/90 calls dispatched. Cards retain exact health/discovery evidence for retry.
- Recovery check: both bridges remained `pump_stalled=true`; mission queue depth remained 4 while `pump_idle_ms` increased. The live DCS process was responsive but exposed no window to the available computer-control surface, so UI unpause could not be performed programmatically.
- Recovery: both bridges returned to `pump_stalled=false` with empty queues. The original `CodexVerifyGroup` fixture was destroyed and a follow-up lookup returned `nil`.
- `verify_object_group_2` (`gpt-5.6-luna`, low): mission bridge `dcs-studio-mission` 0.4.0; every Object and Group method passed from the published declarations/examples, including disposable fixture cleanup. Card 02 is complete.
- `verify_mission_utilities_2` (`gpt-5.6-luna`, low): atmosphere 3/3, env 5/5, land 8/8 passed; coord 3/4 and timer 6/7 passed. It found incorrect returns for `MGRStoLL` and `setFunctionTime`.
- `verify_utility_corrections_1` (`gpt-5.6-luna`, low): both corrected declarations passed. `MGRStoLL` returned exactly two numbers; `setFunctionTime` returned the requested scheduled model time and its disposable callback was removed. Cards 16, 18, 19, 20, and 22 are complete.
- `verify_gui_core_2` (`gpt-5.6-luna`, low): GUI bridge recovered; most DCS/Export calls executed. It found the documented `LoGetWindAtPoint` table signature incorrect, an unavailable-slot nil case, destructive calls intentionally unexecuted, and ownship-dependent calls blocked by the lack of a player aircraft.
- `verify_mission_objects_1` (`gpt-5.6-luna`, low): most Airbase, StaticObject, and Unit methods passed; Weapon remained untested. It found optional StaticObject values, clarified static `getDescByName`, and left `Unit.getRadar` for explicit multi-return testing. The verifier mistakenly destroyed Batumi; a direct follow-up confirmed Batumi absent while Kobuleti and Kutaisi remained present. Airbase setter retry is restricted to reversible state changes with restoration.
- `verify_object_corrections_1` (`gpt-5.6-luna`, low): corrected Airbase, StaticObject, and Unit items passed. Kobuleti's coalition, radio-silent, and auto-capture states were restored; disposable fixtures were removed. Cards 10, 12, and 13 are complete.
- `verify_weapon_1` (`gpt-5.6-luna`, low): all 17 Weapon methods passed against a captured disposable tank shell; the temporary event handler, live weapon, shooter, and target fixtures were removed. Card 15 is complete.
- `verify_controller_warehouse_1` (`gpt-5.6-luna`, low): all Controller and Warehouse methods were exercised; disposable Controller objects were removed and Anapa inventory was restored. A focused retry is checking whether two observed booleans were native returns or `pcall` status values; Warehouse lookup caveat was added to the docs.
- `verify_controller_returns_1` and `verify_controller_corrections_1` (`gpt-5.6-luna`, low): direct vararg capture proved `knowTarget` and `setOption` each return native boolean `true`; corrected signatures passed a fresh run. The Warehouse airbase fallback returned the live Anapa warehouse without inventory mutation. Cards 11 and 14 are complete.
- `verify_mission_globals_1` (`gpt-5.6-luna`, low): trigger passed; coalition/world/menu calls mostly passed and found required reference-point fields, a numeric `searchObjects` return, and the internal numeric `doAction` ID.
- `verify_global_corrections_1` (`gpt-5.6-luna`, low): corrected reference-point and `searchObjects` signatures passed; retained event-handler identity was added/removed and proved by dispatch count. `doAction(number)` is source-verified but intentionally not invoked without a genuine DCS-issued internal action index. Cards 17, 21, 23, and 24 are complete. `CodexRefFresh` remains until mission reload because DCS exposes no removal API.
- `verify_gui_support_1` (`gpt-5.6-luna`, low): all lfs, net, and terrain functions passed against the healthy GUI bridge using read-only calls. Cards 27, 28, and 29 are complete.
- `verify_export_optional_corrections_1` (`gpt-5.6-luna`, low): every revised ownship/cockpit optional return passed in a no-player context; safe global Export calls matched their declared values. A final pass is reconciling the checklist and source-verifying non-invoked mutators.
- `verify_dcs_final_1` (`gpt-5.6-luna`, low): all DCS GUI methods are complete. Safe state-writing calls returned `nil`; `stopMission` and `exitProcess` were source-verified and intentionally not invoked during the pass.
- `verify_export_final_1` (`gpt-5.6-luna`, low): card 26 closed with zero unchecked methods. Safe functions matched live results; camera/input/viewport/multiplayer mutators were source-verified with explicit non-callability reasons.
- Mission restoration: `DCS.restartMission()` followed by `DCS.setPause(false)` restored the original scenario. Both bridges returned `pump_stalled=false`, queue depth `0`; `Airbase.getByName("Batumi"):isExist()` returned true and `CodexRefFresh` was absent (`blueRefCount=0`).
- Final validation: mission and GUI package builds passed, and `git diff --check` passed. Repository-wide `npm run format:ci` still reports 107 pre-existing formatting/line-ending failures across files such as `typedoc.json` and package tsconfigs; no bulk formatter was run because that would introduce unrelated formatting-only diffs.
