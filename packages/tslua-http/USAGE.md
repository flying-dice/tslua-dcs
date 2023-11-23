# Usage Guide for HttpServer

## Overview

The `HttpServer` class provides a simple yet powerful interface for creating and managing an HTTP server in TypeScript. This guide covers how to use the `HttpServer` class, including importing necessary modules, creating a server instance, accepting client connections, and handling client requests.

## Importing Modules

Before you can use the `HttpServer` class, ensure that you import the necessary modules in your TypeScript file:

```typescript
import * as socket from "socket";
import { TCP } from "socket";
import { CRLF } from "./constants";
import { readRequestHead } from "./request";
import { HttpResponse, assembleResponseString } from "./response";
```

## Creating an HTTP Server Instance

To create an instance of the `HttpServer`, provide the bind address and the port number:

```typescript
const httpServer = new HttpServer('localhost', 3000);
```

This example creates a new HTTP server that listens on localhost at port 3000.

## Starting the Server and Accepting Connections

To start the server and begin accepting client connections, use a loop:

```typescript
while(true) {
    httpServer.acceptNextClient();
}
```

This loop keeps the server running indefinitely, accepting and handling client connections as they come in.

## Handling Client Requests

Handling of client requests is done internally within the `acceptNextClient` method. When a client connects, their request is processed, and an appropriate response is sent back. The following steps are performed for each client:

1. **Accept Client Connection:** The server accepts an incoming client connection.
2. **Read Request:** The server reads the HTTP request from the client.
3. **Process Request:** The server processes the request, which may include reading additional data if a `Content-Length` header is present.
4. **Send Response:** The server assembles and sends an HTTP response back to the client.
5. **Close Connection:** The connection with the client is closed.

## Complete Example

Here's a complete example of using the `HttpServer` class:

```typescript
import * as socket from "socket";
import { TCP } from "socket";
import { CRLF } from "./constants";
import { readRequestHead } from "./request";
import { HttpResponse, assembleResponseString } from "./response";

// Creating and starting an HttpServer
const httpServer = new HttpServer('127.0.0.1', 8080);
while(true) {
    httpServer.acceptNextClient();
}
```

This example creates an HTTP server that listens on IP `127.0.0.1` and port `8080`, then enters an infinite loop to accept and handle client connections.