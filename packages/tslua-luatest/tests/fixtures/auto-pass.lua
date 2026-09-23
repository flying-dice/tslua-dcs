-- Legacy usage: plain describe/test, no configure() and no run().
local luatest = require("index")
local describe, test, expect = luatest.describe, luatest.test, luatest.expect

describe("legacy", function()
	test("passes", function()
		expect(1 + 1).toBe(2)
	end)
end)
