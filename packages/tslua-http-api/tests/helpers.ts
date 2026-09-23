import type { HttpRequest, HttpResponse } from "@flying-dice/tslua-http";
import type { Application } from "../src";

/**
 * Test helpers that drive an {@link Application} in the same Lua process, in two ways:
 *
 * - {@link dispatch} calls the request handler the application registers with its `HttpServer`,
 *   with a request/response pair shaped exactly like the ones `HttpServer` builds (a fresh `404`
 *   response with no headers). This is the unit-level path: no sockets involved.
 * - {@link roundTrip} performs a real HTTP exchange over loopback: a LuaSocket client connects to
 *   the application's listening socket (bound to port `0`), sends raw request bytes, the test steps
 *   the server once with `acceptNextClient()`, and the client reads the raw response until the
 *   server closes the connection. This is the end-to-end path through `tslua-http`'s parser and
 *   response writer.
 */

/** @noSelf */
interface LuaSocketModule {
	connect(
		this: void,
		address: string,
		port: number,
	): LuaMultiReturn<[LuaSocketClient | undefined, string | undefined]>;
}

interface LuaSocketClient {
	send(data: string): LuaMultiReturn<[number | undefined, string | undefined]>;
	receive(
		pattern: "*a" | "*l" | number,
	): LuaMultiReturn<
		[string | undefined, string | undefined, string | undefined]
	>;
	settimeout(seconds: number): void;
	close(): void;
}

interface LuaSocketServer {
	getsockname(): LuaMultiReturn<[string, string | number, string]>;
}

const socket = require("socket") as LuaSocketModule;

export type RequestInit = {
	headers?: Record<string, string>;
	body?: string;
};

/** A parsed HTTP response (from {@link roundTrip}) or the handler's response object (from {@link dispatch}). */
export type TestResponse = {
	status: number;
	/** Header names lower-cased, as HTTP clients expose them. */
	headers: Record<string, string>;
	/** The body, `""` when there is none. */
	body: string;
};

/** Builds an `HttpRequest` the way `tslua-http` parses one: lower-cased header names, path without the query. */
export function makeRequest(
	method: string,
	url: string,
	init: RequestInit = {},
): HttpRequest {
	const [path, query] = url.split("?");
	const parameters: Record<string, string> = {};
	if (query !== undefined) {
		for (const pair of query.split("&")) {
			const [name, value] = pair.split("=");
			parameters[name] = value;
		}
	}
	const headers: Record<string, string> = {};
	for (const key of Object.keys(init.headers ?? {})) {
		headers[key.toLowerCase()] = (init.headers as Record<string, string>)[key];
	}
	return {
		method,
		path,
		originalUrl: url,
		protocol: "HTTP/1.1",
		headers,
		parameters,
		body: init.body,
	};
}

/** The response `HttpServer` hands to its handler before any route runs. */
export function makeResponse(): HttpResponse {
	return { status: 404, headers: {} };
}

/**
 * Calls the application's request handler directly (the function it passes to `HttpServer`), and
 * returns the handler's response with lower-cased header names.
 */
export function dispatch(
	app: Application,
	method: string,
	url: string,
	init: RequestInit = {},
): TestResponse {
	const handler = (
		app as unknown as {
			handler: (req: HttpRequest, res: HttpResponse) => HttpResponse;
		}
	).handler;
	return normalize(handler(makeRequest(method, url, init), makeResponse()));
}

/** Calls the handler and returns the raw `HttpResponse` object (header names as set by the app). */
export function dispatchRaw(
	app: Application,
	req: HttpRequest,
	res: HttpResponse = makeResponse(),
): HttpResponse {
	const handler = (
		app as unknown as {
			handler: (req: HttpRequest, res: HttpResponse) => HttpResponse;
		}
	).handler;
	return handler(req, res);
}

function normalize(res: HttpResponse): TestResponse {
	const headers: Record<string, string> = {};
	for (const key of Object.keys(res.headers)) {
		headers[key.toLowerCase()] = res.headers[key];
	}
	return { status: res.status, headers, body: res.body ?? "" };
}

/** The port the application's server socket is bound to (use port `0` when creating it). */
export function portOf(app: Application): number {
	const server = (app as unknown as { server: LuaSocketServer }).server;
	const [, port] = server.getsockname();
	return tonumber(port) as number;
}

/**
 * Sends raw bytes to the application over loopback, steps the server once and returns everything
 * the server wrote before closing the connection.
 */
export function rawExchange(app: Application, requestText: string): string {
	const [client, connectError] = socket.connect("127.0.0.1", portOf(app));
	if (!client) throw new Error(`connect failed: ${connectError}`);
	client.settimeout(5);
	try {
		const [sent, sendError] = client.send(requestText);
		if (sent === undefined) throw new Error(`send failed: ${sendError}`);
		// The request is buffered by the OS, so the server can read all of it synchronously.
		app.acceptNextClient();
		const [data, receiveError, partial] = client.receive("*a");
		if (data !== undefined) return data;
		if (receiveError === "closed") return partial ?? "";
		throw new Error(`receive failed: ${receiveError}`);
	} finally {
		client.close();
	}
}

/** Serialises a request as HTTP/1.1 bytes, adding `Content-Length` when there is a body. */
export function requestText(
	method: string,
	url: string,
	init: RequestInit = {},
): string {
	const lines = [`${method} ${url} HTTP/1.1`, "Host: 127.0.0.1"];
	const headers = init.headers ?? {};
	for (const key of Object.keys(headers)) {
		lines.push(`${key}: ${headers[key]}`);
	}
	if (init.body !== undefined) {
		lines.push(`Content-Length: ${init.body.length}`);
	}
	return `${lines.join("\r\n")}\r\n\r\n${init.body ?? ""}`;
}

/** Parses a raw HTTP/1.1 response written by `tslua-http`. */
export function parseResponse(raw: string): TestResponse {
	const [headEnd] = string.find(raw, "\r\n\r\n", 1, true);
	if (headEnd === undefined) throw new Error(`malformed response: ${raw}`);
	const head = raw.substring(0, headEnd - 1);
	const body = raw.substring(headEnd + 3);
	const [statusLine, ...headerLines] = head.split("\r\n");
	const [statusText] = string.match(statusLine, "^HTTP/1%.1 (%d+) ");
	const headers: Record<string, string> = {};
	for (const line of headerLines) {
		const [name, value] = string.match(line, "^([^:]+):%s*(.*)$");
		headers[name.toLowerCase()] = value;
	}
	return { status: tonumber(statusText) as number, headers, body };
}

/** A full end-to-end request over a real loopback socket. */
export function roundTrip(
	app: Application,
	method: string,
	url: string,
	init: RequestInit = {},
): TestResponse {
	return parseResponse(rawExchange(app, requestText(method, url, init)));
}

/** A request function: either {@link dispatch} or {@link roundTrip}. */
export type Transport = (
	app: Application,
	method: string,
	url: string,
	init?: RequestInit,
) => TestResponse;

export const transports: { name: string; send: Transport }[] = [
	{ name: "dispatch", send: dispatch },
	{ name: "socket", send: roundTrip },
];
