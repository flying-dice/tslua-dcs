/**
 * Real LuaSocket over the loopback interface. `startServer` binds an `HttpServer` to 127.0.0.1 on a port chosen
 * by the OS. Clients live in the same process, so nothing may block: every client socket is non-blocking and
 * the drivers alternate bounded client writes, server pumps and client reads until the exchange completes. A
 * watchdog (a pump count and a generous wall-clock limit) turns an accidental hang into a test failure.
 */
import * as socket from "socket";
import {
	HttpServer,
	type HttpServerOptions,
	type PumpStats,
	type RequestHandler,
} from "../../src";

/** A connected LuaSocket client, typed with the multiple return values LuaSocket really has. */
export interface ClientSocket {
	send(
		data: string,
		i?: number,
		j?: number,
	): LuaMultiReturn<[number | undefined, string?, number?]>;
	receive(
		pattern: number | "*l" | "*a",
	): LuaMultiReturn<[string | undefined, string?, string?]>;
	shutdown(mode: "send" | "receive" | "both"): void;
	settimeout(seconds: number): void;
	setoption(name: string, value: number | boolean): void;
	close(): void;
}

/** @noSelf */
interface LuaSocketClientApi {
	connect(
		address: string,
		port: number,
	): LuaMultiReturn<[ClientSocket, undefined] | [undefined, string]>;
}

/** An `HttpServer` that exposes the port the OS assigned when it was bound to port 0. */
export class LoopbackServer extends HttpServer {
	port(): number {
		const [, port] = this.server.getsockname();
		return tonumber(port) as number;
	}
}

export function startServer(
	handler: RequestHandler,
	options?: HttpServerOptions,
): LoopbackServer {
	return new LoopbackServer("127.0.0.1", 0, handler, options);
}

/** A non-blocking client connected to `port`. */
export function connect(port: number): ClientSocket {
	const [client, err] = (socket as unknown as LuaSocketClientApi).connect(
		"127.0.0.1",
		port,
	);
	if (!client) throw new Error(`connect failed: ${err}`);
	client.settimeout(0);
	return client;
}

/** Limits that turn a hang into a failure; generous so slow CI machines do not trip them. */
export const WATCHDOG = { pumps: 100000, seconds: 20 };

/**
 * One client-side HTTP exchange, advanced a bounded step at a time by {@link step}. It sends the request in
 * slices (retaining partial progress), optionally half-closes, and reads whatever response bytes are available.
 */
export class ClientExchange {
	readonly client: ClientSocket;
	private sentTo = 0;
	private shutDown = false;
	private readonly received: string[] = [];
	/** True once the server closed the connection. */
	done = false;

	constructor(
		port: number,
		private readonly request: string,
		private readonly options: {
			endRequest?: boolean;
			sliceBytes?: number;
			/** When false, the client never reads (a stalled response consumer). */
			read?: boolean;
		} = {},
	) {
		this.client = connect(port);
	}

	/** True once every request byte has been handed to the client socket. */
	get requestSent(): boolean {
		return this.sentTo >= this.request.length;
	}

	/** Everything received so far. */
	response(): string {
		return table.concat(this.received);
	}

	/** Makes one bounded, non-blocking attempt to write and to read. */
	step() {
		if (this.done) return;
		if (!this.requestSent) {
			const last = math.min(
				this.request.length,
				this.sentTo + (this.options.sliceBytes ?? 65536),
			);
			const [sentTo, , sentBeforeError] = this.client.send(
				this.request,
				this.sentTo + 1,
				last,
			);
			const reached = sentTo ?? sentBeforeError;
			if (reached !== undefined && reached > this.sentTo) this.sentTo = reached;
		}
		if (this.requestSent && this.options.endRequest && !this.shutDown) {
			this.client.shutdown("send");
			this.shutDown = true;
		}
		if (this.options.read === false) return;
		this.read();
	}

	/** Reads what is available now; notices when the server closed the connection. */
	read() {
		while (!this.done) {
			const [data, err, partial] = this.client.receive(65536);
			const bytes = data ?? partial ?? "";
			if (bytes.length > 0) this.received.push(bytes);
			if (err === undefined) continue;
			// "timeout": nothing more for now. "closed" (or a reset): the server is finished with us.
			if (err !== "timeout") this.done = true;
			break;
		}
	}

	close() {
		this.client.close();
	}
}

/**
 * Steps `exchanges` and pumps `server` alternately until `until()` holds, failing if the watchdog trips.
 * Returns the stats of every pump.
 */
export function drive(
	server: HttpServer,
	exchanges: ClientExchange[],
	until: () => boolean = () => exchanges.every((e) => e.done),
): PumpStats[] {
	const stats: PumpStats[] = [];
	const deadline = socket.gettime() + WATCHDOG.seconds;
	while (!until()) {
		if (stats.length >= WATCHDOG.pumps || socket.gettime() > deadline) {
			throw new Error(
				`watchdog: exchange not complete after ${stats.length} pumps`,
			);
		}
		for (const exchange of exchanges) exchange.step();
		stats.push(server.pump());
		for (const exchange of exchanges) {
			if (exchange.requestSent) exchange.step();
		}
	}
	return stats;
}

export interface ExchangeOptions {
	/** Half-close the client's sending side after writing, so the server sees end-of-stream. */
	endRequest?: boolean;
	/** Write the request in slices of this many bytes, one slice per pump. */
	sliceBytes?: number;
}

/** Sends `rawRequest`, pumps the server until it closes the connection, and returns the raw response. */
export function exchange(
	server: HttpServer & { port(): number },
	rawRequest: string,
	options: ExchangeOptions = {},
): string {
	const client = new ClientExchange(server.port(), rawRequest, options);
	try {
		drive(server, [client]);
		return client.response();
	} finally {
		client.close();
	}
}

export interface ParsedResponse {
	statusLine: string;
	headerLines: string[];
	body: string;
}

/** Splits a raw HTTP response at the first blank line. */
export function parseResponse(raw: string): ParsedResponse {
	const [headEnd] = string.find(raw, "\r\n\r\n", 1, true);
	if (headEnd === undefined) throw new Error(`no end of head in ${raw}`);
	const head = raw.substring(0, headEnd - 1);
	const [statusLine, ...headerLines] = head.split("\r\n");
	return { statusLine, headerLines, body: raw.substring(headEnd + 3) };
}
