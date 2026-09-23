/**
 * Real LuaSocket over the loopback interface. `startServer` binds an `HttpServer` to 127.0.0.1 on a
 * port chosen by the OS, and `exchange` plays a client in the same process: it connects, writes
 * the raw request, lets the server handle one client with `acceptNextClient()`, and reads the
 * response until the server closes the connection. The kernel buffers both directions, so no
 * second thread or process is needed as long as requests and responses stay small.
 */
import * as socket from "socket";
import { HttpServer, type RequestHandler } from "../../src";

/** A connected LuaSocket client, typed with the multiple return values LuaSocket really has. */
export interface ClientSocket {
	send(data: string): LuaMultiReturn<[number | undefined, string?, number?]>;
	receive(
		pattern: number | "*l" | "*a",
	): LuaMultiReturn<[string | undefined, string?, string?]>;
	shutdown(mode: "send" | "receive" | "both"): void;
	settimeout(seconds: number): void;
	close(): void;
}

/** @noSelf */
interface LuaSocketClientApi {
	connect(
		address: string,
		port: number,
	): LuaMultiReturn<[ClientSocket, undefined] | [undefined, string]>;
}

interface BoundSocket {
	/** LuaSocket 3 returns the port as a string. */
	getsockname(): LuaMultiReturn<[string, string, string]>;
}

/** An `HttpServer` that exposes the port the OS assigned when it was bound to port 0. */
export class LoopbackServer extends HttpServer {
	port(): number {
		const [, port] = (this.server as unknown as BoundSocket).getsockname();
		return tonumber(port) as number;
	}
}

export function startServer(handler: RequestHandler): LoopbackServer {
	return new LoopbackServer("127.0.0.1", 0, handler);
}

export function connect(port: number): ClientSocket {
	const [client, err] = (socket as unknown as LuaSocketClientApi).connect(
		"127.0.0.1",
		port,
	);
	if (!client) throw new Error(`connect failed: ${err}`);
	client.settimeout(2);
	return client;
}

/** Reads until the peer closes; returns everything received (partial data included). */
export function readAll(client: ClientSocket): string {
	const [data, , partial] = client.receive("*a");
	return data ?? partial ?? "";
}

export interface ExchangeOptions {
	/** Half-close the client's sending side after writing, so the server sees end-of-stream. */
	endRequest?: boolean;
}

/** Sends `rawRequest`, lets the server handle one client and returns the raw response. */
export function exchange(
	server: LoopbackServer,
	rawRequest: string,
	options: ExchangeOptions = {},
): string {
	const client = connect(server.port());
	try {
		if (rawRequest !== "") client.send(rawRequest);
		if (options.endRequest) client.shutdown("send");
		server.acceptNextClient();
		return readAll(client);
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
