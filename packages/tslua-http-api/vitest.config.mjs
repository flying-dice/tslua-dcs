import { defineConfig } from "vitest/config";

const shared = {
	globals: true,
	environment: "node",
	fileParallelism: false,
	isolate: true,
};

export default defineConfig({
	test: {
		projects: [
			{
				// HTTP integration tests against the Lua test app: gated on /health.
				test: {
					...shared,
					name: "http",
					include: ["tests/**/*.test.ts"],
					globalSetup: ["./tests/wait-for-server.mjs"],
				},
			},
			{
				test: {
					...shared,
					name: "unit",
					include: ["tests/**/*.test.mjs"],
				},
			},
		],
	},
});
