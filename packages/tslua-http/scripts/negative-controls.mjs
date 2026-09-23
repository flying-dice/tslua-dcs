// Negative controls for the transport tests: reintroduces each defect the non-blocking refactor fixed, one at a
// time, runs the Lua test suite against the mutated source, and checks that the regression tests catch it.
//
//   npm run test:negative-controls --workspace=@flying-dice/tslua-http
//
// Each mutation must make at least one of its `expect` tests fail; the script exits non-zero if a mutation
// survives. The source file is always restored, even on failure.
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const target = join(root, "src", "scheduler.ts");

const mutations = [
	{
		name: "blocking client sockets (the old settimeout(2))",
		find: "client.settimeout(0);",
		replace: "client.settimeout(2);",
		expect: [
			"makes each accepted client non-blocking",
			"an idle connection does not hold up a complete request",
		],
	},
	{
		name: "partial-write progress discarded on would-block",
		find: "conn.writePos = reached + 1;",
		replace: "if (sendError === undefined) conn.writePos = reached + 1;",
		expect: [
			"partial sends, including zero progress, resume at the next byte",
			"a client that stops reading a large response does not stop a healthy client",
		],
	},
	{
		name: "unsent response treated as sent (the old ignored send result)",
		find: 'if (sendError === "timeout") break; // the socket buffer is full; resume later',
		replace:
			'if (sendError === "timeout") { conn.writePos = length + 1; break; }',
		expect: [
			"partial sends, including zero progress, resume at the next byte",
			"the connection is closed only after the last byte is accepted",
		],
	},
	{
		name: "unfair scheduling: every pump starts at the first connection",
		find: "this.nextVisitId = list[next].id;",
		replace: "this.nextVisitId = 0;",
		expect: [
			"visits connections round-robin",
			"rotates the starting connection",
		],
	},
	{
		name: "one connection per pump (head-of-line blocking)",
		find: "const visits = math.min(count, options.maxVisitsPerPump);",
		replace: "const visits = 1;",
		expect: [
			"an idle connection does not delay a complete request behind it",
			"several ready connections all progress in one pump",
		],
	},
	{
		name: "request deadline extended by every received byte",
		find: "conn.lastReadAt = this.now();",
		replace:
			"conn.lastReadAt = this.now(); conn.requestDeadline = conn.lastReadAt + this.options.requestTimeout;",
		expect: ["trickling bytes does not extend the absolute request deadline"],
	},
	{
		name: "incomplete request dispatched when the client closes",
		find: "			// \"closed\" or a socket error: a complete request can still be answered, an incomplete one never is.",
		replace:
			'			if (conn.state === "READING_BODY") { (conn.request as HttpRequest).body = table.concat(conn.bodyChunks as string[]); conn.state = "READY_TO_DISPATCH"; break; }',
		expect: [
			"drops a connection closed before the whole body arrives",
			"never dispatches an incomplete body followed by a half-close",
		],
	},
];

function runSuite() {
	const run = spawnSync(
		"sh",
		["-c", "npx tstl -p tsconfig.tstl-tests.json && npx lua51 ./.test/tests.lua"],
		{ cwd: root, encoding: "utf8", timeout: 300_000 },
	);
	const output = `${run.stdout ?? ""}${run.stderr ?? ""}`;
	const failed = output
		.split("\n")
		.filter((line) => line.startsWith("[FAIL] - "))
		.map((line) => line.slice("[FAIL] - ".length));
	return { status: run.status, timedOut: run.error !== undefined, failed };
}

const original = readFileSync(target, "utf8");
let survivors = 0;
try {
	for (const mutation of mutations) {
		if (!original.includes(mutation.find)) {
			throw new Error(`mutation "${mutation.name}": source text not found`);
		}
		writeFileSync(target, original.replace(mutation.find, mutation.replace));
		const result = runSuite();
		const caught = mutation.expect.filter((name) =>
			result.failed.some((failed) => failed.includes(name)),
		);
		const ok = caught.length > 0 || result.timedOut;
		if (!ok) survivors++;
		console.log(`${ok ? "CAUGHT  " : "SURVIVED"} ${mutation.name}`);
		console.log(`         ${result.failed.length} failing tests${result.timedOut ? " (timed out)" : ""}`);
		for (const name of result.failed) console.log(`           - ${name}`);
	}
} finally {
	writeFileSync(target, original);
}

if (survivors > 0) {
	console.error(`${survivors} mutation(s) survived`);
	process.exit(1);
}
console.log("All mutations were caught.");
