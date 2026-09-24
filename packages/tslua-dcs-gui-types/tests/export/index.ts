// Entry of the export-generator suite (`npm run test:export`). It needs no doubles.
import "../setup"; // must stay first: enables deferred mode before any test is declared
import "./generator";
import { run } from "@flying-dice/tslua-luatest";

run();
