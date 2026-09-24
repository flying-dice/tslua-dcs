// Runs scripts/export.bridge.lua (the chunk `npm run export` sends to DCS) on lua51, the way
// scripts/export.ts prepares it: the two quoted placeholders are replaced with Lua string literals.

/** Reads a file relative to the package directory (npm runs the scripts there). */
export function readFile(path: string): string {
	const [file, openError] = io.open(path, "rb");
	if (file === undefined) return error(`cannot read ${path}: ${openError}`);
	const content = file.read("*a");
	file.close();
	return content as string;
}

/** A Lua string literal for `value` (the job scripts/export.ts's `lua()` helper does). */
export function luaString(value: string): string {
	return string.format("%q", value);
}

/** The bridge chunk for `namespace`, ready to load. */
export function bridgeSource(namespace: string, version: string): string {
	return readFile("scripts/export.bridge.lua")
		.replace("[[NAMESPACE]]", luaString(namespace))
		.replace("[[DCS_VERSION]]", luaString(version));
}

/**
 * Runs the bridge for `namespace` and returns the map it produces (`{ "<ns>.export.ts": source }`).
 * `globals` replaces the `_G` the chunk inspects; by default it sees the real globals (the doubles).
 */
export function runBridge(
	namespace: string,
	version: string,
	globals?: Record<string, unknown>,
): Record<string, string> {
	const [chunk, loadError] = loadstring(
		bridgeSource(namespace, version),
		"=export.bridge.lua",
	);
	if (chunk === undefined)
		return error(`export.bridge.lua does not compile: ${loadError}`);
	if (globals !== undefined) {
		const environment = setmetatable({ _G: globals }, { __index: _G });
		setfenv(chunk, environment);
	}
	return chunk() as Record<string, string>;
}

/** The `@version` recorded in a committed src/exports/<namespace>.export.ts. */
export function committedVersion(source: string): string {
	const [version] = string.match(source, "@version ([^\n]+)");
	return version ?? "";
}
