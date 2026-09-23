import "./setup"; // must stay first
import "./builder";
import "./server";
import "./specification-extension";
import "./oas-common";
import "./openapi31";
import "./utils";
import "./exports";
import { run } from "@flying-dice/tslua-luatest";

run();
