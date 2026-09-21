import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		coverage: {
			include: ["src/**/*"],
			exclude: [
				"src/**/index.ts",
				"src/decode-uri-component.ts", // Covered by decode-uri-component.test.ts
			],
			all: true,
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
	},
});
