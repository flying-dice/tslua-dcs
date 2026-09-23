/** @noSelfInFile */

/**
 * The environment-agnostic core of the project bridge: a JSON-RPC 2.0 service
 * over HTTP, built on this repository's own `@flying-dice/tslua-http-api` and
 * `@flying-dice/tslua-json`. The GUI hook and the mission script each create
 * one and pump it from their environment's frame/timer callback.
 *
 * Endpoints:
 * - `GET /health` — bridge identity and liveness.
 * - `POST /rpc` — JSON-RPC 2.0: `ping`, `rpc.discover`, `eval({ code })`.
 */
import { HttpStatus } from "@flying-dice/tslua-http";
import {
	type AppHttpRequest,
	type AppHttpResponse,
	Application,
} from "@flying-dice/tslua-http-api";
import * as json from "@flying-dice/tslua-json";

export const BRIDGE_VERSION = "0.1.0";

/** The Lua environment a bridge instance serves. */
export type BridgeEnv = "gui" | "mission";

export const DEFAULT_PORTS: Record<BridgeEnv, number> = {
	gui: 25579,
	mission: 25580,
};

export interface BridgeOptions {
	env: BridgeEnv;
	port?: number;
	bindAddress?: string;
	/** Seconds since some epoch; used for uptime and pump-liveness reporting. */
	clock?: () => number;
}

export interface Bridge {
	readonly name: string;
	readonly env: BridgeEnv;
	readonly port: number;
	/** Serves at most one pending connection. Call once per frame/timer tick. */
	pump(): void;
	close(): void;
	/** The underlying application, for tests and extensions. */
	readonly app: Application;
}

/** JSON-RPC 2.0 error codes used by the bridge. */
export const RpcErrorCode = {
	PARSE_ERROR: -32700,
	INVALID_REQUEST: -32600,
	METHOD_NOT_FOUND: -32601,
	INVALID_PARAMS: -32602,
	COMPILE_ERROR: -32000,
	RUNTIME_ERROR: -32001,
	RESULT_NOT_ENCODABLE: -32002,
} as const;

interface RpcRequest {
	jsonrpc?: unknown;
	id?: unknown;
	method?: unknown;
	params?: unknown;
}

class RpcError {
	constructor(
		public readonly code: number,
		public readonly message: string,
		public readonly data?: unknown,
	) {}
}

/**
 * Compiles and runs `code` in the global environment and returns its first
 * result. Compile and runtime errors are reported as distinct RPC errors.
 */
export function evaluate(code: string): unknown {
	const [chunk, compileError] = loadstring(code, "=tslua-dcs-bridge");
	if (chunk === undefined) {
		throw new RpcError(RpcErrorCode.COMPILE_ERROR, tostring(compileError));
	}
	const [ok, result] = pcall(chunk);
	if (!ok) throw new RpcError(RpcErrorCode.RUNTIME_ERROR, tostring(result));
	return result;
}

function discoverDocument(name: string, env: BridgeEnv, port: number) {
	return {
		openrpc: "1.3.2",
		info: { title: name, version: BRIDGE_VERSION, "x-dcs-env": env },
		servers: [{ name, url: `http://127.0.0.1:${port}/rpc` }],
		methods: [
			{
				name: "ping",
				summary: "Liveness check",
				params: json.asArray([]),
				result: { name: "pong", schema: { type: "string" } },
			},
			{
				name: "eval",
				summary: "Run Lua code in this environment and return its first result",
				params: [{ name: "code", required: true, schema: { type: "string" } }],
				result: { name: "result", schema: {} },
			},
			{
				name: "rpc.discover",
				summary: "This OpenRPC document",
				params: json.asArray([]),
				result: { name: "document", schema: { type: "object" } },
			},
		],
	};
}

