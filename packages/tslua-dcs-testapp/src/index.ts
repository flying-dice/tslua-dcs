_G.print = env.info;

import { HttpServer } from "@flying-dice/tslua-http";

declare global {
	let functionId: number;
	let app: HttpServer;
}

if (app) {
	env.info("Closing existing app");
	app.close();
}

app = new HttpServer("127.0.0.1", 1631, (req, res) => {
	res.body = "Hello World!";
	res.status = 200;
	return res;
});

env.info("Starting app");

if (functionId) {
	env.info(`Removing existing function ${functionId}`);
	timer.removeFunction(functionId);
}

functionId = timer.scheduleFunction(
	() => {
		try {
			app.acceptNextClient();
		} catch (e) {
			env.error(`Error accepting client: ${e}`);
		}

		return (timer.getTime() as number) + 0.1;
	},
	[],
	(timer.getTime() as number) + 0.1,
);

env.info(`Started server loop with functionId ${functionId}`);
