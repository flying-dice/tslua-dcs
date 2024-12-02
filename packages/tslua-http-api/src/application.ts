import { Logger } from "@flying-dice/tslua-common";
import {
	type HttpRequest,
	type HttpResponse,
	HttpServer,
	HttpStatus,
	StatusText,
} from "@flying-dice/tslua-http";
import * as json from "@flying-dice/tslua-rxi-json";
import { HttpError } from "./errors";
import { getPathParameters, isMatch } from "./path";

export class AppHttpRequest<PARAMS = any, QUERY = any, BODY = any> {
	protected logger = new Logger("AppHttpRequest");

	get query(): QUERY {
		return this.req.parameters as QUERY;
	}

	get body(): BODY | undefined {
		if (!this.req.body) return undefined;

		// Body Parse JSON
		if (
			this.getHeaderValue("content-type") === "application/json" ||
			this.getHeaderValue("Content-Type") === "application/json"
		) {
			try {
				return json.decode(this.req.body) as BODY;
			} catch (e) {
				this.logger.error(`Error parsing JSON: ${e}`);
				throw new HttpError(HttpStatus.BAD_REQUEST, "Invalid JSON");
			}
		}

		return this.req.body as BODY;
	}

	get params(): PARAMS {
		return this.__params as PARAMS;
	}

	__params: Record<string, string>;

	get headers() {
		return this.req.headers;
	}

	get method() {
		return this.req.method;
	}

	get originalUrl() {
		return this.req.originalUrl;
	}

	get protocol() {
		return this.req.protocol;
	}

	get path() {
		return this.req.path;
	}

	constructor(
		private readonly app: Application,
		public readonly req: HttpRequest,
		pathParams: Record<string, string>,
	) {
		this.__params = pathParams;
	}

	getHeaderValue<T>(key: string) {
		return this.req.headers[key] as T;
	}

	getHeaderValueOrThrow<T>(
		key: string,
		error = new Error("Header is not defined"),
	) {
		if (this.req.headers[key] === undefined) {
			throw error;
		}
		return this.req.headers[key] as T;
	}

	getBody<T = string>() {
		return this.body as T;
	}

	getBodyOrThrow<T = string>(error = new Error("Body is not defined")) {
		if (this.body === undefined) {
			throw error;
		}
		return this.body as T;
	}

	getQueryParameterValue<T = string>(key: string) {
		return this.req.parameters[key] as T;
	}

	getQueryParameterValueOrThrow<T = string>(
		key: string,
		error = new Error("Query parameter is not defined"),
	) {
		if (this.req.parameters[key] === undefined) {
			throw error;
		}
		return this.req.parameters[key] as T;
	}

	getPathParameterValue<T = string>(key: string) {
		return this.__params[key] as T;
	}

	getPathParameterValueOrThrow<T = string>(
		key: string,
		error = new Error("Path parameter is not defined"),
	) {
		if (this.__params[key] === undefined) {
			throw error;
		}
		return this.__params[key] as T;
	}
}

/**
 * A class representing an HTTP response, extending the functionality of HttpResponse.
 */
export class AppHttpResponse<RESPONSE = any> {
	protected logger = new Logger("AppHttpResponse");

	constructor(
		private readonly app: Application,
		public readonly res: HttpResponse,
	) {}

	/**
	 * Sets the HTTP status code.
	 * @example
	 * res.status(HttpStatus.OK);
	 *
	 * @param status The HTTP status code.
	 */
	status(status: HttpStatus): this {
		this.res.status = +status;
		return this;
	}

	/**
	 * Sends a plain text response.
	 *
	 * @example
	 * res.send("Hello World!");
	 *
	 * @param data The data to send.
	 */
	send(data: string): this {
		this.res.headers["Content-Type"] = "text/plain";
		this.res.body = data;
		return this;
	}

	/**
	 * Sends a JSON response.
	 *
	 * @example
	 * res.json({ status: "OK" });
	 *
	 * @param value The value to encode as JSON.
	 */
	json<T = RESPONSE>(value: T): this {
		this.res.headers["Content-Type"] = "application/json";
		try {
			this.res.body = json.encode(value);
			return this;
		} catch (e) {
			this.app.errors.push({ error: e as Error, value });
			throw e;
		}
	}

	/**
	 * Sets a header value.
	 *
	 * @example
	 * res.setHeader("X-My-Header", "My Value");
	 *
	 * @param key The header key.
	 * @param value The header value.
	 */
	setHeader(key: string, value: string): this {
		this.res.headers[key] = value;
		return this;
	}
}

