import { HttpStatus } from "./constants";
import { getQueryParams } from "./query-params";
import type { HttpRequest } from "./request";

/** Limits applied while reading a request head. */
export interface RequestHeadLimits {
	/** The most bytes in the request line plus headers, including the terminating blank line. */
	maxHeaderBytes: number;
	/** The most header lines, not counting the request line. */
	maxHeaderCount: number;
	/** The largest acceptable Content-Length. */
	maxBodyBytes: number;
}

/** More bytes are needed before the head is complete. */
export type HeadIncomplete = { kind: "incomplete" };

/** The head is complete and its framing is valid. */
export type HeadComplete = {
	kind: "complete";
	request: HttpRequest;
	/** The declared body length, `0` when there is no body. */
	bodyLength: number;
	/** Bytes that followed the head in the input: the start of the body (and possibly excess bytes). */
	rest: string;
};

/** The request must be rejected with `status` without dispatching it. */
export type HeadRejected = {
	kind: "rejected";
	status: HttpStatus;
	reason: string;
};

export type HeadResult = HeadIncomplete | HeadComplete | HeadRejected;

const INCOMPLETE: HeadIncomplete = { kind: "incomplete" };

function reject(status: HttpStatus, reason: string): HeadRejected {
	return { kind: "rejected", status, reason };
}

/**
 * Reads a request head incrementally from arbitrary fragments.
 *
 * Each call to {@link push} appends the new bytes and scans only the lines it has not scanned before, so a head
 * split anywhere (inside the request line, a header, or the CRLF of the terminator) is reconstructed exactly.
 * Lines end with LF; a CR before the LF is removed, so bare-LF clients are accepted. The retained buffer never
 * grows past `maxHeaderBytes` plus the size of one pushed fragment: once more than `maxHeaderBytes` bytes are
 * held without a terminator the head is rejected with `431`.
 *
 * Supported request subset: a request line and headers followed by an optional body framed by a single
 * `Content-Length`. The following are rejected before any body is read or the handler runs:
 *
 * - a header line without a colon, or an empty request line: `400`;
 * - any `Transfer-Encoding` (chunked bodies are not supported): `501`, or `400` together with `Content-Length`;
 * - a `Content-Length` that is not a plain decimal number, or several that disagree: `400`;
 * - a `Content-Length` above `maxBodyBytes`: `413`;
 * - any `Expect` header (the server never sends `100 Continue`): `417`;
 * - too many header bytes or lines: `431`.
 */
export class RequestHeadReader {
	private buffer = "";
	/** 1-based index of the first byte of the next unscanned line. */
	private lineStart = 1;
	private readonly lines: string[] = [];

	constructor(private readonly limits: RequestHeadLimits) {}

	push(data: string): HeadResult {
		this.buffer = this.buffer + data;

		while (true) {
			const [newline] = string.find(this.buffer, "\n", this.lineStart, true);
			if (newline === undefined) break;

			if (newline > this.limits.maxHeaderBytes) {
				return this.tooLarge();
			}

			let line = string.sub(this.buffer, this.lineStart, newline - 1);
			if (string.sub(line, -1) === "\r") line = string.sub(line, 1, -2);
			this.lineStart = newline + 1;

			if (line === "") {
				const rest = string.sub(this.buffer, newline + 1);
				this.buffer = "";
				return this.complete(rest);
			}

			this.lines.push(line);
			if (this.lines.length - 1 > this.limits.maxHeaderCount) {
				return reject(
					HttpStatus.REQUEST_HEADER_FIELDS_TOO_LARGE,
					`more than ${this.limits.maxHeaderCount} header lines`,
				);
			}
		}

		if (this.buffer.length > this.limits.maxHeaderBytes) {
			return this.tooLarge();
		}
		return INCOMPLETE;
	}

	private tooLarge(): HeadRejected {
		return reject(
			HttpStatus.REQUEST_HEADER_FIELDS_TOO_LARGE,
			`request head exceeds ${this.limits.maxHeaderBytes} bytes`,
		);
	}

	private complete(rest: string): HeadResult {
		if (this.lines.length === 0) {
			return reject(HttpStatus.BAD_REQUEST, "empty request line");
		}

		// Parse the headers exactly as `readRequestHead` does, and inspect the framing headers on the raw lines while
		// doing so: the header record keeps only the last of repeated names.
		const headers: Record<string, string> = {};
		const contentLengths: string[] = [];
		let transferEncoding = false;
		let expect = false;
		for (let i = 1; i < this.lines.length; i++) {
			const line = this.lines[i];
			const [colon] = string.find(line, ":", 1, true);
			if (colon === undefined) {
				return reject(HttpStatus.BAD_REQUEST, `Malformed header line: ${line}`);
			}
			const name = string
				.sub(line, 1, colon - 1)
				.trim()
				.toLowerCase();
			const value = string.sub(line, colon + 1).trim();
			headers[name] = value;
			if (name === "content-length") contentLengths.push(value);
			else if (name === "transfer-encoding") transferEncoding = true;
			else if (name === "expect") expect = true;
		}

		if (transferEncoding) {
			return contentLengths.length > 0
				? reject(
						HttpStatus.BAD_REQUEST,
						"both Transfer-Encoding and Content-Length",
					)
				: reject(
						HttpStatus.NOT_IMPLEMENTED,
						"Transfer-Encoding is not supported",
					);
		}

		let bodyLength = 0;
		for (let i = 0; i < contentLengths.length; i++) {
			const value = contentLengths[i];
			const [digits] = string.match(value, "^%d+$");
			if (digits === undefined) {
				return reject(
					HttpStatus.BAD_REQUEST,
					`invalid Content-Length: ${value}`,
				);
			}
			const length = tonumber(digits) as number;
			if (i > 0 && length !== bodyLength) {
				return reject(
					HttpStatus.BAD_REQUEST,
					"conflicting Content-Length headers",
				);
			}
			bodyLength = length;
		}
		if (bodyLength > this.limits.maxBodyBytes) {
			return reject(
				HttpStatus.REQUEST_TOO_LONG,
				`Content-Length ${bodyLength} exceeds ${this.limits.maxBodyBytes} bytes`,
			);
		}

		if (expect) {
			return reject(HttpStatus.EXPECTATION_FAILED, "Expect is not supported");
		}

		// The common "METHOD target PROTOCOL" line is matched with one pattern; anything else is split exactly as
		// readRequestHead splits it, so odd lines parse the same way they always did.
		let [method, originalUrl, protocol] = string.match(
			this.lines[0],
			"^([^ ]+) ([^ ]+) ([^ ]+)$",
		);
		if (method === undefined) {
			[method, originalUrl, protocol] = this.lines[0].split(" ");
		}
		if (!method || originalUrl === undefined) {
			return reject(HttpStatus.BAD_REQUEST, "malformed request line");
		}
		const [query] = string.find(originalUrl, "?", 1, true);
		const request: HttpRequest = {
			method,
			path:
				query === undefined
					? originalUrl
					: string.sub(originalUrl, 1, query - 1),
			protocol,
			headers,
			originalUrl,
			parameters: query === undefined ? {} : getQueryParams(originalUrl),
		};

		return { kind: "complete", request, bodyLength, rest };
	}
}
