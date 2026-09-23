/** @noSelfInFile */

import {
	afterEach,
	anything,
	describe,
	expect,
	fn,
	isMock,
	restoreAllMocks,
	spyOn,
	test,
} from "../src";
import { expectFailure } from "./helpers";

/** A stand-in for a DCS global such as `trigger.action`. */
const action = {
	outText: (text: string, seconds: number) => `${text}:${seconds}`,
};

/** A class, whose methods are called with `:` and receive the instance first. */
class Unit {
	constructor(private name: string) {}
	getName() {
		return this.name;
	}
}

function returnsTwo(this: void): LuaMultiReturn<[number, number]> {
	return $multi(1, 2);
}

describe("fn()", () => {
	test("records calls, arguments (with nils) and results", () => {
		const mock = fn();
		expect(isMock(mock)).toBe(true);
		expect(isMock(() => {})).toBe(false);
		expect(mock("a", 1)).toBeUndefined();
		mock(undefined, "b", undefined);
		expect(mock.mock.calls.length).toBe(2);
		expect(mock.mock.calls[0][0]).toBe("a");
		expect(mock.mock.calls[1].n).toBe(3);
		expect(mock.mock.lastCall?.[1]).toBe("b");
		expect(mock.mock.results[0]).toEqual({ type: "return" });
	});

	test("wraps an implementation", () => {
		const double = fn((x: number) => x * 2);
		expect(double(21)).toBe(42);
		expect(double.mock.results[0]).toEqual({ type: "return", value: 42 });
	});

	test("passes multiple return values through", () => {
		const mock = fn(returnsTwo);
		const [a, b] = (mock as unknown as typeof returnsTwo)();
		expect(a).toBe(1);
		expect(b).toBe(2);
	});

	test("mockReturnValue, mockReturnValueOnce", () => {
		const mock = fn<() => number>(() => 0).mockReturnValue(7);
		mock.mockReturnValueOnce(1).mockReturnValueOnce(2);
		expect(mock()).toBe(1);
		expect(mock()).toBe(2);
		expect(mock()).toBe(7);
		expect(mock()).toBe(7);
	});

	test("mockImplementation, mockImplementationOnce", () => {
		const mock = fn<(x: number) => number>();
		mock.mockImplementation((x) => x + 1).mockImplementationOnce((x) => x * 10);
		expect(mock(2)).toBe(20);
		expect(mock(2)).toBe(3);
		mock.mockReturnValue(99);
		expect(mock(2)).toBe(99);
		mock.mockImplementation((x) => -x);
		expect(mock(2)).toBe(-2);
	});

	test("records and rethrows errors", () => {
		const mock = fn(() => error("broken", 0));
		expect(() => mock()).toThrow({ exact: "broken" });
		expect(mock.mock.results[0]).toEqual({ type: "throw", value: "broken" });
	});

	test("mockClear keeps the implementation, mockReset drops it", () => {
		const mock = fn(() => 5);
		mock();
		mock.mockClear();
		expect(mock.mock.calls.length).toBe(0);
		expect(mock.mock.lastCall).toBeUndefined();
		expect(mock()).toBe(5);
		mock.mockReset();
		expect(mock.mock.calls.length).toBe(0);
		expect(mock()).toBeUndefined();
	});

	test("mockName appears in failure messages", () => {
		const mock = fn().mockName("outText");
		expect(mock.getMockName()).toBe("outText");
		expectFailure(
			() => expect(mock).toHaveBeenCalled(),
			"Mock: outText",
			"Received: 0 calls",
		);
	});

	test("is callable from pcall and reports as a table", () => {
		const mock = fn(() => "ok");
		const [ok, value] = pcall(mock);
		expect(ok).toBe(true);
		expect(value).toBe("ok");
		expect(type(mock)).toBe("table");
	});
});

