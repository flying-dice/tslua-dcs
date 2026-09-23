import { createSampleApp } from "./sample-app";

const app = createSampleApp("127.0.0.1", 29293);

while (true) {
	app.acceptNextClient();
}
