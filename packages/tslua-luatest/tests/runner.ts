/** @noSelfInFile */

import { createRunner, describe, expect, it, test } from "../src";
import { capture, isolated } from "./helpers";

describe("runner: reporting", () => {
	test("collects every result instead of stopping at the first failure", () => {
		const { summary, statuses } = capture(({ describe, test }) => {
			describe("a", () => {
				test("fails", () => expect(1).toBe(2));
				test("passes", () => {});
			});
			describe("b", () => {
				test("runs after a failure elsewhere", () => {});
			});
		});
		expect(statuses).toEqual({
			"a > fails": "fail",
			"a > passes": "pass",
			"b > runs after a failure elsewhere": "pass",
		});
		expect(summary.failed).toBe(1);
		expect(summary.passed).toBe(2);
		expect(summary.total).toBe(3);
		expect(summary.success).toBe(false);
		expect(summary.failures[0].name).toBe("a > fails");
		expect(summary.failures[0].errors[0]).toContain("Expected: 2");
	});

	test("prints OK / FAIL / SKIP / TODO lines, failure details, the failed list and totals", () => {
		const { lines } = capture(({ describe, test }) => {
			describe("suite", () => {
				test("good", () => {});
				test("bad", () => expect("x").toBe("y"));
				test.skip("later", () => {});
				test.todo("to write");
			});
		});
		expect(lines).toEqual([
			"Test Suite: suite",
			"[OK] - suite > good",
			"[FAIL] - suite > bad",
			'    expect(received).toBe(expected)\n    Expected: "y"\n    Received: "x"\n    strings differ at byte 1 (expected 1 bytes, received 1 bytes)\n      expected bytes 1..1: "y"\n      received bytes 1..1: "x"',
			"[SKIP] - suite > later",
			"[TODO] - suite > to write",
			"",
			"Failed tests:",
			"  - suite > bad",
			"Tests: 1 failed, 1 passed, 2 skipped, 4 total",
		]);
	});

	test("non-assertion errors are reported with their message", () => {
		const { summary } = capture(({ test }) => {
			test("string error", () => error("kaput", 0));
			test("Error object", () => {
				throw new Error("broken");
			});
			test("TypeError", () => {
				throw new TypeError("wrong type");
			});
			test("runtime error", () => {
				const value: any = undefined;
				value.field = 1;
			});
		});
		expect(summary.failures[0].errors).toEqual(["kaput"]);
		expect(summary.failures[1].errors).toEqual(["broken"]);
		expect(summary.failures[2].errors).toEqual(["TypeError: wrong type"]);
		expect(summary.failures[3].errors[0]).toMatch("attempt to index");
	});

	test("nested describes produce full names", () => {
		const { statuses } = capture(({ describe, it }) => {
			describe("outer", () => {
				describe("inner", () => {
					describe("deepest", () => {
						it("works", () => {});
					});
				});
				it("sibling", () => {});
			});
			it("top-level test", () => {});
		});
		expect(statuses).toEqual({
			"outer > inner > deepest > works": "pass",
			"outer > sibling": "pass",
			"top-level test": "pass",
		});
	});

	test("it is an alias of test", () => {
		expect(it).toBe(test);
	});
});

