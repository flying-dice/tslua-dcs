import { configure } from "@flying-dice/tslua-luatest";

// Deferred mode: nothing runs until index.ts calls run(), so every suite runs and one summary is
// printed. This module must be imported before any test file.
configure({ autoRun: false });
