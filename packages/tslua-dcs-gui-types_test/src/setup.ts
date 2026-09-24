// Imported first by src/index.ts: switch luatest to deferred mode before any test is declared, so
// run() at the end of the entry file executes and reports every suite, offline and in DCS alike.
import { configure } from "@flying-dice/tslua-luatest";

configure({ autoRun: false });
