/**
 * Smoke test of the built bundle: dist/tslua-testapp.lua is loaded unmodified on lua51 with the DCS
 * mission-environment doubles preloaded (see packages/tslua-dcs-mission-types_test/README.md), then a
 * real LuaSocket client talks to the HTTP server it starts, while the doubles' timer drives the
 * server loop the way DCS's scheduler would.
 */
import { afterAll, describe, expect, test } from "@flying-dice/tslua-luatest";
import type { DcsDoubles } from "../../tslua-dcs-mission-types_test/doubles/control";

interface ClientSocket {
	settimeout(this: ClientSocket, seconds: number): void;
	send(this: ClientSocket, data: string): number | undefined;
	receive(
		this: ClientSocket,
		pattern: "*a",
	): LuaMultiReturn<
		[string | undefined, string | undefined, string | undefined]
	>;
	close(this: ClientSocket): void;
}

interface SocketModule {
	connect(
		this: void,
		host: string,
		port: number,
	): LuaMultiReturn<[ClientSocket | undefined, string | undefined]>;
}

const doubles = (_G as unknown as { dcsDoubles: DcsDoubles }).dcsDoubles;
const socket = require("socket") as SocketModule;
const globals = _G as unknown as Record<string, unknown>;

/** Runs the bundle like a DCS "DO SCRIPT FILE", keeping the runner's print (the bundle replaces it). */
function loadBundle(): void {
	const print = globals.print;
	try {
		dofile("dist/tslua-testapp.lua");
	} finally {
		globals.print = print;
	}
}

function messages(): string[] {
	return doubles.log().map((entry) => entry.message);
}

function request(path: string): string {
	const [client, connectError] = socket.connect("127.0.0.1", 1631);
	if (!client) error(`cannot connect to the test app: ${connectError}`);
	const connection = client as ClientSocket;
	connection.settimeout(5);
	connection.send(`GET ${path} HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n`);
	// The request is buffered by the OS; the next timer tick accepts and answers it.
	doubles.advanceTime(0.1);
	const [body, receiveError, partial] = connection.receive("*a");
	connection.close();
	if (body === undefined) error(`no response: ${receiveError} (${partial})`);
	return body as string;
}

describe("tslua-dcs-testapp bundle", () => {
	afterAll(() => {
		const app = globals.app as { close(this: unknown): void } | undefined;
		app?.close();
		timer.removeFunction(globals.functionId as number);
	});

	test("loads on lua51 and starts its server loop", () => {
		doubles.reset();
		loadBundle();
		expect(messages()).toEqual([
			"Starting app",
			"Started server loop with functionId 1",
		]);
		expect(globals.functionId).toBe(1);
	});

	test("answers HTTP requests from the scheduled accept loop", () => {
		const response = request("/");
		expect(response).toMatch("^HTTP/1%.1 200");
		expect(response).toContain("Hello World!");
	});

	test("keeps accepting requests on later ticks", () => {
		expect(request("/again")).toContain("Hello World!");
	});

	test("reloading closes the previous server and schedule", () => {
		loadBundle();
		expect(messages()).toContain("Closing existing app");
		expect(messages()).toContain("Removing existing function 1");
		expect(globals.functionId).toBe(2);
		expect(request("/after-reload")).toContain("Hello World!");
	});
});
