import { Logger } from "@flying-dice/tslua-common";
import { _string } from "./externals";

const logger = new Logger("Path");

export const gSubPathParamsToPattern = (route: string): string => {
	logger.debug(`Replacing Path Params for Pattern matcher ${route}`);
	const result = _string.gsub(route, ":[%w_]+", "([%%w_]+)");
	logger.debug(`Replaced Path Params for Pattern matcher ${result[0]}`);
	return result[0];
};

export const gSubEscapeReservedChars = (route: string): string => {
	logger.debug(`Escaping Path matcher ${route}`);
	// replace all reserved chars with their escaped version including _
	const [patternRoute] = _string.gsub(route, "([%(%)%%%+%-%?%[%^%$])", "%%%1");
	logger.debug(`Escaping Path matcher ${patternRoute}`);
	return patternRoute;
};

export const routeToPattern = (route: string): string => {
	const patternRoute = gSubPathParamsToPattern(gSubEscapeReservedChars(route));

	return `^${patternRoute}$`;
};

export const getParamNames = (route: string): string[] => {
	logger.debug(`Getting Param names from ${route}`);
	const names: string[] = [];

	for (const [name] of _string.gmatch(route, ":(%w+)")) {
		logger.debug(`Adding ${name} to params array`);
		names.push(name);
	}

	return names;
};

export const getPathParameters = (
	route: string,
	path: string,
): Record<string, string> => {
	logger.debug("Getting Param names");
	const paramNames = getParamNames(route);

	logger.debug("Getting Route Pattern");
	const pattern = routeToPattern(route);

	logger.debug("Assembling Parameters");
	const matches: Record<string, string> = {};

	_string.match(path, pattern).forEach((match, idx) => {
		logger.debug(
			`Adding Parameter ${paramNames[idx] || "nil"} from match ${match}`,
		);

		if (paramNames[idx]) {
			matches[paramNames[idx]] = match;
		}
	});

	return matches;
};

export const isMatch = (route: string, path: string): boolean => {
	const pattern = routeToPattern(route);
	logger.debug(`checking if "${pattern}" matches "${path}"`);
	const res = _string.match(path, pattern);
	return res?.[0] !== undefined;
};
