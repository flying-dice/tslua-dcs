import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		fileParallelism: false,
		isolate: true,
		globalSetup: ["./tests/wait-for-server.mjs"],
	},
});
