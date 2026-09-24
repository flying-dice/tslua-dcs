# DCS GUI test doubles

Offline stand-ins for the DCS GUI (hooks) scripting environment, so code written against
`@flying-dice/tslua-dcs-gui-types` can be tested on the repository's `lua51` interpreter without DCS.

The doubles are TypeScript, compiled by TypeScriptToLua into one Lua file and preloaded before a test
bundle:

```shell
npm run build:doubles --workspace=@flying-dice/tslua-dcs-gui-types   # -> .test/doubles.lua
lua51 --preload ./.test/doubles.lua ./.test/tests.lua
```

`packages/tslua-dcs-gui-types_test` compiles the same sources with its own `tsconfig.doubles.json` into
its own `.test/doubles.lua`.

## What gets installed

| Global | Double | Notes |
| --- | --- | --- |
| `DCS` | `namespaces/DCS.ts` | mission, slots, units, FOV, log history, `setUserCallbacks`, ... |
| `Export` | `namespaces/Export.ts` | world objects, camera, coordinates, and the ownship/sensor/cockpit functions |
| `net` | `namespaces/net.ts` | players, chat, bans, mission list, JSON, `dostring_in` sandboxes |
| `lfs` | `namespaces/lfs.ts` | an in-memory Windows file system (nothing touches the disk) |
| `log` | `namespaces/log.ts` | formats with `string.format` and records every line |
| `terrain` | `namespaces/terrain.ts` | a flat, invertible Caucasus model (`geography.ts`) |
| `coalition`, `db` | `index.ts`, `fixtures.ts` | `coalition` has DCS's values (0, 1, 2); `db` holds a small unit/weapon database |
| `_APP_VERSION`, `__DCS_VERSION__`, `__FINAL_VERSION__`, `_ARCHITECTURE` | `index.ts` | version strings |
| `guiDoubles` | `controller.ts` | the test-side controller (not part of DCS) |

Numeric constants (`DCS.UNIT_NAME`, `net.PS_PING`, `log.INFO`, ...) are deterministic placeholders
(`constants.ts`), not DCS's values, so compare against the constant, never a literal.

## Guarantees

- **Typed against the declarations.** Each namespace file returns the declared interface (`l_DCS`,
  `l_Export`, ...), and `index.ts` installs each global through a helper typed with the declared type of
  that global (`typeof DCS`, ...). A declaration that gains, loses or changes a member breaks the build
  of the doubles until the double follows.
- **Same members as DCS.** `tests/surface.ts` runs `scripts/export.bridge.lua` (the generator
  `npm run export` runs inside DCS) against the doubles and requires it to reproduce the committed
  `src/exports/*.export.ts` byte for byte.
- **Dot calls only.** `guard.ts` wraps every namespace function: a call that passes the namespace table
  as its first argument (what TypeScriptToLua emits for `DCS:getPause()` when a declaration lacks
  `@noSelf`) raises `DCS.getPause was called with ':'`. Spies installed with `spyOn(DCS, "getPause")`
  wrap the guard, so they record such a call before it fails.
- **Callbacks are called the way DCS calls them**: as plain Lua functions with no `self`
  (`DCS.enumMissionPersistenceData` visitors, `guiDoubles.fire` for `DCS.setUserCallbacks` handlers).
  Invoking them through the declared TypeScript type would hide a missing `this: void`.

## Controlling the doubles from a test

```ts
import { afterEach, beforeEach, expect, restoreAllMocks, spyOn, test } from "@flying-dice/tslua-luatest";

beforeEach(() => guiDoubles?.reset()); // fresh fixture state
afterEach(() => restoreAllMocks());

test("greets connecting players", () => {
	installHooks(); // code under test: calls DCS.setUserCallbacks({ onPlayerConnect: ... })
	const sendChat = spyOn(net, "send_chat_to");
	guiDoubles?.fire("onPlayerConnect", 2, "Wingman");
	expect(sendChat).toHaveBeenCalledWith("Welcome Wingman", 2);
});
```

`guiDoubles` (`controller.ts`) offers:

| Member | Description |
| --- | --- |
| `state()` | the mutable state (`state.ts`) every double reads and writes: edit it to arrange a scenario, read it to assert side effects (`logRecords`, `chat`, `debriefing`, `nativeCalls`, ...) |
| `reset()` | replace the state with a fresh fixture; the namespace tables stay the same objects |
| `fire(name, ...args)` | invoke a GameGUI hook on every table registered with `DCS.setUserCallbacks`, in order; the first handler returning a non-nil value ends the dispatch and its values are returned (DCS's `onPlayerTry*` behaviour) |
| `handlers(name)` | the registered handlers for a hook |
| `ownshipFixture()` | a player aircraft; assign it to `state().ownship` to make the ownship/sensor `Export` functions return data |
| `globals` | the names of the installed globals |

Suites that must also run inside DCS (the `_test` package) never touch `guiDoubles`. Offline-only
assertions there can be guarded with `test.skipIf(rawget(_G, "guiDoubles") === undefined)` (the global
is declared only for programs that include `tests/doubles/controller.ts`).

Functions whose contract DCS does not document (the `...arguments_: unknown[]` declarations) and
functions that only drive the UI are recorded in `state().nativeCalls` as `{ name, arguments_ }` and
return nothing.

## Extending the doubles

1. **A new member in a declaration** (`src/DCS.ts`, ...): the doubles stop compiling. Implement the
   member in `namespaces/<namespace>.ts`. Read and write `ctx.state()` (add fields to `GuiState` and
   `createState()` in `state.ts`) so setters and getters stay consistent, or use `ctx.native(name, args)`
   for a function without a documented contract. Return copies (`copy(...)`) of state tables.
2. **A new export** (`npm run export` changed `src/exports/*.export.ts`): `tests/surface.ts` fails and
   names the difference. Add the member to the declaration and the double; new numeric constants go in
   `constants.ts` (`Constants<l_X>` makes the list exhaustive).
3. **A new global namespace**: add its declaration to `src/index.ts`, a `namespaces/<name>.ts` double,
   a field in `DeclaredGlobals` and an `install(...)` call in `index.ts`, the namespace to
   `tests/surface.ts` if the export generator covers it, and a `checkCalls` block in
   `tests/call-shapes.ts`.
4. **A callback-taking function**: call the callback through a `this: void` cast
   (`visitor as unknown as AnyFunction`), never through the declared type, so the tests catch a
   declaration that would give TypeScript callbacks a `self` parameter.
5. **New fixture data**: extend `createState()` / `fixtures.ts`. Keep values deterministic and document
   anything that deliberately differs from DCS in the file's comments.

Run `npm test --workspace=@flying-dice/tslua-dcs-gui-types` (declaration and double suites) and
`npm test --workspace=@flying-dice/tslua-dcs-gui-types-test` (example suites) after any change.
