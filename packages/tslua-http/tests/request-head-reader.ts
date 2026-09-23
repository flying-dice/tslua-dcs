import { describe, expect, test } from "@flying-dice/tslua-luatest";
import { HttpStatus } from "../src/constants";
import {
	type HeadResult,
	type RequestHeadLimits,
	RequestHeadReader,
} from "../src/request-head-reader";

const LIMITS: RequestHeadLimits = {
	maxHeaderBytes: 8192,
	maxHeaderCount: 64,
	maxBodyBytes: 1024,
};

function read(
	fragments: string[],
	limits: RequestHeadLimits = LIMITS,
): HeadResult[] {
	const reader = new RequestHeadReader(limits);
	return fragments.map((fragment) => reader.push(fragment));
}

describe("RequestHeadReader", () => {
	test("is incomplete until the blank line, then returns the request, the body length and the rest", () => {
		const results = read([
			"POST /a?b=c HTTP/1.1\r\nContent-Le",
			"ngth: 3\r\n\r",
			"\nxyzEXTRA",
		]);
		expect(results[0]).toEqual({ kind: "incomplete" });
		expect(results[1]).toEqual({ kind: "incomplete" });
		expect(results[2]).toEqual({
			kind: "complete",
			request: {
				method: "POST",
				originalUrl: "/a?b=c",
				protocol: "HTTP/1.1",
				path: "/a",
				parameters: { b: "c" },
				headers: { "content-length": "3" },
			},
			bodyLength: 3,
			rest: "xyzEXTRA",
		});
	});

	test("reassembles every split of a head identically", () => {
		const raw = "GET /x HTTP/1.1\r\nHost: h:1\r\nA: b\r\n\r\n";
		const [whole] = read([raw]);
		for (let at = 1; at < raw.length; at++) {
			const results = read([string.sub(raw, 1, at), string.sub(raw, at + 1)]);
			expect(results[0], `split at ${at}`).toEqual({ kind: "incomplete" });
			expect(results[1], `split at ${at}`).toEqual(whole);
		}
	});

	test("accepts bare LF and mixed line endings", () => {
		const [result] = read(["GET / HTTP/1.1\nA: 1\r\nB: 2\n\n"]);
		expect(result.kind).toBe("complete");
		if (result.kind === "complete") {
			expect(result.request.headers).toEqual({ a: "1", b: "2" });
		}
	});

	test("counts header bytes including the terminator", () => {
		const raw = "GET / HTTP/1.1\r\nA: 1\r\n\r\n"; // 24 bytes
		expect(raw).toHaveLength(24);
		expect(read([raw], { ...LIMITS, maxHeaderBytes: 24 })[0].kind).toBe(
			"complete",
		);
		expect(read([raw], { ...LIMITS, maxHeaderBytes: 23 })[0]).toEqual({
			kind: "rejected",
			status: HttpStatus.REQUEST_HEADER_FIELDS_TOO_LARGE,
			reason: "request head exceeds 23 bytes",
		});
	});

	test("rejects an unterminated head as soon as it holds more than maxHeaderBytes", () => {
		const results = read(["GET / HTTP/1.1\r\nX: ", "aaaaa", "a"], {
			...LIMITS,
			maxHeaderBytes: 24,
		});
		expect(results[0].kind).toBe("incomplete");
		expect(results[1].kind).toBe("incomplete");
		expect(results[2].kind).toBe("rejected");
	});

	test("reports the reason for a malformed header", () => {
		expect(read(["GET / HTTP/1.1\r\nbad\r\n\r\n"])[0]).toEqual({
			kind: "rejected",
			status: HttpStatus.BAD_REQUEST,
			reason: "Malformed header line: bad",
		});
	});

	test("checks framing on the raw lines, whatever the header name's case", () => {
		expect(
			read([
				"POST / HTTP/1.1\r\ncontent-length: 1\r\nCONTENT-LENGTH: 2\r\n\r\n",
			])[0],
		).toEqual({
			kind: "rejected",
			status: HttpStatus.BAD_REQUEST,
			reason: "conflicting Content-Length headers",
		});
		expect(
			read(["POST / HTTP/1.1\r\nTRANSFER-ENCODING: gzip\r\n\r\n"])[0],
		).toEqual({
			kind: "rejected",
			status: HttpStatus.NOT_IMPLEMENTED,
			reason: "Transfer-Encoding is not supported",
		});
	});

	test("accepts a Content-Length of exactly maxBodyBytes and leading zeros", () => {
		const [exact] = read(["POST / HTTP/1.1\r\nContent-Length: 1024\r\n\r\n"]);
		expect(exact.kind === "complete" && exact.bodyLength).toBe(1024);
		const [zeros] = read(["POST / HTTP/1.1\r\nContent-Length: 007\r\n\r\n"]);
		expect(zeros.kind === "complete" && zeros.bodyLength).toBe(7);
	});
});
