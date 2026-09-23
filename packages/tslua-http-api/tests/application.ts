import { LogLevel, Logger } from "@flying-dice/tslua-common";
import { HttpStatus } from "@flying-dice/tslua-http";
import {
	afterEach,
	anything,
	beforeEach,
	describe,
	expect,
	fn,
	restoreAllMocks,
	spyOn,
	stringContaining,
	test,
} from "@flying-dice/tslua-luatest";
import {
	type AppErrorMiddleware,
	type AppHttpRequest,
	AppHttpResponse,
	type AppMiddleware,
	Application,
	HttpError,
} from "../src";
import { dispatch, dispatchRaw, makeRequest, transports } from "./helpers";

type Registrar = "get" | "put" | "post" | "delete" | "patch" | "options";

const METHODS: { method: string; register: Registrar }[] = [
	{ method: "GET", register: "get" },
	{ method: "PUT", register: "put" },
	{ method: "POST", register: "post" },
	{ method: "DELETE", register: "delete" },
	{ method: "PATCH", register: "patch" },
	{ method: "OPTIONS", register: "options" },
];

/** Maps HttpErrors to their status and message, everything else to 500. */
const httpErrorHandler: AppErrorMiddleware = (err, _req, res) => {
	if (err instanceof HttpError) {
		res.status(err.status).send(err.message);
	} else {
		res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(`boom: ${err}`);
	}
};

