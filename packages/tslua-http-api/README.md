# HTTP API framework for Lua

## Introduction

tslua-http-api is a small Express-style framework (routing, middleware, JSON bodies and error handling) on top of
[tslua-http](../tslua-http), for Lua environments with the `socket` module such as DCS World.

Written in TypeScript and transpiled to Lua using TypeScriptToLua.

## Usage

```typescript
import { Application } from "@flying-dice/tslua-http-api";

const app = new Application("127.0.0.1", 8080);

app.get("/health", (_req, res) => {
    res.status(200).send("UP!");
});

app.post("/units/:id", (req, res) => {
    res.json({ id: req.getPathParameterValue("id"), body: req.getBody() });
});

// Drive the server from the host's loop; each pump does bounded, non-blocking work and returns.
// In DCS, from a timer callback:
timer.scheduleFunction(() => {
    app.pump();
    return timer.getTime() + 0.1;
}, [], timer.getTime() + 0.1);
```

Requests that match no route receive an empty `404`. The optional third constructor argument takes the
`HttpServerOptions` of `tslua-http` (connection limits, deadlines, per-pump budgets and the clock), for example
`new Application("127.0.0.1", 8080, { maxConnections: 4 })`. See the [tslua-http README](../tslua-http/README.md) for
the scheduling policy, the defaults and the supported HTTP subset.

`acceptNextClient()` still works: it runs one `pump()`.
