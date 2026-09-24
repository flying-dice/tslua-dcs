/** @noSelfInFile */

/**
 * GameGUI hook entry. Installed as `Saved Games/<DCS>/Scripts/Hooks/tslua-dcs-bridge.lua`,
 * which DCS loads at startup; serves the GUI environment on port 25579
 * (override with a global `TSLUA_DCS_BRIDGE_GUI_PORT` set before this file loads).
 */
import "../core/lua-paths";
import { createBridge } from "../core/bridge";
import { readInstalledToken } from "../core/token";

declare const TSLUA_DCS_BRIDGE_GUI_PORT: number | undefined;

const bridge = createBridge({
	env: "gui",
	port: TSLUA_DCS_BRIDGE_GUI_PORT,
	token: readInstalledToken(),
});

function pump(this: void): void {
	const [ok, error] = pcall(() => bridge.pump());
	if (!ok) log.write("TSLUA-DCS-BRIDGE", log.ERROR, tostring(error));
}

DCS.setUserCallbacks({ onSimulationFrame: pump as never });

log.write(
	"TSLUA-DCS-BRIDGE",
	log.INFO,
	`${bridge.name} listening on 127.0.0.1:${bridge.port}`,
);
