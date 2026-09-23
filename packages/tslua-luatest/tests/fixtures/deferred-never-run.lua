-- Deferred mode but run() is never reached: must not pass silently.
local luatest = require("index")
luatest.configure({ autoRun = false })

luatest.test("declared", function() end)