describe("runner: run() end-of-run contract", () => {
	test("returns the summary and does not throw when everything passed", () => {
		const { runner } = isolated();
		runner.test("ok", () => {});
		const summary = runner.run();
		expect(summary.success).toBe(true);
		expect(summary.passed).toBe(1);
	});

	test("throws 'N of M tests failed' when anything failed", () => {
		const { runner, lines } = isolated();
		runner.test("bad", () => expect(1).toBe(2));
		runner.test("good", () => {});
		expect(() => runner.run()).toThrow({
			exact: "luatest: 1 of 2 tests failed",
		});
		expect(lines[lines.length - 1]).toBe(
			"Tests: 1 failed, 1 passed, 0 skipped, 2 total",
		);
	});

	test("throwOnFailure: false returns the failing summary instead", () => {
		const { runner } = isolated();
		runner.test("bad", () => expect(1).toBe(2));
		const summary = runner.run({ throwOnFailure: false });
		expect(summary.failed).toBe(1);
	});

	test("an empty run throws unless passWithNoTests", () => {
		expect(() => isolated().runner.run()).toThrow("no tests were run");
		expect(isolated().runner.run({ passWithNoTests: true }).total).toBe(0);
	});

	test("run() executes each declaration once; later runs only add new tests", () => {
		const { runner } = isolated();
		let count = 0;
		runner.test("counted", () => {
			count++;
		});
		runner.run();
		runner.test("second", () => {});
		const summary = runner.run();
		expect(count).toBe(1);
		expect(summary.total).toBe(2);
	});

	test("run() cannot be called from inside a test", () => {
		const { runner } = isolated();
		runner.test("nested run", () => {
			runner.run();
		});
		const summary = runner.run({ throwOnFailure: false });
		expect(summary.failures[0].errors[0]).toContain(
			"run() cannot be called from inside a test",
		);
	});

	test("declaring inside a running test is an error", () => {
		const { summary } = capture(({ describe, test }) => {
			test("declares", () => {
				test("inner", () => {});
			});
			test("describes", () => {
				describe("inner", () => {});
			});
		});
		expect(summary.failures[0].errors[0]).toContain(
			"test cannot be called while a test or hook is running",
		);
		expect(summary.failures[1].errors[0]).toContain(
			"describe cannot be called while a test or hook is running",
		);
	});

	test("a describe body that throws is reported as a failure", () => {
		const { statuses, summary } = capture(({ describe, test }) => {
			describe("broken", () => {
				test("declared before the error", () => {});
				error("setup exploded", 0);
			});
		});
		expect(statuses["broken > declared before the error"]).toBe("pass");
		expect(statuses["broken > (describe body)"]).toBe("fail");
		expect(summary.failures[0].errors[0]).toBe(
			"describe body failed: setup exploded",
		);
	});

	test("bodies must be functions", () => {
		const { runner } = isolated();
		expect(() => runner.test("x", undefined as any)).toThrow(
			'test("x") needs a function body',
		);
		expect(() => runner.describe("y", 1 as any)).toThrow(
			'describe("y") needs a function body',
		);
		expect(() => runner.beforeEach(undefined as any)).toThrow(
			"beforeEach needs a function",
		);
	});
});

describe("runner: auto-run mode (backward compatibility)", () => {
	test("each top-level describe runs as soon as it is declared", () => {
		const { runner, lines } = isolated(true);
		let ran = false;
		runner.describe("immediate", () => {
			runner.test("runs", () => {
				ran = true;
			});
		});
		expect(ran).toBe(true);
		expect(lines).toEqual(["Test Suite: immediate", "[OK] - immediate > runs"]);
	});

	test("a failing top-level describe throws after running all of its tests", () => {
		const { runner, lines } = isolated(true);
		let after = false;
		expect(() =>
			runner.describe("block", () => {
				runner.test("bad", () => expect(1).toBe(2));
				runner.test("after", () => {
					after = true;
				});
			}),
		).toThrow({
			exact:
				'luatest: 1 of 2 tests failed in "block" (auto-run mode stops at the first failing top-level block; see the [FAIL] lines above)',
		});
		expect(after).toBe(true);
		expect(lines).toContain("[FAIL] - block > bad");
	});

	test("a failing top-level test throws immediately", () => {
		const { runner } = isolated(true);
		expect(() => runner.test("alone", () => error("x"))).toThrow(
			'failed in "alone"',
		);
	});

	test("hooks declared after tests in the same describe still apply", () => {
		const { runner } = isolated(true);
		const events: string[] = [];
		runner.describe("late hooks", () => {
			runner.test("t", () => events.push("test"));
			runner.beforeEach(() => events.push("beforeEach"));
		});
		expect(events).toEqual(["beforeEach", "test"]);
	});

	test("top-level beforeEach applies to later blocks", () => {
		const { runner } = isolated(true);
		const events: string[] = [];
		runner.beforeEach(() => events.push("each"));
		runner.test("one", () => events.push("one"));
		runner.describe("d", () => runner.test("two", () => events.push("two")));
		expect(events).toEqual(["each", "one", "each", "two"]);
	});

	test("run() prints totals of what already ran", () => {
		const { runner, lines } = isolated(true);
		runner.test("one", () => {});
		const summary = runner.run();
		expect(summary.total).toBe(1);
		expect(lines[lines.length - 1]).toBe(
			"Tests: 0 failed, 1 passed, 0 skipped, 1 total",
		);
	});

	test(".only and top-level beforeAll/afterAll are refused (they cannot be sound)", () => {
		const { runner } = isolated(true);
		expect(() => runner.test.only("x", () => {})).toThrow(
			"test.only needs deferred mode",
		);
		expect(() => runner.describe.only("x", () => {})).toThrow(
			"describe.only needs deferred mode",
		);
		expect(() => runner.beforeAll(() => {})).toThrow(
			"a top-level beforeAll needs deferred mode",
		);
		expect(() => runner.afterAll(() => {})).toThrow(
			"a top-level afterAll needs deferred mode",
		);
	});

	test("configure switches mode only before anything is declared", () => {
		const { runner } = isolated(true);
		runner.configure({ autoRun: false });
		runner.test("deferred now", () => {});
		expect(runner.results().length).toBe(0);
		expect(() => runner.configure({ autoRun: true })).toThrow(
			"must be called before any test is declared",
		);
		runner.configure({ autoRun: false }); // unchanged mode is fine
		expect(runner.run().passed).toBe(1);
	});

	test("configure can redirect output", () => {
		const captured: string[] = [];
		const runner = createRunner({ output: () => {} });
		runner.configure({ output: (line) => captured.push(line) });
		runner.test("x", () => {});
		runner.run();
		expect(captured).toContain("[OK] - x");
	});
});

