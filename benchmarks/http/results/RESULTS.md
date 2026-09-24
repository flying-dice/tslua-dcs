# HTTP server benchmark results

- Date: 2026-09-24T00:21:44.041Z
- Baseline (before): `677d1cf`; after: `b4dc06d`
- Machine: Intel(R) Xeon(R) Processor @ 2.10GHz, 4 CPUs, 16 GiB, linux 6.18.44-fc-v37; Node v22.22.2; Lua 5.1.5  Copyright (C) 1994-2012 Lua.org, PUC-Rio
- 8 s of load per run; 3 repetition(s), median healthy throughput reported
- Frame scenarios call the server once per 16.67 ms frame (60 Hz)

## Summary: before and after, under load

Healthy-client throughput and the longest single server call (host-thread stall) in each 60 Hz scenario.

| Scenario | Before: Application | After: Application (defaults) | After: Application (tuned) | Before: longest call | After: longest call (defaults / tuned) |
|---|---:|---:|---:|---:|---:|
| frame-healthy | 60.0 req/s | 240.0 req/s | 945.1 req/s | 1.33 ms | 3.97 / 7.82 ms |
| frame-idle | 3.8 req/s | 239.2 req/s | 942.9 req/s | 2001 ms | 3.43 / 5.76 ms |
| frame-slowloris | 3.9 req/s | 239.6 req/s | 941.9 req/s | 7720 ms | 4.11 / 13.23 ms |
| frame-slow-readers | 6.9 req/s | 183.0 req/s | 755.5 req/s | 2008 ms | 11.98 / 12.80 ms |
| frame-fragmented | 48.0 req/s | 219.9 req/s | 934.8 req/s | 2.28 ms | 3.89 / 6.92 ms |

## Summary: what TypeScriptToLua and the Express-style layer cost

All three use the same non-blocking transport design with tuned budgets. Capacity is the unpaced loop; CPU per request is measured at 60 Hz under the same offered load.

| Implementation | Capacity (req/s) | vs raw Lua | Host CPU per request at 60 Hz (µs) | vs raw Lua |
|---|---:|---:|---:|---:|
| Raw Lua + route matcher | 29872 | 100% | 42 | 1.0× |
| TypeScriptToLua HttpServer + TS router | 18762 | 63% | 65 | 1.6× |
| TypeScriptToLua Application (Express-style) | 11289 | 38% | 108 | 2.6× |

## capacity

Unpaced loop (server capacity), 48 concurrent clients on 3 load-generator threads

| Variant | Healthy ok/s | Healthy errors | Latency p50 / p99 / max (ms) | Step p50 / p99 / max (ms) | Steps > 16.7 ms | Host CPU per request (µs) | Peak Lua heap (MiB) |
|---|---:|---|---|---|---:|---:|---:|
| Before: HttpServer + TS router | 19711.6 | 0 | 1.3 / 4.8 / 2049.0 | 0.002 / 0.125 / 17.42 | 1 | 48 | 25.6 |
| Before: Application (Express-style) | 11416.9 | 0 | 2.2 / 7.2 / 3073.6 | 0.002 / 0.176 / 4.49 | 0 | 87 | 29.8 |
| After: HttpServer + TS router | 17631.1 | 0 | 1.9 / 5.5 / 1031.0 | 0.003 / 0.301 / 3.89 | 0 | 57 | 18.0 |
| After: HttpServer + TS router, tuned budgets | 18761.9 | 0 | 1.4 / 5.2 / 1037.2 | 0.003 / 1.44 / 11.68 | 0 | 53 | 18.7 |
| After: Application (Express-style) | 10929.2 | 0 | 3.0 / 7.8 / 2049.7 | 0.003 / 0.491 / 4.71 | 0 | 91 | 25.7 |
| After: Application, tuned budgets | 11289.3 | 0 | 2.3 / 6.4 / 1036.9 | 0.003 / 2.12 / 6.84 | 0 | 90 | 24.1 |
| Raw Lua + route matcher | 27796.0 | 0 | 1.5 / 4.7 / 1031.0 | 0.073 / 0.424 / 4.90 | 0 | 36 | 25.3 |
| Raw Lua, tuned budgets | 29872.2 | 0 | 0.9 / 3.1 / 2036.5 | 0.002 / 0.882 / 5.72 | 0 | 33 | 25.3 |

