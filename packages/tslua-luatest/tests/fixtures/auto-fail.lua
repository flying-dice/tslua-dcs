-- Legacy usage with a failure: the failing top-level block must stop the script with an error.
local luatest = require("index")
local describe, test, expect = luatest.describe, luatest.test, luatest.expect

describe("legacy", function()
	test("fails", function()
		expect(1).toBe(2)
	end)
	test("still runs", function() end)
end)

describe("second block", function()
	test("never reached", function() end)
end)
