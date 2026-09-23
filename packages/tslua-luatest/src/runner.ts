/** @noSelfInFile */

import { errorMessage, isAssertionError } from "./expect";

/** A test or hook body. */
export type TestFunction = () => void;

/** Status of one reported result. */
export type TestStatus = "pass" | "fail" | "skip" | "todo";

/**
 * One reported result: a test, or a failing `beforeAll`/`afterAll` hook.
 * @noSelf
 */
export interface TestResult {
	/** Full name: enclosing describe names and the test name joined with `" > "`. */
	name: string;
	status: TestStatus;
	/** Failure messages (a test can collect several, e.g. from the body and an `afterEach`). */
	errors: string[];
}

/**
 * Totals returned by `run()`.
 * @noSelf
 */
export interface Summary {
	passed: number;
	failed: number;
	/** Skipped plus todo tests. */
	skipped: number;
	total: number;
	/** True when nothing failed. */
	success: boolean;
	/** Every result, in execution order. */
	results: TestResult[];
	/** The failed results only. */
	failures: TestResult[];
}

/**
 * Options for {@link createRunner} and `configure`.
 * @noSelf
 */
export interface RunnerOptions {
	/**
	 * `true` (auto-run): every top-level `describe`/`test` runs as soon as it has been declared, and
	 * throws at its end when any test inside it failed, so scripts that never call `run()` still
	 * fail. `false` (deferred): declarations are only collected; `run()` executes all of them.
	 */
	autoRun?: boolean;
	/** Where report lines go. Defaults to `print`, else `env.info` (DCS), else nowhere. */
	output?: (line: string) => void;
}

/**
 * Options for `run()`.
 * @noSelf
 */
export interface RunOptions {
	/** Throw an error when any test failed (default true), so `lua51` exits non-zero. */
	throwOnFailure?: boolean;
	/** Allow a run in which no test executed (default false: that throws, as it usually means misconfiguration). */
	passWithNoTests?: boolean;
}

/**
 * `describe` and its variants.
 * @noSelf
 */
export interface DescribeFunction {
	/** Groups tests. Hooks declared inside apply to every test in the group (nested groups included). */
	(this: void, name: string, body: TestFunction): void;
	/** Declares the group but skips every test in it. */
	skip: (name: string, body: TestFunction) => void;
	/** Runs only focused groups and tests (deferred mode only; see README). */
	only: (name: string, body: TestFunction) => void;
	/** `describe` when `condition` is falsy, `describe.skip` otherwise. */
	skipIf: (condition: unknown) => (name: string, body: TestFunction) => void;
}

/**
 * `test`/`it` and its variants.
 * @noSelf
 */
export interface TestFunctionWithModifiers {
	/** Declares a test. It passes when `body` returns and fails when it raises any error. */
	(this: void, name: string, body: TestFunction): void;
	/** Declares a test that is reported as skipped and never runs. */
	skip: (name: string, body?: TestFunction) => void;
	/** Runs only focused tests (deferred mode only; see README). */
	only: (name: string, body: TestFunction) => void;
	/** Declares a test still to be written; reported as TODO (counted as skipped). */
	todo: (name: string) => void;
	/** `test` when `condition` is falsy, `test.skip` otherwise. */
	skipIf: (condition: unknown) => (name: string, body: TestFunction) => void;
}

/**
 * A self-contained registry of tests with its own hooks, mode, output and results.
 * @noSelf
 */
export interface Runner {
	describe: DescribeFunction;
	test: TestFunctionWithModifiers;
	/** Alias of `test`. */
	it: TestFunctionWithModifiers;
	/** Runs once before the first test of the enclosing describe (or of the whole run at top level). */
	beforeAll: (hook: TestFunction) => void;
	/** Runs once after the last test of the enclosing describe (or of the whole run at top level). */
	afterAll: (hook: TestFunction) => void;
	/** Runs before every test in the enclosing describe, outermost first. */
	beforeEach: (hook: TestFunction) => void;
	/** Runs after every test in the enclosing describe, innermost first; runs even when the test failed. */
	afterEach: (hook: TestFunction) => void;
	/**
	 * Executes every pending declaration, prints the failure list and totals, and returns the
	 * {@link Summary} of everything this runner executed. Throws when a test failed (or when no test
	 * ran) unless disabled in `options`.
	 */
	run: (options?: RunOptions) => Summary;
	/** Changes the mode or output. Switch to deferred mode before any test is declared. */
	configure: (options: RunnerOptions) => void;
	/** Results recorded so far, in execution order. */
	results: () => TestResult[];
	/** True when declared tests are waiting for `run()` (deferred mode). */
	hasPending: () => boolean;
}

