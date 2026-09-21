---
name: dcs-studio
description: How to build, run, debug and publish DCS World mods in a DCS Studio project — manifest format, install roots, mission vs GUI scripting environments, the live bridge console, the bridges' agent-invocable JSON-RPC HTTP API, the Lua debugger, and the publish flow. Use when writing DCS mods, editing dcs-studio.toml, or working in a repo created by DCS Studio.
version: 1.1.0
---

# DCS Studio — writing mods for DCS World

DCS Studio is VS Code tooling for DCS World mods: project templates, a
manifest-driven installer, a GitHub-backed marketplace, a live in-sim Lua
console, and a step debugger for Lua running inside DCS. This skill teaches
the project conventions and the workflow.

## The project manifest: dcs-studio.toml

Every DCS Studio project has a `dcs-studio.toml` at its root. It is the
source of truth for metadata and how files install into DCS:

```toml
[project]
name = "my-mod"
version = "0.1.0"
author = ""
description = ""
dcs_min_version = "2.9.0"

# [[bundle]] declares what gets packed into the release archive (paths
# relative to the project root). [[symlink]] declares which links are
# created into DCS on enable — each source must be inside a bundled path.
[[bundle]]
path = "Scripts/my-mod.lua"

[[symlink]]
source = "Scripts/my-mod.lua"
dest = "{SavedGames}/Scripts/my-mod.lua"
```

> **Breaking change (pre-release, 2026-07):** the old `[[install]]
> { source, dest }` array is no longer supported. It is not parsed,
> normalized, or migrated — publish preflight rejects any manifest whose
> extras still contain a `[[install]]` section. Re-author each rule as a
> `[[bundle]]` path plus a `[[symlink]]` pair.

Symlink destinations use **named roots**, resolved per-machine at install
time — never hard-code absolute paths:

- `{SavedGames}` → the user's DCS "Saved Games" folder (e.g. `%USERPROFILE%\Saved Games\DCS`)
- `{GameInstall}` → the DCS game install directory

Keep every file the mod ships covered by a `[[bundle]]` path, and link
whichever of it needs to land in DCS with a `[[symlink]]` rule.

Opening `dcs-studio.toml` in VS Code auto-opens a two-way-bound authoring
form beside the text editor. Bump `[project] version` for every release.

## Where DCS Lua runs: two environments

DCS has two distinct Lua environments, and code written for one does not
run in the other:

1. **Mission scripting environment** — loaded by a mission trigger
   (`DO SCRIPT FILE`, or `DO SCRIPT` with `dofile`). Available: `env`,
   `timer`, `trigger`, `world`, `coalition`. Sanitized away by default:
   `os`, `io`, `lfs`. Log with `env.info("...")`. Schedule repeating work
   with `timer.scheduleFunction(fn, arg, timer.getTime() + n)` — return the
   next wake-up time from `fn` to keep the schedule alive.

2. **GameGUI hooks environment** — every `.lua` in
   `Saved Games/Scripts/Hooks` is auto-loaded at DCS start, no mission
   needed. Available: `DCS.*`, `net`, `log`, `lfs`. Wire into simulation
   events with `DCS.setUserCallbacks({ onMissionLoadEnd = ..., onSimulationFrame = ... })`.
   Log with `log.write("tag", log.INFO, msg)`. Always `pcall` inside
   callbacks — an error in one callback must never break the GUI loop —
   and keep per-frame work tiny; a slow `onSimulationFrame` is a visible
   stutter.

Both environments log to `Saved Games/DCS/Logs/dcs.log`.

### MissionScripting.lua sanitization

DCS strips `os`/`io`/`lfs`/`require`/`package` from mission scripts via
`MissionScripting.lua`. DCS Studio's MissionScripting panel (command:
`dcs.mission.open`) can de-sanitize it for development and re-sanitize it
after. De-sanitizing is required for the **mission bridge** (it is
`require`d into the mission state) and for any mission script that needs
the full Lua environment. A de-sanitized install lets any mission touch
the filesystem — treat it as a dev-only state and re-sanitize when done.

## Project templates

`dcs.project.new` scaffolds from these templates:

- **Blank** — just the manifest; bring your own structure.
- **Lua Mission Script** — `Scripts/<slug>.lua` targeting the mission
  environment, installed to `{SavedGames}/Scripts/`.
- **Lua GameGUI Hook** — `Scripts/Hooks/<ident>_hook.lua`, installed to
  `{SavedGames}/Scripts/Hooks` where DCS auto-loads it.
