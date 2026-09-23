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
		edits: [["client.settimeout(0);", "client.settimeout(2);"]],
		expect: [
			"makes each accepted client non-blocking",
			"an idle connection does not hold up a complete request",
		],
	},
	{
		name: "partial-write progress discarded on would-block",
		edits: [["conn.writePos = reached + 1;", "if (sendError === undefined) conn.writePos = reached + 1;"]],
		expect: [
			"partial sends, including zero progress, resume at the next byte",
			"a client that stops reading a large response does not stop a healthy client",
		],
	},
	{
		name: "unsent response treated as sent (the old ignored send result)",
		edits: [
			[
				'if (sendError === "timeout") break; // the socket buffer is full; resume later',
				'if (sendError === "timeout") { conn.writePos = length + 1; break; }',
			],
		],
		expect: [
			"partial sends, including zero progress, resume at the next byte",
			"the connection is closed only after the last byte is accepted",
		],
	},
	{
		name: "no rotation: connections always visited in accept order",
		edits: [
			[
				"if (!this.closed) this.reorder(list, visited);",
				'if (!this.closed) this.connections = this.connections.filter((c) => c.state !== "CLOSED");',
			],
		],
		expect: ["visits connections round-robin", "rotates the starting connection"],
	},
	{
		name: "refused connections not given priority in the next pump",
		edits: [
			['if (list[i].starved && list[i].state !== "CLOSED") next.push(list[i]);', "// removed"],
			['if (!list[i].starved && list[i].state !== "CLOSED") next.push(list[i]);', 'if (list[i].state !== "CLOSED") next.push(list[i]);'],
		],
		expect: [
			"a connection refused a dispatch goes first in the next pump",
			"rotates the starting connection",
		],
	},
	{
		name: "one connection per pump (head-of-line blocking)",
		edits: [["math.min(count, options.maxVisitsPerPump),", "1,"]],
		expect: [
			"an idle connection does not delay a complete request behind it",
			"several ready connections all progress in one pump",
		],
	},
	{
		name: "request deadline extended by every received byte",
		edits: [
			["conn.lastReadAt = now;", "conn.lastReadAt = now; conn.requestDeadline = now + this.options.requestTimeout;"],
		],
		expect: ["trickling bytes does not extend the absolute request deadline"],
	},
	{
		name: "incomplete request dispatched when the client closes",
		edits: [
			[
				'// "closed" or a socket error: a complete request can still be answered, an incomplete one never is.',
				'if (conn.state === "READING_BODY") { (conn.request as HttpRequest).body = table.concat(conn.bodyChunks as string[]); conn.state = "READY_TO_DISPATCH"; break; }',
			],
		],
		expect: [
			"drops a connection closed before the whole body arrives",
			"never dispatches an incomplete body followed by a half-close",
		],
	},
	{
		name: "responses not counted against the buffer budget",
		edits: [["this.reserve(conn, serialized.length);", "// not reserved"]],
		expect: ["pending responses count against the budget"],
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
		let mutated = original;
		for (const [find, replace] of mutation.edits) {
			if (!mutated.includes(find)) {
				throw new Error(`mutation "${mutation.name}": source text not found: ${find}`);
			}
			mutated = mutated.replace(find, replace);
		}
		writeFileSync(target, mutated);
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
