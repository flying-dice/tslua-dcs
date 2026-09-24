import { Logger } from "@flying-dice/tslua-common";
import type { TCP } from "socket";
import * as socket from "socket";
import { type HttpServerOptions, resolveServerOptions } from "./options";
import type { HttpRequest } from "./request";
import type { HttpResponse } from "./response";
import { ConnectionScheduler, type PumpStats } from "./scheduler";

export type { ConnectionState, PumpStats } from "./scheduler";

export type RequestHandler = (
	req: HttpRequest,
	res: HttpResponse,
) => HttpResponse;

/**
 * An HTTP/1.1 server driven cooperatively from a host loop or timer callback.
 *
 * Every socket is non-blocking. Each call to {@link pump} accepts a bounded number of new connections and then
 * visits the open connections round-robin, starting where the previous pump stopped. A visit does whatever
 * progress is possible without waiting: it reads available request bytes, runs the request handler once the
 * request is complete, and writes as much of the response as the socket accepts. A connection that cannot make
 * progress keeps its state and is revisited on a later pump, so an idle or slow client never holds up the others.
 *
 * Each connection serves one request and is closed once the whole response has been handed to the socket. Every
 * response carries `Connection: close`. Keep-alive, pipelining and chunked request bodies are not supported; see
 * the package README for the request forms that are rejected, and {@link HttpServerOptions} for the limits,
 * deadlines and per-pump budgets.
 *
 * The request handler is synchronous and runs to completion inside a pump; the pump's time budget cannot
 * interrupt it, but no new handler starts once the budget is spent.
 *
 * @example
 * // Serve 200 for every request, pumping from a DCS timer (use a wall clock, not simulation time).
 * const httpServer = new HttpServer("127.0.0.1", 8080, (req, res) => { res.status = 200; return res; });
 * timer.scheduleFunction((_, time) => { httpServer.pump(); return time + 0.02; }, undefined, timer.getTime() + 0.02);
 */
export class HttpServer {
	/**
	 * The underlying TCP server.
	 * @protected
	 */
	protected server: TCP;

	protected logger: Logger;

	private readonly scheduler: ConnectionScheduler;

	/**
	 * Creates an instance of a HTTP server.
	 * @param {string} bindAddress - The IP address or hostname the server will bind to.
	 * @param {number} port - The port number the server will listen on.
	 * @param {RequestHandler} handler - The request handler to be used when serving requests
	 * @param options - Limits, deadlines, per-pump budgets and the clock; see {@link HttpServerOptions}.
	 */
	constructor(
		bindAddress: string,
		port: number,
		protected readonly handler: RequestHandler,
		options?: HttpServerOptions,
	) {
		this.logger = new Logger("HttpServer");
		const resolved = resolveServerOptions(options);

		const [server, bindError] = socket.bind(bindAddress, port);
		if (!server) {
			throw new Error(
				`Failed to bind ${bindAddress}:${port}: ${bindError ?? "unknown error"}`,
			);
		}
		this.server = server;
		this.server.settimeout(0);
		this.scheduler = new ConnectionScheduler(
			server,
			(req, res) => this.handler(req, res),
			resolved,
			this.logger,
		);
	}

	/**
	 * The number of open connections. (A method rather than a getter: accessors would slow every property access
	 * on the server and its subclasses in the generated Lua.)
	 */
	connectionCount(): number {
		return this.scheduler.connectionCount();
	}

	/**
	 * Closes the listening socket and every open connection and releases their buffers. Safe to call more
	 * than once; later calls, and later pumps, do nothing.
	 */
	close() {
		this.scheduler.close();
	}

	/**
	 * Does a bounded amount of work and returns: accepts up to `maxAcceptsPerPump` new connections (while fewer
	 * than `maxConnections` are open), then visits open connections round-robin within the per-pump budgets.
	 * Call it repeatedly, for example from a timer callback; it never waits for a socket.
	 *
	 * @returns What this pump did. Cheap to ignore; useful for instrumentation.
	 */
	pump(): PumpStats {
		// Re-entrant calls (from a request handler) return at once and do nothing.
		return this.scheduler.pump();
	}

	/**
	 * Legacy entry point, kept for compatibility: it runs one {@link pump}.
	 *
	 * Unlike earlier versions it neither handles exactly one client nor finishes a request within the call: a
	 * call may accept several clients and advance several connections, and a request may take several calls
	 * to be read and answered. Keep calling it repeatedly, as before.
	 *
	 * @deprecated Use {@link pump}.
	 */
	acceptNextClient() {
		this.pump();
	}
}
