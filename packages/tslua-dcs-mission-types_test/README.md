# tslua-dcs-mission-types_test

Private package that tests `@flying-dice/tslua-dcs-mission-types`. It has three parts:

| Path | What it is | Where it runs |
| --- | --- | --- |
| `src/*_test.ts` | TypeScript examples of the mission API (luatest suites) | inside DCS (`npm run test:dcs`) **and** offline on lua51 |
| `doubles/` | test doubles of the DCS mission scripting environment | installed with `lua51 --preload` |
| `tests/` | offline-only suites: call shapes of every declared function, callback contracts, the doubles themselves | offline on lua51 |

```shell
npm run build --workspace=@flying-dice/tslua-dcs-mission-types   # the declarations the suites compile against
npm test --workspace=@flying-dice/tslua-dcs-mission-types-test     # = npm run test:lua
```

`test:lua` builds `.test/mission-tests.lua` (entry `src/index.ts`, the exact bundle DCS runs),
`dist/dcs-mission-doubles.lua` (entry `doubles/index.ts`) and `.test/tests.lua` (entry `tests/index.ts`),
then runs

```shell
lua51 --preload dist/dcs-mission-doubles.lua .test/mission-tests.lua
lua51 --preload dist/dcs-mission-doubles.lua .test/tests.lua
```

`npm run test:dcs` is unchanged: it builds `.test/mission-tests.lua` and evaluates it in a running mission
through the DCS Studio mission bridge (`scripts/run.ts`). Both paths use luatest's deferred mode:
`src/setup.ts` calls `configure({ autoRun: false })` before any suite is imported and `src/index.ts` ends
with `run()`, which throws when a test failed (non-zero exit on lua51, a failed `pcall` in DCS).

## The doubles

`doubles/index.ts` installs the globals of the mission environment: `env`, `timer`, `trigger`, `world`,
`coalition`, `coord`, `land`, `atmosphere`, `AI`, `radio`, `missionCommands`, `net`, the classes `Object`,
`Unit`, `Group`, `StaticObject`, `Airbase`, `Weapon`, `Controller`, `Warehouse`, and `_APP_VERSION` /
`_ARCHITECTURE`. They simulate a small, deterministic Caucasus world (`doubles/state.ts`, `resetState`):

- airbases Batumi and Kobuleti (blue, Georgia) and Senaki-Kolkhi (red), each with a warehouse;
- groups `Enfield-1` (two blue F-16C, `Enfield-1-1` flown by player "Maverick"), `Uzi-1` (a blue truck at
  Batumi) and `Red Armor` (two red Leopard-2);
- statics `Blue Hangar`, the cargo `Ammo Crate` and `Red Depot`; the trigger zone `Batumi Zone`; a
  bullseye per side; net players 1 (server) and 2 (Maverick);
- model time 0 (mission start 43200), a flat projection for `coord`, gentle terrain with sea at
  x <= -360000 and a 1 km road grid for `land`, the standard atmosphere for `atmosphere`.

Objects behave like DCS objects: instances are `{ id_ = n }` tables whose metatable is the class table,
lookups return the same instance for the same object (`Group.getByName(name) === group`), subclasses
inherit `Object`'s members, and methods on a destroyed object raise an error while `isExist()` returns
false. Calls with side effects are stored: flags, marks, messages, F10 menus, scheduled functions, event
handlers, warehouse stock, controller tasks and options.

### Call-shape guards

DCS calls namespace functions with a dot and object methods with a colon; a wrong `@noSelf` in the
declarations makes TypeScriptToLua emit the other form and silently shifts every argument. The doubles
turn that into an error:

- a namespace function called with `:` fails with `world.weather.getFogThickness was called with ':' ...`;
- an instance method called with `.` (or on an object of another class) fails with
  `Unit.getName is an instance method: call it as object:getName(...) ...`;
- a static function called with `:` fails with `Unit.getByName is static and must be called with '.' ...`.

So every call that goes through the doubles also checks the declaration's call shape. `tests/coverage.ts`
runs last and fails unless every function of the doubles was called at least once by the suites.

### They cannot drift from the declarations

