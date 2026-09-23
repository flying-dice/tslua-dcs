import { createSampleApp } from "./sample-app";

const app = createSampleApp("127.0.0.1", 29293);

// `pump` never blocks; this standalone dev server has nothing else to do, so it pumps continuously.
while (true) {
	app.pump();
}
