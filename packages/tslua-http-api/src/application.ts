import {
	HttpRequest,
	HttpResponse,
	HttpServer,
	HttpStatus,
} from "@flying-dice/tslua-http";
import * as json from "@flying-dice/tslua-rxi-json";
import { getPathParameters, isMatch } from "./path";

export class AppHttpResponse {
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

export type AppRequestHandler = (
	req: HttpRequest,
	res: AppHttpResponse,
	next: (err?: Error) => void,
) => void;

/**
 * A class representing a web application, extending the functionality of HttpServer.
 */
export class Application extends HttpServer {
	protected requestHandlers: {
		route: string;
		method?: string;
		requestHandler: AppRequestHandler;
	}[];

	/**
	 * Constructs a new Application instance.
	 * @param bindAddress The network address the server will bind to.
	 * @param port The port number the server will listen on.
	 */
	constructor(bindAddress: string, port: number) {
		super(bindAddress, port, (req: HttpRequest, res: HttpResponse) =>
			this.handleRequest(req, res),
		);
		this.requestHandlers = [];
	}

	/**
	 * Registers a request handler for all HTTP methods on a specific route.
	 * @param route The route pattern to match.
	 * @param requestHandler The handler function to execute.
	 */
	use(route: string, requestHandler: AppRequestHandler) {
		this.requestHandlers.push({ route, requestHandler });
	}

	// Below methods are similar, they register a request handler for a specific HTTP method.

	/**
	 * Registers a GET request handler.
	 */
	get(route: string, requestHandler: AppRequestHandler) {
		this.requestHandlers.push({ route, requestHandler, method: "GET" });
	}

	/**
	 * Registers a PUT request handler.
	 */
	put(route: string, requestHandler: AppRequestHandler) {
		this.requestHandlers.push({ route, requestHandler, method: "PUT" });
	}

	/**
	 * Registers a POST request handler.
	 */
	post(route: string, requestHandler: AppRequestHandler) {
		this.requestHandlers.push({ route, requestHandler, method: "POST" });
	}

	/**
	 * Registers a DELETE request handler.
	 */
	delete(route: string, requestHandler: AppRequestHandler) {
		this.requestHandlers.push({ route, requestHandler, method: "DELETE" });
	}

	/**
	 * Registers a PATCH request handler.
	 */
	patch(route: string, requestHandler: AppRequestHandler) {
		this.requestHandlers.push({ route, requestHandler, method: "PATCH" });
	}

	/**
	 * Registers an OPTIONS request handler.
	 */
	options(route: string, requestHandler: AppRequestHandler) {
		this.requestHandlers.push({ route, requestHandler, method: "OPTIONS" });
	}

	/**
	 * Internal method to handle incoming HTTP requests.
	 * @param req The HttpRequest object.
	 * @param res The HttpResponse object.
	 * @returns The HttpResponse object after processing.
	 */
	private handleRequest(req: HttpRequest, res: HttpResponse): HttpResponse {
		print("Handling Request");

		// Filters the request handlers to match the current request's path and method.
		const stack = this.requestHandlers.filter(
			(it) =>
				(!it.method || it.method === req.method) && isMatch(it.route, req.path),
		);

		print(`Found ${stack.length} handlers to process`);

		// Sets OK status if any handlers are found.
		if (stack.length > 0) {
			res.status = HttpStatus.OK;
		}

		const appResponse = new AppHttpResponse(res);

		const runStackItem = (idx: number) => {
			if (idx < stack.length) {
				req.parameters = getPathParameters(stack[idx].route, req.path);
				stack[idx].requestHandler(req, appResponse, () =>
					runStackItem(idx + 1),
				);
			}
		};

		if (stack.length > 0) runStackItem(0);

		return appResponse.res;
	}
}
