/** @noSelfInFile */

/**
 * luatest: a Jest-style test framework for TypeScriptToLua, running on Lua 5.1 (the `lua51` CLI
 * in this repository) and inside DCS World.
 *
 * The module-level functions below belong to a default runner that starts in auto-run mode
 * (backward compatible: each top-level `describe`/`test` runs as soon as it is declared and throws
 * when a test in it failed). Call `configure({ autoRun: false })` before any test is declared and
 * `run()` at the end of the entry file to collect every result first. See README.md.
 */

import {
	createRunner,
	type DescribeFunction,
	globals,
	type RunnerOptions,
	type RunOptions,
	type Summary,
	type TestFunction,
	type TestFunctionWithModifiers,
	type TestResult,
} from "./runner";

export {
	type AsymmetricMatcher,
	any,
	anything,
	asymmetric,
	type Difference,
	deepDiff,
	deepEqual,
	isAsymmetric,
	isInstanceOf,
	objectContaining,
	stringContaining,
	stringMatching,
} from "./equality";
export {
	ASSERTION_ERROR,
	errorMessage,
	expect,
	fail,
	isAssertionError,
	type Matchers,
	type MatchOptions,
	stripPosition,
	type ThrowExpectation,
} from "./expect";
export {
	describeStringDifference,
	escapeString,
	type FormatOptions,
	firstDifference,
	formatValue,
} from "./format";
export {
	type AnyFunction,
	type CallArgs,
	fn,
	isMock,
	type Mock,
	type MockInstance,
	type MockResult,
	type MockState,
	restoreAllMocks,
	spyOn,
} from "./mock";
export {
	createRunner,
	type DescribeFunction,
	type Runner,
	type RunnerOptions,
	type RunOptions,
	type Summary,
	type TestFunction,
	type TestFunctionWithModifiers,
	type TestResult,
	type TestStatus,
} from "./runner";

const defaultRunner = createRunner({ autoRun: true });

/** Groups tests; see {@link DescribeFunction}. Also `describe.skip`, `describe.only`, `describe.skipIf`. */
export const describe: DescribeFunction = defaultRunner.describe;
/** Declares a test; see {@link TestFunctionWithModifiers}. Also `test.skip`, `.only`, `.todo`, `.skipIf`. */
export const test: TestFunctionWithModifiers = defaultRunner.test;
/** Alias of {@link test}. */
export const it: TestFunctionWithModifiers = defaultRunner.test;

/** Runs once before the first test of the enclosing describe (top level: deferred mode only). */
export function beforeAll(hook: TestFunction): void {
	defaultRunner.beforeAll(hook);
}
/** Runs once after the last test of the enclosing describe (top level: deferred mode only). */
export function afterAll(hook: TestFunction): void {
	defaultRunner.afterAll(hook);
}
/** Runs before every test of the enclosing describe (and nested describes), outermost first. */
export function beforeEach(hook: TestFunction): void {
	defaultRunner.beforeEach(hook);
}
/** Runs after every test of the enclosing describe (and nested describes), innermost first. */
export function afterEach(hook: TestFunction): void {
	defaultRunner.afterEach(hook);
}

/**
 * Configures the default runner. `autoRun: false` switches to deferred mode and must be called
 * before any test is declared (put it in a setup module imported first by the entry file).
 */
export function configure(options: RunnerOptions): void {
	defaultRunner.configure(options);
}

/**
 * Ends a test run: executes every pending test (deferred mode), prints the failed tests and the
 * totals, and returns the {@link Summary}. Throws `luatest: N of M tests failed` when anything
 * failed, and `luatest: no tests were run` when nothing ran, unless disabled in `options`; an
 * uncaught error makes `lua51` exit with status 1.
 */
export function run(options?: RunOptions): Summary {
	return defaultRunner.run(options);
}

/** Results recorded by the default runner so far. */
export function results(): TestResult[] {
	return defaultRunner.results();
}

// Safety net for deferred mode: a script that declares tests but never reaches run() must not
// pass silently. When the Lua state closes (end of a lua51 process) with tests still pending,
// report it and exit with status 1. Best effort: needs Lua 5.1's newproxy; inside DCS the state
// never closes, so nothing happens there.
if (type(globals.newproxy) === "function") {
	const sentinel = (
		globals.newproxy as (this: void, withMetatable: boolean) => unknown
	)(true);
	(getmetatable(sentinel as object) as { __gc?: (this: void) => void }).__gc =
		() => {
			if (!defaultRunner.hasPending()) return;
			const message =
				"luatest: tests were declared but never run; call run() at the end of the test entry file (or the script stopped before reaching it)";
			if (type(globals.print) === "function") globals.print?.(message);
			const exit = type(globals.os) === "table" ? globals.os?.exit : undefined;
			if (type(exit) === "function") exit?.(1);
		};
	// Anchor it on the runner, which the exported functions keep alive until the state closes.
	(defaultRunner as unknown as { sentinel: unknown }).sentinel = sentinel;
}
