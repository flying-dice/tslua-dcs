import type { Logger } from "@flying-dice/tslua-common";
import type { TCP } from "socket";
import { HttpStatus } from "./constants";
import type { ResolvedServerOptions } from "./options";
import type { HttpRequest } from "./request";
import { RequestHeadReader } from "./request-head-reader";
import { assembleResponseString, type HttpResponse } from "./response";

/**
 * The lifecycle of one connection. Requests without a body go straight from `READING_HEADERS` to
 * `READY_TO_DISPATCH`; rejected requests go straight to `WRITING_RESPONSE` with an error response.
 */
export type ConnectionState =
	| "READING_HEADERS"
	| "READING_BODY"
	| "READY_TO_DISPATCH"
	| "DISPATCHING"
	| "WRITING_RESPONSE"
	| "CLOSED";

/** What one `HttpServer.pump` did. */
export interface PumpStats {
	/** Connections accepted. */
	accepted: number;
	/** Connections visited. */
	visited: number;
	/** Request handlers run. */
	dispatched: number;
	/** Request bytes received. */
	bytesRead: number;
	/** Response bytes accepted by the socket. */
	bytesWritten: number;
	/** Connections closed (completed or failed). */
	closed: number;
	/** Connections still open when the pump returned. */
	active: number;
}

/** Everything the server retains for one connection between pumps. */
interface Connection {
	id: number;
	socket: TCP;
	state: ConnectionState;
	/** When the connection was accepted; the request deadline counts from here. */
	acceptedAt: number;
	/** When the last request byte arrived, for the optional idle timeout. */
	lastReadAt: number;
	requestDeadline: number;
	/** The incremental head parser, while reading headers. */
	head?: RequestHeadReader;
	/** The parsed request, from the end of the head until dispatch. */
	request?: HttpRequest;
	/** Body fragments, joined once when the body is complete. */
	bodyChunks?: string[];
	bodyExpected: number;
	bodyReceived: number;
	/** Request bytes received in total (head, body and any excess). */
	bytesRead: number;
	/** The serialized response being written. */
	response?: string;
	/** The status of the response being written, for logs. */
	responseStatus?: number;
	/** 1-based index of the next response byte to send. */
	writePos: number;
	writeDeadline: number;
}

/** Budgets shared by every operation of one pump. */
interface PumpBudget {
	io: number;
	dispatches: number;
	/** Clock reading after which no further operation starts. */
	timeLimit: number;
}

/**
 * The connection machinery behind `HttpServer`: a set of non-blocking connections, each with explicit
 * state that survives between pumps, serviced round-robin within per-pump budgets. Internal; kept out of
 * `HttpServer` so its members cannot collide with those of subclasses such as `Application`.
 */
export class ConnectionScheduler {
	private connections: Connection[] = [];
	private nextConnectionId = 1;
	/** The id of the connection the next pump visits first (or the next one accepted after it). */
	private nextVisitId = 1;
	private lastNow = -math.huge;
	private closed = false;

	constructor(
		private readonly listener: TCP,
		private readonly handler: (
			req: HttpRequest,
			res: HttpResponse,
		) => HttpResponse,
		private readonly options: ResolvedServerOptions,
		private readonly logger: Logger,
	) {}

	/** The number of open connections. */
	get activeConnections(): number {
		return this.connections.length;
	}

	/** Closes the listener and every connection and drops their buffers; idempotent. */
	close() {
		if (this.closed) return;
		this.closed = true;
		this.listener.close();
		for (const conn of this.connections) this.release(conn);
		this.connections = [];
	}

