/** @noSelfInFile */

/** Any function a mock can stand in for. */
export type AnyFunction = (...args: any[]) => any;

/** The arguments of one call, exactly as Lua passed them (`n` counts trailing nils). */
export type CallArgs = any[] & { n: number };

/**
 * The outcome of one call to a mock.
 * @noSelf
 */
export interface MockResult {
	/** `"return"` when the call returned, `"throw"` when it raised an error. */
	type: "return" | "throw";
	/** The first returned value, or the error value. */
	value: unknown;
}

/**
 * Recorded state of a mock.
 * @noSelf
 */
export interface MockState {
	/** Arguments of every call, in order. Colon calls (`obj:method(x)`) include the receiver first. */
	calls: CallArgs[];
	/** Outcome of every call, in order. */
	results: MockResult[];
	/** Arguments of the most recent call, if any. */
	lastCall?: CallArgs;
}

/**
 * Control and inspection API shared by {@link fn} and {@link spyOn} mocks.
 * @noSelf
 */
export interface MockInstance<T extends AnyFunction = AnyFunction> {
	/** Recorded calls and results. */
	readonly mock: MockState;
	/** Marks the table as a mock (used by the `toHaveBeenCalled*` matchers). */
	readonly __luatest_mock: true;
	/** Name shown in failure messages. */
	getMockName: () => string;
	/** Sets the name shown in failure messages. */
	mockName: (name: string) => this;
	/** Every call returns `value` (after any queued once-values). */
	mockReturnValue: (value: ReturnType<T>) => this;
	/** The next call returns `value`; queued values are used in order. */
	mockReturnValueOnce: (value: ReturnType<T>) => this;
	/** Every call runs `implementation` (after any queued once-implementations). */
	mockImplementation: (implementation: T) => this;
	/** The next call runs `implementation`; queued implementations are used in order. */
	mockImplementationOnce: (implementation: T) => this;
	/** Forgets recorded calls and results; keeps implementations. */
	mockClear: () => this;
	/** Forgets calls, results and every configured implementation or return value. */
	mockReset: () => this;
	/** For {@link spyOn}: puts the original function back. For {@link fn}: same as `mockReset`. */
	mockRestore: () => void;
}

/**
 * A callable mock. Mocks are Lua tables with a `__call` metamethod, so `type(mock)` is `"table"`;
 * wrap one in a function (`(...args) => mock(...args)`) where real code insists on a function.
 */
export type Mock<T extends AnyFunction = AnyFunction> = T & MockInstance<T>;

/** @noSelf */
interface MockInternals {
	state: MockState;
	name: string;
	implementation?: AnyFunction;
	/**
	 * One-shot behaviours from mockReturnValueOnce and mockImplementationOnce, in
	 * registration order: a single queue, so interleaving the two APIs is honoured.
	 */
	onceQueue: OnceBehaviour[];
	hasDefaultReturn: boolean;
	defaultReturn: unknown;
	restore?: () => void;
}

type OnceBehaviour =
	| { kind: "return"; value: unknown }
	| { kind: "implementation"; implementation: AnyFunction };

const registry = setmetatable(new LuaTable<object, MockInternals>(), {
	__mode: "k",
});
const restorable: { restore: () => void; active: boolean }[] = [];

function pack(...args: any[]): CallArgs {
	const packed = [...args] as CallArgs;
	packed.n = select("#", ...args);
	return packed;
}

function newState(): MockState {
	return { calls: [], results: [] };
}

function invoke(
	internals: MockInternals,
	args: CallArgs,
): LuaMultiReturn<any[]> {
	internals.state.calls.push(args);
	internals.state.lastCall = args;
	const once = internals.onceQueue.shift();
	if (once !== undefined && once.kind === "return") {
		internals.state.results.push({ type: "return", value: once.value });
		return $multi(once.value);
	}
	// A queued one-shot implementation wins; otherwise mockReturnValue
	// overrides the default implementation, as in Jest.
	const implementation =
		once !== undefined
			? once.implementation
			: internals.hasDefaultReturn
				? undefined
				: internals.implementation;
	if (implementation === undefined) {
		const value = internals.hasDefaultReturn
			? internals.defaultReturn
			: undefined;
		internals.state.results.push({ type: "return", value });
		return $multi(value);
	}
	const outcome = pack(...pcall(implementation, ...unpack(args, 1, args.n)));
	if (outcome[0] !== true) {
		internals.state.results.push({ type: "throw", value: outcome[1] });
		throw outcome[1];
	}
	internals.state.results.push({ type: "return", value: outcome[1] });
	return $multi(...unpack(outcome, 2, outcome.n));
}

