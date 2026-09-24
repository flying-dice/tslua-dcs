import { HttpStatus } from "@flying-dice/tslua-http";
import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { body, responses } from "../src";
import { OpenApiBuilder, type ResponseObject } from "../src/openapi3-ts/oas31";

const jsonRef = (name: string) => ({
	"application/json": { schema: { $ref: `#/components/schemas/${name}` } },
});

describe("responses", () => {
	test("maps a status to a JSON response referencing the schema", () => {
		expect(
			responses({ [HttpStatus.OK]: [{ description: "The unit" }, "Unit"] }),
		).toEqual({
			"200": { description: "The unit", content: jsonRef("Unit") },
		});
	});

	test("maps several statuses", () => {
		expect(
			responses({
				[HttpStatus.OK]: [{ description: "OK" }, "Unit"],
				[HttpStatus.NOT_FOUND]: [{ description: "Not found" }, "Error"],
				[HttpStatus.INTERNAL_SERVER_ERROR]: [{ description: "Boom" }, "Error"],
			}),
		).toEqual({
			"200": { description: "OK", content: jsonRef("Unit") },
			"404": { description: "Not found", content: jsonRef("Error") },
			"500": { description: "Boom", content: jsonRef("Error") },
		});
	});

	test("uses string keys in the result, as OpenAPI requires", () => {
		const result = responses({
			[HttpStatus.CREATED]: [{ description: "Created" }, "Unit"],
		});
		expect(rawget(result, "201")).toBeDefined();
		expect(
			rawget(result as unknown as Record<number, unknown>, 201),
		).toBeUndefined();
	});

	test("accepts status keys written as strings", () => {
		expect(
			responses({ "204": [{ description: "No content" }, "Empty"] }),
		).toEqual({
			"204": { description: "No content", content: jsonRef("Empty") },
		});
	});

	test("keeps the other response fields", () => {
		const response: ResponseObject = {
			description: "OK",
			headers: {
				"X-Rate-Limit": {
					description: "calls per hour",
					schema: { type: "integer" },
				},
			},
			links: { self: { operationId: "getUnit" } },
		};
		expect(responses({ [HttpStatus.OK]: [response, "Unit"] })).toEqual({
			"200": {
				description: "OK",
				headers: {
					"X-Rate-Limit": {
						description: "calls per hour",
						schema: { type: "integer" },
					},
				},
				links: { self: { operationId: "getUnit" } },
				content: jsonRef("Unit"),
			},
		});
	});

	test("replaces any content of the given response", () => {
		const response: ResponseObject = {
			description: "OK",
			content: { "text/plain": { schema: { type: "string" } } },
		};
		expect(responses({ [HttpStatus.OK]: [response, "Unit"] })).toEqual({
			"200": { description: "OK", content: jsonRef("Unit") },
		});
	});

	test("copies the response, leaving the input untouched", () => {
		const response: ResponseObject = { description: "OK" };
		const result = responses({ [HttpStatus.OK]: [response, "Unit"] });
		expect(result["200"]).not.toBe(response);
		expect(response).toEqual({ description: "OK" });
	});

	test("the same response object can be used for several statuses", () => {
		const shared: ResponseObject = { description: "Error" };
		const result = responses({
			[HttpStatus.BAD_REQUEST]: [shared, "Error"],
			[HttpStatus.UNAUTHORIZED]: [shared, "Error"],
		});
		expect(result["400"]).toEqual({
			description: "Error",
			content: jsonRef("Error"),
		});
		expect(result["401"]).toEqual({
			description: "Error",
			content: jsonRef("Error"),
		});
		expect(result["400"]).not.toBe(result["401"]);
	});

	test("the schema name is used verbatim in the $ref", () => {
		expect(
			responses({ [HttpStatus.OK]: [{ description: "" }, "Unit.List_v2"] }),
		).toEqual({
			"200": { description: "", content: jsonRef("Unit.List_v2") },
		});
	});

	test("returns an empty object for no statuses", () => {
		expect(responses({})).toEqual({});
	});

	test("returns a fresh object each call", () => {
		expect(responses({})).not.toBe(responses({}));
	});

	test("the result can be used as the responses of an operation", () => {
		const spec = OpenApiBuilder.create()
			.addPath("/units", {
				get: {
					responses: responses({
						[HttpStatus.OK]: [{ description: "OK" }, "Unit"],
					}),
				},
			})
			.getSpec();
		expect(spec.paths?.["/units"]?.get?.responses).toEqual({
			"200": { description: "OK", content: jsonRef("Unit") },
		});
	});
});

describe("body", () => {
	test("builds a JSON request body referencing the schema", () => {
		expect(body("CreateUnit")).toEqual({ content: jsonRef("CreateUnit") });
	});

	test("uses the schema name verbatim", () => {
		expect(body("")).toEqual({ content: jsonRef("") });
		expect(body("a/b")).toEqual({ content: jsonRef("a/b") });
	});

	test("returns a fresh object each call", () => {
		expect(body("A")).not.toBe(body("A"));
	});

	test("the result can be used as a request body", () => {
		const spec = OpenApiBuilder.create()
			.addPath("/units", {
				post: { requestBody: body("CreateUnit"), responses: {} },
			})
			.getSpec();
		expect(spec.paths?.["/units"]?.post?.requestBody).toEqual({
			content: jsonRef("CreateUnit"),
		});
	});
});