	/** See `HttpServer.pump`. */
	pump(): PumpStats {
		const stats: PumpStats = {
			accepted: 0,
			visited: 0,
			dispatched: 0,
			bytesRead: 0,
			bytesWritten: 0,
			closed: 0,
			active: this.connections.length,
		};
		if (this.closed) return stats;

		const options = this.options;
		const start = this.now();
		const budget: PumpBudget = {
			io: options.maxIoBytesPerPump,
			dispatches: options.maxDispatchesPerPump,
			timeLimit: start + options.maxPumpSeconds,
		};

		while (
			stats.accepted < options.maxAcceptsPerPump &&
			this.connections.length < options.maxConnections
		) {
			// The first accept, visit and dispatch of a pump always happen, so a coarse or jumping clock cannot
			// stall the server; the time budget only stops further ones.
			if (stats.accepted > 0 && this.now() >= budget.timeLimit) break;
			const [client] = this.listener.accept();
			// "timeout" means nobody is waiting; any other error (such as "closed") also ends accepting for this pump.
			if (!client) break;
			this.adopt(client);
			stats.accepted++;
		}

		// A handler may call close() (or even pump()) re-entrantly, so iterate over a snapshot.
		const list = this.connections;
		const count = list.length;
		if (count > 0) {
			let first = 0;
			while (first < count && list[first].id < this.nextVisitId) {
				first++;
			}
			if (first === count) first = 0;

			const visits = math.min(count, options.maxVisitsPerPump);
			let visited = 0;
			while (visited < visits) {
				if (visited > 0 && this.now() >= budget.timeLimit) break;
				const conn = list[(first + visited) % count];
				this.visit(conn, budget, stats);
				visited++;
				if (this.closed) break;
			}
			stats.visited = visited;

			// Start the next pump after the last connection visited; when all were visited, rotate by one so that
			// the per-pump byte and dispatch budgets are not always spent on the same connections first.
			const next = (first + (visited === count ? 1 : visited)) % count;
			this.nextVisitId = list[next].id;

			this.connections = this.connections.filter(
				(conn) => conn.state !== "CLOSED",
			);
		}

		stats.active = this.connections.length;
		return stats;
	}

	/** The clock, never going backwards (see {@link HttpServerOptions.clock}). */
	private now(): number {
		const time = this.options.clock();
		if (time > this.lastNow) this.lastNow = time;
		return this.lastNow;
	}

	private adopt(client: TCP) {
		client.settimeout(0);
		const now = this.now();
		const conn: Connection = {
			id: this.nextConnectionId++,
			socket: client,
			state: "READING_HEADERS",
			acceptedAt: now,
			lastReadAt: now,
			requestDeadline: now + this.options.requestTimeout,
			head: new RequestHeadReader({
				maxHeaderBytes: this.options.maxRequestHeaderBytes,
				maxHeaderCount: this.options.maxRequestHeaderCount,
				maxBodyBytes: this.options.maxRequestBodyBytes,
			}),
			bodyExpected: 0,
			bodyReceived: 0,
			bytesRead: 0,
			writePos: 1,
			writeDeadline: math.huge,
		};
		this.connections.push(conn);
		this.logger.debug(`Accepted connection #${conn.id}`);
	}

	/** Advances one connection as far as it can go without waiting; never throws. */
	private visit(conn: Connection, budget: PumpBudget, stats: PumpStats) {
		try {
			let visitIo = math.min(this.options.maxIoBytesPerVisit, budget.io);
			const now = this.now();

			if (conn.state === "READING_HEADERS" || conn.state === "READING_BODY") {
				const idle = this.options.idleTimeout;
				if (now >= conn.requestDeadline) {
					this.reject(
						conn,
						HttpStatus.REQUEST_TIMEOUT,
						"request deadline expired",
					);
				} else if (idle > 0 && now - conn.lastReadAt >= idle) {
					this.reject(conn, HttpStatus.REQUEST_TIMEOUT, "idle timeout expired");
				} else {
					visitIo -= this.readInput(conn, visitIo, budget, stats);
				}
			}

			if (
				conn.state === "READY_TO_DISPATCH" &&
				budget.dispatches > 0 &&
				(stats.dispatched === 0 || this.now() < budget.timeLimit)
			) {
				budget.dispatches--;
				stats.dispatched++;
				this.dispatch(conn);
			}

			if (conn.state === "WRITING_RESPONSE") {
				if (this.now() >= conn.writeDeadline) {
					this.fail(conn, "response deadline expired", "warn");
				} else {
					this.writeOutput(conn, visitIo, budget, stats);
				}
			}
		} catch (e) {
			this.fail(conn, `unexpected error: ${e}`, "error");
		}
		if (conn.state === "CLOSED") stats.closed++;
	}

