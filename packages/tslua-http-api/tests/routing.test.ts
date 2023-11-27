import axios from "axios";
import { describe, expect, it } from "vitest";

describe("Application Routing", () => {
	it("should route to get endpoint with no params", async () => {
		await axios.get("http://127.0.0.1:29293/api/users").then((res) => {
			expect(res.status).toEqual(200);
			expect(res.data).toMatch("John Doe");
			expect(res.data).toMatch("Jane Gray");
		});
	});

	it("should route to get endpoint with 1 param", async () => {
		await axios.get("http://127.0.0.1:29293/api/users/JOHN").then((res) => {
			expect(res.status).toEqual(200);
			expect(res.data).toEqual("name: John Doe");
		});
	});

	it("should route to nested get endpoint with 2 params", async () => {
		await axios
			.get("http://127.0.0.1:29293/api/users/JOHN/comments/JOHN_C_1")
			.then((res) => {
				expect(res.status).toEqual(200);
				expect(res.data).toEqual("Hello World!");
			});
	});

	it("should route to nested get endpoint with 2 params", async () => {
		await axios
			.get("http://127.0.0.1:29293/api/users/JANE/comments/JANE_C_2")
			.then((res) => {
				expect(res.status).toEqual(200);
				expect(res.data).toEqual("Janes second comment.");
			});
	});

	it("should return 404 for a non existent user", async () => {
		await axios
			.get("http://127.0.0.1:29293/api/users/DAVE", { validateStatus: null })
			.then((res) => {
				expect(res.status).toEqual(404);
			});
	});

	it("should return 404 for a non existent route", async () => {
		await axios
			.get("http://127.0.0.1:29293/api/invalid-path", { validateStatus: null })
			.then((res) => {
				expect(res.status).toEqual(404);
			});
	});

	it("should echo body of reques for post", async () => {
		await axios
			.post("http://127.0.0.1:29293/api/users", "Example Body", {
				validateStatus: null,
			})
			.then((res) => {
				expect(res.status).toEqual(200);
				expect(res.data).toEqual("Example Body");
			});
	});

	it("should return json response", async () => {
		await axios.get("http://127.0.0.1:29293/health").then((res) => {
			expect(res.status).toEqual(200);
			expect(res.headers["content-type"]).toEqual("application/json");
			expect(res.data).toEqual({ status: "OK" });
		});
	});

	it("should reject access to secure endpoint without auth", async () => {
		await axios
			.get("http://127.0.0.1:29293/secure", { validateStatus: null })
			.then((res) => {
				expect(res.status).toEqual(401);
				expect(res.data).toEqual("Unauthorized");
			});
	});

	it("should grant access to secure endpoint with auth", async () => {
		await axios
			.get("http://127.0.0.1:29293/secure", {
				validateStatus: null,
				headers: { Authorization: "Bearer 123" },
			})
			.then((res) => {
				expect(res.status).toEqual(200);
				expect(res.data).toEqual("Secure Content");
			});
	});
});
