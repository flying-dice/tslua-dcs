import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { OpenApiBuilder } from "../src/openapi3-ts/oas31";
import type * as oa from "../src/openapi3-ts/oas31";

const defaultDoc = (): oa.OpenAPIObject => ({
	openapi: "3.1.0",
	info: { title: "app", version: "version" },
	paths: {},
	components: {
		schemas: {},
		responses: {},
		parameters: {},
		examples: {},
		requestBodies: {},
		headers: {},
		securitySchemes: {},
		links: {},
		callbacks: {},
	},
	tags: [],
	servers: [],
});

/** A document with only the required fields, so every optional container starts absent. */
const minimalDoc = (): oa.OpenAPIObject => ({
	openapi: "3.1.1",
	info: { title: "minimal", version: "1" },
});

const op = (operationId: string): oa.OperationObject => ({
	operationId,
	responses: {},
});

type ComponentMaps = Record<string, Record<string, unknown>>;

describe("OpenApiBuilder", () => {
	describe("construction", () => {
		test("new OpenApiBuilder() starts from the default document", () => {
			expect(new OpenApiBuilder().getSpec()).toEqual(defaultDoc());
		});

		test("OpenApiBuilder.create() starts from the default document", () => {
			const builder = OpenApiBuilder.create();
			expect(builder).toBeInstanceOf(OpenApiBuilder);
			expect(builder.getSpec()).toEqual(defaultDoc());
		});

		test("each builder gets its own default document", () => {
			const a = OpenApiBuilder.create();
			const b = OpenApiBuilder.create();
			expect(a.getSpec()).not.toBe(b.getSpec());
			a.addTitle("changed").addTag({ name: "only-a" }).addSchema("S", {});
			expect(b.getSpec()).toEqual(defaultDoc());
		});

		test("a given document is used as the root document by reference", () => {
			const doc = minimalDoc();
			const builder = OpenApiBuilder.create(doc);
			expect(builder.getSpec()).toBe(doc);
			expect(builder.rootDoc).toBe(doc);
			builder.addTitle("mutated");
			expect(doc.info.title).toBe("mutated");
		});

		test("the constructor accepts a document too", () => {
			const doc = minimalDoc();
			expect(new OpenApiBuilder(doc).getSpec()).toBe(doc);
		});

		test("getSpec returns rootDoc", () => {
			const builder = OpenApiBuilder.create();
			expect(builder.getSpec()).toBe(builder.rootDoc);
		});
	});

	describe("info", () => {
		test("addOpenApiVersion sets the openapi field", () => {
			const spec = OpenApiBuilder.create().addOpenApiVersion("3.1.1").getSpec();
			expect(spec.openapi).toBe("3.1.1");
		});

		test("addInfo replaces the whole info object", () => {
			const info: oa.InfoObject = { title: "Mission API", version: "2.0.0" };
			const spec = OpenApiBuilder.create()
				.addDescription("gone")
				.addInfo(info)
				.getSpec();
			expect(spec.info).toBe(info);
			expect(spec.info).toEqual({ title: "Mission API", version: "2.0.0" });
		});

		test("addTitle, addVersion, addDescription and addTermsOfService set info fields", () => {
			const spec = OpenApiBuilder.create()
				.addTitle("Mission API")
				.addVersion("1.2.3")
				.addDescription("Controls the mission")
				.addTermsOfService("https://example.com/tos")
				.getSpec();
			expect(spec.info).toEqual({
				title: "Mission API",
				version: "1.2.3",
				description: "Controls the mission",
				termsOfService: "https://example.com/tos",
			});
		});

		test("addContact and addLicense set info.contact and info.license", () => {
			const contact: oa.ContactObject = {
				name: "Ops",
				email: "ops@example.com",
				url: "https://example.com",
			};
			const license: oa.LicenseObject = { name: "ISC", identifier: "ISC" };
			const spec = OpenApiBuilder.create()
				.addContact(contact)
				.addLicense(license)
				.getSpec();
			expect(spec.info.contact).toBe(contact);
			expect(spec.info.license).toBe(license);
			expect(spec.info).toEqual({
				title: "app",
				version: "version",
				contact: {
					name: "Ops",
					email: "ops@example.com",
					url: "https://example.com",
				},
				license: { name: "ISC", identifier: "ISC" },
			});
		});

		test("later calls overwrite earlier values", () => {
			const spec = OpenApiBuilder.create()
				.addTitle("one")
				.addTitle("two")
				.addVersion("1")
				.addVersion("2")
				.getSpec();
			expect(spec.info.title).toBe("two");
			expect(spec.info.version).toBe("2");
		});

		test("info setters write into an info object given with addInfo", () => {
			const info: oa.InfoObject = { title: "t", version: "v" };
			OpenApiBuilder.create().addInfo(info).addDescription("d");
			expect(info.description).toBe("d");
		});
	});

	describe("paths", () => {
		test("addPath adds a path item", () => {
			const get = op("listUnits");
			const spec = OpenApiBuilder.create().addPath("/units", { get }).getSpec();
			expect(spec.paths).toEqual({
				"/units": { get: op("listUnits") },
			});
			expect(spec.paths?.["/units"]?.get).toBe(get);
		});

		test("addPath merges operations into an existing path item", () => {
			const spec = OpenApiBuilder.create()
				.addPath("/units", { summary: "Units", get: op("list") })
				.addPath("/units", { post: op("create") })
				.getSpec();
			expect(spec.paths).toEqual({
				"/units": {
					summary: "Units",
					get: op("list"),
					post: op("create"),
				},
			});
		});

		test("addPath lets the later item win for the same field (shallow merge)", () => {
			const spec = OpenApiBuilder.create()
				.addPath("/units", { get: { ...op("old"), summary: "old only" } })
				.addPath("/units", { get: op("new") })
				.getSpec();
			expect(spec.paths?.["/units"]).toEqual({ get: op("new") });
		});

		test("addPath stores a copy, so later merges do not mutate the given item", () => {
			const item = { get: op("list") };
			const builder = OpenApiBuilder.create().addPath("/units", item);
			expect(builder.getSpec().paths?.["/units"]).not.toBe(item);
			builder.addPath("/units", { post: op("create") });
			expect(item).toEqual({ get: op("list") });
		});

		test("addPath keeps other paths", () => {
			const spec = OpenApiBuilder.create()
				.addPath("/a", { summary: "a" })
				.addPath("/b", { summary: "b" })
				.getSpec();
			expect(spec.paths).toEqual({
				"/a": { summary: "a" },
				"/b": { summary: "b" },
			});
		});

		test("addPath creates paths when the document has none", () => {
			const spec = OpenApiBuilder.create(minimalDoc())
				.addPath("/a", { summary: "a" })
				.getSpec();
			expect(spec.paths).toEqual({ "/a": { summary: "a" } });
		});
	});

	describe("components", () => {
		type Adder = (
			builder: OpenApiBuilder,
			name: string,
			value: object,
		) => OpenApiBuilder;
		const cases: [string, keyof oa.ComponentsObject, Adder, object][] = [
			[
				"addSchema",
				"schemas",
				(b, n, v) => b.addSchema(n, v as oa.SchemaObject),
				{ type: "string" },
			],
			[
				"addResponse",
				"responses",
				(b, n, v) => b.addResponse(n, v as oa.ResponseObject),
				{ description: "OK" },
			],
			[
				"addParameter",
				"parameters",
				(b, n, v) => b.addParameter(n, v as oa.ParameterObject),
				{ name: "id", in: "path", required: true },
			],
			[
				"addExample",
				"examples",
				(b, n, v) => b.addExample(n, v as oa.ExampleObject),
				{ summary: "s", value: 1 },
			],
			[
				"addRequestBody",
				"requestBodies",
				(b, n, v) => b.addRequestBody(n, v as oa.RequestBodyObject),
				{ content: {}, required: true },
			],
			[
				"addHeader",
				"headers",
				(b, n, v) => b.addHeader(n, v as oa.HeaderObject),
				{ description: "a header" },
			],
			[
				"addSecurityScheme",
				"securitySchemes",
				(b, n, v) => b.addSecurityScheme(n, v as oa.SecuritySchemeObject),
				{ type: "http", scheme: "bearer" },
			],
			[
				"addLink",
				"links",
				(b, n, v) => b.addLink(n, v as oa.LinkObject),
				op("getUnit"),
			],
			[
				"addCallback",
				"callbacks",
				(b, n, v) => b.addCallback(n, v as oa.CallbackObject),
				{ "{$request.body#/url}": { post: op("cb") } },
			],
		];

		for (const [method, key, add, value] of cases) {
			describe(method, () => {
				test(`stores the value under components.${key} and returns the builder`, () => {
					const builder = OpenApiBuilder.create();
					expect(add(builder, "Thing", value)).toBe(builder);
					const components = builder.getSpec().components as ComponentMaps;
					expect(components[key]).toEqual({ Thing: value });
					expect(components[key].Thing).toBe(value);
				});

				test("accepts a reference object", () => {
					const ref: oa.ReferenceObject = { $ref: `#/components/${key}/Other` };
					const builder = add(OpenApiBuilder.create(), "Thing", ref);
					const components = builder.getSpec().components as ComponentMaps;
					expect(components[key].Thing).toBe(ref);
				});

				test("replaces a value with the same name and keeps other names", () => {
					const builder = OpenApiBuilder.create();
					add(builder, "A", { first: true });
					add(builder, "B", value);
					add(builder, "A", { second: true });
					const components = builder.getSpec().components as ComponentMaps;
					expect(components[key]).toEqual({ A: { second: true }, B: value });
				});

				test("does not touch the other component maps", () => {
					const builder = add(OpenApiBuilder.create(), "Thing", value);
					const expected = defaultDoc().components as ComponentMaps;
					expected[key] = { Thing: value };
					expect(builder.getSpec().components).toEqual(expected);
				});

				test("creates components and the map when the document has neither", () => {
					const builder = add(
						OpenApiBuilder.create(minimalDoc()),
						"Thing",
						value,
					);
					expect(builder.getSpec().components).toEqual({
						[key]: { Thing: value },
					});
				});

				test("creates the map when components exists without it", () => {
					const doc = minimalDoc();
					const components = {};
					doc.components = components;
					add(OpenApiBuilder.create(doc), "Thing", value);
					expect(doc.components).toBe(components);
					expect(doc.components).toEqual({ [key]: { Thing: value } });
				});
			});
		}
	});

	describe("servers, tags, external docs and webhooks", () => {
		test("addServer appends servers in order", () => {
			const spec = OpenApiBuilder.create()
				.addServer({ url: "http://localhost:8080" })
				.addServer({
					url: "http://127.0.0.1:{port}",
					variables: { port: { default: "8080" } },
				})
				.getSpec();
			expect(spec.servers).toEqual([
				{ url: "http://localhost:8080" },
				{
					url: "http://127.0.0.1:{port}",
					variables: { port: { default: "8080" } },
				},
			]);
		});

		test("addServer creates the servers list when the document has none", () => {
			const spec = OpenApiBuilder.create(minimalDoc())
				.addServer({ url: "/" })
				.getSpec();
			expect(spec.servers).toEqual([{ url: "/" }]);
			expect(spec.servers).toHaveLength(1);
		});

		test("addTag appends tags in order, even duplicates", () => {
			const spec = OpenApiBuilder.create()
				.addTag({ name: "units", description: "Unit operations" })
				.addTag({ name: "groups" })
				.addTag({ name: "units" })
				.getSpec();
			expect(spec.tags).toEqual([
				{ name: "units", description: "Unit operations" },
				{ name: "groups" },
				{ name: "units" },
			]);
		});

		test("addTag creates the tags list when the document has none", () => {
			const spec = OpenApiBuilder.create(minimalDoc())
				.addTag({ name: "t" })
				.getSpec();
			expect(spec.tags).toEqual([{ name: "t" }]);
		});

		test("addExternalDocs sets externalDocs and replaces a previous value", () => {
			const spec = OpenApiBuilder.create()
				.addExternalDocs({ url: "https://old.example.com" })
				.addExternalDocs({ url: "https://example.com", description: "Docs" })
				.getSpec();
			expect(spec.externalDocs).toEqual({
				url: "https://example.com",
				description: "Docs",
			});
		});

		test("the default document has no webhooks", () => {
			expect(OpenApiBuilder.create().getSpec().webhooks).toBeUndefined();
		});

		test("addWebhook creates webhooks and adds the item", () => {
			const item = { post: op("unitDestroyed") };
			const spec = OpenApiBuilder.create()
				.addWebhook("unitDestroyed", item)
				.getSpec();
			expect(spec.webhooks).toEqual({
				unitDestroyed: { post: op("unitDestroyed") },
			});
			expect(spec.webhooks?.unitDestroyed).toBe(item);
		});

		test("addWebhook replaces an item with the same name (no merge) and keeps others", () => {
			const spec = OpenApiBuilder.create()
				.addWebhook("a", { get: op("old"), summary: "old" })
				.addWebhook("b", { summary: "b" })
				.addWebhook("a", { post: op("new") })
				.getSpec();
			expect(spec.webhooks).toEqual({
				a: { post: op("new") },
				b: { summary: "b" },
			});
		});

		test("addWebhook keeps existing webhooks of a given document", () => {
			const doc = minimalDoc();
			doc.webhooks = { existing: { summary: "e" } };
			OpenApiBuilder.create(doc).addWebhook("added", { summary: "a" });
			expect(doc.webhooks).toEqual({
				existing: { summary: "e" },
				added: { summary: "a" },
			});
		});
	});

	test("every add method returns the builder itself", () => {
		const b = OpenApiBuilder.create();
		const returned: OpenApiBuilder[] = [
			b.addOpenApiVersion("3.1.0"),
			b.addInfo({ title: "t", version: "v" }),
			b.addContact({}),
			b.addLicense({ name: "ISC" }),
			b.addTitle("t"),
			b.addDescription("d"),
			b.addTermsOfService("tos"),
			b.addVersion("v"),
			b.addPath("/", {}),
			b.addSchema("s", {}),
			b.addResponse("r", { description: "r" }),
			b.addParameter("p", { name: "p", in: "query" }),
			b.addExample("e", {}),
			b.addRequestBody("rb", { content: {} }),
			b.addHeader("h", {}),
			b.addSecurityScheme("ss", { type: "apiKey", name: "key", in: "header" }),
			b.addLink("l", {}),
			b.addCallback("c", {}),
			b.addServer({ url: "/" }),
			b.addTag({ name: "t" }),
			b.addExternalDocs({ url: "https://example.com" }),
			b.addWebhook("w", {}),
		];
		expect(returned).toHaveLength(22);
		for (const r of returned) {
			expect(r).toBe(b);
		}
	});

	test("a chained build produces the complete document", () => {
		const spec = OpenApiBuilder.create()
			.addOpenApiVersion("3.1.0")
			.addTitle("DCS Mission API")
			.addVersion("1.0.0")
			.addDescription("HTTP API for the running mission")
			.addLicense({ name: "ISC" })
			.addServer({
				url: "http://127.0.0.1:{port}",
				variables: { port: { default: 8080, enum: [8080, 8081] } },
			})
			.addTag({ name: "units" })
			.addSchema("Unit", {
				type: "object",
				required: ["name"],
				properties: {
					name: { type: "string" },
					alt: { type: ["number", "null"] },
				},
			})
			.addSecurityScheme("apiKey", {
				type: "apiKey",
				name: "X-Api-Key",
				in: "header",
			})
			.addPath("/units/{name}", {
				get: {
					tags: ["units"],
					operationId: "getUnit",
					parameters: [
						{
							name: "name",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: { "200": { description: "The unit" } },
					security: [{ apiKey: [] }],
				},
			})
			.getSpec();

		expect(spec).toEqual({
			openapi: "3.1.0",
			info: {
				title: "DCS Mission API",
				version: "1.0.0",
				description: "HTTP API for the running mission",
				license: { name: "ISC" },
			},
			servers: [
				{
					url: "http://127.0.0.1:{port}",
					variables: { port: { default: 8080, enum: [8080, 8081] } },
				},
			],
			tags: [{ name: "units" }],
			paths: {
				"/units/{name}": {
					get: {
						tags: ["units"],
						operationId: "getUnit",
						parameters: [
							{
								name: "name",
								in: "path",
								required: true,
								schema: { type: "string" },
							},
						],
						responses: { "200": { description: "The unit" } },
						security: [{ apiKey: [] }],
					},
				},
			},
			components: {
				schemas: {
					Unit: {
						type: "object",
						required: ["name"],
						properties: {
							name: { type: "string" },
							alt: { type: ["number", "null"] },
						},
					},
				},
				responses: {},
				parameters: {},
				examples: {},
				requestBodies: {},
				headers: {},
				securitySchemes: {
					apiKey: { type: "apiKey", name: "X-Api-Key", in: "header" },
				},
				links: {},
				callbacks: {},
			},
		});
	});
});
