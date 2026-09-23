/** @noSelfInFile */

/** What the host loop drives: `step` is called once per frame (or continuously), `close` at the end. */
export interface Instance {
	step: () => void;
	close: () => void;
}

/** The `/big` response body: 8 MiB, more than a stalled client's socket buffers absorb on Linux loopback. */
export const BIG_BODY = string.rep("x", 8 * 1024 * 1024);

/**
 * Server options per profile. `default` keeps every tslua-http default except `maxResponseBytes`, raised so
 * `/big` can be served. `tuned` raises the per-pump allowances for a busy server. The baseline tree has no
 * options and ignores them.
 */
export function optionsFor(profile: string): object {
	if (profile === "tuned") {
		return {
			maxResponseBytes: 16 * 1024 * 1024,
			maxConnections: 64,
			maxAcceptsPerPump: 64,
			maxVisitsPerPump: 128,
			maxDispatchesPerPump: 64,
			maxIoBytesPerVisit: 262144,
			maxIoBytesPerPump: 4 * 1024 * 1024,
		};
	}
	return { maxResponseBytes: 16 * 1024 * 1024 };
}
