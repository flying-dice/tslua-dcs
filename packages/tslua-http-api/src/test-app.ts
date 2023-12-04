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

app.get("/complex/:id", (req, res) => {
	res.json({ id: req.parameters.id });
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

// Comprehensive list of endpoints with hardcoded paths using safe characters
app.get("/fixed-complex/Ground-1", (req, res) => {
	res.json({ id: "Ground-1" });
});

app.get("/fixed-complex/Ground_2", (req, res) => {
	res.json({ id: "Ground_2" });
});

app.get("/fixed-complex/Ground~3", (req, res) => {
	res.json({ id: "Ground~3" });
});

app.get("/fixed-complex/Ground.4", (req, res) => {
	res.json({ id: "Ground.4" });
});

app.get("/fixed-complex/Ground!5", (req, res) => {
	res.json({ id: "Ground!5" });
});

app.get("/fixed-complex/Ground$6", (req, res) => {
	res.json({ id: "Ground$6" });
});

app.get("/fixed-complex/Ground'7", (req, res) => {
	res.json({ id: "Ground'7" });
});

app.get("/fixed-complex/Ground(8)", (req, res) => {
	res.json({ id: "Ground(8)" });
});

app.get("/fixed-complex/Ground*9", (req, res) => {
	res.json({ id: "Ground*9" });
});

app.get("/fixed-complex/Ground+10", (req, res) => {
	res.json({ id: "Ground+10" });
});

app.get("/fixed-complex/Ground,11", (req, res) => {
	res.json({ id: "Ground,11" });
});

app.get("/fixed-complex/Ground;12", (req, res) => {
	res.json({ id: "Ground;12" });
});

app.get("/fixed-complex/Ground=13", (req, res) => {
	res.json({ id: "Ground=13" });
});

app.get("/groups/:groupId/units/:unitId", (req, res) => {
	res.json({ groupId: req.parameters.groupId, unitId: req.parameters.unitId });
});

do {
	app.acceptNextClient();
	//   biome-ignore lint/correctness/noConstantCondition: <explanation>
} while (true);
