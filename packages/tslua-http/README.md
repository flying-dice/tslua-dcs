# HTTP Server for Lua

## Introduction

tslua-http is a lightweight and simple HTTP server class designed for Lua environments with the `socket` module.

The server is designed to be embedded in games such as DCS World allowing HTTP requests to be handled.

Written in TypeScript and transpiled to Lua using TypeScriptToLua.

## Usage

Here's a complete example of using the `HttpServer` class to build a simple HTTP server with routing:

By Default Responses start life as an empty `404`, so if your request handler does not perform any mutation on the res
then the user will receive a `404`.

The request handler receives a req and res object. When processing is done return the res to have it be sent to the client.

```typescript
import {HttpRequest, HttpResponse, HttpServer} from "@flying-dice/tslua-http"

// Creating and starting an HttpServer
const httpServer = new HttpServer('127.0.0.1', 8080, (req: HttpRequest, res: HttpResponse) => {
    if (req.path === "/") {
        res.status = 200;
        res.body = "This is the Index!"
        return res
    }

    if (req.path === "/health") {
        res.status = 200;
        res.body = "UP!"
        return res
    }

    // Always return a response: returning nothing closes the connection without a reply.
    return res
});

// Entering a loop to accept and process client requests
// In a real world scenario you would avoid using an infinite loop and use
// some kind of in game timer linked to periodically loop (i.e. main game loop or frame rendering)
while (true) {
    httpServer.acceptNextClient();
}
```

## Testing

`npm test` compiles `tests/index.ts` with TypeScriptToLua and runs it on the repository's `lua51` interpreter
with [luatest](../tslua-luatest). The suite covers:

- the pure functions (`readRequestHead`, `assembleResponseString`, `getQueryParams`, `decodeUriComponent`,
  the status tables) with explicit byte-level expectations;
- `HttpServer` over real LuaSocket on loopback (`tests/support/loopback.ts`): the server binds to
  `127.0.0.1:0` and a client socket in the same process sends raw HTTP, so no second process is needed;
- `HttpServer` against scripted socket doubles (`tests/doubles/fake-socket.ts`) for exact call sequences and
  faults such as read timeouts, partial reads and failed sends. `useFakeListener` makes `socket.bind` return
  the fake listener; `restoreAllMocks()` undoes it.
