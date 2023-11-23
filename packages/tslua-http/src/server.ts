import * as socket from "socket";
import { TCP } from "socket";
import { CRLF } from "./constants";
import { readRequestHead } from "./request";
import { HttpResponse, assembleResponseString } from "./response";

export class HttpServer {
	protected server: TCP;

	constructor(bindAddress: string, port: number) {
		this.server = socket.bind(bindAddress, port);
		this.server.settimeout(0);
	}

	acceptNextClient() {
		const client = this.server.accept();
		if (client) {
			this.handleClient(client);
		}
	}

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
