/** @noSelfInFile */

// Imported first by tests/index.ts: switch the default runner to deferred mode before any test
// file declares tests, so run() at the end of the entry file executes and reports all of them.
import { configure } from "../src";

configure({ autoRun: false });
