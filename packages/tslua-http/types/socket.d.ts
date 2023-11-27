/** @noResolution */
declare module "socket" {
	type TCPRecvPattern = number | "*l" | "*a";

	interface TCP {
		/**
		 * Waits for a remote connection on the server object and returns a client object representing that connection.
		 *
		 * If a connection is successfully initiated, a client object is returned. If a timeout condition is met, the method returns nil followed by the error string 'timeout'.
		 * Other errors are reported by nil followed by a message describing the error.
		 *
		 * Note: calling socket.select with a server object in the recvt parameter before a call to accept does not guarantee accept will return immediately.
		 * Use the settimeout method or accept might block until another client shows up.
		 *
		 * @see https://lunarmodules.github.io/luasocket/tcp.html#accept
		 */
		accept(): TCP;

		/**
		 * Closes a TCP object. The internal socket used by the object is closed and the local address to which the object was bound is made available to other applications. No further operations (except for further calls to the close method) are allowed on a closed socket.
		 *
		 * Note: It is important to close all used sockets once they are not needed, since, in many systems, each socket uses a file descriptor, which are limited system resources. Garbage-collected objects are automatically closed before destruction, though.
		 *
		 * @see https://lunarmodules.github.io/luasocket/tcp.html#close
		 */
		close(): void;

		/**
		 * Reads data from a client object according to the specified read pattern.
		 * @param pattern Read pattern.
		 * @param prefix Optional prefix for received data.
		 * @returns The received pattern or `nil` followed by an error message and a string with partial data received.
		 */
		receive(
			pattern: TCPRecvPattern,
			prefix?: string,
		): string | [null, string, string];

		/**
		 * Sends data through the client object.
		 * @param data Data to send.
		 * @param i Optional start index of the substring to send.
		 * @param j Optional end index of the substring to send.
		 * @returns The index of the last byte sent or `nil` followed by an error message and the index of the last byte sent.
		 */
		send(data: string, i?: number, j?: number): number | [null, string, number];

		/**
		 * Changes the timeout values for the object.
		 * @param value Timeout value in seconds.
		 * @param mode Timeout mode ('b' or 't').
		 */
		settimeout(value: number, mode?: "b" | "t"): void;

		/**
		 * Returns the local address information associated to the object.
		 * The method returns a string with local IP address, a number with the local port, and a string with the family ("inet" or "inet6"). In case of error, the method returns nil.
		 */
		getsockname(): [string, number, string];
	}

	/**
	 * This function is a shortcut that creates and returns a TCP server object bound to a local address and port,
	 * ready to accept client connections. Optionally, user can also specify the backlog argument to the listen method (defaults to 32).
	 *
	 * Note: The server object returned will have the option "reuseaddr" set to true.
	 *
	 * @see https://lunarmodules.github.io/luasocket/socket.html#bind
	 *
	 * @param address
	 * @param port
	 * @param backlog Specifies the number of client connections that can be queued waiting for service. If the queue is full and another client attempts connection, the connection is refused.
	 * @noSelf
	 */
	function bind(address: string, port: number, backlog?: number): TCP;
}