- **Rust DLL Mod** — an mlua `cdylib` crate plus a loader hook. The Lua
  module name equals the crate `[lib]` name: `require("<ident>")` loads
  `<ident>.dll` and calls its exported `luaopen_<ident>`. The DLL installs
  to `{SavedGames}/Mods/tech/<slug>/bin`; the hook appends that folder to
  `package.cpath` before `require`. Footgun: `.cargo/config.toml` must pin
  `LUA_LIB`/`LUA_LIB_NAME` to the bundled `lua5.1/lua.lib` import library
  so the DLL links DCS's own `lua.dll` — otherwise the build succeeds but
  `require` fails silently inside DCS. Never set `panic = "abort"`; mlua
  converts Rust unwinds into Lua errors, and aborting takes DCS down with
  the mod. Build with `cargo build --release`.

## Running and debugging Lua in the live sim

DCS Studio ships TWO bridges (injected DLLs + a GameGUI hook) that connect
VS Code — and any local tool or agent — to a running DCS instance:

- The **GUI bridge** (`dcs_studio_gui.dll`) runs in the GameGUI hooks state
  and is up whenever DCS runs. It serves the `gui`, `server`, `config` and
  `export` environments.
- The **mission bridge** (`dcs_studio_mission.dll`) runs in the mission
  scripting state. The GUI hook boots it automatically a moment after each
  mission start — that boot needs a de-sanitized `MissionScripting.lua`
  (`require`/`package` restored). It serves the `mission` environment and
  is only reachable while a mission is loaded.

- `dcs.bridge.inject` deploys both bridges into DCS; `dcs.bridge.launch`
  launches DCS with them; `dcs.bridge.eject` removes them.
- `dcs.bridge.console` opens a live Lua console — pick the mission or GUI
  environment and evaluate code in the running sim. Use this to probe APIs
  before committing to code.
- The `dcs-lua` debug type runs a Lua file inside DCS with breakpoints.
  Launch config: `{ "type": "dcs-lua", "request": "launch", "program":
  "${file}", "env": "mission" | "gui" }`. Editor title bar Run/Debug
  buttons do the same for the open Lua file. `env: "mission"` needs a
  running mission (the mission bridge serves it); `env: "gui"` works from
  the main menu.

When a mod "does nothing", check `Saved Games/DCS/Logs/dcs.log` first —
load errors, sanitization failures, and `require` failures all land there.
The bridges log to `Logs/dcs_studio_gui.log` and `Logs/dcs_studio_mission.log`.

## Driving DCS from an agent: the bridges' JSON-RPC HTTP API

Both bridges serve JSON-RPC 2.0 over localhost HTTP and WebSocket — any
agent or script can drive the live sim with plain `curl`, no extension
needed:

| Bridge  | Port  | Lua envs                    | Alive when              |
| ------- | ----- | --------------------------- | ----------------------- |
| GUI     | 25569 | gui, server, config, export | whenever DCS runs       |
| Mission | 25570 | mission                     | only during a mission   |

Endpoints on each port: `POST /rpc` (JSON-RPC), `GET /ws` (WebSocket, same
protocol), `GET /health` (identity + liveness).

Rules that matter:

- The request `id` MUST be a **string** (or absent for a notification) —
  a numeric id is rejected by the server's parser.
- Call **`rpc.discover` first**: it returns the bridge's **OpenRPC 1.3.2
  document** (https://spec.open-rpc.org/) — `{ openrpc, info, servers,
  methods[] }`, generated by the DLL from the exact methods it registered
  (never handcrafted). Each method is an OpenRPC method object with `name`,
  `summary`/`description`, `params[]` and a `result` (params/result are
  content descriptors: `{ name, required?, description?, schema }`). The
  bridge identity is in `info` (`title` = service name, `x-dcs-env` = "gui" |
  "mission", `version` = bridge build). `GET /health` also names the service.
- A connection refused on 25570 means "no mission running" (or a sanitized
  MissionScripting.lua blocked the boot — check dcs.log), not a broken
  install.
- Requests are answered on the sim thread: the mission bridge's queue pump
  runs on model time, so requests stall while the sim is paused at the
  escape menu (they time out after ~30s).

Examples:

```sh
# Who's answering? (both ports)
curl -s http://127.0.0.1:25569/health
curl -s http://127.0.0.1:25570/health

# Discover the bridge's OpenRPC document (methods, params, results)
curl -s http://127.0.0.1:25569/rpc -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"1","method":"rpc.discover"}'

