# tslua-dcs-bridge

The repository's own bridge into a running DCS World. It lets tools on the host evaluate Lua in DCS's
**GUI** (hooks) and **mission** scripting environments over JSON-RPC 2.0 on localhost HTTP. The type
exporters and the `test:dcs` suites use it, so this repository needs no external DCS tooling. Private:
never published.

It is written in TypeScript and built with this repository's own packages, so it dogfoods them in the sim:
[`@flying-dice/tslua-http-api`](../tslua-http-api) (server and routing), [`@flying-dice/tslua-http`](../tslua-http)
(LuaSocket HTTP) and [`@flying-dice/tslua-json`](../tslua-json) (JSON).

## Quick start

From the repository root:

```shell
npm run dcs:start     # build (with its workspace dependencies), install, launch DCS, start and unpause the test mission
npm run dcs:status    # GET /health on both bridges
npm run test:dcs      # run the mission and GUI type-example suites inside DCS
```

## How it is installed

`npx dcs-bridge install` writes four things. `npx dcs-bridge uninstall` removes all of them.

| What | Where | Loaded by |
| --- | --- | --- |
| GUI bridge (`dist/tslua-dcs-gui-bridge.lua`) | `<Saved Games>/Scripts/Hooks/tslua-dcs-bridge.lua` | DCS at startup, like any GameGUI hook |
| Mission bridge (`dist/tslua-dcs-mission-bridge.lua`) | `<Saved Games>/Scripts/tslua-dcs/mission-bridge.lua` | the loader block below, at every mission start |
| Loader block | `<DCS install>/Scripts/MissionScripting.lua`, right after `dofile('Scripts/ScriptingSystem.lua')` | DCS, when it creates the mission scripting state |
| Test mission (`dist/tslua-dcs-test.miz`) | `<Saved Games>/Missions/tslua-dcs/tslua-dcs-test.miz` | `dcs-bridge mission` |
| Bearer token (random, 256-bit) | `<Saved Games>/Config/tslua-dcs-bridge.token` | both bridges at load; the CLI and the exporters when they call `/rpc` |

- The loader block sits between marker comments, so installing again replaces it rather than adding a
  second copy. The first install keeps the original file as `MissionScripting.lua.tslua-dcs.bak`.
- The mission bridge loads **before** the sanitization block, so it works on a stock, sanitized install:
  it has already loaded LuaSocket by the time `require` and `package` are removed.
- A DCS update that rewrites `MissionScripting.lua` only needs `install` to be run again.

Paths are auto-detected. The Saved Games folder is the `DCS*` folder with the most recently written
`dcs.log`, and the install folder comes from the Windows uninstall registry. Override them with
`DCS_SAVED_GAMES` and `DCS_INSTALL`.

## Protocol

| | GUI bridge | Mission bridge |
| --- | --- | --- |
| URL | `http://127.0.0.1:25579` | `http://127.0.0.1:25580` |
| Health name | `tslua-dcs-gui-bridge` | `tslua-dcs-mission-bridge` |
| Pumped by | `onSimulationFrame` (also runs at the main menu) | `timer.scheduleFunction` every 0.02 s of model time |
| Available | whenever DCS is running | while a mission is running **and unpaused** |

- `GET /health` returns `{ name, env, version, status, port, pump_stalled, uptime, last_pump_age }`.
- `POST /rpc` accepts JSON-RPC 2.0 (the `id` may be a string or a number):
  - `ping` returns `"pong"`.
  - `rpc.discover` returns a minimal OpenRPC 1.3.2 document.
  - `eval({ code })` compiles and runs `code` in that environment's global state and returns its first
    result as JSON (`null` when there is no result).
  - Errors: `-32700` parse error, `-32600` invalid request, `-32601` unknown method, `-32602` bad params,
    `-32000` compile error, `-32001` runtime error, `-32002` a result that can't be encoded as JSON (for
    example, one containing functions).

Change the ports by setting the global `TSLUA_DCS_BRIDGE_GUI_PORT` or `TSLUA_DCS_BRIDGE_MISSION_PORT`
before the bridge loads, and point the tools at them with `DCS_BRIDGE_GUI_URL` or `DCS_BRIDGE_MISSION_URL`.

## CLI

```text
dcs-bridge install | uninstall | paths | status
dcs-bridge launch                       start DCS (skipping the launcher window) and wait for the GUI bridge
dcs-bridge mission [file.miz]           start a mission (default: the test mission), unpause it, wait for the mission bridge
dcs-bridge eval <gui|mission> <code|->  run Lua and print the JSON result
dcs-bridge run  <gui|mission> <bundle>  run a compiled Lua bundle (e.g. a luatest suite); exit 1 if it errors
```

The same functions (`install`, `launch`, `loadMission`, `evaluate`, `runBundle`, `health`, `rpc`) are
exported from `scripts/dcs-bridge.mjs` for Node scripts.

## Security

Both bridges run any Lua sent to them, with the full rights of that DCS environment. Binding to
`127.0.0.1` isn't enough on its own, because a web page open in a browser can also send requests to
loopback. So `POST /rpc` checks every request before it can reach `eval`:

- **No browser requests:** any request with an `Origin` header gets **403**. Browsers send that header
  on cross-origin requests; Node, curl and the CLI don't.
- **JSON only:** a `Content-Type` other than `application/json` gets **415**. That removes the
  `text/plain` "simple request" a page could send without a CORS preflight, and the bridge never
  grants a preflight.
- **Token required:** the request must carry `Authorization: Bearer <token>`, using the token
  `install` wrote into Saved Games, or it gets **401**. A bridge that couldn't read a token refuses
  every RPC.

`GET /health` runs no code, so it needs no token, but it still refuses requests that carry an `Origin`
header. The CLI and the exporters send the token automatically; set `DCS_BRIDGE_TOKEN` to override it.
Install the bridges only on a development machine, and uninstall them when you are done.

## Development

```shell
npm run dcs:build                                         # the bridge and every workspace package it needs, from a clean checkout
npm test --workspace=@flying-dice/tslua-dcs-bridge        # JSON-RPC handler + loopback HTTP tests on lua51
```

`scripts/build-mission.mjs` generates the test mission from source (a mission table plus a small
store-only ZIP writer), so there are no binary files in the repository.
