## RXI Json for TypeScriptToLua

This repository contains TypeScript type definitions and the associated Lua code for the [rxi/json](https://github.com/rxi/json.lua) library.

### Installation

To use this library in your project, you need to have Node.js and npm installed. You can then install the type definitions via npm with the command

```shell
npm install @flying-dice/tslua-rxi-json
```

### Usage

```typescript
import * as json from "@flying-dice/tslua-rxi-json";

// Example of Encoding to String
const data = { hello: "world" };

const encoded = json.encode(data); // '{"hello":"world"}'

// Example of Decoding from String
const decoded = json.decode(encoded); // { hello: "world" }
```