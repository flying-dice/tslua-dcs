export function describe(description: string, tests: () => void) {
	print(`Test Suite: ${description}`);
	tests();
}

export function test(description: string, test: () => void) {
	try {
		test();
		print(`[OK] - ${description}`);
	} catch (error) {
		print(`[FAIL] - ${description}`);
		print(error);
		throw new Error(`[FAIL] - ${description}`);
	}
}

export function expect(value: any) {
	return {
		toBe(expected: any) {
			if (value !== expected) {
				throw new Error(`${value} is not equal to ${expected}`);
			}
		},
		toThrow(expectedError: string) {
			let threwError = false;
			let caughtError: Error | undefined;

			if (typeof value !== "function") {
				throw new Error("Expected a function for toThrow matcher");
			}

			try {
				value();
			} catch (error) {
				threwError = true;
				caughtError = error as Error;
			}

			// Check if an error was thrown
			if (!threwError) {
				throw new Error("Expected function to throw an error, but it did not");
			}

			// Check if the thrown error message matches the expected error message
			if (caughtError?.message !== expectedError) {
				throw new Error(
					`Expected error message '${caughtError?.message}' to be '${expectedError}'`,
				);
			}
		},
	};
}