describe("runner: hooks", () => {
	test("run in order: beforeAll, then beforeEach outer to inner, afterEach inner to outer, afterAll", () => {
		const events: string[] = [];
		const log = (event: string) => () => {
			events.push(event);
		};
		capture(
			({ describe, test, beforeAll, afterAll, beforeEach, afterEach }) => {
				beforeAll(log("root beforeAll"));
				beforeEach(log("root beforeEach"));
				afterEach(log("root afterEach"));
				afterAll(log("root afterAll"));
				describe("outer", () => {
					beforeAll(log("outer beforeAll"));
					beforeEach(log("outer beforeEach"));
					afterEach(log("outer afterEach"));
					afterAll(log("outer afterAll"));
					test("first", log("first"));
					describe("inner", () => {
						beforeEach(log("inner beforeEach"));
						afterEach(log("inner afterEach"));
						test("second", log("second"));
					});
				});
			},
		);
		expect(events).toEqual([
			"root beforeAll",
			"outer beforeAll",
			"root beforeEach",
			"outer beforeEach",
			"first",
			"outer afterEach",
			"root afterEach",
			"root beforeEach",
			"outer beforeEach",
			"inner beforeEach",
			"second",
			"inner afterEach",
			"outer afterEach",
			"root afterEach",
			"outer afterAll",
			"root afterAll",
		]);
	});

	test("afterEach runs even when the test fails, and its failure is added", () => {
		const events: string[] = [];
		const { summary } = capture(({ describe, test, afterEach }) => {
			describe("d", () => {
				afterEach(() => {
					events.push("afterEach");
					error("cleanup failed", 0);
				});
				test("t", () => error("test failed", 0));
			});
		});
		expect(events).toEqual(["afterEach"]);
		expect(summary.failures[0].errors).toEqual([
			"test failed",
			"afterEach failed: cleanup failed",
		]);
	});

	test("a failing beforeEach skips the body but still runs afterEach", () => {
		const events: string[] = [];
		const { summary } = capture(({ describe, test, beforeEach, afterEach }) => {
			describe("d", () => {
				beforeEach(() => error("no fixture", 0));
				afterEach(() => events.push("afterEach"));
				test("t", () => events.push("body"));
			});
		});
		expect(events).toEqual(["afterEach"]);
		expect(summary.failures[0].errors).toEqual([
			"beforeEach failed: no fixture",
		]);
	});

	test("a failing beforeAll fails every test in its describe and still runs afterAll", () => {
		const events: string[] = [];
		const { statuses, summary } = capture(
			({ describe, test, beforeAll, afterAll }) => {
				describe("d", () => {
					beforeAll(() => error("no server", 0));
					afterAll(() => events.push("afterAll"));
					test("a", () => events.push("a"));
					describe("nested", () => test("b", () => events.push("b")));
				});
				test("outside", () => {});
			},
		);
		expect(events).toEqual(["afterAll"]);
		expect(statuses).toEqual({
			"d > a": "fail",
			"d > nested > b": "fail",
			outside: "pass",
		});
		expect(summary.failures[0].errors).toEqual(["beforeAll failed: no server"]);
	});

	test("a failing afterAll is reported as its own failure", () => {
		const { statuses, summary } = capture(({ describe, test, afterAll }) => {
			describe("d", () => {
				afterAll(() => error("teardown", 0));
				test("a", () => {});
			});
		});
		expect(statuses).toEqual({ "d > a": "pass", "d (afterAll)": "fail" });
		expect(summary.failed).toBe(1);
		expect(summary.total).toBe(2);
	});

	test("beforeAll/afterAll do not run for a describe whose tests are all skipped", () => {
		const events: string[] = [];
		capture(({ describe, test, beforeAll, afterAll }) => {
			describe("d", () => {
				beforeAll(() => events.push("beforeAll"));
				afterAll(() => events.push("afterAll"));
				test.skip("a", () => {});
			});
		});
		expect(events).toEqual([]);
	});

	test("hooks are scoped to their describe", () => {
		const events: string[] = [];
		capture(({ describe, test, beforeEach }) => {
			describe("with hook", () => {
				beforeEach(() => events.push("hook"));
				test("a", () => events.push("a"));
			});
			describe("without hook", () => {
				test("b", () => events.push("b"));
			});
		});
		expect(events).toEqual(["hook", "a", "b"]);
	});
});

