import type { _net } from "./exports/net.export";
/** @noSelf **/
export interface l_net extends _net {
	dostring_in(env: string, luaScript: string): string | undefined;
}
