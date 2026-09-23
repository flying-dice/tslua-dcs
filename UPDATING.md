# Updating DCS type definitions

Exports and the in-sim test suites talk to DCS through this repository's own bridge, [`packages/tslua-dcs-bridge`](packages/tslua-dcs-bridge/README.md). No external tooling (DCS Studio, DCS Fiddle) is needed.

Start DCS with both bridges from the repository root:

```shell
npm run dcs:start
```

This builds the bridge, installs it (GUI hook, mission script, empty Caucasus test mission, and a marked loader block in the game's `Scripts/MissionScripting.lua`; the original is kept as `MissionScripting.lua.tslua-dcs.bak`), launches DCS, starts the test mission and unpauses it. The GUI bridge answers on `http://127.0.0.1:25579` from the main menu onwards; the mission bridge answers on `http://127.0.0.1:25580` while a mission is running and unpaused. The mission bridge loads before the sanitization block, so no desanitizing is required. `npx dcs-bridge uninstall` removes everything, and a DCS update that rewrites `MissionScripting.lua` only needs `npx dcs-bridge install` again.

Run `npm run export` from the repository root, or a package's `npm run export`. The exporter checks `/health`, `rpc.discover`, DCS runtime version, and every configured namespace before it writes anything. It stages all generated files and publishes only after the package succeeds; a failed later namespace leaves existing exports intact. Mission exports reflect the running mission (e.g. `env.mission`), so export from the bundled test mission for reproducible output.

Use `DCS_BRIDGE_GUI_URL` or `DCS_BRIDGE_MISSION_URL` for a different local bridge address, and `DCS_SAVED_GAMES` / `DCS_INSTALL` if auto-detection picks the wrong DCS. Time budgets are `DCS_EXPORT_HEALTH_TIMEOUT_MS` (3s), `DCS_EXPORT_RPC_TIMEOUT_MS` (35s), and `DCS_EXPORT_TIMEOUT_MS` (120s). Normally the generated `@version` comes from `_APP_VERSION`; if that runtime value is unavailable, set `DCS_EXPORT_DCS_VERSION` explicitly. That value is maintainer-supplied DCS provenance, never a bridge or npm version.

If a bridge is unavailable, check `npm run dcs:status` and `Saved Games/<DCS>/Logs/dcs.log` (lines tagged `TSLUA-DCS-BRIDGE`). The mission bridge is pumped on model time, so it stops answering while the mission is paused. Remove any old DCS Fiddle or DCS Studio hooks from Saved Games manually if you no longer use them.

## Preparing a release

Run `npm run release:version` when Lerna should calculate the next version from conventional commits, or update all workspace manifests and `lerna.json` to the same explicit version. Commit the prepared versions before publishing.

Run `npm run publish` to build the repository and publish exactly the versions recorded in the package manifests. Publishing does not calculate or apply an additional version bump.
