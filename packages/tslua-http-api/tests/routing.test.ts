import axios from "axios";

describe("Application Routing", () => {
	it("should route to get endpoint with no params", async () => {
		await axios.get("http://127.0.0.1:3000/api/users").then((res) => {
			expect(res.status).toEqual(200);
			expect(res.data).toEqual("John Doe, Jane Gray");
		});
	});

	it("should route to get endpoint with 1 param", async () => {
		await axios.get("http://127.0.0.1:3000/api/users/JOHN").then((res) => {
			expect(res.status).toEqual(200);
			expect(res.data).toEqual("name: John Doe");
		});
	});

	it("should route to nested get endpoint with 2 params", async () => {
		await axios
			.get("http://127.0.0.1:3000/api/users/JOHN/comments/JOHN_C_1")
			.then((res) => {
				expect(res.status).toEqual(200);
				expect(res.data).toEqual("Hello World!");
			});
	});

	it("should route to nested get endpoint with 2 params", async () => {
		await axios
			.get("http://127.0.0.1:3000/api/users/JANE/comments/JANE_C_2")
			.then((res) => {
				expect(res.status).toEqual(200);
				expect(res.data).toEqual("Janes second comment.");
			});
	});

	it("should return 404 for a non existent user", async () => {
		await axios
			.get("http://127.0.0.1:3000/api/users/DAVE", { validateStatus: null })
			.then((res) => {
				expect(res.status).toEqual(404);
			});
	});

	it("should return 404 for a non existent route", async () => {
		await axios
			.get("http://127.0.0.1:3000/api/invalid-path", { validateStatus: null })
			.then((res) => {
				expect(res.status).toEqual(404);
			});
	});

	it("should echo body of reques for post", async () => {
		await axios
			.post("http://127.0.0.1:3000/api/users", "Example Body", {
				validateStatus: null,
			})
			.then((res) => {
				expect(res.status).toEqual(200);
				expect(res.data).toEqual("Example Body");
			});
	});
});