/** @noSelf */
interface TestNode {
	kind: "test";
	name: string;
	body?: TestFunction;
	skip: boolean;
	only: boolean;
	todo: boolean;
}

/** @noSelf */
interface SuiteNode {
	kind: "suite";
	name: string;
	parent?: SuiteNode;
	children: (TestNode | SuiteNode)[];
	beforeAll: TestFunction[];
	afterAll: TestFunction[];
	beforeEach: TestFunction[];
	afterEach: TestFunction[];
	skip: boolean;
	only: boolean;
}

const SEPARATOR = " > ";

function newSuite(name: string, parent?: SuiteNode): SuiteNode {
	return {
		kind: "suite",
		name,
		parent,
		children: [],
		beforeAll: [],
		afterAll: [],
		beforeEach: [],
		afterEach: [],
		skip: false,
		only: false,
	};
}

/** Optional globals luatest uses when present (stock Lua, DCS mission and GUI environments). */
export interface OptionalGlobals {
	print?: (this: void, ...values: unknown[]) => void;
	env?: { info?: (this: void, text: string) => void };
	os?: { exit?: (this: void, code?: number) => void };
	newproxy?: (this: void, withMetatable: boolean) => unknown;
}

/** `_G`, typed with the optional globals luatest may use; each must be checked before use. */
export const globals = _G as unknown as OptionalGlobals;

function defaultOutput(): (line: string) => void {
	// Looked up on every line, so a `print` replaced after loading (DCS runners capture it) is honoured.
	return (line) => {
		const print = globals.print;
		if (type(print) === "function")
			return (print as (this: void, text: string) => void)(line);
		const info = type(globals.env) === "table" ? globals.env?.info : undefined;
		if (type(info) === "function")
			(info as (this: void, text: string) => void)(line);
	};
}

function describeError(error: unknown): string {
	const message = errorMessage(error);
	if (isAssertionError(error)) return message;
	const name =
		type(error) === "table" ? (error as { name?: unknown }).name : undefined;
	return type(name) === "string" && name !== "Error"
		? `${name as string}: ${message}`
		: message;
}

function attempt(body: TestFunction): string | undefined {
	const [ok, error] = pcall(body);
	return ok ? undefined : describeError(error);
}

function indent(text: string): string {
	const [indented] = string.gsub(text, "\n", "\n    ");
	return `    ${indented}`;
}

/**
 * Creates an independent test runner. The module-level `describe`, `test`, `run`, ... functions
 * belong to a default runner in auto-run mode; runners created here default to deferred mode
 * (`autoRun: false`) and write to `print`.
 */