for (const { name, send } of transports) {
	describe(`Application (${name})`, () => {
		let app: Application;

		beforeEach(() => {
			app = new Application("127.0.0.1", 0);
		});

		afterEach(() => {
			app.close();
			restoreAllMocks();
		});

		describe("methods", () => {
			for (const { method, register } of METHODS) {
				test(`${register}() routes ${method} requests only`, () => {
					app[register]("/thing", (_req, res) => {
						res.send(`${method} handled`);
					});

					const hit = send(app, method, "/thing");
					expect(hit.status).toBe(200);
					expect(hit.body).toBe(`${method} handled`);

					for (const other of METHODS) {
						if (other.method === method) continue;
						expect(send(app, other.method, "/thing").status, other.method).toBe(
							404,
						);
					}
				});
			}

			test("the request method is available to handlers", () => {
				app.use("/echo", (req, res) => {
					res.send(req.method);
				});
				expect(send(app, "PATCH", "/echo").body).toBe("PATCH");
			});

			test("use() routes every method", () => {
				app.use("/any", (req, res) => {
					res.send(`any ${req.method}`);
				});
				for (const { method } of METHODS) {
					const res = send(app, method, "/any");
					expect(res.status, method).toBe(200);
					expect(res.body, method).toBe(`any ${method}`);
				}
			});

			test("a known route requested with an unregistered method is a 404 (no 405 support)", () => {
				app.get("/only-get", (_req, res) => {
					res.send("ok");
				});
				const res = send(app, "POST", "/only-get");
				expect(res.status).toBe(404);
				expect(res.body).toBe("");
			});

			test("HEAD is not routed to GET handlers", () => {
				app.get("/page", (_req, res) => {
					res.send("page");
				});
				expect(send(app, "HEAD", "/page").status).toBe(404);
			});

			test("registering several handlers at once runs them in order", () => {
				const order: string[] = [];
				app.post(
					"/multi",
					(_req, _res, next) => {
						order.push("first");
						next();
					},
					(_req, res) => {
						order.push("second");
						res.send(order.join(","));
					},
				);
				expect(send(app, "POST", "/multi").body).toBe("first,second");
			});
		});

		describe("not found", () => {
			test("an application without handlers answers 404 with no body", () => {
				const res = send(app, "GET", "/nothing");
				expect(res.status).toBe(404);
				expect(res.body).toBe("");
				expect(res.headers["content-type"]).toBeUndefined();
			});

			test("an unknown path is a 404 even when other routes exist", () => {
				app.get("/api/users", (_req, res) => {
					res.send("users");
				});
				expect(send(app, "GET", "/api/invalid-path").status).toBe(404);
				expect(send(app, "GET", "/api").status).toBe(404);
				expect(send(app, "GET", "/api/users/extra").status).toBe(404);
			});

			test("global middleware still runs for a 404 but does not change its status", () => {
				app.useMiddleware((_req, res, next) => {
					res.setHeader("X-Request-Id", "123");
					next();
				});
				const res = send(app, "GET", "/missing");
				expect(res.status).toBe(404);
				expect(res.headers["x-request-id"]).toBe("123");
			});

			test("middleware may answer a request no route matched", () => {
				app.useMiddleware((_req, res) => {
					res.status(HttpStatus.SERVICE_UNAVAILABLE).send("maintenance");
				});
				const res = send(app, "GET", "/anything");
				expect(res.status).toBe(503);
				expect(res.body).toBe("maintenance");
			});

			test("a handler may turn a matched route into a 404", () => {
				app.get("/users/:id", (_req, res) => {
					res.status(HttpStatus.NOT_FOUND).send("Not Found");
				});
				const res = send(app, "GET", "/users/DAVE");
				expect(res.status).toBe(404);
				expect(res.body).toBe("Not Found");
			});
		});

		describe("status", () => {
			test("a matched route defaults to 200 with an empty body", () => {
				app.get("/empty", () => {});
				const res = send(app, "GET", "/empty");
				expect(res.status).toBe(200);
				expect(res.body).toBe("");
			});

			test("handlers set any status", () => {
				app.post("/items", (_req, res) => {
					res.status(HttpStatus.CREATED).send("created");
				});
				expect(send(app, "POST", "/items").status).toBe(201);
			});
		});

		describe("middleware", () => {
			test("runs global middleware, route middleware and handlers in registration order", () => {
				const order: string[] = [];
				const track =
					(label: string): AppMiddleware =>
					(_req, _res, next) => {
						order.push(label);
						next();
					};
				app.useMiddleware(track("global-1"));
				app.use("/api/users", track("use-route"));
				app.get("/api/users", track("get-1"), track("get-2"));
				app.useMiddleware(track("global-2"));
				app.get("/other", track("other"));
				app.post("/api/users", track("post"));
				app.get("/api/users", (_req, res) => {
					order.push("final");
					res.send(order.join(","));
				});

				expect(send(app, "GET", "/api/users").body).toBe(
					"global-1,use-route,get-1,get-2,global-2,final",
				);
			});

			test("a middleware that does not call next ends the chain", () => {
				const after = fn();
				app.useMiddleware((_req, res) => {
					res.status(HttpStatus.UNAUTHORIZED).send("Unauthorized");
				});
				app.get("/secure", after as unknown as AppMiddleware);
				const res = send(app, "GET", "/secure");
				expect(res.status).toBe(401);
				expect(res.body).toBe("Unauthorized");
				expect(after).not.toHaveBeenCalled();
			});

			test("route-level middleware guards only its route", () => {
				const auth: AppMiddleware = (req, res, next) => {
					if (req.getHeaderValue("Authorization") !== "Bearer 123") {
						res.status(HttpStatus.UNAUTHORIZED).send("Unauthorized");
						return;
					}
					next();
				};
				app.get("/secure", auth, (_req, res) => {
					res.send("Secure Content");
				});
				app.get("/public", (_req, res) => {
					res.send("Public");
				});

				expect(send(app, "GET", "/secure").status).toBe(401);
				expect(
					send(app, "GET", "/secure", {
						headers: { Authorization: "Bearer 123" },
					}).body,
				).toBe("Secure Content");
				expect(
					send(app, "GET", "/secure", {
						headers: { Authorization: "Bearer nope" },
					}).status,
				).toBe(401);
				expect(send(app, "GET", "/public").body).toBe("Public");
			});

			test("later handlers see and may override what earlier ones wrote", () => {
				app.useMiddleware((_req, res, next) => {
					res.setHeader("X-Stage", "one").send("first");
					next();
				});
				app.get("/override", (_req, res) => {
					res.setHeader("X-Stage", "two").json({ stage: "two" });
				});
				const res = send(app, "GET", "/override");
				expect(res.headers["x-stage"]).toBe("two");
				expect(res.headers["content-type"]).toBe("application/json");
				expect(res.body).toBe('{"stage":"two"}');
			});

			test("when two routes match, both run in order if the first calls next", () => {
				const seen: string[] = [];
				app.get("/users/me", (_req, _res, next) => {
					seen.push("me");
					next();
				});
				app.get("/users/:id", (req, res) => {
					seen.push(`id=${req.getPathParameterValue("id")}`);
					res.send(seen.join(","));
				});
				expect(send(app, "GET", "/users/me").body).toBe("me,id=me");
			});

			test("when two routes match, the first one wins if it does not call next", () => {
				app.get("/users/me", (_req, res) => {
					res.send("me");
				});
				app.get("/users/:id", (_req, res) => {
					res.send("by id");
				});
				expect(send(app, "GET", "/users/me").body).toBe("me");
				expect(send(app, "GET", "/users/42").body).toBe("by id");
			});

			test("middleware receives the request, the response and next", () => {
				const middleware = fn<AppMiddleware>();
				app.get("/spy", middleware as unknown as AppMiddleware);
				send(app, "GET", "/spy");
				expect(middleware).toHaveBeenCalledTimes(1);
				// Arrow functions compiled by TSTL take a leading context argument.
				const args = middleware.mock.calls[0];
				const req = args[1] as unknown as AppHttpRequest;
				expect(req.path).toBe("/spy");
				expect(req.method).toBe("GET");
				expect(args[2]).toBeInstanceOf(AppHttpResponse);
				expect(args[3]).toBeTypeOf("function");
			});
		});

		describe("path parameters", () => {
			test("a handler reads its route's parameters", () => {
				app.get("/api/users/:id", (req, res) => {
					res.send(`user ${req.getPathParameterValueOrThrow("id")}`);
				});
				expect(send(app, "GET", "/api/users/JOHN").body).toBe("user JOHN");
			});

			test("nested routes resolve several parameters", () => {
				app.get("/api/users/:id/comments/:commentId", (req, res) => {
					res.send(
						`${req.getPathParameterValue("id")}/${req.getPathParameterValue(
							"commentId",
						)}`,
					);
				});
				app.get("/api/users/:id", (_req, res) => {
					res.send("user");
				});
				expect(send(app, "GET", "/api/users/JANE/comments/JANE_C_2").body).toBe(
					"JANE/JANE_C_2",
				);
				expect(send(app, "GET", "/api/users/JANE").body).toBe("user");
				expect(send(app, "GET", "/api/users/JANE/comments").status).toBe(404);
			});

			test("each handler sees the parameters of its own route", () => {
				const seen: string[] = [];
				app.useMiddleware((req, _res, next) => {
					seen.push(`global:${req.getPathParameterValue("id") ?? "none"}`);
					next();
				});
				app.use("/items/:itemId", (req, _res, next) => {
					seen.push(`use:${req.getPathParameterValue("itemId")}`);
					next();
				});
				app.get("/items/:id", (req, res) => {
					seen.push(
						`get:${req.getPathParameterValue("id")}:${
							req.getPathParameterValue("itemId") ?? "none"
						}`,
					);
					res.send(seen.join(","));
				});
				expect(send(app, "GET", "/items/7").body).toBe(
					"global:none,use:7,get:7:none",
				);
			});

			test("parameter names may contain `w` and underscores", () => {
				app.get("/users/:user_id/widgets/:wid", (req, res) => {
					res.send(
						`${req.getPathParameterValue("user_id")}:${req.getPathParameterValue(
							"wid",
						)}`,
					);
				});
				expect(send(app, "GET", "/users/5/widgets/9").body).toBe("5:9");
			});

			test("parameters are not percent-decoded", () => {
				app.get("/complex/:id", (req, res) => {
					res.send(req.getPathParameterValueOrThrow("id"));
				});
				expect(send(app, "GET", "/complex/Aerobatics%20%23003").body).toBe(
					"Aerobatics%20%23003",
				);
			});
		});

		describe("query parameters", () => {
			test("the query string does not affect routing and is readable", () => {
				app.get("/search", (req, res) => {
					res.send(
						`${req.getQueryParameterValue("q")}|${req.getQueryParameterValue(
							"page",
						)}`,
					);
				});
				const res = send(app, "GET", "/search?q=mig&page=2");
				expect(res.status).toBe(200);
				expect(res.body).toBe("mig|2");
			});
		});

		describe("headers", () => {
			test("request headers are read case-insensitively", () => {
				app.get("/whoami", (req, res) => {
					res.send(req.getHeaderValueOrThrow("X-User"));
				});
				expect(
					send(app, "GET", "/whoami", { headers: { "x-user": "Maverick" } })
						.body,
				).toBe("Maverick");
			});

			test("response headers set by handlers are returned", () => {
				app.get("/headers", (_req, res) => {
					res.setHeader("X-One", "1").setHeader("Cache-Control", "no-cache");
				});
				const res = send(app, "GET", "/headers");
				expect(res.headers["x-one"]).toBe("1");
				expect(res.headers["cache-control"]).toBe("no-cache");
			});

			test("send and json set the content type", () => {
				app.get("/text", (_req, res) => {
					res.send("hi");
				});
				app.get("/json", (_req, res) => {
					res.json({ ok: true });
				});
				expect(send(app, "GET", "/text").headers["content-type"]).toBe(
					"text/plain",
				);
				expect(send(app, "GET", "/json").headers["content-type"]).toBe(
					"application/json",
				);
			});
		});

		describe("JSON", () => {
			test("a JSON request body is decoded for handlers", () => {
				app.post("/greet", (req, res) => {
					const body = req.getBodyOrThrow<{ name: string; tags: string[] }>();
					res.json({ greeting: `Hello ${body.name}`, tags: body.tags });
				});
				const res = send(app, "POST", "/greet", {
					headers: { "Content-Type": "application/json" },
					body: '{"name":"Goose","tags":["rio"]}',
				});
				expect(res.status).toBe(200);
				expect(res.headers["content-type"]).toBe("application/json");
				expect(res.body).toMatch('"greeting":"Hello Goose"', { plain: true });
				expect(res.body).toMatch('"tags":["rio"]', { plain: true });
			});

			test("a text body is passed through unchanged", () => {
				app.post("/echo", (req, res) => {
					res.send(req.getBody());
				});
				const res = send(app, "POST", "/echo", {
					headers: { "Content-Type": "text/plain" },
					body: "Example Body",
				});
				expect(res.body).toBe("Example Body");
			});

			test("invalid JSON reaches the error handler as HttpError 400", () => {
				app.useGlobalErrorHandler(httpErrorHandler);
				app.post("/greet", (req, res) => {
					res.json(req.getBody());
				});
				const res = send(app, "POST", "/greet", {
					headers: { "Content-Type": "application/json" },
					body: "{oops",
				});
				expect(res.status).toBe(400);
				expect(res.body).toBe("Invalid JSON");
			});

			test("invalid JSON is a 500 with the default error handler", () => {
				app.post("/greet", (req, res) => {
					res.json(req.getBody());
				});
				const res = send(app, "POST", "/greet", {
					headers: { "Content-Type": "application/json" },
					body: "{oops",
				});
				expect(res.status).toBe(500);
				expect(res.body).toBe("Internal Server Error");
			});

			test("a value that cannot be encoded is recorded in app.errors and answered 500", () => {
				const value = { callback: () => 1 };
				app.get("/bad-json", (_req, res) => {
					res.json(value);
				});
				const res = send(app, "GET", "/bad-json");
				expect(res.status).toBe(500);
				expect(app.errors).toHaveLength(1);
				expect(app.errors[0].value).toBe(value);
			});
		});

		describe("errors", () => {
			test("a thrown error is answered 500 Internal Server Error by default", () => {
				app.get("/throws", () => {
					throw new Error("kaboom");
				});
				const res = send(app, "GET", "/throws");
				expect(res.status).toBe(500);
				expect(res.body).toBe("Internal Server Error");
				expect(res.headers["content-type"]).toBe("text/plain");
			});

			test("a Lua error() is handled the same way", () => {
				app.get("/lua-error", () => {
					error("raw lua error");
				});
				expect(send(app, "GET", "/lua-error").status).toBe(500);
			});

			test("next(err) skips the remaining handlers and reaches the error handler", () => {
				const after = fn();
				app.useMiddleware((_req, _res, next) => {
					next(new Error("stop here"));
				});
				app.get("/x", after as unknown as AppMiddleware);
				const res = send(app, "GET", "/x");
				expect(res.status).toBe(500);
				expect(after).not.toHaveBeenCalled();
			});

			test("the default error handler ignores HttpError status", () => {
				app.get("/teapot", () => {
					throw new HttpError(HttpStatus.IM_A_TEAPOT, "short and stout");
				});
				const res = send(app, "GET", "/teapot");
				expect(res.status).toBe(500);
				expect(res.body).toBe("Internal Server Error");
			});

			test("a global error handler receives the error, request and response", () => {
				const thrown = new HttpError(HttpStatus.IM_A_TEAPOT, "short and stout");
				const handler = fn(httpErrorHandler);
				app.useGlobalErrorHandler(handler as unknown as AppErrorMiddleware);
				app.get("/teapot", () => {
					throw thrown;
				});
				const res = send(app, "GET", "/teapot");
				expect(res.status).toBe(418);
				expect(res.body).toBe("short and stout");
				expect(handler).toHaveBeenCalledTimes(1);
				const args = handler.mock.calls[0];
				expect(args[1]).toBe(thrown);
				expect((args[2] as unknown as AppHttpRequest).path).toBe("/teapot");
				expect(args[3]).toBeInstanceOf(AppHttpResponse);
			});

			test("the error handler receives next(err)'s error", () => {
				app.useGlobalErrorHandler(httpErrorHandler);
				app.get("/forbidden", (_req, _res, next) => {
					next(new HttpError(HttpStatus.FORBIDDEN, "Forbidden"));
				});
				const res = send(app, "GET", "/forbidden");
				expect(res.status).toBe(403);
				expect(res.body).toBe("Forbidden");
			});

			test("an error thrown in a later handler is caught", () => {
				app.useGlobalErrorHandler(httpErrorHandler);
				app.get(
					"/late",
					(_req, _res, next) => next(),
					() => {
						throw new HttpError(HttpStatus.CONFLICT, "late conflict");
					},
				);
				expect(send(app, "GET", "/late").status).toBe(409);
			});

			test("headers written before the error are kept", () => {
				app.useMiddleware((_req, res, next) => {
					res.setHeader("X-Request-Id", "123");
					next();
				});
				app.get("/throws", () => {
					throw new Error("kaboom");
				});
				const res = send(app, "GET", "/throws");
				expect(res.status).toBe(500);
				expect(res.headers["x-request-id"]).toBe("123");
			});

			test("thrown getter errors from OrThrow helpers are routed to the error handler", () => {
				app.useGlobalErrorHandler(httpErrorHandler);
				app.get("/need-header", (req, res) => {
					req.getHeaderValueOrThrow(
						"Authorization",
						new HttpError(HttpStatus.UNAUTHORIZED, "Missing Authorization"),
					);
					res.send("ok");
				});
				const res = send(app, "GET", "/need-header");
				expect(res.status).toBe(401);
				expect(res.body).toBe("Missing Authorization");
			});

			test("the last registered global error handler wins", () => {
				app.useGlobalErrorHandler((_err, _req, res) => {
					res.status(HttpStatus.BAD_GATEWAY).send("first");
				});
				app.useGlobalErrorHandler((_err, _req, res) => {
					res.status(HttpStatus.GATEWAY_TIMEOUT).send("second");
				});
				app.get("/throws", () => {
					throw new Error("x");
				});
				const res = send(app, "GET", "/throws");
				expect(res.status).toBe(504);
				expect(res.body).toBe("second");
			});
		});

		describe("isolation", () => {
			test("state does not leak between requests", () => {
				let count = 0;
				app.get("/count", (req, res) => {
					count++;
					res.send(`${count}:${req.getQueryParameterValue("v") ?? "none"}`);
				});
				expect(send(app, "GET", "/count?v=a").body).toBe("1:a");
				expect(send(app, "GET", "/count").body).toBe("2:none");
			});
		});
	});
}

