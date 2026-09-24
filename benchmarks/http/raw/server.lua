-- Benchmark variant: a hand-written Lua 5.1 HTTP server, no TypeScriptToLua and no framework.
--
-- It follows the same transport design as tslua-http (non-blocking sockets, per-connection state kept between
-- pumps, bounded numeric reads, resumable writes, round-robin visits, the same per-pump budgets and limits)
-- so that the comparison isolates what TypeScriptToLua output and the Express-style layer cost. It is written
-- the way one would write it directly in Lua: locals for hot functions, plain tables for connections, a
-- string buffer for the head, patterns for parsing and a small route matcher.
--
-- It supports the same request subset as tslua-http (one request per connection, Content-Length bodies,
-- Transfer-Encoding and Expect rejected) but only CRLF line endings, and it does no JSON escaping.

local socket = require("socket")

local gettime = socket.gettime
local concat, insert = table.concat, table.insert
local find, sub, match, gmatch, lower, format, rep =
	string.find, string.sub, string.match, string.gmatch, string.lower, string.format, string.rep
local min, huge = math.min, math.huge

local M = {}

local PROFILES = {
	default = {
		maxConnections = 64, maxBufferedBodyBytes = 32 * 1048576, maxAcceptsPerPump = 4, maxVisitsPerPump = 32, maxDispatchesPerPump = 4,
		ioChunkBytes = 8192, maxIoBytesPerVisit = 32768, maxIoBytesPerPump = 262144, maxPumpSeconds = 0.005,
		maxHeaderBytes = 8192, maxHeaderCount = 64, maxBodyBytes = 1048576, maxResponseBytes = 16 * 1048576,
		requestTimeout = 10, responseTimeout = 30,
	},
}
PROFILES.tuned = setmetatable({
	maxConnections = 64, maxAcceptsPerPump = 64, maxVisitsPerPump = 128, maxDispatchesPerPump = 64,
	maxIoBytesPerVisit = 262144, maxIoBytesPerPump = 4 * 1048576,
}, { __index = PROFILES.default })

local REASONS = {
	[200] = "OK", [400] = "Bad Request", [404] = "Not Found", [408] = "Request Timeout",
	[413] = "Payload Too Large", [417] = "Expectation Failed", [431] = "Request Header Fields Too Large",
	[500] = "Internal Server Error", [501] = "Not Implemented", [503] = "Service Unavailable",
}

local function respond(status, contentType, body)
	local reason = REASONS[status] or "Unknown Status"
	if contentType then
		return format("HTTP/1.1 %d %s\r\nServer: raw-lua\r\nContent-Type: %s\r\nConnection: close\r\n\r\n", status,
			reason, contentType) .. (body or "")
	end
	return format("HTTP/1.1 %d %s\r\nServer: raw-lua\r\nConnection: close\r\n\r\n", status, reason)
end

-- Routes -------------------------------------------------------------------------------------------------------

local BIG_BODY = rep("x", 8 * 1024 * 1024)

local exact = {
	["GET /health"] = function() return respond(200, "text/plain", "OK") end,
	["POST /echo"] = function(_, body) return respond(200, "text/plain", body) end,
	["GET /big"] = function() return respond(200, "text/plain", BIG_BODY) end,
}

local patterns = {
	{ "GET", "^/units/([^/]+)$", function(id)
		return respond(200, "application/json", format('{"id":"%s","name":"Unit %s","alive":true}', id, id))
	end },
}

local function route(method, path, body)
	local handler = exact[method .. " " .. path]
	if handler then return handler(path, body) end
	for i = 1, #patterns do
		local p = patterns[i]
		if p[1] == method then
			local capture = match(path, p[2])
			if capture then return p[3](capture, body) end
		end
	end
	return respond(404)
end

-- Transport ----------------------------------------------------------------------------------------------------

