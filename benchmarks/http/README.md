# HTTP server benchmarks

Before/after benchmarks for the non-blocking `tslua-http` server, plus a comparison with a hand-written Lua server,
under realistic and adversarial load. The latest results are in [results/RESULTS.md](results/RESULTS.md); the raw
numbers are in [results/results.json](results/results.json).

```shell
npm ci && npx lua51 --setup           # once
node benchmarks/http/run.mjs          # everything: ~30 minutes with --reps 3
node benchmarks/http/run.mjs --reps 3 --duration 8
node benchmarks/http/run.mjs --scenarios frame-idle,capacity --variants before-app,after-app
node benchmarks/http/run.mjs --reuse-baseline   # keep the built baseline between runs
```

## What is compared

Every variant serves the same four routes: `GET /health` (text), `GET /units/:id` (JSON), `POST /echo` (echoes a
256-byte body) and `GET /big` (8 MiB).

| Variant | What it is |
|---|---|
| `before-http` | `HttpServer` from the baseline commit (default `677d1cf`, before the refactor) with a small TypeScript table router (`entries/http.ts`) |
| `before-app` | The Express-style `Application` from the baseline (`entries/app.ts`, idiomatic: `app.get("/units/:id")`, `res.json`, `res.send`) |
| `after-http`, `after-http-tuned` | The same `entries/http.ts` compiled against the current tree |
| `after-app`, `after-app-tuned` | The same `entries/app.ts` compiled against the current tree |
| `raw-lua`, `raw-lua-tuned` | [`raw/server.lua`](raw/server.lua): a hand-written Lua 5.1 server with a route table and one pattern route, and no TypeScriptToLua or framework. It uses the same transport design as the current `tslua-http` (non-blocking sockets, per-connection state, bounded reads and resumable writes, the same service-order policy, budgets, limits and memory budget), so it isolates what the generated code and the framework cost |

The same TypeScript entry source is compiled against both trees. The baseline is a git worktree created outside the
repository, so module resolution cannot pick up the current tree, and the orchestrator checks that each bundle came
from the right tree. `default` uses every tslua-http default except `maxResponseBytes` (raised so `/big` fits).
`tuned` raises the per-pump allowances (64 accepts, 128 visits and 64 dispatches per pump, and larger I/O budgets).
The baseline has no options.

## How it runs

- **Server host** ([`host.lua`](host.lua)) runs one variant in its own `lua51` process, the way a game would. In
  `frame` mode it calls the server once per 1/60 s frame and sleeps until the next frame (a game loop or DCS timer). In
  `tight` mode it calls the server continuously, which measures capacity. It records how long every call blocks the
  host thread (a histogram and the number of calls longer than a 60 Hz frame), host CPU time and peak Lua heap.
- **Load** ([`load.mjs`](load.mjs)) runs in Node. Every request opens its own connection, and every response is
  validated byte-for-byte (or as JSON), so a fast wrong answer never counts. Client kinds:
  - `healthy`: closed-loop workers cycling the three small routes;
  - `idle`: preconnect-style clients that connect, send nothing, and reconnect when closed;
  - `slowloris`: send a partial head, then one more header line every second;
  - `slowReaders`: request `/big` and stop reading for 3 s, then check that all 8 MiB arrived;
  - `fragmented`: write `POST /echo` in 16-byte pieces 10 ms apart.
- **Scenarios**: `capacity` (tight loop, 48 clients on 3 load threads) and five 60 Hz frame scenarios: well-behaved
  load alone, then with idle, slowloris, slow-reader or fragmented clients added.
- Each scenario/variant pair is repeated `--reps` times on a fresh port, and the repetition with the median healthy
  throughput is reported.

## Reading the results

- **Healthy ok/s and latency** are the well-behaved clients' view. Errors are listed by kind (timeouts, truncated
  bodies, wrong status).
- **Step p50/p99/max** is how long one server call blocked the host thread. In a game this is frame time taken from
  the simulation. `Steps > 16.7 ms` counts calls that alone exceeded a 60 Hz frame.
- **Host CPU per request** is the host process's CPU time divided by the requests served. In frame mode it includes
  each frame's fixed polling cost, so it only compares variants that serve similar request rates.
- In frame mode, throughput is capped by the per-pump allowances: at 60 Hz the default 4 accepts and 4 dispatches per
  pump allow about 240 requests/s, and the baseline's one client per call allows 60/s.

These are host-side measurements on Linux with the repository's Lua 5.1.5 and LuaSocket, with the load generator on
the same machine. They are not DCS measurements: DCS runs a different LuaSocket build on Windows, inside a game frame.
