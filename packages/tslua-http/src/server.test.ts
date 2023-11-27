import * as socket from "socket";
import { TCP } from "socket";
import { Mocked, afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { CRLF, EMPTY_LINE } from "./constants";
import { HttpServer } from "./server";

vi.mock("socket", () => ({
	bind: vi.fn(),
}));

describe("HttpServer", () => {
	let httpServer: HttpServer;
	let mockTcp: Mocked<TCP>;

	beforeAll(() => {
		mockTcp = mock<TCP>();
		vi.mocked(socket.bind).mockReturnValue(mockTcp);

		httpServer = new HttpServer("127.0.0.1", 8080, (req, res) => {
			res.status = 200;
			res.body = "Hello";
			return res;
		});
	});

	afterAll(() => {
		vi.restoreAllMocks();
	});

	it("should have been bound to the correct address and port", function () {
		expect(socket.bind).toHaveBeenCalledWith("127.0.0.1", 8080);
	});

	it("should handle client download request line by line and send 200 with hello in body and close", () => {
		const mockClient = mock<TCP>();

		mockClient.receive.mockReturnValueOnce("GET / HTTP/1.1");
		mockClient.receive.mockReturnValueOnce("Content-Length: 5");
		mockClient.receive.mockReturnValueOnce(EMPTY_LINE);
		mockClient.receive.mockReturnValueOnce("Hello");

		mockTcp.accept.mockReturnValue(mockClient);
		httpServer.acceptNextClient();

		expect(mockClient.receive).toHaveBeenNthCalledWith(1, "*l");
		expect(mockClient.receive).toHaveBeenNthCalledWith(2, "*l");
		expect(mockClient.receive).toHaveBeenNthCalledWith(3, "*l");
		expect(mockClient.receive).toHaveBeenNthCalledWith(4, 5);

		expect(mockClient.send).toHaveBeenCalledWith(
			["HTTP/1.1 200 OK", "Server: Lua HTTP/1.1", EMPTY_LINE, "Hello"].join(
				CRLF,
			),
		);

		expect(mockClient.close).toHaveBeenCalled();
	});
});