## frame-healthy

60 Hz frame loop, 16 concurrent well-behaved clients

| Variant | Healthy ok/s | Healthy errors | Latency p50 / p99 / max (ms) | Step p50 / p99 / max (ms) | Steps > 16.7 ms | Host CPU per request (µs) | Peak Lua heap (MiB) |
|---|---:|---|---|---|---:|---:|---:|
| Before: HttpServer + TS router | 60.0 | 0 | 266.6 / 266.8 / 267.2 | 0.160 / 0.332 / 0.906 | 0 | 208 | 25.6 |
| Before: Application (Express-style) | 60.0 | 0 | 266.6 / 267.6 / 270.3 | 0.236 / 0.762 / 1.33 | 0 | 295 | 31.5 |
| After: HttpServer + TS router | 240.0 | 0 | 66.6 / 68.1 / 68.8 | 0.349 / 2.23 / 2.50 | 0 | 107 | 24.5 |
| After: HttpServer + TS router, tuned budgets | 959.5 | 0 | 16.7 / 19.1 / 20.8 | 0.840 / 3.63 / 4.67 | 0 | 65 | 24.1 |
| After: Application (Express-style) | 240.0 | 0 | 66.6 / 68.2 / 70.1 | 0.541 / 2.58 / 3.97 | 0 | 168 | 25.7 |
| After: Application, tuned budgets | 945.1 | 0 | 16.7 / 32.4 / 49.7 | 1.44 / 5.11 / 7.82 | 0 | 108 | 23.6 |
| Raw Lua + route matcher | 240.0 | 0 | 66.6 / 68.0 / 69.7 | 0.273 / 1.58 / 3.27 | 0 | 86 | 25.3 |
| Raw Lua, tuned budgets | 960.2 | 0 | 16.7 / 18.5 / 19.9 | 0.568 / 1.66 / 3.74 | 0 | 42 | 25.3 |

## frame-idle

60 Hz, 16 clients + 8 idle preconnects (connect, send nothing)

| Variant | Healthy ok/s | Healthy errors | Latency p50 / p99 / max (ms) | Step p50 / p99 / max (ms) | Steps > 16.7 ms | Host CPU per request (µs) | Peak Lua heap (MiB) |
|---|---:|---|---|---|---:|---:|---:|
| Before: HttpServer + TS router | 3.8 | 0 | 265.2 / 8054.6 / 8054.6 | 0.176 / 2063 / 2001 | 4 | 328 | 25.6 |
| Before: Application (Express-style) | 3.8 | 0 | 255.4 / 8064.3 / 8064.3 | 0.236 / 2063 / 2001 | 4 | 393 | 30.4 |
| After: HttpServer + TS router | 239.1 | 0 | 66.6 / 69.1 / 100.1 | 0.366 / 1.92 / 2.28 | 0 | 112 | 24.5 |
| After: HttpServer + TS router, tuned budgets | 959.6 | 0 | 16.7 / 19.3 / 32.2 | 0.882 / 4.41 / 5.83 | 0 | 67 | 24.3 |
| After: Application (Express-style) | 239.2 | 0 | 66.6 / 70.0 / 100.3 | 0.568 / 2.84 / 3.43 | 0 | 173 | 25.7 |
| After: Application, tuned budgets | 942.9 | 0 | 16.7 / 33.0 / 36.4 | 1.44 / 5.36 / 5.76 | 0 | 107 | 24.2 |
| Raw Lua + route matcher | 239.2 | 0 | 66.6 / 68.3 / 100.1 | 0.273 / 1.02 / 1.65 | 0 | 80 | 25.3 |
| Raw Lua, tuned budgets | 960.9 | 0 | 16.7 / 18.0 / 19.6 | 0.597 / 2.02 / 3.30 | 0 | 43 | 25.3 |

