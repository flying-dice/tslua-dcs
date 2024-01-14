import { Logger } from "@flying-dice/tslua-common";

const logger = new Logger("Path");

/**
 * The set of characters considered "safe" in URLs is defined by the URL specifications, specifically RFC 3986.
 * According to this specification, the characters that are safe and do not need to be percent-encoded in the path segment of a URL are:
 *
 * Alphanumeric characters: A-Z a-z 0-9
 * Unreserved characters: - _ . ~
 * Sub-delimiters: ! $ & ' ( ) * + , ; =
 *
 * @param route
 */
export const gSubPathParamsToPattern = (route: string): string => {
	logger.debug(`Replacing Path Params for Pattern matcher ${route}`);
	const result = string.gsub(route, ":[%w_]+", "([%%w_%%%%-%%.~!$&'()*+,;=]+)");
	logger.debug(`Replaced Path Params for Pattern matcher ${result[0]}`);
	return result[0];
};

export const gSubEscapeReservedChars = (route: string): string => {
	logger.debug(`Escaping Path matcher ${route}`);
	// replace all reserved chars with their escaped version including _
	const [patternRoute] = string.gsub(
		route,
		"([%%w_%%%%-%%.~!$&'()*+,;=])",
		"%%%1",
	);
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

	for (const [name] of string.gmatch(route, ":(%w+)")) {
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

	string.match(path, pattern).forEach((match, idx) => {
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
	const res = string.match(path, pattern);
	return res?.[0] !== undefined;
};
