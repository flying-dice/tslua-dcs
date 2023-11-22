/**
 * Extracts query parameters from a given URL and returns them as an object.
 *
 * This function parses the query string part of a URL and converts it into an object
 * where each key-value pair corresponds to a query parameter and its value.
 *
 * Note:
 * - If the URL does not have query parameters, the function returns an empty object.
 * - The function does not handle array-like query parameters (e.g., "param[]=value1&param[]=value2").
 * - There is no URL validation; if the input is not a string or does not contain valid query parameters,
 *   the behavior is undefined.
 * - Special characters in query parameters are not decoded (e.g., "%20" will not be converted to a space).
 *
 * @param {string} url - The URL from which to extract the query parameters.
 * @returns {Object} An object containing the query parameters as key-value pairs.
 *
 * @example
 * // If the URL is "http://example.com/page?param1=value1&param2=value2"
 * const queryParams = getQueryParams("http://example.com/page?param1=value1&param2=value2");
 * // The function will return: { param1: "value1", param2: "value2" }
 */
export const getQueryParams = (url: string): Record<string, string> => {
    const [_, parametersPart] = url.split('?');

    const parameters: Record<string, string> = {}

    parametersPart?.split('&').forEach(parameter => {
        const [name, value] = parameter.split('=');
        parameters[name] = value;
    });

    return parameters
}
