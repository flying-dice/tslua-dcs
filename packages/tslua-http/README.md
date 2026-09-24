# HTTP Server for Lua

## Introduction

tslua-http is a lightweight HTTP/1.1 server class for Lua 5.1 environments with the LuaSocket `socket` module.

It is designed to be embedded in games such as DCS World: the host calls `pump()` from its own loop or timer, and
each call does a bounded amount of non-blocking work and returns. An idle, slow or incomplete connection never holds
up the others.

Written in TypeScript and transpiled to Lua using TypeScriptToLua.

## Usage

Responses start life as an empty `404`, so if your request handler does not change `res`, the client receives a `404`.
The handler receives a `req` and a `res` object; return the response when you are done. (A handler that throws or
returns nothing produces an empty `500`.)

```typescript
import { HttpRequest, HttpResponse, HttpServer } from "@flying-dice/tslua-http";

const httpServer = new HttpServer("127.0.0.1", 8080, (req: HttpRequest, res: HttpResponse) => {
    if (req.path === "/health") {
        res.status = 200;
        res.body = "UP!";
        return res;
    }
    return res;
});

// Drive the server from the host's loop. In DCS, from a timer callback:
timer.scheduleFunction(() => {
    httpServer.pump();
    return timer.getTime() + 0.1;
}, [], timer.getTime() + 0.1);
```

`acceptNextClient()` is kept for existing callers and simply runs one `pump()`. Unlike earlier versions a call no longer
handles exactly one client from start to finish: it may advance several connections, and a request may take several
calls to be read and answered. Keep calling it (or `pump()`) repeatedly.

An optional fourth constructor argument configures limits, deadlines, budgets and the clock:

```typescript
new HttpServer("127.0.0.1", 8080, handler, { maxConnections: 4, requestTimeout: 5 });
```

## How a pump works

Each connection is a small state machine whose state survives between pumps:

```
READING_HEADERS -> READING_BODY -> READY_TO_DISPATCH -> DISPATCHING -> WRITING_RESPONSE -> CLOSED
```

A request without a body goes from `READING_HEADERS` straight to `READY_TO_DISPATCH`; a rejected request goes straight to
`WRITING_RESPONSE` with an error response.

`pump()`:

1. accepts up to `maxAcceptsPerPump` new connections, while fewer than `maxConnections` are open. At capacity it stops
   accepting, and new clients wait in the operating system's listen backlog;
2. visits open connections in service order, up to `maxVisitsPerPump` visits. A visit:
   - reads what is available (bounded `receive(n)` calls on a non-blocking socket, partial data included) and feeds it
     to an incremental parser;
   - runs the request handler once the request is complete, at most once per request;
   - writes as much of the response as the socket accepts, resuming from the exact byte where the last write stopped;
   - closes the connection once the whole response has been accepted by the socket. That means the bytes are in the
     operating system's send buffer, not that the client has received or processed them.
3. stops early when a per-pump budget is spent: `maxIoBytesPerPump` bytes read plus written, `maxDispatchesPerPump`
   handler runs, or `maxPumpSeconds` of clock time. The first accept, visit and dispatch of a pump always happen, so
   the server keeps making progress with a coarse clock.
4. reorders the connections for the next pump: first the ones this pump did not reach, then the ones that were refused
   a budgeted operation (a handler run, or I/O once the byte budget ran out), then the rest. New connections join at
   the back. A connection that loses out in one pump is therefore first in the next, however many new clients arrive.

No socket call waits: a read or write that would block ends that connection's visit, and the connection is revisited on
a later pump. The time budget is cooperative. It is checked between operations and cannot interrupt a handler that is
already running, but no further handler starts once it is spent.

`pump()` returns counters for the call (`accepted`, `visited`, `dispatched`, `bytesRead`, `bytesWritten`, `closed`,
`active`, `bufferedBodyBytes`), and `connectionCount()` returns the number of open connections. You can use them for your own bounded instrumentation. The server logs connection events at debug level
and failures at warn or error level. It never logs per pump, and a read or write that would block is never logged.

## Options and defaults

The defaults are conservative initial settings for small JSON APIs. They have not been measured in DCS; tune them for
your workload.

