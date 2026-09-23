/** @noSelfInFile */
/**
 * Scripted doubles for LuaSocket TCP objects, used to inject faults that are awkward or slow to
 * produce with real sockets (read timeouts, partial reads, failed sends).
 *
 * - `fakeClient(script)` is a connected client socket. Each `receive` call consumes the next entry
 *   of `script`: a string is returned as received data, `{ error, partial }` is returned the way
 *   LuaSocket reports a failure (`nil, error, partial`). Once the script is exhausted `receive`
 *   reports `nil, "timeout", ""`, like a real socket whose peer went quiet. `send` reports every
 *   byte as sent unless overridden with `mockImplementation`.
 * - `fakeListener(clients)` is a bound server socket. Each `accept` call hands out the next client,
 *   then reports `nil, "timeout"` like a non-blocking listener with nothing pending.
 * - `useFakeListener(listener)` makes the next `socket.bind` return the listener, so an
 *   `HttpServer` constructed afterwards uses it. Restore with `restoreAllMocks()`.
 *
 * Every method is a luatest `fn()` mock. `HttpServer` calls them with colon syntax, so recorded
 * calls start with the receiver: `expect(client.receive).toHaveBeenNthCalledWith(1, client.socket, "*l")`.
 */
import { fn, type Mock, spyOn } from "@flying-dice/tslua-luatest";
import * as socket from "socket";
import type { TCP } from "socket";

/** One scripted result of `receive`: data, or a LuaSocket failure (`nil, error, partial`). */
export type ReceiveOutcome = string | { error: string; partial?: string };

type ReceiveResult = LuaMultiReturn<[string | undefined, string?, string?]>;

export interface FakeClient {
	/** The object handed to the server; its methods are the mocks below. */
	socket: TCP;
	receive: Mock;
	send: Mock;
	close: Mock;
	settimeout: Mock;
}

export interface FakeListener {
	socket: TCP;
	accept: Mock;
	close: Mock;
	settimeout: Mock;
}

export function fakeClient(script: ReceiveOutcome[] = []): FakeClient {
	const queue = [...script];
	const receive = fn((_self: unknown, _pattern: unknown): ReceiveResult => {
		const next = queue.shift();
		if (next === undefined) return $multi(undefined, "timeout", "");
		if (typeof next === "string") return $multi(next);
		return $multi(undefined, next.error, next.partial ?? "");
	});
	const send = fn((_self: unknown, data: string) => $multi(data.length));
	const close = fn();
	const settimeout = fn();
	const client = { receive, send, close, settimeout };
	return {
		socket: client as unknown as TCP,
		receive,
		send,
		close,
		settimeout,
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
	return { socket: listener as unknown as TCP, accept, close, settimeout };
}

/** Makes `socket.bind` return `listener` (and records its arguments) until mocks are restored. */
export function useFakeListener(listener: FakeListener): Mock {
	return spyOn(socket, "bind").mockImplementation(() =>
		$multi(listener.socket, undefined),
	);
}
