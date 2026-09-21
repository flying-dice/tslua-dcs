# Updating DCS type definitions

Exports use the DCS Studio bridges; this repository no longer installs or talks to DCS Fiddle. Install DCS Studio, select the intended DCS and Saved Games profile, then run `dcs.bridge.inject` and `dcs.bridge.launch`. Injection deploys bridge files, so restart DCS when Studio asks you to.

The GUI exporter uses `http://127.0.0.1:25569` and must be run with DCS at the main menu. The mission exporter uses `http://127.0.0.1:25570` and needs a trusted development mission actively running and unpaused. Open the MissionScripting panel in Studio, use its desanitize action if the mission bridge requires it, and restart/reload as directed. Desanitizing permits filesystem/OS access in mission Lua: restore sanitization afterwards. The exporter never changes DCS lifecycle or sanitization itself.

Run `npm run export` from the repository root, or a package's `npm run export`. The exporter checks `/health`, `rpc.discover`, DCS runtime version, and every configured namespace before it writes anything. It stages all generated files and publishes only after the package succeeds; a failed later namespace leaves existing exports intact.

Use `DCS_STUDIO_GUI_URL` or `DCS_STUDIO_MISSION_URL` for a different local bridge address. Time budgets are `DCS_EXPORT_HEALTH_TIMEOUT_MS` (3s), `DCS_EXPORT_RPC_TIMEOUT_MS` (35s), and `DCS_EXPORT_TIMEOUT_MS` (120s). Normally the generated `@version` comes from `_APP_VERSION`; if that runtime value is unavailable, set `DCS_EXPORT_DCS_VERSION` explicitly. That value is maintainer-supplied DCS provenance, never a bridge or npm version.

If a bridge is unavailable, verify Studio injection/launch and its `/health` identity. A stalled mission bridge requires a running, unpaused mission; wrong namespace reports should be investigated in that selected Lua environment rather than sourced from another one. Remove any old DCS Fiddle hook from Saved Games manually—repository cleanup cannot remove external installed files.

## Preparing a release

Run `npm run release:version` when Lerna should calculate the next version from conventional commits, or update all workspace manifests and `lerna.json` to the same explicit version. Commit the prepared versions before publishing.

Run `npm run publish` to build the repository and publish exactly the versions recorded in the package manifests. Publishing does not calculate or apply an additional version bump.
