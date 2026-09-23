/**
 * Plumbing shared by every double: strict call-shape checks, the call registry used by the coverage
 * test, class tables with DCS-style instances, and the helpers that install globals.
 *
 * DCS calls namespace functions with a dot (`trigger.action.outText(text, 10)`) and object methods with
 * a colon (`unit:getName()`). TypeScriptToLua picks one or the other from the declarations, so a wrong
 * `@noSelf` annotation silently shifts every argument by one. The wrappers below turn such a mismatch
 * into an immediate, descriptive error, which makes every call made through the doubles a call-shape
 * assertion.
 */

export type AnyFunction = (this: void, ...args: any[]) => any;

/** Keys that the DCS export contains but that are engine internals, not mission scripting API. */
type Internal = "parentClass_" | "database_" | "tonumber";

/**
 * The surface a double must implement for a declared namespace or class: every declared member except
 * the engine internals and the listed data members (mission data dumps that are fixture-specific).
 *
 * Doubles are object literals checked with `satisfies Double<l_X>`, so a member added to or removed
 * from the declarations fails the doubles' type check until the double follows.
 */
export type Double<T, Data extends keyof T = never> = Omit<T, Internal | Data>;

const calls = new LuaTable<string, number>();
const paths: string[] = [];
const classParents = new LuaTable<object, object>();
const classNames = new LuaTable<object, string>();
const instanceCache = new LuaTable<object, LuaTable<number, object>>();

function record(path: string): void {
	calls.set(path, (calls.get(path) ?? 0) + 1);
}

function register(path: string): void {
	if (calls.get(path) === undefined) {
		calls.set(path, 0);
		paths.push(path);
	}
}

/** Every function path the doubles define, in installation order (e.g. `"trigger.action.outText"`). */
export function surfacePaths(): string[] {
	return [...paths];
}

/** How often each function path was called since the last {@link resetCallCounts}. */
export function callCount(path: string): number {
	return calls.get(path) ?? 0;
}

export function resetCallCounts(): void {
	for (const path of paths) calls.set(path, 0);
}

function isClassTable(value: unknown): boolean {
	return type(value) === "table" && classNames.has(value as object);
}

/** Whether `value` is an instance of `cls` or of a class derived from it. */
export function isInstance(value: unknown, cls: object): boolean {
	if (type(value) !== "table") return false;
	let current: object | undefined = getmetatable(value) as object | undefined;
	while (current !== undefined) {
		if (current === cls) return true;
		current = classParents.get(current);
	}
	return false;
}

function isAnyInstance(value: unknown): boolean {
	if (type(value) !== "table") return false;
	const metatable = getmetatable(value) as object | undefined;
	return metatable !== undefined && classNames.has(metatable);
}

function wrapNamespaceFunction(
	path: string,
	owner: object,
	fn: AnyFunction,
): AnyFunction {
	register(path);
	return (first?: unknown, ...rest: unknown[]) => {
		if (rawequal(first as object, owner))
			error(
				`${path} was called with ':' but DCS namespace functions are called with '.' (missing @noSelf?)`,
				2,
			);
		record(path);
		return fn(first, ...rest);
	};
}

/**
 * Wraps every function of a namespace table (recursively, for nested tables such as `trigger.action`)
 * so that a colon call raises an error, and registers each function path for the coverage check.
 */
export function strictNamespace<T extends object>(path: string, table: T): T {
	const entries = table as unknown as LuaTable<string, unknown>;
	for (const [key, value] of pairs(entries)) {
		const childPath = `${path}.${key}`;
		if (type(value) === "function")
			entries.set(
				key,
				wrapNamespaceFunction(childPath, table, value as AnyFunction),
			);
		else if (type(value) === "table" && !isClassTable(value))
			strictNamespace(childPath, value as object);
	}
	return table;
}

export interface ClassOptions {
	/** Functions DCS calls with a dot on the class table, e.g. `Unit.getByName(name)`. */
	statics: string[];
	/** Base class whose instances' methods also accept instances of this class. */
	parent?: object;
}

/**
 * Turns an object literal into a DCS-style class table: instances are `{ id_ = n }` tables whose
 * metatable is the class table (`__index` points back to it), static functions reject a colon call, and
 * instance methods reject anything but an instance of the class (or a derived class) as `self`.
 */
export function defineClass<T extends object>(
	name: string,
	table: T,
	options: ClassOptions,
): T {
	const entries = table as unknown as LuaTable<string, unknown>;
	classNames.set(table, name);
	if (options.parent) {
		classParents.set(table, options.parent);
		// DCS classes inherit their parent's members (e.g. Unit sees Object.cancelChoosingCargo).
		setmetatable(table, { __index: options.parent });
	}
	entries.set("__index", table);
	for (const [key, value] of pairs(entries)) {
		if (type(value) !== "function") continue;
		const path = `${name}.${key}`;
		const fn = value as AnyFunction;
		register(path);
		let wrapper: AnyFunction;
		if (options.statics.indexOf(key) !== -1) {
			wrapper = (first?: unknown, ...rest: unknown[]) => {
				// `Class:fn()` passes the class table and `object:fn()` an instance of the class; other
				// objects are legitimate arguments (e.g. Warehouse.getCargoAsWarehouse(cargo)).
				if (rawequal(first as object, table) || isInstance(first, table))
					error(
						`${path} is static and must be called with '.', not ':' (missing @noSelf?)`,
						2,
					);
				record(path);
				return fn(first, ...rest);
			};
		} else {
			wrapper = (self?: unknown, ...rest: unknown[]) => {
				if (!isInstance(self, table))
					error(
						`${path} is an instance method: call it as object:${key}(...) on a ${name} (got ${describe(self)} as self)`,
						2,
					);
				record(path);
				return fn(self, ...rest);
			};
		}
		entries.set(key, wrapper);
	}
	return table;
}

function describe(value: unknown): string {
	if (isClassTable(value))
		return `the ${classNames.get(value as object)} class table`;
	if (isAnyInstance(value))
		return `a ${classNames.get(getmetatable(value) as object)} instance`;
	return type(value);
}

/**
 * The instance of `cls` for object id `id`. Instances are cached so that lookups return the same table
 * for the same object, as DCS does (`Group.getByName(name) === group`).
 */
export function instanceOf<T>(cls: object, id: number): T {
	let byId = instanceCache.get(cls);
	if (!byId) {
		byId = new LuaTable<number, object>();
		instanceCache.set(cls, byId);
	}
	let instance = byId.get(id);
	if (!instance) {
		instance = setmetatable({ id_: id }, cls as LuaMetatable<object>);
		byId.set(id, instance);
	}
	return instance as unknown as T;
}

/** The `id_` of an instance created by {@link instanceOf}. */
export function idOf(instance: unknown): number {
	return (instance as { id_: number }).id_;
}

export function clearInstances(): void {
	for (const [cls] of pairs(instanceCache)) instanceCache.delete(cls);
}

/** Assigns a global without tripping over the `const` declarations of the mission types. */
export function setGlobal(name: string, value: unknown): void {
	(_G as unknown as Record<string, unknown>)[name] = value;
}
