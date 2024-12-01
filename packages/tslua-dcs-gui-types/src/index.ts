import type { l_DCS } from "./DCS";
import type { l_Export } from "./Export";
import type { l_coalition } from "./coalition";
import type { l_db } from "./db";
import type { l_lfs } from "./lfs";
import type { l_log } from "./log";
import type { l_net } from "./net";
import type { l_terrain } from "./terrain";

export * from "./coalition";
export * from "./DCS";
export * from "./Export";
export * from "./log";
export * from "./db";
export * from "./net";

declare global {
	const __DCS_VERSION__: string;
	const __FINAL_VERSION__: string;
	const _APP_VERSION: string;
	const _ARCHITECTURE: string;

	/** @noSelf **/
	const coalition: l_coalition;

	/** @noSelf **/
	const DCS: l_DCS;

	/** @noSelf **/
	const Export: l_Export;

	/** @noSelf **/
	const log: l_log;

	/** @noSelf **/
	const db: l_db;

	/** @noSelf **/
	const net: l_net;

	/** @noSelf **/
	const lfs: l_lfs;

	/** @noSelf **/
	const terrain: l_terrain;
}