describe("Application (dispatch only)", () => {
	let app: Application;

	beforeEach(() => {
		app = new Application("127.0.0.1", 0);
	});

	afterEach(() => {
		app.close();
		restoreAllMocks();
		Logger.level = LogLevel.INFO;
	});

	test("the handler returns the same response object it was given", () => {
		app.get("/", (_req, res) => {
			res.send("root");
		});
		const res = { status: 404, headers: {} };
		const returned = dispatchRaw(app, makeRequest("GET", "/"), res);
		expect(returned).toBe(res);
		expect(res).toEqual({
			status: 200,
			headers: { "Content-Type": "text/plain" },
			body: "root",
		});
	});

	test("the default response is left untouched when nothing matches", () => {
		const res = { status: 404, headers: {} };
		dispatchRaw(app, makeRequest("GET", "/nope"), res);
		expect(res).toEqual({ status: 404, headers: {} });
	});

	test("an error thrown by the error handler propagates out of the request handler", () => {
		app.useGlobalErrorHandler(() => {
			throw new Error("error handler failed");
		});
		app.get("/throws", () => {
			throw new Error("kaboom");
		});
		expect(() => dispatch(app, "GET", "/throws")).toThrow(
			"error handler failed",
		);
	});

	test("errors starts empty", () => {
		expect(app.errors).toEqual([]);
	});

	test("logs its progress at debug level", () => {
		Logger.level = LogLevel.DEBUG;
		const debug = spyOn(Logger.transports, "debug");
		app.get("/logged", (_req, res) => {
			res.send("ok");
		});
		dispatch(app, "GET", "/logged");
		expect(debug).toHaveBeenCalledWith(
			anything(),
			"[DEBUG] [Application] - Handling Request",
		);
		expect(debug).toHaveBeenCalledWith(
			anything(),
			"[DEBUG] [Application] - Found 1 handlers to process",
		);
		expect(debug).toHaveBeenCalledWith(
			anything(),
			stringContaining("[DEBUG] [Path] - "),
		);
	});
});
