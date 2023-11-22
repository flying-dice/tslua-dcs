import { CRLF, EMPTY_LINE, StatusText } from "./constants";

/**
 * Represents an HTTP response to be sent to a client.
 *
 * This type is used to define the structure of an HTTP response. It includes
 * necessary information such as status code, response headers, and an optional
 * response body.
 *
 * @example
 * const httpResponse: HttpResponse = {
 *     status: 200,
 *     body: 'Hello, world!',
 *     headers: {
 *         'Content-Type': 'text/plain',
 *         'Cache-Control': 'no-cache'
 *     }
 * };
 *
 * This defines a typical HTTP response with a 200 OK status, a plain text body, and
 * headers for content type and cache control.
 */
export type HttpResponse = {
	/** A numeric HTTP status code */
	status: keyof typeof StatusText;

	/** A string containing the body of the response. Optional. */
	body?: string;

	/** An object representing the HTTP headers. Keys are header names, values are the corresponding header values. */
	headers: Record<string, string>;
};

/**
 * Assembles an HTTP response string based on the provided HttpResponse object.
 *
 * This function constructs a valid HTTP response string using the status code,
 * headers, and body (if provided) from the HttpResponse object. It includes a
 * default server header indicating the server is "Lua HTTP/1.1". If the status
 * code is not recognized, it defaults to "Unknown Status".
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages
 *
 * @param {HttpResponse} response - The HttpResponse object containing the necessary
 *                                  information to construct the response string.
 *                                  It must include a status and headers, with an
 *                                  optional body.
 *
 * @returns {string} The complete HTTP response string, ready to be sent over the network.
 *                   This string includes the start line (status line), headers, and
 *                   the response body if provided. Each section is separated by CRLF
 *                   (Carriage Return and Line Feed) characters.
 *
 * @example
 * const response: HttpResponse = {
 *     status: 200,
 *     body: 'Hello, world!',
 *     headers: {
 *         'Content-Type': 'text/plain'
 *     }
 * };
 * const responseString = assembleResponseString(response);
 */
export function assembleResponseString(response: HttpResponse): string {
	const startLine = `HTTP/1.1 ${response.status} ${
		StatusText[response.status] || "Unknown Status"
	}`;
	const headers = [
		"Server: Lua HTTP/1.1",
		...Object.entries(response.headers).map(
			([name, value]) => `${name}: ${value}`,
		),
	];

	let responseString: string;

	if (response.body) {
		responseString = [
			startLine,
			headers.join(CRLF),
			EMPTY_LINE,
			response.body,
		].join(CRLF);
	} else {
		responseString = [startLine, headers.join(CRLF), EMPTY_LINE].join(CRLF);
	}

	return responseString;
}
