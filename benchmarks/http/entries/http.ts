/** @noSelfInFile */
/**
 * Benchmark variant: tslua-http's `HttpServer` with a minimal table router written in TypeScript, i.e. the
 * TypeScriptToLua transport without the Express-style framework. Responses are built from strings, like the
 * raw Lua variant. The same source is compiled against the baseline and the current tree.
 */
import {
	type HttpRequest,
	type HttpResponse,
	HttpServer,
} from "@flying-dice/tslua-http";
import { BIG_BODY, type Instance, optionsFor } from "./common";

type Route = (req: HttpRequest, res: HttpResponse) => void;

/** HttpServer calls its handler with the server as `self`, so the handler must take one. */
type Handler = (
	this: unknown,
	req: HttpRequest,
	res: HttpResponse,
) => HttpResponse;

type ServerConstructor = new (
	bindAddress: string,
	port: number,
	handler: Handler,
	options?: object,
) => HttpServer;

const exact: Record<string, Route> = {
	"GET /health": (_req, res) => {
		res.status = 200;
		res.headers["Content-Type"] = "text/plain";
		res.body = "OK";
	},
	"POST /echo": (req, res) => {
		res.status = 200;
		res.headers["Content-Type"] = "text/plain";
		res.body = req.body;
	},
	"GET /big": (_req, res) => {
		res.status = 200;
		res.headers["Content-Type"] = "text/plain";
		res.body = BIG_BODY;
	},
};

function handle(req: HttpRequest, res: HttpResponse): HttpResponse {
	const route = exact[`${req.method} ${req.path}`];
	if (route !== undefined) {
		route(req, res);
		return res;
	}
	if (req.method === "GET") {
		const [id] = string.match(req.path, "^/units/([^/]+)$");
		if (id !== undefined) {
			res.status = 200;
			res.headers["Content-Type"] = "application/json";
			res.body = `{"id":"${id}","name":"Unit ${id}","alive":true}`;
		}
	}
	return res;
}

export function create(port: number, profile: string): Instance {
	const server = new (HttpServer as unknown as ServerConstructor)(
		"127.0.0.1",
		port,
		function (this: unknown, req: HttpRequest, res: HttpResponse) {
			return handle(req, res);
		},
		optionsFor(profile),
	);
	return {
		step: () => server.acceptNextClient(),
		close: () => server.close(),
	};
}
