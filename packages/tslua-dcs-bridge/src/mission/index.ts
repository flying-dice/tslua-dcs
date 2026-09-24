/** @noSelfInFile */

/**
 * Mission scripting entry. `MissionScripting.lua` runs this file (via the
 * block `npm run dcs -- install` adds) at every mission start, before the
 * environment is sanitized; serves the mission environment on port 25580
 * (override with a global `TSLUA_DCS_BRIDGE_MISSION_PORT`).
 */
import "../core/lua-paths";
import { createBridge } from "../core/bridge";
import { readInstalledToken } from "../core/token";

declare const TSLUA_DCS_BRIDGE_MISSION_PORT: number | undefined;

/** Model-time seconds between pumps. The mission pump stops while the sim is paused. */
const PUMP_INTERVAL = 0.02;

const bridge = createBridge({
	env: "mission",
	port: TSLUA_DCS_BRIDGE_MISSION_PORT,
	token: readInstalledToken(),
});

timer.scheduleFunction(
	((_: unknown, time: number) => {
		const [ok, error] = pcall(() => bridge.pump());
		if (!ok) env.error(`[tslua-dcs-bridge] ${tostring(error)}`);
		return time + PUMP_INTERVAL;
	}) as never,
	undefined,
	timer.getTime() + PUMP_INTERVAL,
);

env.info(
	`[tslua-dcs-bridge] ${bridge.name} listening on 127.0.0.1:${bridge.port}`,
);
