// Load generator for the HTTP benchmarks. Every request opens its own connection (the servers close after one
// response) and every response is validated byte-for-byte or as JSON, so a fast wrong answer never counts.
//
// Client kinds, all running at once for `durationMs`:
//   healthy     closed-loop workers cycling GET /health, GET /units/:id and POST /echo (256-byte body)
//   idle        preconnect-style clients: connect, send nothing, reconnect when the server closes
//   slowloris   connect, send a partial head, then one more header line every second
//   slowReaders GET /big (8 MiB) and stop reading for `slowReaderPauseMs`, then read the rest and verify it
//   fragmented  POST /echo written in 16-byte pieces 10 ms apart
import net from "node:net";
import { isMainThread, parentPort, Worker, workerData } from "node:worker_threads";

const BIG_LENGTH = 8 * 1024 * 1024;
const ECHO_BODY = "e".repeat(200) + "0123456789".repeat(5) + "abcdef";

function percentiles(values) {
	if (values.length === 0) return { p50: null, p90: null, p99: null, max: null, mean: null };
	const sorted = [...values].sort((a, b) => a - b);
	const at = (q) => sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * q) - 1)];
	const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
	return { p50: at(0.5), p90: at(0.9), p99: at(0.99), max: sorted[sorted.length - 1], mean };
}

function parse(buffer) {
	const headEnd = buffer.indexOf("\r\n\r\n");
	if (headEnd < 0) return undefined;
	const head = buffer.subarray(0, headEnd).toString("latin1");
	const status = Number(head.split(" ")[1]);
	return { status, head, body: buffer.subarray(headEnd + 4) };
}

/**
 * One request on a fresh connection. Resolves with { ok, error?, ms, status, bytes }.
 * `validate(parsed)` returns an error string or undefined.
 */
function request(port, payload, { validate, timeoutMs, chunk, chunkDelayMs, pauseMs }) {
	return new Promise((resolve) => {
		const started = performance.now();
		const chunks = [];
		let bytes = 0;
		let settled = false;
		const socket = net.connect({ port, host: "127.0.0.1" });
		const finish = (error) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			socket.destroy();
			const ms = performance.now() - started;
			if (error) return resolve({ ok: false, error, ms, bytes });
			const buffer = Buffer.concat(chunks);
			const parsed = parse(buffer);
			if (!parsed) return resolve({ ok: false, error: bytes === 0 ? "no response" : "malformed", ms, bytes });
			const invalid = validate(parsed);
			resolve({ ok: !invalid, error: invalid, ms, bytes, status: parsed.status });
		};
		const timer = setTimeout(() => finish("timeout"), timeoutMs);
		socket.on("data", (data) => {
			chunks.push(data);
			bytes += data.length;
		});
		socket.on("end", () => finish());
		socket.on("error", (err) => finish(err.code ?? "error"));
		socket.on("connect", async () => {
			if (pauseMs) {
				socket.write(payload);
				socket.pause();
				setTimeout(() => socket.resume(), pauseMs);
				return;
			}
			if (!chunk) {
				socket.write(payload);
				return;
			}
			for (let i = 0; i < payload.length && !settled; i += chunk) {
				socket.write(payload.subarray(i, i + chunk));
				await new Promise((r) => setTimeout(r, chunkDelayMs));
			}
		});
	});
}

const expectText = (text) => (res) =>
	res.status !== 200 ? `status ${res.status}` : res.body.toString("latin1") !== text ? "body mismatch" : undefined;

function expectUnit(id) {
	return (res) => {
		if (res.status !== 200) return `status ${res.status}`;
		try {
			const value = JSON.parse(res.body.toString("utf8"));
			if (value.id !== id || value.name !== `Unit ${id}` || value.alive !== true) return "body mismatch";
		} catch {
			return "invalid JSON";
		}
		return undefined;
	};
}

const expectBig = (res) =>
	res.status !== 200 ? `status ${res.status}` : res.body.length !== BIG_LENGTH ? `truncated (${res.body.length} bytes)` : undefined;

function healthyRequest(n) {
	switch (n % 3) {
		case 0:
			return { payload: "GET /health HTTP/1.1\r\nHost: bench\r\n\r\n", validate: expectText("OK") };
		case 1: {
			const id = `u${n % 1000}`;
			return { payload: `GET /units/${id} HTTP/1.1\r\nHost: bench\r\n\r\n`, validate: expectUnit(id) };
		}
		default:
			return {
				payload: `POST /echo HTTP/1.1\r\nHost: bench\r\nContent-Type: text/plain\r\nContent-Length: ${ECHO_BODY.length}\r\n\r\n${ECHO_BODY}`,
				validate: expectText(ECHO_BODY),
			};
	}
}

function tally() {
	return { ok: 0, errors: {}, latencies: [] };
}

function count(stats, result) {
	if (result.ok) {
		stats.ok++;
		stats.latencies.push(result.ms);
	} else {
		stats.errors[result.error] = (stats.errors[result.error] ?? 0) + 1;
	}
}

