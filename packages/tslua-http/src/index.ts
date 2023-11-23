import * as socket from "socket";
import { TCPRecvPattern } from "socket";
import { HttpResponse, assembleResponseString } from "./response";

print("Starting Server");
const server = socket.bind("127.0.0.1", 3001);

print("Setting Timeout value");
server.settimeout(0);

const clients: Record<
	number,
	{
		id: number;
		handler: LuaThread;
		client: socket.TCP;
		recvPattern: TCPRecvPattern;
	}
> = {};
let clientIdSequence = 1;

const getClientId = () => {
	const id = clientIdSequence;
	clientIdSequence = clientIdSequence + 1;
	return id;
};

const createClientHandler = () =>
	coroutine.create((id: number, client: socket.TCP) => {
		print(`[${id}] - Yielding for initial startLine`);

		do {
			const [received] = coroutine.yield("*l");
			print(`[${id}] - << ${received} from ${client.getsockname()}`);
			if (received === "") {
				break;
			}
		} while (1);

		const response: HttpResponse = { status: 200, headers: {}, body: "OK" };

		print(`[${id}] - Sending Response`);
		const responseString = assembleResponseString(response);
		print(responseString);
		print(`[${id}] - Asking Client to Send ${typeof client}`);
		print(`[${id}] - Client: ${client.getsockname()}`);

		client.send(responseString);

		print(`[${id}] - Closing Connection`);
		client.close();
	});

const registerNewClients = () => {
	const client = server.accept();
	if (client) {
		print("New Client Found, Creating Handler");
		print("Setting Timeout");
		client.settimeout(0);

		print("Getting new ID");
		const id = getClientId();
		const handler = createClientHandler();

		print(`Handler Created with ID ${id}`);
		print(typeof client);
		print(`Client: ${client.getsockname()}`);

		clients[id] = { id, handler, client, recvPattern: "*l" };
		coroutine.resume(handler, id, client);
	}
};

const receiveAndResumeClients = () => {
	for (const { id, handler, client, recvPattern } of Object.values(clients)) {
		const status = coroutine.status(handler);
		if (status === "suspended") {
			print(`Client ${client.getsockname()} was suspended`);
			try {
				const line = client.receive(recvPattern as TCPRecvPattern);
				const [success, nextRecvPattern] = coroutine.resume(handler, line);
				clients[id].recvPattern = nextRecvPattern;
			} catch (err) {
				print(`ERROR: Caught an Error :/ ${err}`);
				delete clients[id];
			}
		}
	}
};

const doRxLoop = () => {
	registerNewClients();
	receiveAndResumeClients();
};

while (true) {
	doRxLoop();
}
