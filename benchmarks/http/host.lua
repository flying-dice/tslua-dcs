-- Benchmark host: loads one server variant and drives it the way a game would, measuring how long each call
-- blocks the host thread.
--
--   lua51 host.lua <variant.lua> <port> <profile> <mode> <frameSeconds> <stopFile>
--
-- variant.lua returns a module with create(port, profile) -> { step = fn, close = fn }. mode "frame" calls
-- step() once per frame and sleeps until the next frame boundary (a game's main loop or timer); mode "tight"
-- calls it continuously (the server's capacity). The host runs until <stopFile> exists, then prints one JSON
-- line of measurements.

local socket = require("socket")
local gettime = socket.gettime

local variantPath, port, profile, mode, frame, stopFile = arg[1], tonumber(arg[2]), arg[3], arg[4], tonumber(arg[5]), arg[6]

local variant = dofile(variantPath)
local server = variant.create(port, profile)

-- Step durations go into a log-scale histogram: bucket k holds durations in [1us * 1.05^k, 1us * 1.05^(k+1)).
local LOG_BASE = math.log(1.05)
local buckets, calls, total, maxStep = {}, 0, 0, 0
local over = { ["1ms"] = 0, ["5ms"] = 0, ["16.7ms"] = 0, ["100ms"] = 0, ["1s"] = 0 }
local LIMITS = { { "1ms", 0.001 }, { "5ms", 0.005 }, { "16.7ms", 1 / 60 }, { "100ms", 0.1 }, { "1s", 1 } }

local function record(d)
	calls = calls + 1
	total = total + d
	if d > maxStep then maxStep = d end
	local k = d <= 1e-6 and 0 or math.floor(math.log(d / 1e-6) / LOG_BASE)
	buckets[k] = (buckets[k] or 0) + 1
	for i = 1, #LIMITS do
		if d > LIMITS[i][2] then over[LIMITS[i][1]] = over[LIMITS[i][1]] + 1 end
	end
end

local function percentile(q)
	local target, seen = calls * q, 0
	local keys = {}
	for k in pairs(buckets) do keys[#keys + 1] = k end
	table.sort(keys)
	for _, k in ipairs(keys) do
		seen = seen + buckets[k]
		if seen >= target then return 1e-6 * 1.05 ^ (k + 1) end
	end
	return maxStep
end

local function exists(path)
	local f = io.open(path, "r")
	if f then f:close() return true end
	return false
end

io.write("READY\n")
io.flush()

local started = gettime()
local cpuStart = os.clock()
local nextCheck, nextFrame = started, started
local peakKb, missedFrames = collectgarbage("count"), 0

while true do
	local now = gettime()
	if now >= nextCheck then
		nextCheck = now + 0.1
		local kb = collectgarbage("count")
		if kb > peakKb then peakKb = kb end
		if exists(stopFile) then break end
	end

	local s = gettime()
	server.step()
	local d = gettime() - s
	record(d)

	if mode == "frame" then
		nextFrame = nextFrame + frame
		local wait = nextFrame - gettime()
		if wait > 0 then
			socket.sleep(wait)
		else
			missedFrames = missedFrames + 1
			nextFrame = gettime()
		end
	end
end

local wall = gettime() - started
local cpu = os.clock() - cpuStart
server.close()

io.write(string.format(
	'{"calls":%d,"wallSeconds":%.6f,"cpuSeconds":%.6f,"stepTotalSeconds":%.6f,"stepMax":%.6f,"stepP50":%.9f,"stepP99":%.9f,"stepP999":%.9f,"over1ms":%d,"over5ms":%d,"over16ms":%d,"over100ms":%d,"over1s":%d,"missedFrames":%d,"peakLuaKb":%.1f}\n',
	calls, wall, cpu, total, maxStep, percentile(0.5), percentile(0.99), percentile(0.999),
	over["1ms"], over["5ms"], over["16.7ms"], over["100ms"], over["1s"], missedFrames, peakKb))
io.flush()
