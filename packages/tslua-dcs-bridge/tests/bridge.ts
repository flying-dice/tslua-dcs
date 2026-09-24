/** @noSelfInFile */

/**
 * Bridge tests on the managed lua51 interpreter: the JSON-RPC handler in
 * isolation, then real HTTP round trips over loopback with a LuaSocket client.
 */
import { describe, expect, test } from "@flying-dice/tslua-luatest";
import * as json from "@flying-dice/tslua-json";
import * as socket from "socket";
import {
	type Bridge,
	createBridge,
	evaluate,
	handleRpcBody,
	RpcErrorCode,
} from "../src/core/bridge";

interface RpcResponse {
	jsonrpc: string;
	id: unknown;
	result?: unknown;
	error?: { code: number; message: string };
}

function rpcBody(body: string): RpcResponse {
	return json.decode<RpcResponse>(
		handleRpcBody(body, "tslua-dcs-mission-bridge", "mission", 25580),
		{
			nullValue: json.NULL,
		},
	);
}

function call(
	method: string,
	params?: unknown,
	id: unknown = "t1",
): RpcResponse {
	return rpcBody(json.encode({ jsonrpc: "2.0", id, method, params }));
}

describe("evaluate", () => {
	test("returns the first result of the chunk", () => {
		expect(evaluate("return 1 + 2, 'ignored'")).toBe(3);
	});

	test("runs in the global environment", () => {
		evaluate("__bridge_test_global = 'set'");
		expect(evaluate("return __bridge_test_global")).toBe("set");
	});
});

describe("JSON-RPC handler", () => {
	test("ping answers pong and echoes the id", () => {
		const response = call("ping", undefined, "abc");
		expect(response.jsonrpc).toBe("2.0");
		expect(response.id).toBe("abc");
		expect(response.result).toBe("pong");
	});

	test("numeric ids are echoed too", () => {
		expect(call("ping", undefined, 7).id).toBe(7);
	});

	test("eval returns JSON-encodable values", () => {
		const result = call("eval", {
			code: "return { a = 1, list = { 'x', 'y' } }",
		}).result as {
			a: number;
			list: string[];
		};
		expect(result.a).toBe(1);
		expect(result.list[1]).toBe("y");
	});

	test("eval of nil still carries a result member (null)", () => {
		const response = call("eval", { code: "return nil" });
		expect(response.error).toBe(undefined);
		expect(json.isNull(response.result)).toBe(true);
	});

	test("compile errors are reported", () => {
		const response = call("eval", { code: "return +" });
		expect(response.error?.code).toBe(RpcErrorCode.COMPILE_ERROR);
		expect(
			string.find(
				response.error?.message ?? "",
				"tslua-dcs-bridge",
				1,
				true,
			)[0] !== undefined,
		).toBe(true);
	});

	test("runtime errors are reported with the Lua message", () => {
		const response = call("eval", { code: "error('boom')" });
		expect(response.error?.code).toBe(RpcErrorCode.RUNTIME_ERROR);
		expect(
			string.find(response.error?.message ?? "", "boom", 1, true)[0] !==
				undefined,
		).toBe(true);
	});

	test("non-encodable results become an error, not a broken response", () => {
		const response = call("eval", { code: "return { f = function() end }" });
		expect(response.error?.code).toBe(RpcErrorCode.RESULT_NOT_ENCODABLE);
		expect(response.id).toBe("t1");
	});

	test("eval without a code string is invalid params", () => {
		expect(call("eval", { source: "return 1" }).error?.code).toBe(
			RpcErrorCode.INVALID_PARAMS,
		);
		expect(call("eval").error?.code).toBe(RpcErrorCode.INVALID_PARAMS);
	});

	test("unknown methods are method-not-found", () => {
		const response = call("repl_eval", { code: "return 1" });
		expect(response.error?.code).toBe(RpcErrorCode.METHOD_NOT_FOUND);
	});

	test("malformed JSON is a parse error with a null id", () => {
		const response = rpcBody("{not json");
		expect(response.error?.code).toBe(RpcErrorCode.PARSE_ERROR);
		expect(json.isNull(response.id)).toBe(true);
	});

	test("requests without jsonrpc 2.0 or a method are invalid", () => {
		expect(rpcBody(json.encode({ id: "x", method: "ping" })).error?.code).toBe(
			RpcErrorCode.INVALID_REQUEST,
		);
		expect(rpcBody(json.encode({ jsonrpc: "2.0", id: "x" })).error?.code).toBe(
			RpcErrorCode.INVALID_REQUEST,
		);
		expect(rpcBody("42").error?.code).toBe(RpcErrorCode.INVALID_REQUEST);
	});

	test("rpc.discover advertises eval with its code parameter", () => {
		const document = call("rpc.discover").result as {
			openrpc: string;
			info: { title: string; "x-dcs-env": string };
			methods: { name: string; params: { name: string }[] }[];
		};
		expect(document.openrpc).toBe("1.3.2");
		expect(document.info.title).toBe("tslua-dcs-mission-bridge");
		expect(document.info["x-dcs-env"]).toBe("mission");
		const names = document.methods.map((method) => method.name).join(",");
		expect(names).toBe("ping,eval,rpc.discover");
		expect(document.methods[1].params[0].name).toBe("code");
	});
});