/** Holds a connection open in some misbehaving way and reconnects whenever the server closes it. */
function holder(port, until, onOpen, stats) {
	return new Promise((resolve) => {
		const loop = () => {
			if (Date.now() >= until) return resolve();
			stats.connections++;
			const socket = net.connect({ port, host: "127.0.0.1" });
			let interval;
			const done = () => {
				clearInterval(interval);
				socket.destroy();
				setTimeout(loop, 10);
			};
			socket.on("connect", () => {
				interval = onOpen(socket);
			});
			socket.on("data", () => {});
			socket.on("end", () => {
				stats.closedByServer++;
				done();
			});
			socket.on("error", done);
			const stop = setTimeout(() => {
				clearInterval(interval);
				socket.destroy();
				resolve();
			}, Math.max(0, until - Date.now()));
			socket.on("close", () => clearTimeout(stop));
		};
		loop();
	});
}

/**
 * Runs the load, spreading the healthy workers over `threads` worker threads (one Node thread cannot open
 * connections fast enough to saturate the fastest servers). Other client kinds run on the calling thread.
 */
export async function runLoad(options) {
	const threads = Math.max(1, Math.min(options.threads ?? 1, options.healthy ?? 0));
	if (threads === 1) return summarizeAll(await runRaw(options), options);
	const share = (i) => Math.floor(options.healthy / threads) + (i < options.healthy % threads ? 1 : 0);
	const workers = [];
	for (let i = 1; i < threads; i++) {
		workers.push(
			new Promise((resolve, reject) => {
				const worker = new Worker(new URL(import.meta.url), {
					workerData: { ...options, healthy: share(i), idle: 0, slowloris: 0, slowReaders: 0, fragmented: 0 },
				});
				worker.once("message", resolve);
				worker.once("error", reject);
			}),
		);
	}
	const local = runRaw({ ...options, healthy: share(0) });
	const parts = [await local, ...(await Promise.all(workers))];
	const merged = parts[0];
	for (const part of parts.slice(1)) {
		for (const kind of ["healthy", "fragmented", "slowReaders"]) {
			merged[kind].ok += part[kind].ok;
			merged[kind].latencies.push(...part[kind].latencies);
			for (const [k, v] of Object.entries(part[kind].errors)) {
				merged[kind].errors[k] = (merged[kind].errors[k] ?? 0) + v;
			}
		}
		merged.elapsedSeconds = Math.max(merged.elapsedSeconds, part.elapsedSeconds);
	}
	return summarizeAll(merged, options);
}

function summarizeAll(raw, { durationMs }) {
	const summarize = (stats) => ({
		ok: stats.ok,
		errors: stats.errors,
		// Over the whole run, including the drain of requests still in flight when the load stopped.
		perSecond: stats.ok / raw.elapsedSeconds,
		latencyMs: percentiles(stats.latencies),
	});
	return {
		elapsedSeconds: raw.elapsedSeconds,
		durationSeconds: durationMs / 1000,
		healthy: summarize(raw.healthy),
		fragmented: summarize(raw.fragmented),
		slowReaders: summarize(raw.slowReaders),
		idle: raw.idle,
		slowloris: raw.slowloris,
	};
}

if (!isMainThread && workerData) {
	runRaw(workerData).then((raw) => parentPort.postMessage(raw));
}

async function runRaw({
	port,
	durationMs,
	healthy = 0,
	idle = 0,
	slowloris = 0,
	slowReaders = 0,
	fragmented = 0,
	timeoutMs = 10000,
	slowReaderPauseMs = 3000,
}) {
	const started = Date.now();
	const until = started + durationMs;
	const result = {
		healthy: tally(),
		fragmented: tally(),
		slowReaders: tally(),
		idle: { connections: 0, closedByServer: 0 },
		slowloris: { connections: 0, closedByServer: 0 },
	};

	let sequence = 0;
	const workers = [];
	for (let w = 0; w < healthy; w++) {
		workers.push(
			(async () => {
				while (Date.now() < until) {
					const { payload, validate } = healthyRequest(sequence++);
					count(result.healthy, await request(port, Buffer.from(payload, "latin1"), { validate, timeoutMs }));
				}
			})(),
		);
	}
	for (let w = 0; w < fragmented; w++) {
		workers.push(
			(async () => {
				const payload = Buffer.from(
					`POST /echo HTTP/1.1\r\nHost: bench\r\nContent-Type: text/plain\r\nContent-Length: ${ECHO_BODY.length}\r\n\r\n${ECHO_BODY}`,
					"latin1",
				);
				while (Date.now() < until) {
					count(
						result.fragmented,
						await request(port, payload, { validate: expectText(ECHO_BODY), timeoutMs, chunk: 16, chunkDelayMs: 10 }),
					);
				}
			})(),
		);
	}
	for (let w = 0; w < slowReaders; w++) {
		workers.push(
			(async () => {
				const payload = Buffer.from("GET /big HTTP/1.1\r\nHost: bench\r\n\r\n", "latin1");
				while (Date.now() < until) {
					count(
						result.slowReaders,
						await request(port, payload, {
							validate: expectBig,
							timeoutMs: timeoutMs + slowReaderPauseMs,
							pauseMs: slowReaderPauseMs,
						}),
					);
				}
			})(),
		);
	}
	for (let w = 0; w < idle; w++) {
		workers.push(holder(port, until, () => undefined, result.idle));
	}
	for (let w = 0; w < slowloris; w++) {
		workers.push(
			holder(
				port,
				until,
				(socket) => {
					socket.write("GET /slow HTTP/1.1\r\nHost: bench\r\n");
					return setInterval(() => socket.write("X-Trickle: 1\r\n"), 1000);
				},
				result.slowloris,
			),
		);
	}

	await Promise.all(workers);
	result.elapsedSeconds = (Date.now() - started) / 1000;
	return result;
}
