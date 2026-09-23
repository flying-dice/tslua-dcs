import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { waitForHealthy } from "./wait-for-server.mjs";

const servers = [];

async function listen(handler) {
	const server = createServer(handler);
	servers.push(server);
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	return `http://127.0.0.1:${server.address().port}/health`;
}

afterEach(async () => {
	for (const server of servers.splice(0)) {
		server.closeAllConnections();
		await new Promise((resolve) => server.close(resolve));
	}
});

describe("waitForHealthy", () => {
	it("rejects on time when the server accepts the request but never responds", async () => {
		const url = await listen(() => {});
		const started = Date.now();
		await expect(waitForHealthy(url, 1000)).rejects.toThrow("within 1s");
		expect(Date.now() - started).toBeLessThan(2000);
	});

	it("rejects when a healthy response only arrives after the deadline", async () => {
		const url = await listen((_req, res) => {
			setTimeout(() => res.end("OK"), 1500);
		});
		const started = Date.now();
		await expect(waitForHealthy(url, 1000)).rejects.toThrow("within 1s");
		expect(Date.now() - started).toBeLessThan(1400);
	});

	it("retries non-2xx responses until the server is healthy", async () => {
		let calls = 0;
		const url = await listen((_req, res) => {
			calls++;
			res.statusCode = calls <= 2 ? 503 : 200;
			res.end();
		});
		await expect(waitForHealthy(url, 5000)).resolves.toBeUndefined();
		expect(calls).toBe(3);
	});

	it("rejects with the last status when the server never becomes healthy", async () => {
		const url = await listen((_req, res) => {
			res.statusCode = 503;
			res.end();
		});
		await expect(waitForHealthy(url, 800)).rejects.toThrow("status 503");
	});
});