const TOKEN = "test-token-0123456789abcdef";

interface Exchange {
	status: number;
	/** Response header values by lower-cased name. */
	headers: Record<string, string>;
	body: string;
}

/** Sends one raw HTTP request to the bridge, pumps it once, and returns the parsed response. */
function exchange(bridge: Bridge, request: string): Exchange {
	const [client, connectError] = socket.connect("127.0.0.1", bridge.port);
	if (client === undefined) throw new Error(`connect failed: ${connectError}`);
	client.settimeout(2);
	client.send(request);
	bridge.pump();
	const [data, , partial] = client.receive("*a");
	client.close();
	const raw = data ?? partial ?? "";
	const [statusText] = string.match(raw, "^HTTP/1%.%d (%d+)");
	const [headEnd, bodyStart] = string.find(raw, "\r\n\r\n", 1, true);
	const headers: Record<string, string> = {};
	const head = headEnd === undefined ? raw : string.sub(raw, 1, headEnd - 1);
	for (const [name, value] of string.gmatch(
		head,
		"\r\n([^:\r\n]+):%s*([^\r\n]*)",
	)) {
		headers[string.lower(name)] = value;
	}
	return {
		status: tonumber(statusText) ?? 0,
		headers,
		body: bodyStart === undefined ? "" : string.sub(raw, bodyStart + 1),
	};
}

/** POSTs `body` to /rpc with the given extra header lines (default: JSON + the right token). */
function postWith(
	bridge: Bridge,
	body: string,
	headerLines: string[],
): Exchange {
	return exchange(
		bridge,
		`POST /rpc HTTP/1.1\r\nHost: 127.0.0.1\r\n${headerLines.map((line) => `${line}\r\n`).join("")}Content-Length: ${body.length}\r\n\r\n${body}`,
	);
}

function post(bridge: Bridge, body: string) {
	return postWith(bridge, body, [
		"Content-Type: application/json",
		`Authorization: Bearer ${TOKEN}`,
	]);
}

describe("HTTP over loopback", () => {
	const bridge = createBridge({ env: "gui", port: 0, token: TOKEN });

	test("binds an OS-assigned port and reports it", () => {
		expect(bridge.port > 0).toBe(true);
		expect(bridge.name).toBe("tslua-dcs-gui-bridge");
	});

	test("GET /health identifies the bridge", () => {
		const response = exchange(
			bridge,
			"GET /health HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n",
		);
		expect(response.status).toBe(200);
		const health = json.decode<{
			name: string;
			env: string;
			status: string;
			pump_stalled: boolean;
			port: number;
		}>(response.body);
		expect(health.name).toBe("tslua-dcs-gui-bridge");
		expect(health.env).toBe("gui");
		expect(health.status).toBe("OK");
		expect(health.pump_stalled).toBe(false);
		expect(health.port).toBe(bridge.port);
	});

	test("POST /rpc evaluates Lua", () => {
		const response = post(
			bridge,
			json.encode({
				jsonrpc: "2.0",
				id: "http-1",
				method: "eval",
				params: { code: "return 6 * 7" },
			}),
		);
		expect(response.status).toBe(200);
		const decoded = json.decode<RpcResponse>(response.body);
		expect(decoded.id).toBe("http-1");
		expect(decoded.result).toBe(42);
	});

	test("the result carries large multi-line text intact", () => {
		const code =
			"local t = {} for i = 1, 2000 do t[i] = 'line ' .. i end return table.concat(t, '\\n')";
		const response = post(
			bridge,
			json.encode({
				jsonrpc: "2.0",
				id: "big",
				method: "eval",
				params: { code },
			}),
		);
		const text = json.decode<RpcResponse>(response.body).result as string;
		expect(string.sub(text, 1, 6)).toBe("line 1");
		expect(string.sub(text, -9)).toBe("line 2000");
	});

	test("invalid JSON over HTTP is still a JSON-RPC parse error", () => {
		const response = post(bridge, "{oops");
		expect(response.status).toBe(200);
		expect(json.decode<RpcResponse>(response.body).error?.code).toBe(
			RpcErrorCode.PARSE_ERROR,
		);
	});

	test("unknown paths are not served", () => {
		expect(
			exchange(bridge, "GET /nope HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n").status,
		).toBe(404);
	});

	test("pumping with no pending connection is a no-op", () => {
		bridge.pump();
		expect(true).toBe(true);
	});

	test("close releases the port", () => {
		const port = bridge.port;
		bridge.close();
		const [client] = socket.connect("127.0.0.1", port);
		expect(client).toBe(undefined);
	});
});

