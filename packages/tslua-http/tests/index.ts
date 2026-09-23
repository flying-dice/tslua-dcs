import "./setup"; // must stay first: switches luatest to deferred mode
import "./constants";
import "./decode-uri-component";
import "./query-params";
import "./request";
import "./response";
import "./server-loopback";
import "./server-faults";
import { run } from "@flying-dice/tslua-luatest";

run();