	/** Reads what is available, up to `allowance` bytes, and feeds it to the parser. Returns the bytes read. */
	private readInput(
		conn: Connection,
		allowance: number,
		budget: PumpBudget,
		stats: PumpStats,
	): number {
		let total = 0;
		while (
			(conn.state === "READING_HEADERS" || conn.state === "READING_BODY") &&
			total < allowance
		) {
			let wanted = math.min(this.options.ioChunkBytes, allowance - total);
			if (conn.state === "READING_BODY") {
				wanted = math.min(wanted, conn.bodyExpected - conn.bodyReceived);
			}

			const [data, receiveError, partial] = conn.socket.receive(wanted);
			const bytes = data ?? partial ?? "";
			if (bytes.length > 0) {
				total += bytes.length;
				budget.io -= bytes.length;
				stats.bytesRead += bytes.length;
				conn.bytesRead += bytes.length;
				conn.lastReadAt = this.now();
				this.consume(conn, bytes);
			}

			if (receiveError === undefined) continue; // got everything asked for; there may be more
			if (receiveError === "timeout") break; // nothing more for now

			// "closed" or a socket error: a complete request can still be answered, an incomplete one never is.
			if (conn.state === "READING_HEADERS" || conn.state === "READING_BODY") {
				this.fail(
					conn,
					this.incompleteReason(conn, receiveError),
					conn.bytesRead === 0 && receiveError === "closed" ? "debug" : "warn",
				);
			}
			break;
		}
		return total;
	}

	private incompleteReason(conn: Connection, receiveError: string): string {
		if (conn.state === "READING_BODY") {
			return `Incomplete request body: expected ${conn.bodyExpected} bytes, received ${conn.bodyReceived} (${receiveError})`;
		}
		return `Incomplete request head: received ${conn.bytesRead} bytes (${receiveError})`;
	}

	/** Feeds received bytes to the head parser or the body. */
	private consume(conn: Connection, bytes: string) {
		if (conn.state === "READING_HEADERS") {
			const result = (conn.head as RequestHeadReader).push(bytes);
			if (result.kind === "incomplete") return;
			conn.head = undefined;
			if (result.kind === "rejected") {
				this.reject(conn, result.status, result.reason);
				return;
			}
			conn.request = result.request;
			conn.bodyExpected = result.bodyLength;
			if (result.bodyLength === 0) {
				// Bytes after a body-less request are ignored.
				conn.state = "READY_TO_DISPATCH";
				return;
			}
			this.logger.debug(
				`Connection #${conn.id}: reading request body of ${result.bodyLength} bytes`,
			);
			conn.state = "READING_BODY";
			conn.bodyChunks = [];
			if (result.rest.length > 0) this.appendBody(conn, result.rest);
		} else if (conn.state === "READING_BODY") {
			this.appendBody(conn, bytes);
		}
	}

	private appendBody(conn: Connection, bytes: string) {
		const needed = conn.bodyExpected - conn.bodyReceived;
		// Bytes past the declared length are ignored.
		const chunk = bytes.length > needed ? string.sub(bytes, 1, needed) : bytes;
		(conn.bodyChunks as string[]).push(chunk);
		conn.bodyReceived += chunk.length;
		if (conn.bodyReceived === conn.bodyExpected) {
			(conn.request as HttpRequest).body = table.concat(
				conn.bodyChunks as string[],
			);
			conn.bodyChunks = undefined;
			conn.state = "READY_TO_DISPATCH";
		}
	}

	/** Runs the handler exactly once and prepares its response. */
	private dispatch(conn: Connection) {
		// Leave READY_TO_DISPATCH first: nothing may dispatch this request again, even re-entrantly.
		conn.state = "DISPATCHING";
		const request = conn.request as HttpRequest;
		conn.request = undefined;

		let response: HttpResponse;
		try {
			response = this.handler(request, { status: 404, headers: {} });
		} catch (e) {
			if (conn.state !== "DISPATCHING") return; // the handler closed the server
			this.serverError(conn, `request handler failed: ${e}`);
			return;
		}
		if (conn.state !== "DISPATCHING") return; // the handler closed the server
		if (
			typeof response !== "object" ||
			typeof response.status !== "number" ||
			typeof response.headers !== "object"
		) {
			this.serverError(conn, "request handler did not return a response");
			return;
		}

		let serialized: string;
		try {
			serialized = assembleResponseString(response, { closeConnection: true });
		} catch (e) {
			this.serverError(conn, `could not serialize the response: ${e}`);
			return;
		}
		if (serialized.length > this.options.maxResponseBytes) {
			this.serverError(
				conn,
				`response of ${serialized.length} bytes exceeds ${this.options.maxResponseBytes} bytes`,
			);
			return;
		}
		this.startResponse(conn, serialized, response.status);
	}

