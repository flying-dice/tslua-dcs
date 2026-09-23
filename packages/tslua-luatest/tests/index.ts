/** @noSelfInFile */

import "./setup"; // must stay first: enables deferred mode before any test is declared
import "./format";
import "./matchers";
import "./throw";
import "./mock";
import "./runner";
import { run } from "../src";

run();
