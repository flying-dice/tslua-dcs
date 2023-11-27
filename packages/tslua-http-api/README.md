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
});

// Entering a loop to accept and process client requests
// In a real world scenario you would avoid using an infinite loop and use
// some kind of in game timer linked to periodically loop (i.e. main game loop or frame rendering)
while (true) {
    httpServer.acceptNextClient();
}
```