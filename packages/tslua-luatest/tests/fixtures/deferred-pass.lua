local luatest = require("index")
luatest.configure({ autoRun = false })
local describe, it, expect = luatest.describe, luatest.it, luatest.expect

describe("deferred", function()
	it("one", function() expect({ 1, 2 }).toEqual({ 1, 2 }) end)
	it("two", function() expect("abc").toMatch("^a") end)
end)

luatest.run()
