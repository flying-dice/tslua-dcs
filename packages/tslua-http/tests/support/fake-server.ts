/**
 * An `HttpServer` wired to the socket doubles and a fake clock, with a handler that records each request and
 * answers 200 "Hello" (or runs a custom handler). The clock only moves when the test moves it, so deadlines
 * and the pump time budget are deterministic.
 */
import type { Mock } from "@flying-dice/tslua-luatest";
import {
	type HttpRequest,
	HttpServer,
	type HttpServerOptions,
	type RequestHandler,
} from "../../src";
import {
	type FakeClient,
	type FakeClock,
	type FakeListener,
	fakeClock,
	fakeListener,
	useFakeListener,
} from "../doubles/fake-socket";

/** The exact bytes the default handler's response serializes to. */
export const HELLO =
	"HTTP/1.1 200 OK\r\nServer: Lua HTTP/1.1\r\nConnection: close\r\n\r\nHello";

/** The exact bytes of an error response the server writes itself. */
export function errorBytes(status: number, text: string): string {
	return `HTTP/1.1 ${status} ${text}\r\nServer: Lua HTTP/1.1\r\nConnection: close\r\n\r\n`;
}

export interface FakeServer {
	server: HttpServer;
	listener: FakeListener;
	bind: Mock;
	clock: FakeClock;
	requests: HttpRequest[];
}

export function fakeServer(
	clients: FakeClient[] = [],
	options: HttpServerOptions = {},
	handler?: RequestHandler,
): FakeServer {
	const listener = fakeListener(clients);
	const bind = useFakeListener(listener);
	const clock = fakeClock();
	const requests: HttpRequest[] = [];
	const server = new HttpServer(
		"127.0.0.1",
		8080,
		(req, res) => {
			requests.push(req);
			if (handler) return handler(req, res);
			res.status = 200;
			res.body = "Hello";
			return res;
		},
		{ clock: clock.clock, ...options },
	);
	return { server, listener, bind, clock, requests };
}