export type AppMiddleware = (
	req: AppHttpRequest,
	res: AppHttpResponse,
	next: (err?: Error) => void,
) => void;

export type AppErrorMiddleware = <T = Error>(
	err: T,
	req: AppHttpRequest,
	res: AppHttpResponse,
) => void;

/**
 * A class representing a web application, extending the functionality of HttpServer.
 */
export class Application extends HttpServer {
	public errors: { error: Error; [key: string]: any }[] = [];

	protected requestHandlers: {
		route: string;
		method?: string;
		middleware: AppMiddleware;
	}[];

	protected errorMiddleware: AppErrorMiddleware;

	protected logger: Logger;

	/**
	 * Constructs a new Application instance.
	 * @param bindAddress The network address the server will bind to.
	 * @param port The port number the server will listen on.
	 */
	constructor(bindAddress: string, port: number) {
		super(bindAddress, port, (req: HttpRequest, res: HttpResponse) =>
			this.handleRequest(req, res),
		);
		this.logger = new Logger(Application.name);
		this.requestHandlers = [];
		this.errorMiddleware = (err, req, res) => {
			res
				.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.send(StatusText[HttpStatus.INTERNAL_SERVER_ERROR]);
		};
	}

	/**
	 * Registers a request handler for all HTTP methods on a specific route.
	 * @param route The route pattern to match.
	 * @param middleware The handler function to execute.
	 */
	use(route: string, ...middleware: AppMiddleware[]) {
		middleware.forEach((it) =>
			this.requestHandlers.push({ route, middleware: it }),
		);
	}

	useGlobalErrorHandler(middleware: AppErrorMiddleware) {
		this.errorMiddleware = middleware;
	}

	// Below methods are similar, they register a request handler for a specific HTTP method.

	/**
	 * Registers a GET request handler.
	 */
	get(route: string, ...middleware: AppMiddleware[]) {
		middleware.forEach((it) =>
			this.requestHandlers.push({ route, middleware: it, method: "GET" }),
		);
	}

	/**
	 * Registers a PUT request handler.
	 */
	put(route: string, ...middleware: AppMiddleware[]) {
		middleware.forEach((it) =>
			this.requestHandlers.push({ route, middleware: it, method: "PUT" }),
		);
	}

	/**
	 * Registers a POST request handler.
	 */
	post(route: string, ...middleware: AppMiddleware[]) {
		middleware.forEach((it) =>
			this.requestHandlers.push({ route, middleware: it, method: "POST" }),
		);
	}

	/**
	 * Registers a DELETE request handler.
	 */
	delete(route: string, ...middleware: AppMiddleware[]) {
		middleware.forEach((it) =>
			this.requestHandlers.push({ route, middleware: it, method: "DELETE" }),
		);
	}

	/**
	 * Registers a PATCH request handler.
	 */
	patch(route: string, ...middleware: AppMiddleware[]) {
		middleware.forEach((it) =>
			this.requestHandlers.push({ route, middleware: it, method: "PATCH" }),
		);
	}

	/**
	 * Registers an OPTIONS request handler.
	 */
	options(route: string, ...middleware: AppMiddleware[]) {
		middleware.forEach((it) =>
			this.requestHandlers.push({ route, middleware: it, method: "OPTIONS" }),
		);
	}

	/**
	 * Internal method to handle incoming HTTP requests.
	 * @param req The HttpRequest object.
	 * @param res The HttpResponse object.
	 * @returns The HttpResponse object after processing.
	 */
	private handleRequest(req: HttpRequest, res: HttpResponse): HttpResponse {
		this.logger.debug("Handling Request");

		// Filters the request handlers to match the current request's path and method.
		const stack = this.requestHandlers.filter(
			(it) =>
				(!it.method || it.method === req.method) && isMatch(it.route, req.path),
		);

		this.logger.debug(`Found ${stack.length} handlers to process`);

		// Sets OK status if any handlers are found.
		if (stack.length > 0) {
			res.status = HttpStatus.OK;
		}

		const appRequest = new AppHttpRequest(this, req, {});
		const appResponse = new AppHttpResponse(this, res);

		try {
			const runStackItem = (idx: number) => {
				if (idx < stack.length) {
					appRequest.__params = getPathParameters(stack[idx].route, req.path);
					stack[idx].middleware(appRequest, appResponse, (err) => {
						if (!err) {
							runStackItem(idx + 1);
						} else {
							throw err;
						}
					});
				}
			};

			if (stack.length > 0) runStackItem(0);
		} catch (e) {
			this.errorMiddleware(e, appRequest, appResponse);
		}

		return appResponse.res;
	}
}
