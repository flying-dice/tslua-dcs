## Common for TypeScriptToLua

This repository contains a set of common tools for use in tslua for DCS

### Installation

To use this library in your project, you need to have Node.js and npm installed.

```shell
npm install @flying-dice/tslua-common
```

### Usage

```ts
import { Logger, LogLevel } from "@flying-dice/tslua-common";

Logger.level = LogLevel.DEBUG;
// Transports are plain functions that receive only the formatted message,
// so Lua functions such as print or DCS's env.info can be assigned directly.
Logger.transports = { trace: Logger.ignore, debug: env.info, info: env.info, warn: env.warning, error: env.error };

new Logger("MyMod").info("started"); // env.info("[INFO] [MyMod] - started")
```

### Testing

`npm test` compiles `tests/` with TypeScriptToLua and runs it on the repository's `lua51` interpreter with
[`@flying-dice/tslua-luatest`](../tslua-luatest). `tests/doubles/dcs-env.lua` is preloaded to provide
recording doubles of DCS's `env` and `log` logging functions.
