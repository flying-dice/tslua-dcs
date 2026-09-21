import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		coverage: {
			include: ["src/**/*"],
			exclude: ["src/**/index.ts"],
			all: true,
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
	},
});