export function createRunner(options: RunnerOptions = {}): Runner {
	let autoRun = options.autoRun ?? false;
	let output = options.output ?? defaultOutput();
	const root = newSuite("");
	let current = root;
	let collecting = 0; // depth of describe bodies being collected
	let running = false;
	let executedTopLevel = false;
	let usedOnly = false;
	const results: TestResult[] = [];

	const emit = (line: string) => output(line);

	const record = (name: string, status: TestStatus, errors: string[]) => {
		const result: TestResult = { name, status, errors };
		results.push(result);
		if (status === "pass") emit(`[OK] - ${name}`);
		else if (status === "skip") emit(`[SKIP] - ${name}`);
		else if (status === "todo") emit(`[TODO] - ${name}`);
		else {
			emit(`[FAIL] - ${name}`);
			for (const error of errors) emit(indent(error));
		}
		return result;
	};

	const guardDeclaration = (what: string) => {
		if (running && collecting === 0) {
			error(
				`luatest: ${what} cannot be called while a test or hook is running`,
				0,
			);
		}
	};

	const requireDeferredForOnly = (what: string) => {
		if (autoRun) {
			error(
				`luatest: ${what} needs deferred mode, otherwise tests declared before it would already have run. Call configure({ autoRun: false }) before declaring tests and run() at the end.`,
				0,
			);
		}
		usedOnly = true;
	};

	// ---------------------------------------------------------------- execution

	const fullName = (suite: SuiteNode, name: string) => {
		const parts: string[] = [name];
		let node: SuiteNode | undefined = suite;
		while (node !== undefined && node.parent !== undefined) {
			table.insert(parts, 1, node.name);
			node = node.parent;
		}
		return parts.join(SEPARATOR);
	};

	const suiteName = (suite: SuiteNode) =>
		suite.parent === undefined
			? "(top level)"
			: fullName(suite.parent as SuiteNode, suite.name);

	/** Decides whether each test runs, given skip/only on it and its ancestors. */
	const shouldRun = (test: TestNode, skipped: boolean, focused: boolean) => {
		if (skipped || test.skip || test.todo || test.body === undefined)
			return false;
		return !usedOnly || focused || test.only;
	};

	const hasRunnable = (
		suite: SuiteNode,
		skipped: boolean,
		focused: boolean,
	): boolean => {
		const skip = skipped || suite.skip;
		const focus = focused || suite.only;
		for (const child of suite.children) {
			if (child.kind === "test") {
				if (shouldRun(child, skip, focus)) return true;
			} else if (hasRunnable(child, skip, focus)) return true;
		}
		return false;
	};

	const reportNotRun = (suite: SuiteNode, error?: string) => {
		for (const child of suite.children) {
			if (child.kind === "suite") reportNotRun(child, error);
			else if (error !== undefined)
				record(fullName(suite, child.name), "fail", [error]);
			else
				record(fullName(suite, child.name), child.todo ? "todo" : "skip", []);
		}
	};

	const runHooks = (hooks: TestFunction[], errors: string[], label: string) => {
		for (const hook of hooks) {
			const error = attempt(hook);
			if (error !== undefined) errors.push(`${label} failed: ${error}`);
		}
	};

	const eachChain = (suite: SuiteNode) => {
		const chain: SuiteNode[] = [];
		let node: SuiteNode | undefined = suite;
		while (node !== undefined) {
			table.insert(chain, 1, node);
			node = node.parent;
		}
		return chain;
	};

	const runTest = (suite: SuiteNode, test: TestNode) => {
		const name = fullName(suite, test.name);
		const errors: string[] = [];
		const chain = eachChain(suite);
		let setupFailed = false;
		for (const node of chain) {
			const before = errors.length;
			runHooks(node.beforeEach, errors, "beforeEach");
			if (errors.length > before) {
				setupFailed = true;
				break;
			}
		}
		if (!setupFailed) {
			const error = attempt(test.body as TestFunction);
			if (error !== undefined) errors.push(error);
		}
		for (let i = chain.length - 1; i >= 0; i--)
			runHooks(chain[i].afterEach, errors, "afterEach");
		record(name, errors.length === 0 ? "pass" : "fail", errors);
	};

	const runSuite = (suite: SuiteNode, skipped: boolean, focused: boolean) => {
		const skip = skipped || suite.skip;
		const focus = focused || suite.only;
		if (suite !== root) emit(`Test Suite: ${suiteName(suite)}`);
		if (!hasRunnable(suite, skipped, focused)) {
			reportNotRun(suite);
			return;
		}
		const setupErrors: string[] = [];
		runHooks(suite.beforeAll, setupErrors, "beforeAll");
		if (setupErrors.length > 0) {
			reportNotRun(suite, setupErrors.join("\n"));
		} else {
			for (const child of suite.children) {
				if (child.kind === "suite") runSuite(child, skip, focus);
				else if (shouldRun(child, skip, focus)) runTest(suite, child);
				else
					record(fullName(suite, child.name), child.todo ? "todo" : "skip", []);
			}
		}
		const teardownErrors: string[] = [];
		runHooks(suite.afterAll, teardownErrors, "afterAll");
		if (teardownErrors.length > 0)
			record(`${suiteName(suite)} (afterAll)`, "fail", teardownErrors);
	};

	/** Auto-run mode: executes one top-level declaration as soon as it is complete. */
	const runImmediately = (node: TestNode | SuiteNode) => {
		const first = results.length;
		running = true;
		const detached = newSuite("");
		// Run the block as a child of a copy of the root that has the root's each-hooks.
		detached.beforeEach = root.beforeEach;
		detached.afterEach = root.afterEach;
		if (node.kind === "suite") node.parent = detached;
		detached.children = [node];
		const [ok, problem] = pcall(() => {
			if (node.kind === "suite") {
				runSuite(node, false, false);
			} else if (shouldRun(node, false, false)) {
				runTest(detached, node);
			} else {
				record(node.name, node.todo ? "todo" : "skip", []);
			}
		});
		running = false;
		executedTopLevel = true;
		// forget the block so run() does not execute it again
		root.children = root.children.filter((child) => child !== node);
		if (!ok) error(problem as string, 0);
		let failed = 0;
		let total = 0;
		for (let i = first; i < results.length; i++) {
			total++;
			if (results[i].status === "fail") failed++;
		}
		if (failed > 0) {
			error(
				`luatest: ${failed} of ${total} test${total === 1 ? "" : "s"} failed in "${node.name}" (auto-run mode stops at the first failing top-level block; see the [FAIL] lines above)`,
				0,
			);
		}
	};

	// ---------------------------------------------------------------- declaration

	const declareSuite = (
		name: string,
		body: TestFunction,
		skip: boolean,
		only: boolean,
	) => {
		guardDeclaration("describe");
		if (type(body) !== "function" && type(body) !== "table") {
			error(`luatest: describe("${name}") needs a function body`, 0);
		}
		const suite = newSuite(name, current);
		suite.skip = skip;
		suite.only = only;
		current.children.push(suite);
		const parent = current;
		current = suite;
		collecting++;
		const [ok, problem] = pcall(body);
		collecting--;
		current = parent;
		if (!ok) {
			// A describe body that throws cannot be trusted: report it as a failed test.
			const message = describeError(problem);
			suite.children.push({
				kind: "test",
				name: "(describe body)",
				body: () => error(`describe body failed: ${message}`, 0),
				skip: false,
				only: true, // still reported when other tests are focused with .only
				todo: false,
			});
		}
		if (autoRun && parent === root) runImmediately(suite);
	};

	const declareTest = (
		name: string,
		body: TestFunction | undefined,
		skip: boolean,
		only: boolean,
		todo: boolean,
	) => {
		guardDeclaration("test");
		if (!skip && !todo && type(body) !== "function" && type(body) !== "table") {
			error(`luatest: test("${name}") needs a function body`, 0);
		}
		const node: TestNode = { kind: "test", name, body, skip, only, todo };
		current.children.push(node);
		if (autoRun && current === root) runImmediately(node);
	};

	const declareHook = (
		list: keyof Pick<
			SuiteNode,
			"beforeAll" | "afterAll" | "beforeEach" | "afterEach"
		>,
		hook: TestFunction,
	) => {
		guardDeclaration(list);
		if (type(hook) !== "function" && type(hook) !== "table")
			error(`luatest: ${list} needs a function`, 0);
		if (
			autoRun &&
			current === root &&
			(list === "beforeAll" || list === "afterAll")
		) {
			error(
				`luatest: a top-level ${list} needs deferred mode (configure({ autoRun: false }) and run()); in auto-run mode declare it inside a describe`,
				0,
			);
		}
		current[list].push(hook);
	};

	const makeCallable = <T>(
		call: (name: string, body: TestFunction) => void,
		fields: object,
	): T =>
		setmetatable(fields, {
			__call: (_self: unknown, name: string, body: TestFunction) =>
				call(name, body),
		} as any) as unknown as T;

	const describe = makeCallable<DescribeFunction>(
		(name, body) => declareSuite(name, body, false, false),
		{
			skip: (name: string, body: TestFunction) =>
				declareSuite(name, body, true, false),
			only: (name: string, body: TestFunction) => {
				requireDeferredForOnly("describe.only");
				declareSuite(name, body, false, true);
			},
			skipIf: (condition: unknown) => (name: string, body: TestFunction) =>
				declareSuite(
					name,
					body,
					condition !== undefined && condition !== false,
					false,
				),
		},
	);

	const test = makeCallable<TestFunctionWithModifiers>(
		(name, body) => declareTest(name, body, false, false, false),
		{
			skip: (name: string, body?: TestFunction) =>
				declareTest(name, body, true, false, false),
			only: (name: string, body: TestFunction) => {
				requireDeferredForOnly("test.only");
				declareTest(name, body, false, true, false);
			},
			todo: (name: string) => declareTest(name, undefined, false, false, true),
			skipIf: (condition: unknown) => (name: string, body: TestFunction) =>
				declareTest(
					name,
					body,
					condition !== undefined && condition !== false,
					false,
					false,
				),
		},
	);

	const summarize = (): Summary => {
		const summary: Summary = {
			passed: 0,
			failed: 0,
			skipped: 0,
			total: 0,
			success: true,
			results,
			failures: [],
		};
		for (const result of results) {
			summary.total++;
			if (result.status === "pass") summary.passed++;
			else if (result.status === "fail") {
				summary.failed++;
				summary.failures.push(result);
			} else summary.skipped++;
		}
		summary.success = summary.failed === 0;
		return summary;
	};

	const run = (runOptions: RunOptions = {}): Summary => {
		if (running) error("luatest: run() cannot be called from inside a test", 2);
		if (root.children.length > 0 || root.beforeAll.length > 0) {
			running = true;
			const [ok, problem] = pcall(() => runSuite(root, false, false));
			running = false;
			root.children = [];
			root.beforeAll = [];
			root.afterAll = [];
			if (!ok) error(problem as string, 0);
		}
		const summary = summarize();
		if (summary.failures.length > 0) {
			emit("");
			emit("Failed tests:");
			for (const failure of summary.failures) emit(`  - ${failure.name}`);
		}
		if (usedOnly)
			emit(
				"Note: .only was used, so tests outside the focused ones were skipped.",
			);
		emit(
			`Tests: ${summary.failed} failed, ${summary.passed} passed, ${summary.skipped} skipped, ${summary.total} total`,
		);
		if (runOptions.throwOnFailure !== false) {
			if (!summary.success) {
				error(
					`luatest: ${summary.failed} of ${summary.total} test${summary.total === 1 ? "" : "s"} failed`,
					0,
				);
			}
			// Skipped, todo and .only-filtered tests are reported but not executed:
			// a run that executed none of its tests is as suspect as an empty one.
			const executed = summary.passed + summary.failed;
			if (executed === 0 && runOptions.passWithNoTests !== true) {
				error(
					summary.total === 0
						? "luatest: no tests were run (pass { passWithNoTests: true } to run() to allow this)"
						: `luatest: no tests were run: all ${summary.total} were skipped, todo or filtered out by .only (pass { passWithNoTests: true } to run() to allow this)`,
					0,
				);
			}
		}
		return summary;
	};

	return {
		describe,
		test,
		it: test,
		beforeAll: (hook) => declareHook("beforeAll", hook),
		afterAll: (hook) => declareHook("afterAll", hook),
		beforeEach: (hook) => declareHook("beforeEach", hook),
		afterEach: (hook) => declareHook("afterEach", hook),
		run,
		configure: (next) => {
			if (next.autoRun !== undefined && next.autoRun !== autoRun) {
				if (executedTopLevel || root.children.length > 0) {
					error(
						"luatest: configure({ autoRun }) must be called before any test is declared",
						2,
					);
				}
				autoRun = next.autoRun;
			}
			if (next.output !== undefined) output = next.output;
		},
		results: () => results,
		hasPending: () => root.children.length > 0,
	};
}
