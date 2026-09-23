import "./setup"; // must stay first: switches luatest to deferred mode before any test is declared
import "./defaults";
import "./logger";
import "./log-level";
import "./messages";
import "./dcs-transports";
import { run } from "@flying-dice/tslua-luatest";

run();
