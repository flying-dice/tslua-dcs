/** @noSelfInFile */

type AnyFunction = (this: void, ...arguments_: unknown[]) => unknown;

/**
 * Wraps every function of a namespace double so that a colon call fails loudly.
 *
 * Every DCS GUI namespace is a plain table of functions called with a dot (`DCS.getPause()`). If a
 * declaration lost its `@noSelf` annotation, TypeScriptToLua would emit `DCS:getPause()` and pass the
 * namespace table as a hidden first argument. Real DCS usually ignores or misreads that argument; the
 * doubles raise `"<namespace>.<name> was called with ':'"` instead, so every test that calls through a
 * double also checks the call shape.
 *
 * The wrappers are the table's own values, so `spyOn(DCS, "getPause")` wraps the guard and still
 * calls through it. All return values pass through (multiple returns included).
 */
export function guardDotCalls<T extends object>(
	namespace: string,
	target: T,
): T {
	const table = target as unknown as Record<string, unknown>;
	for (const key in table) {
		const value = table[key];
		if (type(value) === "function") {
			const original = value as AnyFunction;
			table[key] = (first?: unknown, ...rest: unknown[]) => {
				if (rawequal(first, target))
					error(
						`${namespace}.${key} was called with ':' (the namespace table was passed as the first argument); DCS namespace functions take no self`,
						2,
					);
				return original(first, ...rest);
			};
		}
	}
	return target;
}
