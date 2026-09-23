/** Assertion helpers on top of tslua-luatest, with context in every failure message. */

function preview(value: unknown): string {
	if (typeof value !== "string") return tostring(value);
	const head = value.length > 48 ? string.sub(value, 1, 48) : value;
	const [hex] = string.gsub(head, ".", (c: string) =>
		string.format("%02x", string.byte(c)),
	);
	return `${value.length} bytes: ${hex}${value.length > 48 ? "…" : ""}`;
}

export function assertEqual(
	actual: unknown,
	expected: unknown,
	context: string,
): void {
	if (actual !== expected) {
		throw new Error(
			`${context}\n  expected: ${preview(expected)}\n  actual:   ${preview(actual)}`,
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