# Evaluate Lua in the GUI state
curl -s http://127.0.0.1:25569/rpc -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"2","method":"repl_eval","params":{"code":"return DCS.getVersion()"}}'

# Evaluate Lua in the mission state (needs a running mission)
curl -s http://127.0.0.1:25570/rpc -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"3","method":"repl_eval","params":{"code":"return #world.getAirbases()"}}'
```

Browse the whole surface without a sim: the checked-in OpenRPC documents and
OpenRPC Playground deep links are in `docs/03-reference/01-bridge-api.md` in the
dcs-studio repo.

The full surface (per `rpc.discover`): `ping`, `eval`, `console_read`,
`emit_dlua`, `dump_globals`, `repl_*` (eval/inspect/expand/clear/export),
`debug_*` (run/state/continue/pause/stop/expand/eval/inspect/
set_breakpoints/clear_breakpoints), plus `mission_boot` and the `db_*`
methods on the GUI bridge (`mission_boot` re-dispatches the mission-bridge
boot into a running mission).

### DCS unit database (`db_*`, GUI bridge only)

The GameGUI hook state carries the DCS `db` global (units, weapons, …), so
these run on the **GUI bridge (25569) only** and need DCS loaded and
**foreground** (the RPC queue pumps on the sim thread — a backgrounded sim
stalls requests until the ~30s timeout). All return plain JSON.

- `db_categories {}` → `{ categories: [{ name, entry_key, count }] }` — the real
  categories inside `db.Units` (Planes, Helicopters, Ships, Cars, …), shape-
  detected (GT_t/Skills and non-unit children are filtered out).
- `db_unit_types { category?, filter? }` → `{ units: [{ type, display_name,
  category }], truncated }` — light listing across one or all categories;
  `filter` is a case-insensitive substring; capped at 2000 rows.
- `db_unit { type, raw? }` → curated `{ unit: { type, display_name, category,
  attributes, country_of_origin, crew_members, perf, guns, pylons } }`, where
  `pylons[].stores[]` carry each store's `clsid` resolved against `db.Weapons`.
  `raw = true` returns the whole record (depth-capped, cycle-safe copy).
- `db_weapons { filter? }` → `{ weapons: [{ clsid, display_name, name,
  category }], truncated }` — `db.Weapons.ByCLSID` listing; filter + 2000 cap.
- `db_export { what? }` → `{ path, bytes }` — dumps `what` = `all` (default) |
  `weapons` | `category:<name>` | `unit:<type>` to a JSON file under
  `<writedir>Temp\` (a tens-of-MB dump never rides the socket; runs on the sim
  thread, so `all` can stall for seconds).

**"Payloads" caveat:** ME loadout *presets* (the named payloads in the mission
editor) are **not** in `db`. The DB's answer to "what can this unit carry" is
its **pylons + per-pylon compatible store CLSIDs** (cross-referenced against
`db.Weapons`), which is what `db_unit`'s `pylons` gives you.

The extension surfaces `db_export` as the command **"DCS Studio: Export DCS
Unit Database (JSON)…"** (quick-pick: everything / a category / a single unit /
weapons). Interactive browsing of `db` stays in the Lua Console explorer.

## Marketplace and publishing

The Marketplace discovers mods as GitHub repos tagged with the
`dcs-studio` topic; a mod's identity is its `owner/name`. Users subscribe
in the extension; downloads unpack into the DCS Studio data dir and
symlink into the DCS folders per the install rules.

To publish (`dcs.publish.open`): the guided flow runs preflight checks on
the manifest, pushes the repo to GitHub, applies the `dcs-studio` topic,
and cuts a versioned release with a packaged payload (7-Zip). Before
publishing: bump `[project] version`, make sure `[[bundle]]`/`[[symlink]]`
rules cover everything the mod needs at runtime, and fill in
`author`/`description` — the Marketplace displays them.

## Key commands reference

| Command | What it does |
| --- | --- |
| `dcs.project.new` | New project from a template |
| `dcs.manifest.author` | Create/edit the project manifest (form + text) |
| `dcs.marketplace.open` | Browse community mods |
| `dcs.mymods.open` | Manage installed mods |
| `dcs.publish.open` | Guided publish to GitHub |
| `dcs.bridge.console` | Live Lua console into the running sim |
| `dcs.bridge.inject` / `dcs.bridge.launch` | Deploy the bridge / launch DCS with it |
| `dcs.mission.open` | MissionScripting.lua sanitization panel |
| `dcs.setup.open` | Configure DCS paths (Saved Games, game install) |
