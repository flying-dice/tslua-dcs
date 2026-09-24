/**
 * The TypeScript examples of the mission scripting declarations. The same bundle
 * (`.test/mission-tests.lua`) runs inside DCS (`npm run test:dcs`, through the project mission bridge)
 * and offline on lua51 with the mission-environment doubles preloaded (`npm test`).
 */
import "./setup"; // must stay first
import "./Airbase_test";
import "./atmosphere_test";
import "./coalition_test";
import "./Controller_test";
import "./coord_test";
import "./env_test";
import "./land_test";
import "./missionCommands_test";
import "./net_test";
import "./Group_test";
import "./Object_test";
import "./StaticObject_test";
import "./timer_test";
import "./trigger_test";
import "./Unit_test";
import "./Warehouse_test";
import "./Weapon_test";
import "./world_test";
import { afterAll, run } from "@flying-dice/tslua-luatest";
import { cleanupFixtures } from "./fixtures";

afterAll(() => cleanupFixtures());

// Prints the report and throws when a test failed: lua51 exits non-zero, and the DCS runner's pcall
// reports the failure.
run();

export const completed = true;