| Option | Default | Meaning |
|---|---|---|
| `maxConnections` | `64` | Open connections; accepting pauses at this count. Idle connections are cheap, so keep this well above the expected number of clients: a few idle clients can otherwise hold every slot until their deadlines expire |
| `maxBufferedBodyBytes` | `33554432` | Declared request bodies held across all connections; a body that does not fit gets `503` (see below) |
| `maxRequestHeaderBytes` | `8192` | Request line plus headers; more gets `431` |
| `maxRequestHeaderCount` | `64` | Header lines; more gets `431` |
| `maxRequestBodyBytes` | `1048576` | Largest `Content-Length`; more gets `413` before any body is read |
| `maxResponseBytes` | `4194304` | Largest serialized response; a larger one is replaced by `500` |
| `requestTimeout` | `10` | Seconds from accept until the request is complete (absolute; more bytes do not extend it); then `408` |
| `responseTimeout` | `30` | Seconds to hand the whole response to the socket; then the connection is closed |
| `idleTimeout` | `0` (off) | Seconds without a request byte before `408` |
| `ioChunkBytes` | `8192` | Bytes per `receive`/`send` call |
| `maxIoBytesPerVisit` | `32768` | Bytes moved for one connection per visit |
| `maxIoBytesPerPump` | `262144` | Bytes moved per pump, all connections |
| `maxAcceptsPerPump` | `4` | New connections per pump |
| `maxVisitsPerPump` | `32` | Connection visits per pump |
| `maxDispatchesPerPump` | `4` | Handler runs per pump |
| `maxPumpSeconds` | `0.005` | Soft time budget per pump |
| `clock` | `socket.gettime` | Clock for deadlines and the time budget |

**Memory bound.** Declared request bodies share the `maxBufferedBodyBytes` budget. A body is reserved when its head
arrives, and one that does not fit gets `503 Service Unavailable` before anything is read or dispatched. Serialized
responses are bounded per connection by `maxResponseBytes` and in time by `responseTimeout`. They are deliberately not
part of the body budget, so clients that stop reading large responses cannot make the server refuse small requests
from everyone else. Each connection also holds at most one head buffer (`maxRequestHeaderBytes` plus one read chunk).
The server's own buffers are therefore bounded by
`maxBufferedBodyBytes + maxConnections × (maxRequestHeaderBytes + ioChunkBytes + maxResponseBytes)`, about 289 MiB with
the defaults. That worst case needs 64 clients each leaving a 4 MiB response unread, so lower `maxResponseBytes` or
`maxConnections` if your responses are small or your clients few. While a complete body is joined into one string its fragments exist alongside it for a
moment, and strings the handler builds for itself (such as a response body before serialization) are outside this
bound.

**Clock.** `socket.gettime` is wall-clock (Unix) time, not a monotonic clock. The server never lets its view of time go
backwards: after a backwards adjustment, deadlines pause until the clock catches up, and a forward adjustment expires
them early. Do not pass simulation time (such as DCS's `timer.getTime`): it stops while the mission is paused, and
network deadlines would never expire.

## Supported HTTP subset

- One request per connection. Every response carries `Connection: close`, replacing any `Connection` header the handler
  sets, and the connection is closed after the response. There is no keep-alive and no pipelining.
- Request bodies are framed by a single `Content-Length` and kept byte-for-byte (NUL bytes and CRLFs included). Bytes
  past the declared length are ignored.
- Responses are close-delimited: no `Content-Length` is added.
- Lines may end in CRLF or bare LF.
- The following requests are answered without calling the handler:

| Request | Response |
|---|---|
| Header line without a colon, or an empty request line or one without a target | `400` |
| `Content-Length` that is not a plain decimal number (negative, signed, list-valued), or several that disagree | `400` |
| `Transfer-Encoding` together with `Content-Length` | `400` |
| Any other `Transfer-Encoding` (chunked bodies are not supported) | `501` |
| `Content-Length` above `maxRequestBodyBytes` | `413` |
| Any `Expect` header (the server never sends `100 Continue`) | `417` |
| Head larger than `maxRequestHeaderBytes`, or more than `maxRequestHeaderCount` headers | `431` |
| A declared body that does not fit in the free `maxBufferedBodyBytes` budget | `503` |
| Request not complete within `requestTimeout` (or `idleTimeout`) | `408` |

- A request is dispatched only when it is complete. If the client half-closes after a complete request, it is still
  answered. A connection that closes mid-request is dropped without a response.

## Testing

`npm test` compiles `tests/index.ts` with TypeScriptToLua and runs it on the repository's `lua51` interpreter with
[luatest](../tslua-luatest), so the generated Lua is what gets tested. The suite covers:

- the pure functions (`readRequestHead`, `RequestHeadReader`, `assembleResponseString`, `getQueryParams`,
  `decodeUriComponent`, the status tables) with byte-level expectations;
- `HttpServer` over real LuaSocket on loopback (`tests/support/loopback.ts`). The server binds to `127.0.0.1:0`, and
  non-blocking clients in the same process alternate bounded writes, server pumps and reads under a watchdog. This
  covers fragmented requests, concurrent clients, a client that stops reading a large response, half-close, and
  deadlines driven by a fake clock;
- `HttpServer` against scripted socket doubles (`tests/doubles/fake-socket.ts`) and a fake clock
  (`tests/support/fake-server.ts`). These cover exact call sequences, fragmentation at every byte, partial and
  zero-progress writes, fairness and budgets, deadlines, limits and failure isolation. `useFakeListener` makes
  `socket.bind` return the fake listener, and `restoreAllMocks()` undoes it.
