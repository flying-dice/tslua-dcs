import "./setup"; // must stay first: switches luatest to deferred mode
import "./bridge";
import { run } from "@flying-dice/tslua-luatest";

run();
