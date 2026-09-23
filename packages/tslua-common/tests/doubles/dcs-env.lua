-- Test doubles for the DCS World logging globals, installed with `lua51 --preload` before the test bundle.
--
-- DCS provides these to scripts; the stock Lua 5.1 interpreter does not. Each double appends what it was
-- given to `__dcsLog.calls` so tests can assert on the exact arguments, and tests can `spyOn` them as well.
--
--   env.info(message, showMessageBox)     mission scripting environment
--   env.warning(message, showMessageBox)
--   env.error(message, showMessageBox)
--   log.write(subsystem, level, message)  GUI / hooks environment, with log.INFO / log.WARNING / log.ERROR / ...
--
-- Each record is { fn = "env.info", n = <argument count>, args = { ... } }.
-- `__dcsLog.clear()` empties the record between tests.

__dcsLog = { calls = {} }

function __dcsLog.clear()
	__dcsLog.calls = {}
end

local function record(fn, ...)
	local calls = __dcsLog.calls
	calls[#calls + 1] = { fn = fn, n = select("#", ...), args = { ... } }
end

env = {
	info = function(...)
		record("env.info", ...)
	end,
	warning = function(...)
		record("env.warning", ...)
	end,
	error = function(...)
		record("env.error", ...)
	end,
}

log = {
	ALERT = 1,
	ERROR = 2,
	WARNING = 4,
	INFO = 8,
	DEBUG = 16,
	TRACE = 32,
	write = function(...)
		record("log.write", ...)
	end,
}
