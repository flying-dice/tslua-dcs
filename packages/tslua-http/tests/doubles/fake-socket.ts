/** @noSelfInFile */
/**
 * Scripted doubles for non-blocking LuaSocket TCP objects, used to inject fragmentation and faults that are
 * awkward or slow to produce with real sockets (partial reads, partial and zero-progress writes, failures).
 *
 * - `fakeClient(script)` is a connected client socket. Each `receive(n)` call consumes the next entry of
 *   `script`, the way a non-blocking socket sees one arrival at a time:
 *   - a string is the bytes that have arrived. If it has at least `n` bytes, `receive` returns the first `n`
 *     and keeps the rest for the next call; otherwise it returns them as partial data with "timeout", as
 *     LuaSocket does when fewer bytes than asked for are available;
 *   - `{ error, partial }` is a failure reported the LuaSocket way (`nil, error, partial`), e.g. "closed".
 *   Once the script is exhausted `receive` reports `nil, "timeout", ""`: a peer that went quiet.
 *   `send(data, i, j)` accepts every byte and returns `j` unless limited with `sendLimits`; the bytes
 *   accepted are appended to `written()`.
 * - `fakeListener(clients)` is a bound server socket. Each `accept` call hands out the next client, then
 *   reports `nil, "timeout"` like a non-blocking listener with nothing pending.
 * - `useFakeListener(listener)` makes the next `socket.bind` return the listener, so an `HttpServer` constructed
 *   afterwards uses it. Restore with `restoreAllMocks()`.
 * - `fakeClock(start)` is a clock for the `clock` option that only moves when told to.
 *
 * Every method is a luatest `fn()` mock. `HttpServer` calls them with colon syntax, so recorded calls start with
 * the receiver: `expect(client.receive).toHaveBeenNthCalledWith(1, client.socket, 8192)`.
 */
import { fn, type Mock, spyOn } from "@flying-dice/tslua-luatest";
import type { TCP } from "socket";
import * as socket from "socket";

/** One scripted arrival for `receive`: data, or a LuaSocket failure (`nil, error, partial`). */
export type ReceiveOutcome = string | { error: string; partial?: string };

/**
 * One scripted outcome for `send`: the number of bytes the socket accepts (fewer than offered means
 * "timeout", i.e. the send buffer is full), or a failure after accepting `accepted` bytes.
 */
export type SendOutcome = number | { error: string; accepted?: number };

type ReceiveResult = LuaMultiReturn<[string | undefined, string?, string?]>;
type SendResult = LuaMultiReturn<[number | undefined, string?, number?]>;

export interface FakeClient {
	/** The object handed to the server; its methods are the mocks below. */
	socket: TCP;
	receive: Mock;
	send: Mock;
	close: Mock;
	settimeout: Mock;
	/** Appends arrivals to the receive script. */
	arrive(...outcomes: ReceiveOutcome[]): void;
	/** Queues send outcomes; once they run out every send is accepted in full. */
	sendLimits(...outcomes: SendOutcome[]): void;
	/** Every byte the server's sends were reported as accepting, in order. */
	written(): string;
}

export interface FakeListener {
	socket: TCP;
	accept: Mock;
	close: Mock;
	settimeout: Mock;
	/** Queues more clients to accept. */
	enqueue(...clients: FakeClient[]): void;
}

export function fakeClient(script: ReceiveOutcome[] = []): FakeClient {
	const queue = [...script];
	const sendQueue: SendOutcome[] = [];
	const written: string[] = [];

	const receive = fn((_self: unknown, wanted: number): ReceiveResult => {
		const next = queue.shift();
		if (next === undefined) return $multi(undefined, "timeout", "");
		if (typeof next !== "string") {
			return $multi(undefined, next.error, next.partial ?? "");
		}
		if (next.length >= wanted) {
			if (next.length > wanted) queue.unshift(string.sub(next, wanted + 1));
			return $multi(string.sub(next, 1, wanted));
		}
		return $multi(undefined, "timeout", next);
	});

	const send = fn(
		(_self: unknown, data: string, i?: number, j?: number): SendResult => {
			const first = i ?? 1;
			const last = j ?? data.length;
			const offered = last - first + 1;
			const next = sendQueue.shift();
			let accepted = offered;
			let failure: string | undefined;
			if (typeof next === "number") {
				accepted = math.min(next, offered);
			} else if (next !== undefined) {
				accepted = math.min(next.accepted ?? 0, offered);
				failure = next.error;
			}
			written.push(string.sub(data, first, first + accepted - 1));
			const reached = first + accepted - 1;
			if (failure !== undefined) return $multi(undefined, failure, reached);
			if (accepted < offered) return $multi(undefined, "timeout", reached);
			return $multi(reached);
		},
	);

	const close = fn();
	const settimeout = fn();
	const client = { receive, send, close, settimeout };
	return {
		socket: client as unknown as TCP,
		receive,
		send,
		close,
		settimeout,
		arrive: (...outcomes) => {
			queue.push(...outcomes);
		},
		sendLimits: (...outcomes) => {
			sendQueue.push(...outcomes);
		},
		written: () => table.concat(written),
	};
}

export function fakeListener(clients: FakeClient[] = []): FakeListener {
	const queue = [...clients];
	const accept = fn(() => {
		const next = queue.shift();
		if (next === undefined) return $multi(undefined, "timeout");
		return $multi(next.socket);
	});
	const close = fn();
	const settimeout = fn();
	const listener = { accept, close, settimeout };
	return {
		socket: listener as unknown as TCP,
		accept,
		close,
		settimeout,
		enqueue: (...more) => {
			queue.push(...more);
		},
	};
}

/** Makes `socket.bind` return `listener` (and records its arguments) until mocks are restored. */
export function useFakeListener(listener: FakeListener): Mock {
	return spyOn(socket, "bind").mockImplementation(() =>
		$multi(listener.socket, undefined),
	);
}

export interface FakeClock {
	/** Pass as the `clock` option. */
	clock: (this: void) => number;
	/** Moves the clock forward by `seconds`. */
	advance(seconds: number): void;
	/** Sets the clock, forwards or backwards. */
	set(time: number): void;
}

export function fakeClock(start = 1000): FakeClock {
	let now = start;
	return {
		clock: () => now,
		advance: (seconds) => {
			now += seconds;
		},
		set: (time) => {
			now = time;
		},
	};
}
