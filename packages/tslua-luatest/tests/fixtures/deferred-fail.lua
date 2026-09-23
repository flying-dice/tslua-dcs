local luatest = require("index")
luatest.configure({ autoRun = false })
local describe, test, expect = luatest.describe, luatest.test, luatest.expect

describe("first", function()
	test("fails", function() expect({ a = 1 }).toEqual({ a = 2 }) end)
	test("passes", function() end)
end)

describe("second", function()
	test("still runs", function() end)
end)

luatest.run()
