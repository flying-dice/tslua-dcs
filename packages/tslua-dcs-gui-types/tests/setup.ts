// Imported first by tests/index.ts: switch luatest to deferred mode before any test is declared,
// so run() at the end of the entry file executes and reports every test.
import { configure } from "@flying-dice/tslua-luatest";

configure({ autoRun: false });
