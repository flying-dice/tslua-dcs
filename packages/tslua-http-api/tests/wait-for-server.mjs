/**
 * Vitest global setup: waits until the test app (started alongside Vitest by
 * `npm test`) answers GET /health, so no test runs against a server that is
 * still starting.
 */
const HEALTH_URL = "http://127.0.0.1:29293/health";
const TIMEOUT_MS = 60_000;
const RETRY_INTERVAL_MS = 250;

/**
 * Resolves once `url` answers with a 2xx status, or rejects once `timeoutMs`
 * has elapsed. The deadline bounds every attempt: each request is aborted when
 * the time left runs out, so a server that accepts the connection and never
 * responds cannot hold the check open past its timeout.
 */
export async function waitForHealthy(url, timeoutMs) {
	const deadline = Date.now() + timeoutMs;
	let lastError;
	while (true) {
		const remaining = deadline - Date.now();
		if (remaining <= 0) break;
		try {
			const response = await fetch(url, {
				signal: AbortSignal.timeout(remaining),
			});
			await response.body?.cancel();
			if (response.ok && Date.now() <= deadline) return;
			lastError = new Error(`status ${response.status}`);
		} catch (error) {
			lastError = error;
		}
		const pause = Math.min(RETRY_INTERVAL_MS, deadline - Date.now());
		if (pause > 0) await new Promise((resolve) => setTimeout(resolve, pause));
	}
	throw new Error(
		`Test app did not become healthy at ${url} within ${timeoutMs / 1000}s: ${lastError?.message ?? "no response"}`,
	);
}

export default async function waitForServer() {
	await waitForHealthy(HEALTH_URL, TIMEOUT_MS);
}
