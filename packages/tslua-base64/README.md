## Base64 for TypeScriptToLua

This repository contains TypeScript type definitions and the associated Lua code for the [lbase64](https://github.com/iskolbin/lbase64) library.

### Installation

To use this library in your project, you need to have Node.js and npm installed. You can then install the type definitions via npm with the command

```shell
npm install @flying-dice/tslua-base64
```

### Usage

```typescript
import * as base64 from "@flying-dice/tslua-base64";

// Example of Encoding to String
const data = `return 1 + 1`;

const encoded = base64.encode(data); // "cmV0dXJuIDEgKyAx"

// Example of Decoding from String
const decoded = base64.decode(encoded); // "return 1 + 1"
```