describe("spyOn()", () => {
	afterEach(() => restoreAllMocks());

	test("calls through to the original and records calls", () => {
		const original = action.outText;
		const spy = spyOn(action, "outText");
		expect(action.outText).toBe(spy);
		expect(action.outText("hi", 5)).toBe("hi:5");
		expect(spy).toHaveBeenCalledWith("hi", 5);
		spy.mockRestore();
		expect(action.outText).toBe(original);
	});

	test("can replace the implementation", () => {
		const spy = spyOn(action, "outText").mockReturnValue("stubbed");
		expect(action.outText("x", 1)).toBe("stubbed");
		expect(spy).toHaveBeenCalledTimes(1);
	});

	test("colon calls record the receiver first", () => {
		const unit = new Unit("Enfield11");
		const spy = spyOn(unit, "getName");
		expect(unit.getName()).toBe("Enfield11");
		expect(spy).toHaveBeenCalledWith(unit);
		expect(spy).toHaveBeenCalledWith(anything());
	});

	test("restoreAllMocks restores every active spy", () => {
		const original = action.outText;
		spyOn(action, "outText");
		spyOn(action, "outText");
		restoreAllMocks();
		expect(action.outText).toBe(original);
	});

	test("rejects non-functions and non-tables", () => {
		expect(() => spyOn({ value: 1 } as any, "value")).toThrow(
			"is not a function",
		);
		expect(() => spyOn(1 as any, "x")).toThrow("expected a table");
	});
});

describe("mock matchers", () => {
	test("toHaveBeenCalled / toHaveBeenCalledTimes", () => {
		const mock = fn();
		expect(mock).not.toHaveBeenCalled();
		expect(mock).toHaveBeenCalledTimes(0);
		mock(1);
		mock(2);
		expect(mock).toHaveBeenCalled();
		expect(mock).toHaveBeenCalledTimes(2);
		expectFailure(
			() => expect(mock).toHaveBeenCalledTimes(3),
			"Expected calls: 3",
			"Received 2 calls:",
			"1: (1)",
			"2: (2)",
		);
		expectFailure(
			() => expect(mock).not.toHaveBeenCalled(),
			"not.toHaveBeenCalled()",
		);
	});

	test("toHaveBeenCalledWith compares arguments deeply, ignoring trailing nils", () => {
		const mock = fn();
		mock("a", { x: [1] });
		mock("b", undefined);
		expect(mock).toHaveBeenCalledWith("a", { x: [1] });
		expect(mock).toHaveBeenCalledWith("b");
		expect(mock).toHaveBeenCalledWith("b", undefined);
		expect(mock).not.toHaveBeenCalledWith("c");
		expectFailure(
			() => expect(mock).toHaveBeenCalledWith("a", { x: [2] }),
			'Expected: ("a", { x = { 2 } })',
			"Received 2 calls:",
			'1: ("a", { x = { 1 } })',
		);
		expectFailure(
			() => expect(mock).not.toHaveBeenCalledWith("b"),
			'Expected: no call with ("b")',
		);
	});

	test("toHaveBeenLastCalledWith / toHaveBeenNthCalledWith", () => {
		const mock = fn();
		mock(1);
		mock(2, "x");
		expect(mock).toHaveBeenLastCalledWith(2, "x");
		expect(mock).toHaveBeenNthCalledWith(1, 1);
		expect(mock).toHaveBeenNthCalledWith(2, 2, "x");
		expect(mock).not.toHaveBeenNthCalledWith(3, 1);
		expectFailure(
			() => expect(mock).toHaveBeenLastCalledWith(1),
			"Expected last call: (1)",
		);
		expectFailure(
			() => expect(mock).toHaveBeenNthCalledWith(1, 2),
			"Expected call 1: (2)",
		);
		expectFailure(
			() => expect(fn()).toHaveBeenLastCalledWith(),
			"Received: 0 calls",
		);
	});

	test("toHaveReturnedWith", () => {
		const mock = fn((x: number) => ({ doubled: x * 2 }));
		mock(2);
		expect(mock).toHaveReturnedWith({ doubled: 4 });
		expect(mock).not.toHaveReturnedWith({ doubled: 5 });
		expectFailure(
			() => expect(mock).toHaveReturnedWith(1),
			"Returned values: { { doubled = 4 } }",
		);
	});

	test("mock matchers require a mock", () => {
		expectFailure(
			() => expect(() => {}).toHaveBeenCalled(),
			"Matcher error: received value must be a mock",
		);
		expectFailure(() => expect(1).not.toHaveBeenCalledWith(1), "Matcher error");
	});
});
