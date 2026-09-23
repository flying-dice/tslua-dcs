/** Assertion helpers on top of tslua-luatest, with context in every failure message. */

/** Shows up to 48 bytes of a string as hex, starting at `from` (1-based). */
function preview(value: unknown, from = 1): string {
	if (typeof value !== "string") return tostring(value);
	const head = string.sub(value, from, from + 47);
	const [hex] = string.gsub(head, ".", (c: string) =>
		string.format("%02x", string.byte(c)),
	);
	const more = value.length > from + 47 ? "…" : "";
	return `${value.length} bytes, from byte ${from}: ${hex}${more}`;
}

function firstDifference(a: string, b: string): number {
	let index = 1;
	while (index <= a.length && string.byte(a, index) === string.byte(b, index)) {
		index++;
	}
	return index;
}

export function assertEqual(
	actual: unknown,
	expected: unknown,
	context: string,
): void {
	if (actual !== expected) {
		const from =
			typeof actual === "string" && typeof expected === "string"
				? math.max(1, firstDifference(actual, expected) - 8)
				: 1;
		throw new Error(
			`${context}\n  expected: ${preview(expected, from)}\n  actual:   ${preview(actual, from)}`,
		);
	}
}

/** Asserts that `fn` throws an error whose message contains `fragment` (plain text match). */
export function assertThrows(
	fn: () => unknown,
	fragment: string,
	context: string,
): void {
	let message: string | undefined;
	try {
		fn();
	} catch (error) {
		message = error instanceof Error ? error.message : tostring(error);
	}
	if (message === undefined) {
		throw new Error(
			`${context}: expected an error containing '${fragment}', but nothing was thrown`,
		);
	}
	const [found] = string.find(message, fragment, 1, true);
	if (found === undefined) {
		throw new Error(
			`${context}: expected an error containing '${fragment}', got '${message}'`,
		);
	}
}

export function fromHex(hex: string): string {
	const [bytes] = string.gsub(hex, "..", (pair: string) =>
		string.char(tonumber(pair, 16) as number),
	);
	return bytes;
}

/** Deterministic Park–Miller PRNG; products stay below 2^53 so it is exact in Lua 5.1 doubles. */
export function createRandom(seed: number): () => number {
	let state = seed;
	return () => {
		state = (state * 16807) % 2147483647;
		return state / 2147483647;
	};
}

export function randomBytes(random: () => number, length: number): string {
	const parts: string[] = [];
	for (let i = 0; i < length; i++) {
		parts.push(string.char(math.floor(random() * 256)));
	}
	return table.concat(parts);
}
