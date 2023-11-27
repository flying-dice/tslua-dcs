import { HttpRequest, HttpStatus } from "@flying-dice/tslua-http";
import { AppHttpResponse, AppMiddleware, Application } from "./index";

const app = new Application("127.0.0.1", 29293);

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

app.get("/api/users", (req: HttpRequest, res: AppHttpResponse) => {
	res.send(
		Object.keys(users)
			.map((it) => users[it].name)
			.join(", "),
	);
});

app.get("/api/users/:id", (req: HttpRequest, res: AppHttpResponse) => {
	if (!users[req.parameters.id]) {
		return res.status(HttpStatus.NOT_FOUND).send("Not Found");
	}

	res.send(`name: ${users[req.parameters.id].name}`);
});

app.get(
	"/api/users/:id/comments/:commentId",
	(req: HttpRequest, res: AppHttpResponse) => {
		if (
			!users[req.parameters.id] ||
			!users[req.parameters.id].comments[req.parameters.commentId]
		) {
			return res.status(HttpStatus.NOT_FOUND).send("Not Found");
		}

		res.send(users[req.parameters.id].comments[req.parameters.commentId]);
	},
);

app.post("/api/users", (req: HttpRequest, res: AppHttpResponse) => {
	res.send(req.body as string);
});

app.get("/health", (req, res) => {
	res.json({ status: "OK" });
});

const authMiddleware: AppMiddleware = (req, res, next) => {
	if (req.headers.Authorization !== "Bearer 123") {
		return res.status(HttpStatus.UNAUTHORIZED).send("Unauthorized");
	}

	next();
};

app.get("/secure", authMiddleware, (req, res) => {
	res.send("Secure Content");
});

do {
	app.acceptNextClient();
	//   biome-ignore lint/correctness/noConstantCondition: <explanation>
} while (true);
