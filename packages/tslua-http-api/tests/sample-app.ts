import {
	afterAll,
	beforeAll,
	describe,
	expect,
	test,
} from "@flying-dice/tslua-luatest";
import type { Application } from "../src";
import { createSampleApp } from "../src/sample-app";
import { transports } from "./helpers";

/**
 * The HTTP integration suite that used to run with vitest and axios against `lua51 test-app.lua`,
 * now run in-process against the same sample app: once through the request handler and once over
 * a real loopback socket.
 */
const SAFE_IDS = [
	"Ground-1",
	"Ground_2",
	"Ground~3",
	"Ground.4",
	"Ground!5",
	"Ground$6",
	"Ground'7",
	"Ground(8)",
	"Ground*9",
	"Ground+10",
	"Ground,11",
	"Ground;12",
	"Ground=13",
];

/** Each value paired with `encodeURIComponent(value)`. */
const UNSAFE_IDS: [string, string][] = [
	["Aerobatics #003", "Aerobatics%20%23003"],
	["Flight&Navigation", "Flight%26Navigation"],
	["Weather%Conditions", "Weather%25Conditions"],
	["Altitude@10000ft", "Altitude%4010000ft"],
	["Speed:500knots", "Speed%3A500knots"],
	["Direction<North>", "Direction%3CNorth%3E"],
	["Landing*Procedure", "Landing*Procedure"],
	["Takeoff(Sequence)", "Takeoff(Sequence)"],
	["Fuel+Capacity", "Fuel%2BCapacity"],
	["Payload,Weight", "Payload%2CWeight"],
	["Route;Path", "Route%3BPath"],
	["Emergency=Protocol", "Emergency%3DProtocol"],
];

/** The JSON text of `{ id }`, for ids that need no JSON escaping. */
const idJson = (id: string) => `{"id":"${id}"}`;

for (const { name, send } of transports) {
	describe(`Sample app routing (${name})`, () => {
		let app: Application;

		beforeAll(() => {
			app = createSampleApp("127.0.0.1", 0);
		});

		afterAll(() => app.close());

		test("should add header to each request due to wildcard middleware", () => {
			const res = send(app, "GET", "/api/users");
			expect(res.status).toBe(200);
			expect(res.headers["x-request-id"]).toBe("123");
		});

		test("should add the middleware header to 404 responses too", () => {
			const res = send(app, "GET", "/api/invalid-path");
			expect(res.headers["x-request-id"]).toBe("123");
		});

		test("should route to get endpoint with no params", () => {
			const res = send(app, "GET", "/api/users");
			expect(res.status).toBe(200);
			expect(res.body).toContain("John Doe");
			expect(res.body).toContain("Jane Gray");
		});

		test("should route to get endpoint with 1 param", () => {
			const res = send(app, "GET", "/api/users/JOHN");
			expect(res.status).toBe(200);
			expect(res.body).toBe("name: John Doe");
		});

		test("should route to nested get endpoint with 2 params (John)", () => {
			const res = send(app, "GET", "/api/users/JOHN/comments/JOHN_C_1");
			expect(res.status).toBe(200);
			expect(res.body).toBe("Hello World!");
		});

		test("should route to nested get endpoint with 2 params (Jane)", () => {
			const res = send(app, "GET", "/api/users/JANE/comments/JANE_C_2");
			expect(res.status).toBe(200);
			expect(res.body).toBe("Janes second comment.");
		});

		test("should return 404 for a non existent comment", () => {
			const res = send(app, "GET", "/api/users/JOHN/comments/JANE_C_2");
			expect(res.status).toBe(404);
			expect(res.body).toBe("Not Found");
		});

		test("should return 404 for a non existent user", () => {
			const res = send(app, "GET", "/api/users/DAVE");
			expect(res.status).toBe(404);
			expect(res.body).toBe("Not Found");
		});

		test("should return 404 for a non existent route", () => {
			const res = send(app, "GET", "/api/invalid-path");
			expect(res.status).toBe(404);
		});

		test("should echo body of request for post", () => {
			const res = send(app, "POST", "/api/users", {
				headers: { "Content-Type": "text/plain" },
				body: "Example Body",
			});
			expect(res.status).toBe(200);
			expect(res.body).toBe("Example Body");
		});

		test("should return json response", () => {
			const res = send(app, "GET", "/health");
			expect(res.status).toBe(200);
			expect(res.headers["content-type"]).toBe("application/json");
			expect(res.body).toBe('{"status":"OK"}');
		});

		describe("Unsafe encoded URI components tests using :id parameter", () => {
			for (const [value, encoded] of UNSAFE_IDS) {
				test(`should navigate for unsafe encoded string ${value}`, () => {
					const res = send(app, "GET", `/complex/${encoded}`);
					expect(res.status).toBe(200);
					expect(res.body).toBe(idJson(encoded));
				});
			}
		});

		describe("Safe URI components tests using dynamic :id parameter", () => {
			for (const id of SAFE_IDS) {
				test(`should navigate for safe string ${id}`, () => {
					const res = send(app, "GET", `/complex/${id}`);
					expect(res.status).toBe(200);
					expect(res.body).toBe(idJson(id));
				});
			}
		});

		describe("Safe URI components tests using fixed string in app.get", () => {
			for (const id of SAFE_IDS) {
				test(`should navigate to fixed-complex/${id}`, () => {
					const res = send(app, "GET", `/fixed-complex/${id}`);
					expect(res.status).toBe(200);
					expect(res.body).toBe(idJson(id));
				});
			}

			test("should not treat fixed route characters as patterns", () => {
				expect(send(app, "GET", "/fixed-complex/GroundX4").status).toBe(404);
				expect(send(app, "GET", "/fixed-complex/Groun9").status).toBe(404);
			});
		});

		test("should resolve double parameterized", () => {
			const res = send(app, "GET", "/groups/Ground-1/units/Ground-1-1");
			expect(res.status).toBe(200);
			expect(res.headers["content-type"]).toBe("application/json");
			// Key order in an encoded object is not specified: check both members.
			expect(res.body).toMatch('"groupId":"Ground-1"', { plain: true });
			expect(res.body).toMatch('"unitId":"Ground-1-1"', { plain: true });
			expect(res.body).toHaveLength(
				'{"groupId":"Ground-1","unitId":"Ground-1-1"}'.length,
			);
		});

		test("should reject access to secure endpoint without auth", () => {
			const res = send(app, "GET", "/secure");
			expect(res.status).toBe(401);
			expect(res.body).toBe("Unauthorized");
		});

		test("should reject access to secure endpoint with the wrong token", () => {
			const res = send(app, "GET", "/secure", {
				headers: { Authorization: "Bearer 456" },
			});
			expect(res.status).toBe(401);
		});

		test("should grant access to secure endpoint with auth", () => {
			const res = send(app, "GET", "/secure", {
				headers: { Authorization: "Bearer 123" },
			});
			expect(res.status).toBe(200);
			expect(res.body).toBe("Secure Content");
		});

		test("should only route the sample endpoints for their methods", () => {
			expect(send(app, "DELETE", "/api/users").status).toBe(404);
			expect(send(app, "POST", "/health").status).toBe(404);
		});
	});
}