function dispatch(
	request: RpcRequest,
	name: string,
	env: BridgeEnv,
	port: number,
): unknown {
	if (request.jsonrpc !== "2.0" || typeof request.method !== "string") {
		throw new RpcError(
			RpcErrorCode.INVALID_REQUEST,
			'expected { "jsonrpc": "2.0", "method": string }',
		);
	}
	switch (request.method) {
		case "ping":
			return "pong";
		case "rpc.discover":
			return discoverDocument(name, env, port);
		case "eval": {
			const params = request.params as { code?: unknown } | undefined;
			if (params === undefined || typeof params.code !== "string") {
				throw new RpcError(
					RpcErrorCode.INVALID_PARAMS,
					"eval expects params { code: string }",
				);
			}
			return evaluate(params.code);
		}
		default:
			throw new RpcError(
				RpcErrorCode.METHOD_NOT_FOUND,
				`method not found: ${request.method}`,
			);
	}
}

/** Encodes a JSON-RPC response, turning a non-encodable result into an error. */
function encodeResponse(id: unknown, result: unknown): string {
	const safeId = id === undefined ? json.NULL : id;
	try {
		return json.encode({
			jsonrpc: "2.0",
			id: safeId,
			result: result === undefined ? json.NULL : result,
		});
	} catch (error) {
		return encodeError(
			id,
			new RpcError(
				RpcErrorCode.RESULT_NOT_ENCODABLE,
				`result is not JSON-encodable: ${error instanceof Error ? error.message : tostring(error)}`,
			),
		);
	}
}

function encodeError(id: unknown, error: RpcError): string {
	const body: Record<string, unknown> = {
		code: error.code,
		message: error.message,
	};
	if (error.data !== undefined) body.data = error.data;
	return json.encode({
		jsonrpc: "2.0",
		id: id === undefined ? json.NULL : id,
		error: body,
	});
}

function sendJson(res: AppHttpResponse, status: HttpStatus, body: string) {
	res.status(status);
	res.res.headers["Content-Type"] = "application/json";
	res.send(body);
}

/** Handles one raw JSON-RPC HTTP body and returns the response body. */
export function handleRpcBody(
	body: string | undefined,
	name: string,
	env: BridgeEnv,
	port: number,
): string {
	let request: RpcRequest;
	try {
		request = json.decode<RpcRequest>(body ?? "");
	} catch (error) {
		return encodeError(
			undefined,
			new RpcError(
				RpcErrorCode.PARSE_ERROR,
				error instanceof Error ? error.message : tostring(error),
			),
		);
	}
	if (type(request) !== "table") {
		return encodeError(
			undefined,
			new RpcError(RpcErrorCode.INVALID_REQUEST, "expected a JSON object"),
		);
	}
	try {
		return encodeResponse(request.id, dispatch(request, name, env, port));
	} catch (error) {
		if (error instanceof RpcError) return encodeError(request.id, error);
		return encodeError(
			request.id,
			new RpcError(
				RpcErrorCode.RUNTIME_ERROR,
				error instanceof Error ? error.message : tostring(error),
			),
		);
	}
}

export function createBridge(options: BridgeOptions): Bridge {
	const env = options.env;
	const requestedPort = options.port ?? DEFAULT_PORTS[env];
	const bindAddress = options.bindAddress ?? "127.0.0.1";
	const clock = options.clock ?? os.clock;
	const name = `tslua-dcs-${env}-bridge`;
	const started = clock();
	let lastPump = started;

	const app = new Application(bindAddress, requestedPort);
	// Port 0 asks the OS for a free port; report the one actually bound.
	const [, boundPort] = (
		app as unknown as {
			server: {
				getsockname(this: unknown): LuaMultiReturn<[string, string | number]>;
			};
		}
	).server.getsockname();
	// LuaSocket 3 reports the port as a string.
	const port = tonumber(boundPort) ?? requestedPort;

	app.get("/health", (_req: AppHttpRequest, res: AppHttpResponse) => {
		sendJson(
			res,
			HttpStatus.OK,
			json.encode({
				name,
				env,
				version: BRIDGE_VERSION,
				status: "OK",
				port,
				pump_stalled: false,
				uptime: clock() - started,
				last_pump_age: clock() - lastPump,
			}),
		);
	});

	app.post("/rpc", (req: AppHttpRequest, res: AppHttpResponse) => {
		sendJson(res, HttpStatus.OK, handleRpcBody(req.req.body, name, env, port));
	});

	return {
		name,
		env,
		port,
		app,
		pump() {
			lastPump = clock();
			app.acceptNextClient();
		},
		close() {
			app.close();
		},
	};
}
