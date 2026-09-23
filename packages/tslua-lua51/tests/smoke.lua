-- Smoke tests for the managed interpreter. Run: npm test (in this package).
local failures = 0
local function check(name, ok, detail)
	if ok then
		print("[OK] " .. name)
	else
		failures = failures + 1
		print("[FAIL] " .. name .. (detail and (": " .. tostring(detail)) or ""))
	end
end

check("runs Lua 5.1", _VERSION == "Lua 5.1", _VERSION)
check("package.path is pinned", package.path == "./?.lua;./?/init.lua", package.path)
check("package.cpath is empty", package.cpath == "", package.cpath)
check("no LUA_INIT side effects", _G.__lua_init_ran == nil)
check("full stdlib incl. debug", type(debug.traceback) == "function" and type(io.open) == "function" and type(os.time) == "function")
check("arg table", arg[0] ~= nil and arg[1] == "first" and arg[2] == "second", arg[1])
check("varargs", select("#", ...) == 2 and select(1, ...) == "first")

check("preloaded DCS doubles are visible", env ~= nil and timer.getTime() == 42)
env.info("hello from the test")
check("doubles record calls", env.__logged[1] == "hello from the test")

local socket = require("socket")
check("socket loads", type(socket.bind) == "function", socket._VERSION)
local server = assert(socket.bind("127.0.0.1", 0))
local ip, port = server:getsockname()
local client = assert(socket.connect(ip, port))
local peer = assert(server:accept())
client:send("ping\n")
check("tcp round trip", peer:receive("*l") == "ping")
client:close(); peer:close(); server:close()
check("socket.url", require("socket.url").escape("a b") == "a%20b")
check("mime", require("mime").b64("hi") == "aGk=")
check("ltn12", type(require("ltn12").pump.all) == "function")

if failures > 0 then
	print(failures .. " check(s) failed")
	os.exit(1)
end
