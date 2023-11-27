import { CRLF } from "./constants";
import { getQueryParams } from "./query-params";

/**
 * Represents an HTTP request received by the server.
 *
 * This type is used to define the structure of an HTTP request. It encapsulates
 * various components of a typical HTTP request, such as headers, method, URL, and
 * body.
 *
 * @example
 * const httpRequest: HttpRequest = {
 *     headers: {'Content-Type': 'application/json'},
 *     method: 'POST',
 *     originalUrl: 'http://example.com/api/data?user=123',
 *     protocol: 'HTTP/1.1',
 *     path: '/api/data',
 *     parameters: { user: '123' },
 *     body: '{"name": "John Doe"}'
 * };
 */
export type HttpRequest<PARAMS = Record<string, string>> = {
	/** The HTTP headers as a record of key-value pairs. */
	headers: Record<string, string>;

	/** The HTTP method used for the request, e.g., 'GET', 'POST'. */
	method: string;

	/** The full URL as received in the HTTP request line. */
	originalUrl: string;

	/** The protocol used in the request, typically 'HTTP/1.1' or 'HTTP/2.0'. */
	protocol: string;

	/** The path part of the URL, excluding the query string. */
	path: string;

	/** Query parameters parsed from the URL as a record of key-value pairs. */
	parameters: PARAMS;

	/** Optional body of the request. */
	body?: string;
};

/**
 * Parses an HTTP request string and constructs an HttpRequest object.
 *
 * This function takes a raw HTTP request payload as a string and parses it to
 * construct an HttpRequest object. It splits the request into its constituent
 * parts: start line, headers, and potentially a body.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages
 *
 * @param {string} requestPayload - The complete HTTP request payload as a string.
 *
 * @returns {HttpRequest} The HttpRequest object representing the parsed request.
 *
 * The function assumes that the request payload follows the standard HTTP request
 * format, with a start line, followed by headers, an empty line, and an optional body.
 */
export const readRequestHead = (requestPayload: string): HttpRequest => {
	const [startLine, ...headerLines] = requestPayload.split(CRLF);
	const [method, originalUrl, protocol] = startLine.split(" ");

	const httpRequest: HttpRequest = {
		method,
		path: originalUrl.split("?")[0],
		protocol,
		headers: {},
		originalUrl,
		parameters: getQueryParams(originalUrl),
	};

	for (const headerLine of headerLines) {
		if (headerLine === "") break;
		const [key, value] = headerLine.split(":");
		httpRequest.headers[key.trim()] = value.trim();
	}

	return httpRequest;
};
