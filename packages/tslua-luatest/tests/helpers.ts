/** @noSelfInFile */

import {
	createRunner,
	errorMessage,
	expect,
	fail,
	isAssertionError,
	type Runner,
	type Summary,
} from "../src";

/** Runs `fn` and returns the message of the assertion error it raises; fails if it passes. */
export function failureOf(fn: () => void): string {
	const [ok, error] = pcall(fn);
	if (ok) return fail("expected the assertion to fail, but it passed");
	if (!isAssertionError(error)) {
		return fail(`expected an AssertionError, got: ${errorMessage(error)}`);
	}
	return errorMessage(error);
}

/** Asserts that `fn` fails with an assertion message containing every fragment. */
export function expectFailure(fn: () => void, ...fragments: string[]): void {
	const message = failureOf(fn);
	for (const fragment of fragments)
		expect(message, `failure message:\n${message}`).toContain(fragment);
}

/** Output and outcome of a run of an isolated runner. */
export interface Captured {
	summary: Summary;
	lines: string[];
	/** All lines joined with "\n". */
	text: string;
	/** Status of each result by full name. */
	statuses: Record<string, string>;
}

/** Creates an isolated deferred runner whose report lines are captured instead of printed. */
export function isolated(autoRun = false): { runner: Runner; lines: string[] } {
	const lines: string[] = [];
	const runner = createRunner({ autoRun, output: (line) => lines.push(line) });
	return { runner, lines };
}

/** Declares tests on an isolated runner, runs it without throwing and returns what happened. */
export function capture(declare: (runner: Runner) => void): Captured {
	const { runner, lines } = isolated();
	declare(runner);
	const summary = runner.run({ throwOnFailure: false, passWithNoTests: true });
	const statuses: Record<string, string> = {};
	for (const result of summary.results) statuses[result.name] = result.status;
	return { summary, lines, text: lines.join("\n"), statuses };
}
