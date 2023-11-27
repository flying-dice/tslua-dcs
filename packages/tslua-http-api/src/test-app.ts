import { HttpRequest, HttpResponse, HttpStatus } from "@flying-dice/tslua-http";
import { Application } from "./index";

const app = new Application("127.0.0.1", 3000);

const users: Record<
	string,
	{ name: string; comments: Record<string, string> }
> = {
	JOHN: { name: "John Doe", comments: { JOHN_C_1: "Hello World!" } },
	JANE: {
		name: "Jane Gray",
		comments: {
			JANE_C_1: "Janes first comment.",
			JANE_C_2: "Janes second comment.",
		},
	},
};

app.get("/api/users", (req: HttpRequest, res: HttpResponse) => {
	res.body = Object.values(users)
		.map((it) => it.name)
		.join(", ");
	return res;
});

app.get("/api/users/:id", (req: HttpRequest, res: HttpResponse) => {
	if (!users[req.parameters.id]) {
		res.status = HttpStatus.NOT_FOUND;
		return res;
	}

	res.body = `name: ${users[req.parameters.id].name}`;

	return res;
});

app.get(
	"/api/users/:id/comments/:commentId",
	(req: HttpRequest, res: HttpResponse) => {
		if (
			!users[req.parameters.id] ||
			!users[req.parameters.id].comments[req.parameters.commentId]
		) {
			res.status = HttpStatus.NOT_FOUND;
			return res;
		}

		res.body = users[req.parameters.id].comments[req.parameters.commentId];

		return res;
	},
);

app.post("/api/users", (req: HttpRequest, res: HttpResponse) => {
	res.body = req.body;
	return res;
});

do {
	app.acceptNextClient();
	//   biome-ignore lint/correctness/noConstantCondition: <explanation>
} while (true);
