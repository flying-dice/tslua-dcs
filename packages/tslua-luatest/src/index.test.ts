import { describe, expect, test, vi } from "vitest";
import {
	describe as customDescribe,
	expect as customExpect,
	test as customTest,
} from "./index"; // import your functions

// Mock print function for testing
globalThis.print = console.log;

describe("Custom Testing Library", () => {
	test("describe should call its callback", () => {
		const mockCallback = vi.fn();
		customDescribe("test suite", mockCallback);
		expect(mockCallback).toHaveBeenCalled();
	});

	describe("test function", () => {
		test("should handle passing tests", () => {
			const passingTest = () => customTest("passes", () => {});
			expect(passingTest).not.toThrow();
		});

		test("should handle failing tests", () => {
			const failingTest = () =>
				customTest("fails", () => {
					throw new Error("fail");
				});
			expect(failingTest).toThrow("[FAIL] - fails");
		});
	});

	describe("expect function", () => {
		describe("toBe matcher", () => {
			test("should pass for correct assertions", () => {
				expect(() => customExpect(1).toBe(1)).not.toThrow();
			});

			test("should fail for incorrect assertions", () => {
				expect(() => customExpect(1).toBe(2)).toThrow("1 is not equal to 2");
			});
		});

		describe("toThrow matcher", () => {
			test("should fail when the passed value is not a function", () => {
				expect(() => customExpect(1).toThrow("error")).toThrow(
					"Expected a function for toThrow matcher",
				);
			})

			test("should pass when the function throws the expected error", () => {
				expect(() =>
					customExpect(() => {
						throw new Error("error");
					}).toThrow("error"),
				).not.toThrow();
			});

			test("should fail when the function does not throw an error", () => {
				expect(() => customExpect(() => {}).toThrow("error")).toThrow(
					"Expected function to throw an error, but it did not",
				);
			});

			test("should fail when the function throws an unexpected error", () => {
				expect(() =>
					customExpect(() => {
						throw new Error("unexpected");
					}).toThrow("error"),
				).toThrow(`Expected error message 'unexpected' to be 'error'`);
			});
		});
	});
});
