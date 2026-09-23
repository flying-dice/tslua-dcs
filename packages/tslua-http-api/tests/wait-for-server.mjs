/**
 * Vitest global setup: waits until the test app (started alongside Vitest by
 * `npm test`) answers GET /health, so no test runs against a server that is
 * still starting.
 */
const HEALTH_URL = "http://127.0.0.1:29293/health";
const TIMEOUT_MS = 60_000;

export default async function waitForServer() {
	const deadline = Date.now() + TIMEOUT_MS;
	let lastError;
	while (Date.now() < deadline) {
		try {
			const response = await fetch(HEALTH_URL);
			if (response.ok) return;
			lastError = new Error(`status ${response.status}`);
		} catch (error) {
			lastError = error;
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error(`Test app did not become healthy at ${HEALTH_URL} within ${TIMEOUT_MS / 1000}s: ${lastError?.message}`);
}
