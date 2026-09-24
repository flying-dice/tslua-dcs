// Entry of the example suites. The same bundle (.test/tests.lua) runs offline on lua51 with the
// DCS GUI doubles preloaded (`npm test`) and inside DCS through the DCS Studio GUI bridge
// (`npm run test:dcs`). run() prints the report and raises when a test failed, which fails the
// lua51 process offline and the bridge's pcall in DCS.
import "./setup"; // must stay first: enables deferred mode before any test is declared
import "./DCS_test";
import "./Export_test";
import "./lfs_test";
import "./log_test";
import "./net_test";
import "./terrain_test";
import { run } from "@flying-dice/tslua-luatest";

run();