Each double is an object literal checked with `satisfies Double<l_X>` (`doubles/runtime.ts`), where
`Double<T>` is the declared interface minus engine internals (`parentClass_`, `database_`, `tonumber`) and
mission-specific data dumps (`env.mission`, `env.warehouses`, `world.eventHandlers`,
`world.persistenceHandlers`). Since the declarations extend the interfaces generated from DCS
(`src/exports/*.export.ts`), a function added to the declarations or to the DCS export, or a changed return
type, breaks `npm run build:doubles` until the double follows; excess-property checks reject members that
are not declared. Enumeration tables (`coalition.side`, `world.event`, `AI.Option`, ...) are complete; their
values follow the Hoggit wiki where documented and are otherwise distinct fixture values (see
`doubles/constants.ts`), so tests should use the names, not the numbers.

### Control API: `dcsDoubles`

Tests drive and inspect the world through the global `dcsDoubles` (typed by `doubles/control.ts`):

```ts
import type { DcsDoubles } from "../doubles/control";
const doubles = (_G as unknown as { dcsDoubles: DcsDoubles }).dcsDoubles;

beforeEach(() => doubles.reset());           // fresh fixture world, time 0, empty logs

test("reports the time", () => {
	startReporter();                          // code under test: timer.scheduleFunction(...)
	doubles.advanceTime(60);                 // runs due scheduled functions in time order
	expect(doubles.messages()[0].text).toBe("T+60");
});
```

| Function | Purpose |
| --- | --- |
| `reset()` | rebuild the fixture world |
| `advanceTime(seconds)`, `setPaused(paused)` | drive `timer` (callbacks get `(argument, time)`; a returned number reschedules, errors are logged and re-raised) |
| `dispatchEvent(event)` | call `handler:onEvent(event)` on every `world.addEventHandler` handler |
| `selectMenuCommand(path, scope?)`, `menu()` | select an F10 command (`scope`: `"all"`, `"coalition:<id>"`, `"group:<id>"`) and list the menu |
| `launchWeapon({ typeName, launcher, target? })` | create a `Weapon` in flight and dispatch `S_EVENT_SHOT` |
| `setLife(unit, life)` | damage a unit (`isDead`, `isBroken`, ...) |
| `log()`, `messages()`, `marks()`, `effects()`, `chat()` | what the code under test logged, showed, drew or triggered |
| `setPersistenceData(name, value)` | data returned by `world.getPersistenceData` |
| `setLogEcho(enabled)` | also print log lines to stdout |
| `surface()`, `calls(path)`, `resetCalls()` | the function paths the doubles implement and how often each was called |

Spies work on the doubles as on any table: `spyOn(trigger.action, "outText")` records dot calls as
`(text, seconds)`, and `spyOn(_G.Unit, "getName")` records colon calls with the receiver first.

### Using them from another package

`packages/tslua-dcs-testapp` shows how: build the doubles into your own output directory and preload them.

```shell
tstl -p ../tslua-dcs-mission-types_test/tsconfig.doubles.json --outDir ../<your-package>/.test
lua51 --preload .test/dcs-mission-doubles.lua .test/tests.lua
```

## Extending the doubles

1. **A function was added to the declarations or to the DCS export** — `npm run build:doubles` fails with
   the missing property. Implement it in the matching file (`environment.ts` for `env`/`timer`,
   `trigger.ts`, `world.ts` for `world`/`coalition`, `geo.ts` for `coord`/`land`/`atmosphere`,
   `comms.ts` for `missionCommands`/`net`, `objects.ts` for the classes). Namespace functions are arrow
   functions (no `self`); instance methods are method shorthand or `function (this: unknown)` helpers that
   read the object's record with `objectRecord(this)`; static class functions are arrow functions **and**
   must be listed in `statics` of `defineClass`.
2. **Call it from `tests/`** so the call-shape coverage test passes, asserting on the result or with a
   spy on the argument order.
3. **New fixture data** goes in `resetState()` (`state.ts`) and type descriptors in `fixtures.ts`. Keep it
   deterministic: no randomness, no wall-clock time. Add names tests rely on to `fixtureNames`.
4. **New control functions** go in `DcsDoubles` (`control.ts`, `@noSelf`) and `index.ts`. Doubles
   internals must not call the wrapped globals (it would count as a checked call); use the state helpers.
