import * as socket from "socket";

/** A clock returning elapsed-time seconds as a number. Only differences between readings are used. */
export type Clock = (this: void) => number;

/**
 * Optional configuration for `HttpServer`. Every field has a default (see {@link DEFAULT_SERVER_OPTIONS}).
 *
 * The defaults are conservative initial settings chosen for small JSON APIs embedded in DCS World. They are
 * not measured recommendations; tune them against your own workload.
 *
 * ## Memory bound
 *
 * Request bodies and serialized responses are counted against one budget, `maxBufferedBytes`. A declared body is
 * reserved when its head arrives, and a body that does not fit gets `503` before anything is read or dispatched; so
 * retained bodies never exceed `maxBufferedBytes`. A response is counted from dispatch until its connection closes,
 * which makes new bodies wait for room, but it never delays or fails a request: a few slow readers must not stop the
 * server answering everyone else. Responses are bounded per connection by `maxResponseBytes` and in time by
 * `responseTimeout`. Each connection also holds at most `maxRequestHeaderBytes + ioChunkBytes` bytes of head. The
 * server's own buffers are therefore bounded by
 *
 *     maxBufferedBytes + maxConnections * (maxRequestHeaderBytes + ioChunkBytes + maxResponseBytes)
 *
 * which is 32 MiB + 64 * (16 KiB + 4 MiB), about 289 MiB, with the defaults. That worst case needs 64 clients each
 * holding a 4 MiB response unread; lower `maxResponseBytes` or `maxConnections` if your responses are small or your
 * clients few. Objects the request handler builds (for example the response body string before serialization) are
 * outside this bound.
 */
export interface HttpServerOptions {
	/**
	 * The most connections held open at once. When it is reached the server stops accepting; further clients wait
	 * in the operating system's listen backlog until a slot frees up. An open connection that has sent nothing
	 * costs little, so this is set well above the expected number of clients: a low value lets a few idle or slow
	 * clients occupy every slot until their deadlines expire. Default `64`.
	 */
	maxConnections?: number;

	/**
	 * The budget for request bodies and serialized responses across all connections: a body that does not fit gets
	 * `503` (see the memory bound above). Default `33554432` (32 MiB).
	 */
	maxBufferedBytes?: number;

	/** The most bytes in the request line plus headers, terminator included. Larger heads get `431`. Default `8192`. */
	maxRequestHeaderBytes?: number;

	/** The most header lines in a request. More get `431`. Default `64`. */
	maxRequestHeaderCount?: number;

	/** The largest accepted `Content-Length`. Larger declarations get `413` before any body is read. Default `1048576` (1 MiB). */
	maxRequestBodyBytes?: number;

	/** The largest serialized response retained for sending. A larger response is replaced by `500`. Default `4194304` (4 MiB). */
	maxResponseBytes?: number;

	/**
	 * Seconds from accepting a connection until its request must be completely received. An absolute deadline:
	 * receiving more bytes does not extend it. On expiry the client gets `408`. Default `10`.
	 */
	requestTimeout?: number;

	/**
	 * Seconds from starting a response until it must be completely handed to the socket. On expiry the connection is
	 * closed without the rest of the response. Default `30`.
	 */
	responseTimeout?: number;

	/**
	 * Seconds a connection may go without receiving a request byte before it gets `408`, in addition to
	 * `requestTimeout`. `0` disables it. Default `0`.
	 */
	idleTimeout?: number;

	/** The most bytes read or written by a single socket call. Default `8192`. */
	ioChunkBytes?: number;

	/** The most bytes read plus written for one connection in one visit, so busy connections share a pump. Default `32768`. */
	maxIoBytesPerVisit?: number;

	/** The most bytes read plus written across all connections in one `HttpServer.pump`. Default `262144`. */
	maxIoBytesPerPump?: number;

	/** The most connections accepted in one pump. Default `4`. */
	maxAcceptsPerPump?: number;

	/** The most connection visits in one pump. Each connection is visited at most once per pump. Default `32`. */
	maxVisitsPerPump?: number;

