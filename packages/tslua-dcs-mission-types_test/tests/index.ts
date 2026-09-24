/**
 * Offline-only suites, bundled to `.test/tests.lua` and run on lua51 with the doubles preloaded:
 * call shapes of every declared function, callback contracts, and the doubles' own behaviour. They
 * rely on `dcsDoubles` and spies, so unlike src/ they are not meant to run inside DCS.
 */
import "../src/setup"; // must stay first
import "./namespaces";
import "./objects";
import "./doubles";
import "./coverage"; // must stay last: checks that the suites above called every function
import { run } from "@flying-dice/tslua-luatest";

run();