describe("runner: skip, todo, skipIf and only", () => {
	test("test.skip / describe.skip / test.todo never run", () => {
		let ran = false;
		const mark = () => {
			ran = true;
		};
		const { statuses, summary } = capture(({ describe, test }) => {
			test.skip("skipped test", mark);
			test.skip("skipped without body");
			test.todo("todo");
			describe.skip("skipped suite", () => {
				test("inside", mark);
				describe("deeper", () => test("deepest", mark));
			});
		});
		expect(ran).toBe(false);
		expect(statuses).toEqual({
			"skipped test": "skip",
			"skipped without body": "skip",
			todo: "todo",
			"skipped suite > inside": "skip",
			"skipped suite > deeper > deepest": "skip",
		});
		expect(summary.skipped).toBe(5);
		expect(summary.success).toBe(true);
	});

	test("skipIf skips on a truthy condition only", () => {
		const { statuses } = capture(({ describe, test }) => {
			test.skipIf(true)("skipped", () => {});
			test.skipIf(false)("runs", () => {});
			test.skipIf(undefined)("runs too", () => {});
			describe.skipIf(0)("0 is truthy in Lua", () => test("x", () => {}));
			describe.skipIf(false)("kept", () => test("y", () => {}));
		});
		expect(statuses).toEqual({
			skipped: "skip",
			runs: "pass",
			"runs too": "pass",
			"0 is truthy in Lua > x": "skip",
			"kept > y": "pass",
		});
	});

	test("test.only runs only focused tests, reporting the rest as skipped", () => {
		const { statuses, text } = capture(({ describe, test }) => {
			test("unfocused", () => {});
			describe("group", () => {
				test.only("focused", () => {});
				test("sibling", () => {});
			});
		});
		expect(statuses).toEqual({
			unfocused: "skip",
			"group > focused": "pass",
			"group > sibling": "skip",
		});
		expect(text).toContain("Note: .only was used");
	});

	test("describe.only focuses every test inside it, declared before or after", () => {
		const { statuses } = capture(({ describe, test }) => {
			test("before", () => {});
			describe.only("focus", () => {
				test("a", () => {});
				describe("nested", () => test("b", () => {}));
			});
			test("after", () => {});
		});
		expect(statuses).toEqual({
			before: "skip",
			"focus > a": "pass",
			"focus > nested > b": "pass",
			after: "skip",
		});
	});

	test("skip wins over only", () => {
		const { statuses } = capture(({ describe, test }) => {
			describe.skip("skipped", () => test.only("focused", () => {}));
		});
		expect(statuses).toEqual({ "skipped > focused": "skip" });
	});

	test("beforeAll of unfocused describes does not run", () => {
		const events: string[] = [];
		capture(({ describe, test, beforeAll }) => {
			describe("unfocused", () => {
				beforeAll(() => events.push("unfocused beforeAll"));
				test("x", () => {});
			});
			test.only("focused", () => {});
		});
		expect(events).toEqual([]);
	});
});
