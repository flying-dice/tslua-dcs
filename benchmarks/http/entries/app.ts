/** @noSelfInFile */
/**
 * Benchmark variant: the Express-style `Application` from tslua-http-api, used the way its README shows
 * (routes with a path parameter, `res.json`, `res.send`, `getBody`). The same source is compiled against the
 * baseline and the current tree; the baseline ignores the options argument.
 */
import { Application } from "@flying-dice/tslua-http-api";
import { BIG_BODY, type Instance, optionsFor } from "./common";

type AppConstructor = new (
	bindAddress: string,
	port: number,
	options?: object,
) => Application;

export function create(port: number, profile: string): Instance {
	const app = new (Application as unknown as AppConstructor)(
		"127.0.0.1",
		port,
		optionsFor(profile),
	);

	app.get("/health", (_req, res) => {
		res.send("OK");
	});

	app.get("/units/:id", (req, res) => {
		const id = req.getPathParameterValue("id");
		res.json({ id, name: `Unit ${id}`, alive: true });
	});

	app.post("/echo", (req, res) => {
		res.send(req.getBody());
	});

	app.get("/big", (_req, res) => {
		res.send(BIG_BODY);
	});

	return {
		step: () => app.acceptNextClient(),
		close: () => app.close(),
	};
}
