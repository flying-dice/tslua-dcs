import { Logger } from "@flying-dice/tslua-common";
import * as socket from "socket";
import { TCP } from "socket";
import { CRLF } from "./constants";
import { HttpRequest, readRequestHead } from "./request";
import { HttpResponse, assembleResponseString } from "./response";

export type RequestHandler = (
	req: HttpRequest,
	res: HttpResponse,
) => HttpResponse;

/**
 * Represents an HTTP server.
 * This class encapsulates the functionality required for creating and
 * managing an HTTP server, including binding to a network address,
 * accepting client connections, and handling client requests.
 *
 * @example
 * // Example of creating and starting an HttpServer with a handler which returns 200 for all requests
 * const httpServer = new HttpServer('127.0.0.1', 8080, (req, res) => { res.status = 200; return res; });
 * while(true) {
 *   httpServer.acceptNextClient();
 * }
 */
export class HttpServer {
	/**
	 * The underlying TCP server.
	 * @protected
	 */
	protected server: TCP;

	protected logger: Logger;

	/**
	 * Creates an instance of a HTTP server.
	 * @param {string} bindAddress - The IP address or hostname the server will bind to.
	 * @param {number} port - The port number the server will listen on.
	 * @param {RequestHandler} handler - The request handler to be used when serving requests
	 */
	constructor(
		bindAddress: string,
		port: number,
		protected readonly handler: RequestHandler,
	) {
		this.logger = new Logger("HttpServer");

		this.server = socket.bind(bindAddress, port);
		this.server.settimeout(0);
	}

	close() {
		this.server.close();
	}

	/**
	 * Accepts the next client connection.
	 * When a client connects, it handles the client's request.
	 *
	 * @example
	 * // Accept and handle the next client
	 * httpServer.acceptNextClient();
	 */
	acceptNextClient() {
		// if (this.currentClient) return;
		const client = this.server.accept();
		if (client) {
			try {
				this.logger.debug("Handling client");
				this.handleClient(client);
			} catch (e) {
				this.logger.error(`Error handling client: ${e}`);
			} finally {
				this.logger.debug("Closing client");
				client.close();
			}
		}
	}

	/**
	 * Handles the client's request.
	 * Reads the request from the client, processes it, and sends back a response.
	 *
	 * @param {TCP} client - The client to handle.
	 *
	 * @private
	 *
	 * @example
	 * // Internally used to handle a client's request
	 * this.handleClient(client);
	 */
	private handleClient(client: TCP): void {
		const requestHeadLines: string[] = [];
		let lastReceived;
		this.logger.debug("Handling client");
		client.settimeout(2);

		do {
			const received = client.receive("*l");
			if (typeof received === "string") {
				requestHeadLines.push(received);
			}
			lastReceived = received;
			if (received === undefined) {
				throw new Error("Client returned unexpected value, terminating");
			}
		} while (lastReceived !== "");

		this.logger.debug("Received request head");
		const request = readRequestHead(requestHeadLines.join(CRLF));

		const contentLength = request.headers["Content-Length"];
		const contentLengthNum = tonumber(contentLength);
		if (contentLengthNum && contentLengthNum > 0) {
			this.logger.debug(
				`Fetching request body ${request.headers["Content-Length"]}`,
			);

			client.settimeout(2);
			request.body = client.receive(contentLengthNum) as string;
		}

		this.logger.debug("Handling request");
		const response: HttpResponse = this.handler(request, {
			status: 404,
			headers: {},
		});

		this.logger.debug("Assembling response");
		const responseString = assembleResponseString(response);

		this.logger.debug("Sending response");
		client.send(responseString);
	}
}