	/** The most request handlers run in one pump. Default `4`. */
	maxDispatchesPerPump?: number;

	/**
	 * A cooperative time budget for one pump, in seconds of {@link clock}. It is checked between operations: a
	 * handler that is already running is never interrupted, and no new handler starts once it is spent.
	 * Default `0.005`. The default clock is the wall clock, whose resolution is coarse on some platforms
	 * (around 15 ms on Windows), so treat this as a soft limit.
	 */
	maxPumpSeconds?: number;

	/**
	 * The clock used for deadlines and the pump time budget. Defaults to LuaSocket's `socket.gettime`, which is
	 * wall-clock (Unix) time and follows system clock adjustments. The server never lets its view of time go
	 * backwards: a backwards adjustment pauses deadlines until the clock catches up, and a forward adjustment
	 * expires them early. Do not pass simulation time (for example DCS's `timer.getTime`), which stops while
	 * the simulation is paused and would keep network deadlines from expiring.
	 */
	clock?: Clock;
}

export type ResolvedServerOptions = Required<HttpServerOptions>;

export const DEFAULT_SERVER_OPTIONS: Readonly<ResolvedServerOptions> = {
	maxConnections: 64,
	maxBufferedBytes: 33554432,
	maxRequestHeaderBytes: 8192,
	maxRequestHeaderCount: 64,
	maxRequestBodyBytes: 1048576,
	maxResponseBytes: 4194304,
	requestTimeout: 10,
	responseTimeout: 30,
	idleTimeout: 0,
	ioChunkBytes: 8192,
	maxIoBytesPerVisit: 32768,
	maxIoBytesPerPump: 262144,
	maxAcceptsPerPump: 4,
	maxVisitsPerPump: 32,
	maxDispatchesPerPump: 4,
	maxPumpSeconds: 0.005,
	clock: socket.gettime,
};

const POSITIVE_INTEGERS: (keyof HttpServerOptions)[] = [
	"maxConnections",
	"maxRequestHeaderBytes",
	"maxRequestHeaderCount",
	"ioChunkBytes",
	"maxIoBytesPerVisit",
	"maxIoBytesPerPump",
	"maxAcceptsPerPump",
	"maxVisitsPerPump",
	"maxDispatchesPerPump",
];

const NON_NEGATIVE: (keyof HttpServerOptions)[] = [
	"maxBufferedBytes",
	"maxRequestBodyBytes",
	"maxResponseBytes",
	"idleTimeout",
];

const POSITIVE: (keyof HttpServerOptions)[] = [
	"requestTimeout",
	"responseTimeout",
	"maxPumpSeconds",
];

/** Fills in defaults and rejects values that would disable a bound (zero budgets, negative limits). */
export function resolveServerOptions(
	options: HttpServerOptions = {},
): ResolvedServerOptions {
	const resolved = { ...DEFAULT_SERVER_OPTIONS };
	for (const key of Object.keys(options) as (keyof HttpServerOptions)[]) {
		const value = options[key];
		if (value !== undefined) {
			(resolved as Record<string, unknown>)[key] = value;
		}
	}
	for (const key of POSITIVE_INTEGERS) {
		const value = resolved[key] as number;
		if (typeof value !== "number" || value < 1 || math.floor(value) !== value) {
			throw new Error(`HttpServer option ${key} must be a positive integer`);
		}
	}
	for (const key of NON_NEGATIVE) {
		const value = resolved[key] as number;
		if (typeof value !== "number" || value < 0) {
			throw new Error(`HttpServer option ${key} must be a number >= 0`);
		}
	}
	for (const key of POSITIVE) {
		const value = resolved[key] as number;
		if (typeof value !== "number" || !(value > 0)) {
			throw new Error(`HttpServer option ${key} must be a number > 0`);
		}
	}
	if (typeof resolved.clock !== "function") {
		throw new Error("HttpServer option clock must be a function");
	}
	return resolved;
}
