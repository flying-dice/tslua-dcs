import { socket, TCP } from "socket";
import { assembleResponseString, HttpResponse } from "./response";

const server = socket.bind("127.0.0.1", 3000);
server.settimeout(0);

const clients: Record<number, { id: number; handler: LuaThread; client: TCP }> =
	{};
let clientIdSequence = 1;

const getClientId = () => {
	const id = clientIdSequence;
	clientIdSequence = clientIdSequence + 1;
	return id;
};
const createClientHandler = () =>
	coroutine.create((id: string, client: TCP) => {
		const [received, err] = coroutine.yield("*l");

		// @ts-ignore
		console.log(received);

		const response: HttpResponse = { status: 500, headers: {} };

		client.send(assembleResponseString(response));

		client.close();
	});

const registerNewClients = () => {
	const client = server.accept();
	if (client) {
		client.settimeout(0);
		const id = getClientId();
		const handler = createClientHandler();
		clients[id] = { id, handler, client };
	}
};

const receiveAndResumeClients = () => {
	for (const clientObj of Object.values(clients)) {
		if (coroutine.status(clientObj.handler) === "suspended") {
			const [line, err] = clientObj.client.receive("*l");

			if (err && err === "closed") {
				delete clients[clientObj.id];
			} else if (err) {
			} else {
				coroutine.resume(clientObj.handler, line);
			}
		}
	}
};

const doRxLoop = () => {
	registerNewClients();
	receiveAndResumeClients();
};

// Start loop
doRxLoop();
