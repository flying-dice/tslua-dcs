import { Logger } from "@flying-dice/tslua-common";
import {
	HttpRequest,
	HttpResponse,
	HttpServer,
	HttpStatus,
	StatusText,
} from "@flying-dice/tslua-http";
import * as json from "@flying-dice/tslua-rxi-json";
import { getPathParameters, isMatch } from "./path";

export class AppHttpResponse {
	protected logger = new Logger("AppHttpResponse");

	constructor(public readonly res: HttpResponse) {}

	status(status: HttpStatus): this {
		this.res.status = +status;
		return this;
	}

	send(data: string): this {
		this.res.headers["Content-Type"] = "text/plain";
		this.res.body = data;
		return this;
	}

	json(value: any): this {
		this.res.headers["Content-Type"] = "application/json";
		this.res.body = json.encode(value);
		return this;
	}
}

export type AppMiddleware = (
	req: HttpRequest,
	res: AppHttpResponse,
	next: (err?: Error) => void,
) => void;

export type AppErrorMiddleware = <T = Error>(
	err: T,
	req: HttpRequest,
	res: AppHttpResponse,
) => void;

/**
 * A class representing a web application, extending the functionality of HttpServer.
 */
export class Application extends HttpServer {
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

		const appResponse = new AppHttpResponse(res);

		try {
			const runStackItem = (idx: number) => {
				if (idx < stack.length) {
					req.parameters = getPathParameters(stack[idx].route, req.path);
					stack[idx].middleware(req, appResponse, (err) => {
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
			this.errorMiddleware(e, req, appResponse);
		}

		return appResponse.res;
	}
}
