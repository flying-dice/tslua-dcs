-- Test doubles for the DCS mission environment, installed with `lua51 --preload`.
trigger = {
	action = {
		outText = function(text, seconds) end,
	},
}
timer = {
	getTime = function() return 42 end,
}
