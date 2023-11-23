import * as socket from "socket";
import { TCP } from "socket";
import { CRLF } from "./constants";
import { readRequestHead } from "./request";
import { HttpResponse, assembleResponseString } from "./response";

/**
 * Represents an HTTP server.
 * This class encapsulates the functionality required for creating and
 * managing an HTTP server, including binding to a network address,
 * accepting client connections, and handling client requests.
 *
 * @example
 * // Example of creating and starting an HttpServer
 * const httpServer = new HttpServer('127.0.0.1', 8080);
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

	/**
	 * Creates an instance of an HTTP server.
	 * @param {string} bindAddress - The IP address or hostname the server will bind to.
	 * @param {number} port - The port number the server will listen on.
	 *
	 * @example
	 * // Create a new HTTP server instance
	 * const server = new HttpServer('localhost', 3000);
	 */
	constructor(bindAddress: string, port: number) {
		this.server = socket.bind(bindAddress, port);
		this.server.settimeout(0);
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
		const client = this.server.accept();
		if (client) {
			this.handleClient(client);
		}
	}

	/**
	 * Handles the client's request.
	 * Reads the request from the client, processes it, and sends back a response.
	 * @param {TCP} client - The client connection to handle.
	 * @private
	 *
	 * @example
	 * // Internally used to handle a client's request
	 * this.handleClient(client);
	 */
	private handleClient(client: TCP): void {
		const requestHeadLines: string[] = [];
		let lastReceived;
		do {
			const received = client.receive("*l");
			if (typeof received === "string") {
				requestHeadLines.push(received);
			}
			lastReceived = received;
		} while (lastReceived !== "");

		const request = readRequestHead(requestHeadLines.join(CRLF));
		if (request.headers["Content-Length"]) {
			client.settimeout(5);
			request.body = client.receive(
				+request.headers["Content-Length"],
			) as string;
		}
		const response: HttpResponse = {
			status: 200,
			headers: {},
			body: request.body,
		};
		const responseString = assembleResponseString(response);
		client.send(responseString);
		client.close();
	}
}