function M.create(port, profile)
	local cfg = PROFILES[profile or "default"] or PROFILES.default
	local listener = assert(socket.bind("127.0.0.1", port))
	listener:settimeout(0)

	-- Open connections in service order: after each pump, those not reached come first, then those refused a
	-- budgeted operation, then the rest; new connections join at the back (the same policy as tslua-http).
	local conns, nextId, lastNow, closed = {}, 1, -huge, false
	local buffered = 0 -- bytes of declared bodies held, against cfg.maxBufferedBodyBytes

	local function reserve(c, bytes)
		buffered = buffered + bytes - (c.reserved or 0)
		c.reserved = bytes
	end

	local function now()
		local t = gettime()
		if t > lastNow then lastNow = t end
		return lastNow
	end

	local function release(c)
		if c.state == "closed" then return end
		c.state = "closed"
		c.buf, c.parts, c.out = nil, nil, nil
		reserve(c, 0)
		c.sock:close()
	end

	local function startResponse(c, out)
		c.buf, c.parts = nil, nil
		c.out, c.pos, c.writeDeadline, c.state = out, 1, now() + cfg.responseTimeout, "write"
	end

	-- Parses a complete head (without its terminator); returns nil or an error status.
	local function parseHead(c, head)
		local method, target = match(head, "^(%u+) (%S+) HTTP/1%.[01]\r?\n?")
		if not method then return 400 end
		local length, count = nil, 0
		for name, value in gmatch(head, "\n([^:\r\n]+):[ \t]*([^\r\n]*)") do
			count = count + 1
			if count > cfg.maxHeaderCount then return 431 end
			name = lower(name)
			if name == "content-length" then
				local n = match(value, "^(%d+)%s*$")
				if not n or (length and length ~= tonumber(n)) then return 400 end
				length = tonumber(n)
			elseif name == "transfer-encoding" then
				return 501
			elseif name == "expect" then
				return 417
			end
		end
		length = length or 0
		if length > cfg.maxBodyBytes then return 413 end
		c.method, c.path, c.need = method, match(target, "^[^?]*"), length
		return nil
	end

	local function appendBody(c, data)
		local want = c.need - c.got
		if #data > want then data = sub(data, 1, want) end
		local parts = c.parts
		parts[#parts + 1] = data
		c.got = c.got + #data
		if c.got == c.need then
			c.body, c.parts, c.state = concat(parts), nil, "ready"
		end
	end

	local function consume(c, data)
		if c.state == "head" then
			local scanFrom = #c.buf - 2
			if scanFrom < 1 then scanFrom = 1 end
			c.buf = c.buf .. data
			local e = find(c.buf, "\r\n\r\n", scanFrom, true)
			if not e then
				if #c.buf > cfg.maxHeaderBytes then startResponse(c, respond(431)) end
				return
			end
			if e + 3 > cfg.maxHeaderBytes then return startResponse(c, respond(431)) end
			local status = parseHead(c, sub(c.buf, 1, e + 1))
			if status then return startResponse(c, respond(status)) end
			if c.need > 0 and buffered + c.need > cfg.maxBufferedBodyBytes then return startResponse(c, respond(503)) end
			reserve(c, c.need)
			local rest = sub(c.buf, e + 4)
			c.buf = nil
			if c.need == 0 then
				c.state = "ready"
			else
				c.state, c.parts, c.got = "body", {}, 0
				if #rest > 0 then appendBody(c, rest) end
			end
		elseif c.state == "body" then
			appendBody(c, data)
		end
	end

	local function read(c, allowance, budget)
		local total = 0
		while (c.state == "head" or c.state == "body") and total < allowance do
			local wanted = min(cfg.ioChunkBytes, allowance - total)
			if c.state == "body" then wanted = min(wanted, c.need - c.got) end
			local data, err, partial = c.sock:receive(wanted)
			data = data or partial or ""
			local n = #data
			if n > 0 then
				total = total + n
				budget.io = budget.io - n
				consume(c, data)
			end
			if err then
				if err ~= "timeout" and (c.state == "head" or c.state == "body") then release(c) end
				break
			end
		end
		return total
	end

	local function write(c, allowance, budget)
		local out, len, total = c.out, #c.out, 0
		while c.pos <= len and total < allowance do
			local last = min(len, c.pos + min(cfg.ioChunkBytes, allowance - total) - 1)
			local sentTo, err, sentBefore = c.sock:send(out, c.pos, last)
			local reached = sentTo or sentBefore
			if reached and reached >= c.pos then
				total = total + reached - c.pos + 1
				budget.io = budget.io - (reached - c.pos + 1)
				c.pos = reached + 1
			end
			if err then
				if err ~= "timeout" then return release(c) end
				break
			end
			if reached < last then break end
		end
		if c.pos > len then release(c) end
	end

	local function visit(c, budget)
		c.starved = false
		local ok = pcall(function()
			local io = min(cfg.maxIoBytesPerVisit, budget.io)
			local t = now()
			if c.state == "head" or c.state == "body" then
				if t >= c.deadline then
					startResponse(c, respond(408))
				elseif io <= 0 then
					c.starved = true
				else
					io = io - read(c, io, budget)
				end
			end
			if c.state == "ready" and not (budget.dispatches > 0 and (budget.dispatched == 0 or now() < budget.limit)) then
				c.starved = true
			elseif c.state == "ready" then
				budget.dispatches = budget.dispatches - 1
				budget.dispatched = budget.dispatched + 1
				c.state = "dispatching"
				reserve(c, 0)
				local routed, out = pcall(route, c.method, c.path, c.body)
				c.body = nil
				if not routed or #out > cfg.maxResponseBytes then out = respond(500) end
				startResponse(c, out)
			end
			if c.state == "write" then
				if now() >= c.writeDeadline then
					release(c)
				elseif io <= 0 then
					c.starved = true
				else
					write(c, io, budget)
				end
			end
		end)
		if not ok then
			release(c)
		end
	end

	local server = {}

	function server.step()
		if closed then return end
		local start = now()
		local budget = { io = cfg.maxIoBytesPerPump, dispatches = cfg.maxDispatchesPerPump, dispatched = 0,
			limit = start + cfg.maxPumpSeconds }

		local accepted = 0
		while accepted < cfg.maxAcceptsPerPump and #conns < cfg.maxConnections do
			if accepted > 0 and now() >= budget.limit then break end
			local sock = listener:accept()
			if not sock then break end
			sock:settimeout(0)
			local t = now()
			conns[#conns + 1] = { id = nextId, sock = sock, state = "head", buf = "", deadline = t + cfg.requestTimeout }
			nextId = nextId + 1
			accepted = accepted + 1
		end

		local list, count = conns, #conns
		if count == 0 then return end
		local visits = min(count, cfg.maxVisitsPerPump)
		local visited = 0
		while visited < visits do
			if visited > 0 and now() >= budget.limit then break end
			visited = visited + 1
			visit(list[visited], budget)
		end

		local order = {}
		for i = visited + 1, count do
			if list[i].state ~= "closed" then order[#order + 1] = list[i] end
		end
		for i = 1, visited do
			local c = list[i]
			if c.starved and c.state ~= "closed" then order[#order + 1] = c end
		end
		for i = 1, visited do
			local c = list[i]
			if not c.starved and c.state ~= "closed" then order[#order + 1] = c end
		end
		conns = order
	end

	function server.close()
		if closed then return end
		closed = true
		listener:close()
		for i = 1, #conns do release(conns[i]) end
		conns = {}
	end

	return server
end

return M