/** An eval whose side effect proves whether it ran: it sets a global. */
function sideEffectBody(marker: string): string {
	return json.encode({
		jsonrpc: "2.0",
		id: "probe",
		method: "eval",
		params: { code: `__bridge_probe = "${marker}" return "ran"` },
	});
}

function probe(): unknown {
	return (_G as unknown as { __bridge_probe?: unknown }).__bridge_probe;
}

describe("request trust (regression: cross-origin eval)", () => {
	const bridge = createBridge({ env: "mission", port: 0, token: TOKEN });
	const untokened = createBridge({ env: "mission", port: 0 });

	const refused: [string, Bridge, string[], number, string][] = [
		[
			"a text/plain POST (a CORS-safelisted simple request) is refused",
			bridge,
			["Content-Type: text/plain", `Authorization: Bearer ${TOKEN}`],
			415,
			"Content-Type must be application/json",
		],
		[
			"a form-encoded POST is refused",
			bridge,
			[
				"Content-Type: application/x-www-form-urlencoded",
				`Authorization: Bearer ${TOKEN}`,
			],
			415,
			"Content-Type must be application/json",
		],
		[
			"a request with an Origin header is refused, even with the right token",
			bridge,
			[
				"Origin: https://evil.example",
				"Content-Type: application/json",
				`Authorization: Bearer ${TOKEN}`,
			],
			403,
			"Origin header",
		],
		[
			"a request without a token is refused",
			bridge,
			["Content-Type: application/json"],
			401,
			"missing or wrong bearer token",
		],
		[
			"a request with the wrong token is refused",
			bridge,
			["Content-Type: application/json", "Authorization: Bearer not-the-token"],
			401,
			"missing or wrong bearer token",
		],
		[
			"a bridge with no token configured refuses every RPC (fails closed)",
			untokened,
			["Content-Type: application/json", "Authorization: Bearer "],
			401,
			"no token configured",
		],
	];

	for (const [name, target, headerLines, status, message] of refused) {
		test(name, () => {
			(_G as unknown as { __bridge_probe?: unknown }).__bridge_probe =
				undefined;
			const response = postWith(target, sideEffectBody(name), headerLines);
			expect(response.status).toBe(status);
			expect(response.headers["content-type"]).toBe("application/json");
			const decoded = json.decode<RpcResponse>(response.body);
			expect(decoded.error?.code).toBe(RpcErrorCode.UNAUTHORIZED);
			expect(decoded.error?.message).toContain(message);
			expect(probe()).toBeUndefined(); // the code never ran
		});
	}

	test("the trusted request (JSON + token, no Origin) runs", () => {
		const response = post(bridge, sideEffectBody("trusted"));
		expect(response.status).toBe(200);
		expect(json.decode<RpcResponse>(response.body).result).toBe("ran");
		expect(probe()).toBe("trusted");
	});

	test("a JSON media type with parameters is accepted", () => {
		const response = postWith(bridge, sideEffectBody("charset"), [
			"Content-Type: Application/JSON; charset=utf-8",
			`Authorization: Bearer ${TOKEN}`,
		]);
		expect(response.status).toBe(200);
		expect(probe()).toBe("charset");
	});

	test("GET /health refuses browser origins but needs no token", () => {
		expect(
			exchange(bridge, "GET /health HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n")
				.status,
		).toBe(200);
		const fromPage = exchange(
			bridge,
			"GET /health HTTP/1.1\r\nHost: 127.0.0.1\r\nOrigin: https://evil.example\r\n\r\n",
		);
		expect(fromPage.status).toBe(403);
	});

	test("cleanup", () => {
		bridge.close();
		untokened.close();
		expect(true).toBe(true);
	});
});

describe("response media type (regression: JSON advertised as text/plain)", () => {
	const bridge = createBridge({ env: "gui", port: 0, token: TOKEN });

	test("GET /health is application/json", () => {
		expect(
			exchange(bridge, "GET /health HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n")
				.headers["content-type"],
		).toBe("application/json");
	});

	test("successful RPC responses are application/json", () => {
		const response = post(
			bridge,
			json.encode({ jsonrpc: "2.0", id: 1, method: "ping" }),
		);
		expect(response.headers["content-type"]).toBe("application/json");
	});

	test("RPC error responses are application/json", () => {
		const response = post(bridge, "{not json");
		expect(response.headers["content-type"]).toBe("application/json");
	});

	test("cleanup", () => {
		bridge.close();
		expect(true).toBe(true);
	});
});
