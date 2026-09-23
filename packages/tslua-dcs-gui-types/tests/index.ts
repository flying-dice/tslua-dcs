import "./setup"; // must stay first: enables deferred mode before any test is declared
import "./call-shapes";
import "./lua-shapes";
import "./surface";
import "./doubles-behaviour";
import { run } from "@flying-dice/tslua-luatest";

run();