	private serverError(conn: Connection, reason: string) {
		this.logger.error(`Connection #${conn.id}: ${reason}`);
		this.startResponse(
			conn,
			errorResponse(HttpStatus.INTERNAL_SERVER_ERROR),
			HttpStatus.INTERNAL_SERVER_ERROR,
		);
	}

	/** Answers a request that will not be dispatched with an empty error response. */
	private reject(conn: Connection, status: HttpStatus, reason: string) {
		const message = `Connection #${conn.id}: rejected with ${status} while ${stage(conn.state)} after ${conn.bytesRead} bytes: ${reason}`;
		// A connection that timed out without sending anything is usually a speculative preconnect; not worth a warning.
		if (status === HttpStatus.REQUEST_TIMEOUT && conn.bytesRead === 0) {
			this.logger.debug(message);
		} else {
			this.logger.warn(message);
		}
		this.startResponse(conn, errorResponse(status), status);
	}

	private startResponse(conn: Connection, serialized: string, status: number) {
		conn.head = undefined;
		conn.request = undefined;
		conn.bodyChunks = undefined;
		conn.response = serialized;
		conn.responseStatus = status;
		conn.writePos = 1;
		conn.writeDeadline = this.now() + this.options.responseTimeout;
		conn.state = "WRITING_RESPONSE";
	}

	/** Sends as much of the response as the socket accepts, up to `allowance` bytes. */
	private writeOutput(
		conn: Connection,
		allowance: number,
		budget: PumpBudget,
		stats: PumpStats,
	) {
		const response = conn.response as string;
		const length = response.length;
		let total = 0;
		while (conn.writePos <= length && total < allowance) {
			const last = math.min(
				length,
				conn.writePos +
					math.min(this.options.ioChunkBytes, allowance - total) -
					1,
			);
			const [sentTo, sendError, sentBeforeError] = conn.socket.send(
				response,
				conn.writePos,
				last,
			);
			// Both results are the index of the last byte sent, not a count; zero progress is writePos - 1.
			const reached = sentTo !== undefined ? sentTo : sentBeforeError;
			if (reached !== undefined && reached >= conn.writePos) {
				const sent = reached - conn.writePos + 1;
				total += sent;
				budget.io -= sent;
				stats.bytesWritten += sent;
				conn.writePos = reached + 1;
			}

			if (sendError === undefined) {
				if (reached === undefined || reached < last) break; // defensive: no error but short
				continue;
			}
			if (sendError === "timeout") break; // the socket buffer is full; resume later

			this.fail(
				conn,
				`response write failed (${sendError}) after ${conn.writePos - 1} of ${length} bytes`,
				"warn",
			);
			return;
		}

		if (conn.writePos > length) {
			this.logger.debug(
				`Connection #${conn.id}: sent ${conn.responseStatus} (${length} bytes), closing`,
			);
			this.release(conn);
		}
	}

	/** Closes a connection that cannot be completed, logging why at `level`. */
	private fail(
		conn: Connection,
		reason: string,
		level: "debug" | "warn" | "error",
	) {
		const message = `Connection #${conn.id}: closed while ${stage(conn.state)}: ${reason}`;
		if (level === "error") this.logger.error(message);
		else if (level === "warn") this.logger.warn(message);
		else this.logger.debug(message);
		this.release(conn);
	}

	/** Closes the socket once and drops every retained buffer. */
	private release(conn: Connection) {
		if (conn.state === "CLOSED") return;
		conn.state = "CLOSED";
		conn.head = undefined;
		conn.request = undefined;
		conn.bodyChunks = undefined;
		conn.response = undefined;
		try {
			conn.socket.close();
		} catch (e) {
			this.logger.error(`Connection #${conn.id}: close failed: ${e}`);
		}
	}
}

function errorResponse(status: HttpStatus): string {
	return assembleResponseString(
		{ status, headers: {} },
		{ closeConnection: true },
	);
}

function stage(state: ConnectionState): string {
	switch (state) {
		case "READING_HEADERS":
			return "reading the request head";
		case "READING_BODY":
			return "reading the request body";
		case "READY_TO_DISPATCH":
		case "DISPATCHING":
			return "dispatching";
		case "WRITING_RESPONSE":
			return "writing the response";
		default:
			return "closed";
	}
}
