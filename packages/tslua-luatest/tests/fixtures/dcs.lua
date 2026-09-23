-- Code under test calls DCS globals provided by the preloaded doubles.
local luatest = require("index")
luatest.configure({ autoRun = false })
local describe, test, expect, spyOn = luatest.describe, luatest.test, luatest.expect, luatest.spyOn

local function announce(name)
	trigger.action.outText(name .. " at " .. timer.getTime(), 10)
end

describe("announce", function()
	luatest.afterEach(luatest.restoreAllMocks)

	test("writes to the screen through trigger.action.outText", function()
		local outText = spyOn(trigger.action, "outText")
		announce("Enfield11")
		expect(outText).toHaveBeenCalledTimes(1)
		expect(outText).toHaveBeenCalledWith("Enfield11 at 42", 10)
	end)

	test("uses the mission time", function()
		spyOn(timer, "getTime").mockReturnValue(7)
		local outText = spyOn(trigger.action, "outText")
		announce("Uzi")
		expect(outText).toHaveBeenLastCalledWith("Uzi at 7", 10)
	end)
end)

luatest.run()
