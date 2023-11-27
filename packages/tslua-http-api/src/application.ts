import {
	HttpRequest,
	HttpResponse,
	HttpServer,
	HttpStatus,
	RequestHandler,
} from "@flying-dice/tslua-http";
import { getPathParameters, isMatch } from "./path";

export class Application extends HttpServer {
	protected requestHandlers: {
		route: string;
		method?: string;
		requestHandler: RequestHandler;
	}[];

	constructor(bindAddress: string, port: number) {
		super(bindAddress, port, (req: HttpRequest, res: HttpResponse) =>
			this.handleRequest(req, res),
		);
		this.requestHandlers = [];
	}

	use(route: string, requestHandler: RequestHandler) {
		this.requestHandlers.push({ route, requestHandler });
	}

	get(route: string, requestHandler: RequestHandler) {
		this.requestHandlers.push({ route, requestHandler, method: "GET" });
	}

	put(route: string, requestHandler: RequestHandler) {
		this.requestHandlers.push({ route, requestHandler, method: "PUT" });
	}

	post(route: string, requestHandler: RequestHandler) {
		this.requestHandlers.push({ route, requestHandler, method: "POST" });
	}

	delete(route: string, requestHandler: RequestHandler) {
		this.requestHandlers.push({ route, requestHandler, method: "DELETE" });
	}

	patch(route: string, requestHandler: RequestHandler) {
		this.requestHandlers.push({ route, requestHandler, method: "PATCH" });
	}

	options(route: string, requestHandler: RequestHandler) {
		this.requestHandlers.push({ route, requestHandler, method: "OPTIONS" });
	}

	private handleRequest(req: HttpRequest, res: HttpResponse): HttpResponse {
		print("Handling Request");

		const stack = this.requestHandlers.filter(
			(it) =>
				(!it.method || it.method === req.method) && isMatch(it.route, req.path),
		);

		print(`Found ${stack.length} handlers to process`);

		if (stack.length > 0) {
			res.status = HttpStatus.OK;
		}

		stack.forEach((it) => {
			req.parameters = getPathParameters(it.route, req.path);
			it.requestHandler(req, res);
		});

		return res;
	}
}