function createMock<T extends AnyFunction>(
	implementation: T | undefined,
	name: string,
): Mock<T> {
	const internals: MockInternals = {
		state: newState(),
		name,
		implementation,
		onceQueue: [],
		hasDefaultReturn: false,
		defaultReturn: undefined,
	};
	const mock: any = {
		__luatest_mock: true,
		mock: internals.state,
	};
	mock.getMockName = () => internals.name;
	mock.mockName = (value: string) => {
		internals.name = value;
		return mock;
	};
	mock.mockReturnValue = (value: unknown) => {
		internals.hasDefaultReturn = true;
		internals.defaultReturn = value;
		return mock;
	};
	mock.mockReturnValueOnce = (value: unknown) => {
		internals.onceQueue.push({ kind: "return", value });
		return mock;
	};
	mock.mockImplementation = (value: AnyFunction) => {
		internals.implementation = value;
		internals.hasDefaultReturn = false;
		return mock;
	};
	mock.mockImplementationOnce = (value: AnyFunction) => {
		internals.onceQueue.push({ kind: "implementation", implementation: value });
		return mock;
	};
	const clear = () => {
		const state = internals.state;
		state.calls = [];
		state.results = [];
		state.lastCall = undefined;
		return mock;
	};
	mock.mockClear = clear;
	mock.mockReset = () => {
		clear();
		internals.implementation = undefined;
		internals.onceQueue = [];
		internals.hasDefaultReturn = false;
		internals.defaultReturn = undefined;
		return mock;
	};
	mock.mockRestore = () => {
		if (internals.restore !== undefined) internals.restore();
		else (mock as MockInstance).mockReset();
	};
	setmetatable(mock, {
		__call: function (
			this: void,
			_self: unknown,
			...args: any[]
		): LuaMultiReturn<any[]> {
			return invoke(internals, pack(...args));
		},
		__tostring: () => `mock(${internals.name})`,
		__luatest_format: () => `<mock ${internals.name}>`,
	} as any);
	registry.set(mock, internals);
	return mock as Mock<T>;
}

/**
 * Creates a mock function that records every call. Without an implementation it returns `nil`.
 *
 * ```ts
 * const outText = fn<(text: string, seconds: number) => void>();
 * outText("hello", 10);
 * expect(outText).toHaveBeenCalledWith("hello", 10);
 * ```
 */
export function fn<T extends AnyFunction = AnyFunction>(
	implementation?: T,
): Mock<T> {
	return createMock(implementation, "fn");
}

/** True when `value` was created by {@link fn} or {@link spyOn}. */
export function isMock(value: unknown): value is Mock {
	return type(value) === "table" && registry.has(value as object);
}

/**
 * Replaces `object[key]` (an own or inherited function, e.g. a class method) with a mock that calls through to the original function (change that
 * with `mockImplementation` / `mockReturnValue`). `mockRestore()` or {@link restoreAllMocks} puts
 * the original back (an inherited method is un-shadowed). Works on any table, including DCS globals such as `trigger.action`.
 *
 * Arguments are recorded exactly as passed: a colon call `unit:getName()` records the receiver as
 * the first argument, a dot call `trigger.action.outText(text, 10)` records only its arguments.
 */
export function spyOn<O extends object, K extends keyof O>(
	object: O,
	key: K,
): O[K] extends AnyFunction ? Mock<O[K]> : Mock {
	if (type(object) !== "table")
		error(`spyOn: expected a table, received a ${type(object)}`, 2);
	// Normal indexing, so methods inherited through a metatable (class prototypes) can be spied on.
	const original = (object as any)[key];
	const own = rawget(object as any, key);
	if (type(original) !== "function" && !isMock(original)) {
		error(`spyOn: ${tostring(key)} is not a function (${type(original)})`, 2);
	}
	const mock = createMock(original as AnyFunction, tostring(key));
	const entry = { active: true, restore: () => {} };
	entry.restore = () => {
		if (!entry.active) return;
		entry.active = false;
		rawset(object as any, key, own);
	};
	const internals = registry.get(mock) as MockInternals;
	internals.restore = entry.restore;
	restorable.push(entry);
	rawset(object as any, key, mock);
	return mock as any;
}

/** Restores every {@link spyOn} that is still active. */
export function restoreAllMocks(): void {
	for (let i = restorable.length - 1; i >= 0; i--) restorable[i].restore();
	restorable.length = 0;
}