| Variant | Idle/slowloris connections opened | Closed by server |
|---|---:|---:|
| Before: HttpServer + TS router | 11 | 3 |
| Before: Application (Express-style) | 11 | 3 |
| After: HttpServer + TS router | 8 | 0 |
| After: HttpServer + TS router, tuned budgets | 8 | 0 |
| After: Application (Express-style) | 8 | 0 |
| After: Application, tuned budgets | 8 | 0 |
| Raw Lua + route matcher | 8 | 0 |
| Raw Lua, tuned budgets | 8 | 0 |

## frame-slowloris

60 Hz, 16 clients + 4 slowloris (one header line per second)

| Variant | Healthy ok/s | Healthy errors | Latency p50 / p99 / max (ms) | Step p50 / p99 / max (ms) | Steps > 16.7 ms | Host CPU per request (µs) | Peak Lua heap (MiB) |
|---|---:|---|---|---|---:|---:|---:|
| Before: HttpServer + TS router | 3.9 | 0 | 263.5 / 8038.6 / 8038.6 | 0.160 / 8086 / 7722 | 1 | 301 | 25.6 |
| Before: Application (Express-style) | 3.9 | 0 | 265.5 / 8037.4 / 8037.4 | 0.248 / 8086 / 7720 | 1 | 355 | 30.3 |
| After: HttpServer + TS router | 239.6 | 0 | 66.7 / 69.1 / 83.4 | 0.366 / 1.92 / 2.23 | 0 | 109 | 24.6 |
| After: HttpServer + TS router, tuned budgets | 958.2 | 0 | 16.7 / 19.3 / 20.5 | 0.840 / 4.63 / 4.79 | 0 | 63 | 24.5 |
| After: Application (Express-style) | 239.6 | 0 | 66.6 / 83.2 / 96.7 | 0.627 / 2.84 / 4.11 | 0 | 195 | 25.7 |
| After: Application, tuned budgets | 941.9 | 0 | 16.7 / 33.0 / 49.7 | 1.44 / 5.36 / 13.23 | 0 | 113 | 24.8 |
| Raw Lua + route matcher | 239.6 | 0 | 66.6 / 72.7 / 84.1 | 0.260 / 1.02 / 1.50 | 0 | 81 | 25.3 |
| Raw Lua, tuned budgets | 960.8 | 0 | 16.7 / 18.0 / 20.1 | 0.597 / 2.46 / 3.17 | 0 | 43 | 25.3 |

| Variant | Idle/slowloris connections opened | Closed by server |
|---|---:|---:|
| Before: HttpServer + TS router | 4 | 0 |
| Before: Application (Express-style) | 4 | 0 |
| After: HttpServer + TS router | 4 | 0 |
| After: HttpServer + TS router, tuned budgets | 4 | 0 |
| After: Application (Express-style) | 4 | 0 |
| After: Application, tuned budgets | 4 | 0 |
| Raw Lua + route matcher | 4 | 0 |
| Raw Lua, tuned budgets | 4 | 0 |

## frame-slow-readers

60 Hz, 16 clients + 4 clients that stop reading an 8 MiB response for 3 s

| Variant | Healthy ok/s | Healthy errors | Latency p50 / p99 / max (ms) | Step p50 / p99 / max (ms) | Steps > 16.7 ms | Host CPU per request (µs) | Peak Lua heap (MiB) |
|---|---:|---|---|---|---:|---:|---:|
| Before: HttpServer + TS router | 6.9 | 0 | 3010.1 / 3038.5 / 3038.5 | 0.168 / 2063 / 2010 | 6 | 1426 | 25.6 |
| Before: Application (Express-style) | 6.9 | 0 | 3009.3 / 3041.2 / 3041.2 | 0.248 / 2063 / 2008 | 6 | 1496 | 38.1 |
| After: HttpServer + TS router | 185.9 | 0 | 66.6 / 100.2 / 116.5 | 0.404 / 2.23 / 9.23 | 0 | 150 | 40.9 |
| After: HttpServer + TS router, tuned budgets | 771.2 | 0 | 16.7 / 32.7 / 49.9 | 0.840 / 5.91 / 9.38 | 0 | 75 | 41.0 |
| After: Application (Express-style) | 183.0 | 0 | 66.7 / 104.8 / 133.7 | 0.627 / 5.63 / 11.98 | 0 | 222 | 40.7 |
| After: Application, tuned budgets | 755.5 | 0 | 16.7 / 36.1 / 57.6 | 1.51 / 7.19 / 12.80 | 0 | 126 | 41.3 |
| Raw Lua + route matcher | 184.5 | 0 | 66.6 / 100.0 / 116.7 | 0.301 / 1.51 / 8.84 | 0 | 123 | 40.7 |
| Raw Lua, tuned budgets | 774.2 | 0 | 16.7 / 24.2 / 48.7 | 0.627 / 5.91 / 8.79 | 0 | 55 | 40.6 |

