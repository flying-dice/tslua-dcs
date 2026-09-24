_G.print = env.info;

import { HttpServer } from "@flying-dice/tslua-http";

declare global {
	let functionId: number;
	let app: HttpServer;
}

/** Simulation seconds between pumps. Each pump advances every open connection, not just one client. */
const PUMP_INTERVAL = 0.1;

if (app) {
	env.info("Closing existing app");
	app.close();
}

// Deadlines use the default wall clock (socket.gettime), not simulation time, so they keep running while
// the mission is paused. Pumping is driven by a mission timer, which does not fire while paused.
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
			app.pump();
		} catch (e) {
			env.error(`Error pumping HTTP server: ${e}`);
		}

		return (timer.getTime() as number) + PUMP_INTERVAL;
	},
	[],
	(timer.getTime() as number) + PUMP_INTERVAL,
);

env.info(`Started server loop with functionId ${functionId}`);
