-- Example DCS test doubles, installed with `lua51 --preload tests/dcs-doubles.lua ...`.
-- Code under test sees these as the mission-environment globals DCS provides.
local logged = {}
env = {
	info = function(message) logged[#logged + 1] = message end,
	__logged = logged,
}
timer = {
	getTime = function() return 42 end,
}
