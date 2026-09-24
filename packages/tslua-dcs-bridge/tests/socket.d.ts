/** The slice of LuaSocket the bridge tests use as an HTTP client. */
declare module "socket" {
	interface Client {
		send(
			this: Client,
			data: string,
		): LuaMultiReturn<[number | undefined, string | undefined]>;
		receive(
			this: Client,
			pattern: "*a" | "*l" | number,
		): LuaMultiReturn<
			[string | undefined, string | undefined, string | undefined]
		>;
		settimeout(this: Client, seconds: number): void;
		close(this: Client): void;
	}
	/** @noSelf */
	export function connect(
		host: string,
		port: number,
	): LuaMultiReturn<[Client | undefined, string | undefined]>;
}
