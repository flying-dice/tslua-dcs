import { _print, _string } from "./externals";

export const gSubPathParamsToPattern = (route: string): string => {
	_print(`Replacing Path Params for Pattern matcher ${route}`);
	const result = _string.gsub(route, ":[%w_]+", "([%%w_]+)");
	_print(`Replaced Path Params for Pattern matcher ${result[0]}`);
	return result[0];
};

export const gSubEscapeReservedChars = (route: string): string => {
	_print(`Escaping Path matcher ${route}`);
	// replace all reserved chars with their escaped version including _
	const [patternRoute] = _string.gsub(
		route,
		"([%(%)%.%%%+%-%*%?%[%^%$])",
		"%%%1",
	);
	_print(`Escaping Path matcher ${patternRoute}`);
	return patternRoute;
};

export const routeToPattern = (route: string): string => {
	const patternRoute = gSubPathParamsToPattern(gSubEscapeReservedChars(route));

	return `^${patternRoute}$`;
};

export const getParamNames = (route: string): string[] => {
	_print(`Getting Param names from ${route}`);
	const names: string[] = [];

	for (const [name] of _string.gmatch(route, ":(%w+)")) {
		_print(`Adding ${name} to params array`);
		names.push(name);
	}

	return names;
};

export const getPathParameters = (
	route: string,
	path: string,
): Record<string, string> => {
	_print("Getting Param names");
	const paramNames = getParamNames(route);

	_print("Getting Route Pattern");
	const pattern = routeToPattern(route);

	_print("Assembling Parameters");
	const matches: Record<string, string> = {};

	_string.match(path, pattern).forEach((match, idx) => {
		_print(`Adding Parameter ${paramNames[idx] || "nil"} from match ${match}`);

		if (paramNames[idx]) {
			matches[paramNames[idx]] = match;
		}
	});

	return matches;
};

export const isMatch = (route: string, path: string): boolean => {
	const pattern = routeToPattern(route);
	_print(`checking if "${pattern}" matches "${path}"`);
	const res = _string.match(path, pattern);
	return res?.[0] !== undefined;
};
