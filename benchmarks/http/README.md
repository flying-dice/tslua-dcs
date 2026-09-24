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

## Findings (committed run, `b4dc06d` against `677d1cf`)

The figures below come from [results/RESULTS.md](results/RESULTS.md): the median of 3 runs of 8 s each on a 4-vCPU
Linux VM.

**The refactor fixes the host-thread stalls.** In the baseline, one misbehaving client stalls the whole host:

- An idle preconnect blocks a call for 2.0 s.
- A slowloris client blocks one call for 7.7 s, the length of its trickle.
- A client that stops reading blocks a call for 2.0 s, and then its 8 MiB response is cut off at about 4 MB. Three of
  its twelve responses were truncated.

After the refactor, no call in any 60 Hz scenario exceeded a 16.7 ms frame. The longest was 13.2 ms, and most were
under 6 ms. The longest calls in the slow-reader scenario (9–13 ms) come from building an 8 MiB response string in one
piece. The raw Lua server takes 8.8 ms for the same work, so that cost is not the transport's.

**It also serves more.** Healthy-client throughput at 60 Hz for the `Application` framework:

| Scenario | Before | After (defaults) | After (tuned budgets) |
|---|---:|---:|---:|
| Well-behaved load | 60 req/s | 240 req/s | 945 req/s |
| + 8 idle preconnects | 3.8 req/s | 239 req/s | 943 req/s |
| + 4 slowloris clients | 3.9 req/s | 240 req/s | 942 req/s |
| + 4 slow readers | 6.9 req/s | 183 req/s | 756 req/s |
| + 4 fragmented writers | 48 req/s | 220 req/s | 935 req/s |

The baseline handles one client per call, so at 60 Hz it can never exceed 60 req/s. By default the refactored server
accepts and dispatches 4 per pump. That cap is a per-frame budget you can raise (see "tuned"). In the fragmented
scenario the baseline did not stall: clients waited about 333 ms in its backlog, long enough for their whole request to
arrive before being read. The cost shows up as latency (333 ms, against 217 ms after the refactor) rather than as a
stall.

**Unpaced capacity is slightly lower.** When the server is called in a tight loop (not how a game drives it), the
refactored `HttpServer` handles 17.6k req/s, against 19.7k in the baseline (−11%; 18.8k, −5%, with tuned budgets).
`Application` handles 10.9k against 11.4k (−4%). This is the cost of the per-connection state machine, the incremental
parser and the scheduling in generated Lua. The same design written by hand in Lua reaches 28–30k req/s, so the design
is not the limit.

**What TypeScriptToLua and the Express-style layer cost.** All three rows below use the same transport design with
tuned budgets:

| Implementation | Capacity | Host CPU per request at 60 Hz |
|---|---:|---:|
| Raw Lua + route matcher | 29.9k req/s (100%) | 42 µs (1.0×) |
| TypeScriptToLua `HttpServer` + TS table router | 18.8k req/s (63%) | 65 µs (1.6×) |
| TypeScriptToLua `Application` (Express-style) | 11.3k req/s (38%) | 108 µs (2.6×) |

- **TypeScriptToLua costs about 1.6× CPU per request.** It mostly comes from lualib helpers
  (`__TS__StringSplit`, `__TS__StringTrim`, `__TS__ArrayFilter`, `__TS__New`), method calls through class tables, and
  object allocation. One specific trap: a class with any `get`/`set` accessor makes every property access on its
  instances go through `__TS__DescriptorGet`/`__TS__DescriptorSet`. Accessors added during this work made the whole
  pump 20–40% slower until they were replaced with methods.
- **The Express-style layer adds roughly another 1.7×** on top of that. A sampling profile of `Application` under load
  puts about a third of all Lua instructions in framework code that predates this work:
  - `Logger.debug` calls whose message strings are built even when debug logging is off (~9%);
  - every route pattern recompiled for every request (`isMatch`, `routeToPattern`, `gSubPathParamsToPattern`,
    `gSubEscapeReservedChars`, ~14%);
  - `filter` over the handler list, and the request wrapper's accessors going through descriptor lookups (~8%).

  Caching compiled route patterns, guarding debug logging, and replacing the `AppHttpRequest` accessors with plain
  fields or methods would remove most of it without changing the API much.

At DCS-like request rates, these per-request costs are small next to the stalls the refactor removes. At 240 req/s,
`Application`'s 108 µs per request is about 26 ms of CPU per second, or 0.4 ms per 60 Hz frame. A single stalled
client in the baseline cost 2,000–7,700 ms at once.
