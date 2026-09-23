# @flying-dice/tslua-luatest

A Jest-style test framework for [TypeScriptToLua](https://typescripttolua.github.io/), written for Lua 5.1. It
runs on the repository's `lua51` interpreter and inside DCS World (mission and GUI environments), and it
never requires `os`, `io` or `debug`: it uses them only when they exist.

- `describe` / `test` / `it` with nesting, `skip`, `only`, `todo` and `skipIf`
- `beforeAll` / `afterAll` / `beforeEach` / `afterEach`, scoped to their `describe`
- `expect(value)` with 30+ matchers and `.not`, deep equality with the path to the first difference
- binary-safe failure messages: escaped strings, the first differing byte, hex dumps, depth-limited tables
- mocks and spies: `fn()`, `spyOn(object, key)`, `toHaveBeenCalledWith` and friends
- a report of every test (OK / FAIL / SKIP / TODO), the failed tests and totals, and a non-zero exit status
  when anything failed

```shell
npm install --save-dev @flying-dice/tslua-luatest
```

## Contents

- [Quick start](#quick-start)
- [How a run ends: auto-run and deferred mode](#how-a-run-ends-auto-run-and-deferred-mode)
- [Declaring tests](#declaring-tests)
- [Hooks](#hooks)
- [Matchers](#matchers)
- [Mocks and spies](#mocks-and-spies)
- [DCS test doubles with `lua51 --preload`](#dcs-test-doubles-with-lua51---preload)
- [Runners, output and results](#runners-output-and-results)
- [Utilities](#utilities)
- [Lua semantics to keep in mind](#lua-semantics-to-keep-in-mind)
- [Calling luatest from plain Lua (`@noSelf`)](#calling-luatest-from-plain-lua-noself)

## Quick start

A package tests itself by bundling `tests/index.ts` into one Lua file and running it on `lua51`.

`tests/setup.ts` switches to deferred mode. It must be imported before any test file:

```ts
import { configure } from "@flying-dice/tslua-luatest";

configure({ autoRun: false });
```

`tests/index.ts` is the entry file:

```ts
import "./setup"; // must stay first
import "./decode";
import "./encode";
import { run } from "@flying-dice/tslua-luatest";

run(); // runs every test, prints the report, throws (exit status 1) when anything failed
```

`tests/decode.ts`:

```ts
import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { decode } from "../src";

describe("decode", () => {
	test("objects become tables", () => {
		expect(decode('{"a":[1,2]}')).toEqual({ a: [1, 2] });
	});

	test("rejects trailing commas", () => {
		expect(() => decode("[1,]")).toThrow("unexpected ']'");
	});
});
```

`tsconfig.tstl-tests.json`:

```json
{
	"extends": ["./tsconfig.tstl.json"],
	"include": ["src/**/*", "tests/**/*"],
	"compilerOptions": { "outDir": ".test", "declaration": false, "rootDir": "." },
	"tstl": { "luaBundleEntry": "tests/index.ts", "luaBundle": "tests.lua" }
}
```

`package.json` scripts (and add `/packages/<name>/.test/` to the root `.gitignore`):

```json
{
	"test": "npm run test:lua",
	"test:lua": "tstl -p tsconfig.tstl-tests.json && lua51 ./.test/tests.lua"
}
```

Output:

```text
Test Suite: decode
[OK] - decode > objects become tables
[FAIL] - decode > rejects trailing commas
    expect(received).toThrow("unexpected ']'")
    Thrown message does not contain "unexpected ']'"
    Thrown message: "expected a value at byte 4"

Failed tests:
  - decode > rejects trailing commas
Tests: 1 failed, 1 passed, 0 skipped, 2 total
lua51: runtime error: luatest: 1 of 2 tests failed
```

## How a run ends: auto-run and deferred mode

Lua has no "end of script" hook that can change the exit status, so luatest has two modes. In both, a
failing test makes the script fail; they differ in when tests execute.

| | auto-run (default) | deferred (`configure({ autoRun: false })`) |
| --- | --- | --- |
| When tests run | each top-level `describe`/`test` runs as soon as its declaration is complete | nothing runs until `run()` |
| On failure | the failing top-level block throws `luatest: N of M tests failed in "<name>"` after running all of its tests; later blocks do not run | every test runs; `run()` then throws `luatest: N of M tests failed` |
| `run()` needed | no (optional: prints totals, throws on failure) | yes |
| `test.only` / `describe.only` | refused with an error (tests declared earlier would already have run) | supported |
| Top-level `beforeAll` / `afterAll` | refused with an error (declare them inside a `describe`) | supported (run once around the whole run) |

**Auto-run is the default, for backward compatibility.** Scripts written for earlier versions call only
`describe`/`test`/`expect` and never an end-of-run function. They still fail with an uncaught error as soon
as a top-level block contains a failing test, so a failure never turns into a silent pass. Hooks declared
anywhere inside a `describe` apply to all of its tests, because a block runs only once its body has finished.

**New test suites should use deferred mode.** Import a setup module that calls `configure({ autoRun: false })`
first, and call `run()` at the end of the entry file (see [Quick start](#quick-start)). `configure({ autoRun })`
throws if a test has already been declared. As a safety net, when a `lua51` process ends with declared tests
that never ran (because `run()` is missing, or the script stopped before reaching it), luatest prints
`luatest: tests were declared but never run` and exits with status 1.

### `run(options?): Summary`

Executes every pending test, prints the list of failed tests and the totals, and returns a summary:

```ts
interface Summary {
	passed: number;
	failed: number;
	skipped: number; // skipped + todo
	total: number;
	success: boolean;
	results: TestResult[]; // { name, status: "pass" | "fail" | "skip" | "todo", errors: string[] }
	failures: TestResult[];
}
```

It throws `luatest: N of M tests failed` when anything failed, and `luatest: no tests were run` when no test
executed: an empty run, or one where every test was skipped, `todo`, or filtered out by `.only`. An uncaught error makes `lua51` exit with status 1, and makes a DCS `pcall`-based runner report
failure. Options:

- `throwOnFailure: false` returns the summary instead of throwing (e.g. to send results elsewhere in DCS).
- `passWithNoTests: true` lets a run that executed no tests (empty, or all skipped/todo/filtered) pass.

Calling `run()` again later runs only tests declared since. The summary always covers everything the runner
has executed.

## Declaring tests

```ts
describe(name, body)            // group; nests; full names are joined with " > "
describe.skip(name, body)       // every test inside is reported as skipped
describe.only(name, body)       // deferred mode: run only focused groups/tests
describe.skipIf(condition)(name, body)

test(name, body)                // also available as it(name, body)
test.skip(name, body?)
test.only(name, body)           // deferred mode only
test.todo(name)                 // reported as TODO, counted as skipped
test.skipIf(condition)(name, body)
```

- A test passes when its body returns and fails when it raises any error: an assertion, `error(...)`,
  `throw new Error(...)`, or a runtime error such as indexing `nil`.
- Failures never stop the run: the next test runs.
- When any `.only` exists, only tests that are `.only` or inside a `describe.only` run. The rest are reported
  as skipped, and the report ends with a note that `.only` was used. `skip` wins over `only`.
- `skipIf` uses Lua truthiness: `0` and `""` skip.
- A `describe` body that throws is reported as a failing test named `<describe> > (describe body)`. Tests it
  declared before the error still run.
- Declaring a test, describe or hook while a test or hook is running is an error, reported as that test's
  failure.

## Hooks

```ts
describe("database", () => {
	let db: Db;
	beforeAll(() => {
		db = openDb();
	});
	afterAll(() => db.close());
	beforeEach(() => db.begin());
	afterEach(() => db.rollback());

	test("inserts", () => {
		// ...
	});
});
```

- Hooks belong to the enclosing `describe` and apply to every test in it, including nested describes.
- Order for each test: `beforeEach` from the outermost describe inwards, the test, then `afterEach` from the
  innermost describe outwards. `beforeAll` runs before the first test of its describe and `afterAll` after the
  last; neither runs when every test in the describe is skipped.
- A failing `beforeEach` fails the test without running its body. `afterEach` hooks still run, and their
  errors are added to the test's errors.
- A failing `beforeAll` fails every test of its describe without running them. `afterAll` still runs.
- A failing `afterAll` is reported as a separate failed result named `<describe> (afterAll)`.
- Top-level hooks apply to every test. In auto-run mode only top-level `beforeEach`/`afterEach` are allowed,
  and they apply to blocks declared after them.

## Matchers

`expect(value, label?)` returns the matchers below, and `expect(value).not` negates any of them. The optional
`label` is printed as the first line of the failure message, which helps inside loops:
``expect(decode(input), `case ${name}`).toEqual(expected)``.

A failed assertion throws an `Error` whose `name` is `"AssertionError"` and whose message starts with the
matcher, e.g. `expect(received).not.toBe(expected)`, followed by details. Using a matcher on the wrong kind
of value (for example `toBeGreaterThan` on a string) fails with `Matcher error: ...`, negated or not.

### Equality

| Matcher | Passes when |
| --- | --- |
| `toBe(expected)` | `rawequal(received, expected)`; `nan` is `nan`. Tables must be the same table (the message suggests `toEqual` when they are merely equal). |
| `toEqual(expected)` | Deep equality, see below. |
| `toStrictEqual(expected)` | `toEqual`, and every pair of compared tables has the same metatable, so a class instance never equals a plain table or an instance of another class. |

`toEqual` compares tables key by key with `rawget` (metamethods and metatables are ignored), in sorted key
order, and reports the first difference with its path:

```text
expect(received).toEqual(expected)
First difference at received.list[3]: values differ
  expected: 4
  received: 3
Expected: { list = { 1, 2, 4 }, name = "x" }
Received: { list = { 1, 2, 3 }, name = "x" }
```

Paths use Lua keys: TypeScript's `list[2]` is `list[3]` in Lua. Reasons are `values differ`,
`missing key`, `unexpected key`, `expected a <type>, received a <type>`, `metatables (classes) differ`
(`toStrictEqual`) and `does not match <asymmetric matcher>`. Cycles are safe (a pair of tables already being
compared is assumed equal), table keys compare by identity, and `nan` equals `nan`.

Asymmetric matchers can be used anywhere inside the expected value of `toEqual`, `toStrictEqual`,
`toContainEqual`, `toHaveProperty`, `toHaveReturnedWith` and the `toHaveBeenCalled*With` matchers:

| Matcher | Matches |
| --- | --- |
| `anything()` | any value except `nil` |
| `any("string")` | by Lua type name: `"string"`, `"number"`, `"boolean"`, `"table"`, `"function"`, `"userdata"`, `"thread"` |
| `any(SomeClass)` | instances of a TypeScriptToLua class (subclasses included) |
| `stringContaining(text)` | strings containing `text` (plain) |
| `stringMatching(pattern)` | strings matching a Lua pattern |
| `objectContaining(subset)` | tables having at least the keys of `subset`, each deeply equal |
| `asymmetric(description, predicate)` | your own predicate |

```ts
expect(unit).toEqual({ id: any("number"), name: stringMatching("^Enfield"), pos: anything() });
```

### nil, truthiness and types

| Matcher | Passes when |
| --- | --- |
| `toBeUndefined()`, `toBeNil()`, `toBeNull()` | the value is `nil` (`undefined` and `null` are both `nil`) |
| `toBeDefined()` | the value is not `nil` (`false` is defined) |
| `toBeTruthy()` / `toBeFalsy()` | **Lua truthiness**: only `nil` and `false` are falsy; `0`, `""` and `{}` are truthy |
| `toBeNaN()` | the value is the number `nan` |
| `toBeTypeOf(luaType)` | `type(value) === luaType`, using Lua type names (`"nil"`, `"table"`, ...) |
| `toBeInstanceOf(Class)` | `value instanceof Class` for TypeScriptToLua classes (subclasses included) |

### Numbers

| Matcher | Passes when |
| --- | --- |
| `toBeGreaterThan(n)`, `toBeGreaterThanOrEqual(n)` | `>` / `>=` |
| `toBeLessThan(n)`, `toBeLessThanOrEqual(n)` | `<` / `<=` |
| `toBeCloseTo(n, digits = 2)` | `math.abs(received - n) < 10 ^ -digits / 2` (`inf` is close to `inf`) |

Numbers print with enough digits to tell them apart: `0.1 + 0.2` prints as `0.30000000000000004`.

### Strings and collections

| Matcher | Passes when |
| --- | --- |
| `toContain(item)` | a string contains the substring `item` (plain text), or a table has a value that is `rawequal` to `item` |
| `toContainEqual(item)` | a table has a value that `toEqual`s `item` |
| `toHaveLength(n)` | `#value === n` for strings (bytes) and tables (TypeScriptToLua arrays) |
| `toMatch(pattern, { plain }?)` | `string.find(value, pattern)` finds a match; `{ plain: true }` treats `pattern` as plain text. An invalid pattern is a matcher error. |
| `toHaveProperty(path, value?)` | the value at `path` is not `nil` and, when `value` is given, `toEqual`s it |

`toHaveProperty` accepts a dotted string (`"a.b.c"`; a segment not found as a string key is retried as a
number, so `"list.1"` reaches the first array element) or an array of raw Lua keys (`["list", 1]`, or keys
containing dots). Values are read with normal indexing, so methods inherited from a class are found.

### Errors: `toThrow(expected?)`

`expect(fn).toThrow(...)` calls `fn` (a function or a mock) and inspects the raised error. The message is
`error.message` for thrown `Error`s (any table with a string `message`), the string itself for
`error("...")` (including the `chunk:line: ` prefix Lua adds), and a formatted value otherwise.

| Call | Passes when the function raises an error and ... |
| --- | --- |
| `toThrow()` | (any error) |
| `toThrow("text")` | the message **contains** `text` (plain substring, as in Jest) |
| `toThrow({ exact: "text" })` | the message equals `text`, with or without Lua's `chunk:line: ` prefix |
| `toThrow({ includes: "text" })` | the message contains `text` |
| `toThrow({ pattern: "^bad %d+" })` | the message matches the Lua pattern |

Fields of the object form can be combined, and all must hold. `.not.toThrow()` passes when nothing is
raised; `.not.toThrow("text")` passes when nothing is raised or the message does not contain `text`. Earlier
versions compared `toThrow(message)` exactly; every exact match is still a match.

### Mock matchers

| Matcher | Passes when |
| --- | --- |
| `toHaveBeenCalled()` | the mock was called |
| `toHaveBeenCalledTimes(n)` | it was called exactly `n` times |
| `toHaveBeenCalledWith(...args)` | some call's arguments `toEqual` `args` (trailing `nil`s are ignored) |
| `toHaveBeenLastCalledWith(...args)` | the last call's arguments `toEqual` `args` |
| `toHaveBeenNthCalledWith(n, ...args)` | the `n`th call (1-based) matched |
| `toHaveReturnedWith(value)` | some call returned a first value that `toEqual`s `value` |

Failure messages list the recorded calls: `Received 2 calls:`, `1: ("a", 1)`, `2: ("b", nil)`.

### Failure previews

- Strings are quoted and escaped byte by byte: printable ASCII as-is, `\n`, `\t`, `\r`, `\"`, `\\`, and every
  other byte (NUL, controls, bytes >= 0x80) as a three-digit decimal escape such as `\000` or `\255`. Strings
  longer than 120 bytes are truncated and show their length.
- When two strings differ, the message gives the first differing byte (1-based), both lengths, and a window of
  each string around the difference, with a hex dump when the window contains non-printable bytes:

  ```text
  strings differ at byte 4 (expected 4 bytes, received 4 bytes)
    expected bytes 1..4: "ab\000d"
        hex: 61 62 00 64
    received bytes 1..4: "ab\000c"
        hex: 61 62 00 63
  ```

- Tables print as Lua table constructors with sorted keys, 3 levels deep and 20 entries wide
  (`{...}` and `... (N more)` beyond that). Cycles print as `<cycle>`, class instances with their class name
  (`Dog { name = "rex" }`), and `nan`/`inf` as `nan`/`inf`.

## Mocks and spies

### `fn(implementation?): Mock`

Creates a callable mock that records every call. Without an implementation it returns `nil`.

```ts
const outText = fn<(text: string, seconds: number) => void>();
outText("hello", 10);
expect(outText).toHaveBeenCalledWith("hello", 10);
expect(outText.mock.calls[0][0]).toBe("hello");
```

| Member | Description |
| --- | --- |
| `mock.calls` | arguments of every call (arrays with `n`, the Lua argument count including trailing `nil`s) |
| `mock.results` | `{ type: "return" \| "throw", value }` per call (`value` is the first return value or the error) |
| `mock.lastCall` | arguments of the latest call |
| `mockReturnValue(v)` / `mockReturnValueOnce(v)` | return `v` |
| `mockImplementation(f)` / `mockImplementationOnce(f)` | run `f` (all its return values pass through) |

`mockReturnValueOnce` and `mockImplementationOnce` share one queue, consumed one entry per call in the order
they were registered, however the two are interleaved. Once it is empty, `mockReturnValue` (if set) wins over
`mockImplementation`, as in Jest.
| `mockClear()` | forget calls and results |
| `mockReset()` | also forget implementations and return values |
| `mockRestore()` | for `spyOn`, put the original back; for `fn`, same as `mockReset` |
| `mockName(name)` / `getMockName()` | the name shown in failure messages |

Whichever of `mockReturnValue` and `mockImplementation` was configured last wins. Errors raised by the
implementation are recorded and re-raised unchanged.

Mocks are tables with a `__call` metamethod, so `type(mock)` is `"table"`. They work with direct calls and
`pcall`; where code insists on a real function, pass `(...args) => mock(...args)`. `isMock(value)` tells
them apart.

### `spyOn(object, key): Mock`

Replaces `object[key]` (an own function or one inherited through a metatable, such as a class method) with a
mock that **calls through to the original** until you change its behaviour. `mockRestore()` puts the
original back, and `restoreAllMocks()` restores every active spy (use it in `afterEach`).

```ts
afterEach(() => restoreAllMocks());

test("announces the unit", () => {
	const outText = spyOn(trigger.action, "outText");
	announce("Enfield11");
	expect(outText).toHaveBeenCalledWith("Enfield11 is airborne", 10);
});
```

Arguments are recorded exactly as Lua passes them. A dot call such as `trigger.action.outText(text, 10)`
records `(text, 10)`, while a colon call such as `unit:getName()` (TypeScriptToLua class methods, DCS
objects) records the receiver first: use `toHaveBeenCalledWith(unit)` or
`toHaveBeenCalledWith(anything(), ...)`.

## DCS test doubles with `lua51 --preload`

`lua51 --preload <file>` runs a Lua file in the same state before the test bundle. That is the place to
install doubles of the DCS globals (`env`, `timer`, `trigger`, `world`, `coalition`, ...) that the code under
test calls:

```lua
-- tests/dcs-doubles.lua
trigger = { action = { outText = function(text, seconds) end } }
timer = { getTime = function() return 42 end }
env = { info = function(message) end }
```

```json
"test:lua": "tstl -p tsconfig.tstl-tests.json && lua51 --preload tests/dcs-doubles.lua ./.test/tests.lua"
```

Tests then spy on the doubles and control them per test:

```ts
describe("announce", () => {
	afterEach(() => restoreAllMocks());

	test("uses the mission time", () => {
		spyOn(timer, "getTime").mockReturnValue(7);
		const outText = spyOn(trigger.action, "outText");
		announce("Uzi");
		expect(outText).toHaveBeenLastCalledWith("Uzi at 7", 10);
	});
});
```

The same bundle can also run inside DCS (for example through the DCS Studio bridge). Reporting uses `print`,
falling back to `env.info`, and a failing run raises an error that the calling `pcall` sees. The
`tslua-dcs-*-types_test` packages run their suites this way.

## Runners, output and results

The module-level functions use a default runner. `createRunner(options?)` makes an independent one with its
own tests, hooks, mode and output, which is useful to run a suite programmatically or to test luatest
itself:

```ts
const lines: string[] = [];
const runner = createRunner({ output: (line) => lines.push(line) }); // deferred by default
runner.describe("suite", () => runner.test("works", () => {}));
const summary = runner.run({ throwOnFailure: false });
```

| API | Description |
| --- | --- |
| `createRunner({ autoRun?, output? }): Runner` | `autoRun` defaults to `false` here; `output` defaults to `print` (else `env.info`, else nothing) |
| `runner.describe`, `.test`, `.it`, `.beforeAll`, `.afterAll`, `.beforeEach`, `.afterEach`, `.run` | as the module-level functions |
| `runner.configure({ autoRun?, output? })` / `configure(...)` | change the mode (before any declaration) or the output |
| `runner.results()` / `results()` | results recorded so far |
| `runner.hasPending()` | whether declared tests are waiting for `run()` |

Report lines: `Test Suite: <describe>`, `[OK] - <name>`, `[FAIL] - <name>` followed by the indented failure
messages, `[SKIP] - <name>`, `[TODO] - <name>`, and from `run()` the `Failed tests:` list and
`Tests: F failed, P passed, S skipped, T total`.

## Utilities

| Export | Description |
| --- | --- |
| `fail(message?)` | raise an assertion failure |
| `isAssertionError(error)` | whether an error came from a failed assertion |
| `errorMessage(error)` | the message of any thrown value (as used by `toThrow`) |
| `stripPosition(message)` | remove Lua's `chunk:line: ` prefix |
| `formatValue(value, { maxDepth?, maxItems?, maxString? })` | the pretty-printer used in failure messages |
| `escapeString(text)` | binary-safe escaping of a string's bytes |
| `firstDifference(a, b)` | 1-based index of the first differing byte, or `undefined` |
| `describeStringDifference(expected, received)` | the "strings differ at byte ..." block |
| `deepDiff(received, expected, strict?)` / `deepEqual(...)` | the comparison behind `toEqual` (returns `{ path, expected, received, reason }`) |
| `isInstanceOf(value, Class)` | `instanceof` that is safe for non-tables |

## Lua semantics to keep in mind

- `undefined` and `null` are both `nil`. A table cannot hold `nil`, so `{ a: undefined }` equals `{}`.
- Only `nil` and `false` are falsy: `expect(0).toBeTruthy()` passes.
- Arrays are 1-based in Lua. Paths in messages (`received.list[3]`), `toHaveProperty` array paths and
  `mock.calls[i].n` use Lua keys, while TypeScript indexing (`mock.calls[0]`) is translated as usual.
- Strings are byte strings: lengths and offsets count bytes, not characters.

## Calling luatest from plain Lua (`@noSelf`)

Every source file is compiled with `/** @noSelfInFile */` and every interface is `@noSelf`, so no function
takes a hidden `self` argument. Plain Lua and DCS scripts call it with dots, and callbacks are ordinary
functions:

```lua
local luatest = require("index") -- dist/index.lua, with dist/ on package.path
luatest.configure({ autoRun = false })

luatest.describe("plain Lua", function()
	luatest.it("works", function()
		luatest.expect({ 1, 2 }).toEqual({ 1, 2 })
	end)
end)

luatest.run()
```

TypeScriptToLua consumers see the same declarations (the `.d.ts` files keep the annotations), so the arrow
functions they pass to `describe`/`test` compile without `self`. A function declared with a `this` context
(for example a class method) cannot be passed directly as a test body; wrap it in an arrow function.