| Variant | Complete 8 MiB responses | Failed / truncated |
|---|---:|---|
| Before: HttpServer + TS router | 9 | 3 truncated (4011453 bytes) |
| Before: Application (Express-style) | 9 | 3 truncated (4011453 bytes) |
| After: HttpServer + TS router | 8 | 0 |
| After: HttpServer + TS router, tuned budgets | 12 | 0 |
| After: Application (Express-style) | 8 | 0 |
| After: Application, tuned budgets | 12 | 0 |
| Raw Lua + route matcher | 8 | 0 |
| Raw Lua, tuned budgets | 12 | 0 |

## frame-fragmented

60 Hz, 16 clients + 4 clients writing requests in 16-byte pieces every 10 ms

| Variant | Healthy ok/s | Healthy errors | Latency p50 / p99 / max (ms) | Step p50 / p99 / max (ms) | Steps > 16.7 ms | Host CPU per request (µs) | Peak Lua heap (MiB) |
|---|---:|---|---|---|---:|---:|---:|
| Before: HttpServer + TS router | 48.0 | 0 | 333.3 / 333.8 / 334.1 | 0.160 / 0.332 / 0.893 | 0 | 213 | 25.6 |
| Before: Application (Express-style) | 48.0 | 0 | 333.3 / 334.2 / 335.4 | 0.248 / 0.762 / 2.28 | 0 | 328 | 31.5 |
| After: HttpServer + TS router | 219.1 | 0 | 66.8 / 83.6 / 84.6 | 0.404 / 1.83 / 2.43 | 0 | 122 | 24.7 |
| After: HttpServer + TS router, tuned budgets | 939.2 | 0 | 16.7 / 19.3 / 32.9 | 0.882 / 4.00 / 5.08 | 0 | 67 | 24.5 |
| After: Application (Express-style) | 219.9 | 0 | 66.8 / 84.0 / 85.4 | 0.568 / 2.99 / 3.89 | 0 | 173 | 25.7 |
| After: Application, tuned budgets | 934.8 | 0 | 16.7 / 32.1 / 35.2 | 1.44 / 5.36 / 6.92 | 0 | 107 | 23.9 |
| Raw Lua + route matcher | 219.6 | 0 | 66.8 / 84.0 / 85.0 | 0.287 / 1.07 / 1.70 | 0 | 89 | 25.3 |
| Raw Lua, tuned budgets | 940.0 | 0 | 16.7 / 18.2 / 19.8 | 0.597 / 2.12 / 2.85 | 0 | 43 | 25.3 |

| Variant | Fragmented ok | Fragmented errors | Fragmented latency p50 / p99 (ms) |
|---|---:|---|---|
| Before: HttpServer + TS router | 100 | 0 | 333.3 / 333.7 |
| Before: Application (Express-style) | 100 | 0 | 333.3 / 334.1 |
| After: HttpServer + TS router | 148 | 0 | 216.7 / 233.4 |
| After: HttpServer + TS router, tuned budgets | 145 | 0 | 216.7 / 234.1 |
| After: Application (Express-style) | 148 | 0 | 216.7 / 233.6 |
| After: Application, tuned budgets | 148 | 0 | 216.7 / 233.4 |
| Raw Lua + route matcher | 148 | 0 | 216.7 / 233.7 |
| Raw Lua, tuned budgets | 148 | 0 | 216.7 / 233.5 |

