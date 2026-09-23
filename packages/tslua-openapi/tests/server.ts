import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { Server, ServerVariable } from "../src";
import { OpenApiBuilder } from "../src/openapi3-ts/oas31";

describe("Server", () => {
	test("stores the url and description and starts with no variables", () => {
		const server = new Server("http://localhost:{port}", "Local bridge");
		expect(server).toBeInstanceOf(Server);
		expect(server.url).toBe("http://localhost:{port}");
		expect(server.description).toBe("Local bridge");
		expect(server).toEqual({
			url: "http://localhost:{port}",
			description: "Local bridge",
			variables: {},
		});
	});

	test("the description is undefined when omitted", () => {
		const server = new Server("/");
		expect(server.description).toBeUndefined();
		expect(server).toEqual({ url: "/", variables: {} });
	});

	test("each server has its own variables map", () => {
		const a = new Server("/a");
		const b = new Server("/b");
		a.addVariable("port", new ServerVariable(8080));
		expect(a.variables).not.toBe(b.variables);
		expect(b.variables).toEqual({});
	});

	test("addVariable adds variables by name, replaces an existing one and returns nothing", () => {
		const server = new Server("http://{host}:{port}");
		const port = new ServerVariable(8080);
		expect(server.addVariable("port", port)).toBeUndefined();
		server.addVariable("host", new ServerVariable("localhost"));
		server.addVariable(
			"host",
			new ServerVariable("127.0.0.1", ["127.0.0.1", "localhost"]),
		);
		expect(server.variables.port).toBe(port);
		expect(server.variables).toEqual({
			port: { default: 8080 },
			host: { default: "127.0.0.1", enum: ["127.0.0.1", "localhost"] },
		});
	});

	test("can be passed to OpenApiBuilder.addServer as a ServerObject", () => {
		const server = new Server("/api", "API");
		server.addVariable("v", new ServerVariable("1"));
		const spec = OpenApiBuilder.create().addServer(server).getSpec();
		expect(spec.servers?.[0]).toBe(server);
		expect(spec.servers).toEqual([
			{ url: "/api", description: "API", variables: { v: { default: "1" } } },
		]);
	});
});

describe("ServerVariable", () => {
	test("stores the default, enum and description", () => {
		const variable = new ServerVariable("8080", ["8080", "8081"], "Port");
		expect(variable).toBeInstanceOf(ServerVariable);
		expect(variable).toEqual({
			default: "8080",
			enum: ["8080", "8081"],
			description: "Port",
		});
	});

	test("enum and description are undefined when omitted", () => {
		const variable = new ServerVariable("x");
		expect(variable.enum).toBeUndefined();
		expect(variable.description).toBeUndefined();
		expect(variable).toEqual({ default: "x" });
	});

	test("accepts number and boolean defaults and enums", () => {
		expect(new ServerVariable(1, [1, 2])).toEqual({ default: 1, enum: [1, 2] });
		expect(new ServerVariable(true, [true, false])).toEqual({
			default: true,
			enum: [true, false],
		});
	});

	test("keeps a false default (Lua tables can hold false)", () => {
		const variable = new ServerVariable(false);
		expect(variable.default).toBe(false);
		expect(variable).toEqual({ default: false });
	});

	test("keeps the given enum array by reference", () => {
		const values = ["a", "b"];
		expect(new ServerVariable("a", values).enum).toBe(values);
	});
});
