import type { HttpStatus } from "@flying-dice/tslua-http";
import type {
	ResponseObject,
	ResponsesObject,
} from "./openapi3-ts/model/openapi31";

export const responses = (
	responseRefs: Partial<Record<HttpStatus, [ResponseObject, string]>>,
): ResponsesObject => {
	const res: ResponsesObject = {};

	Object.keys(responseRefs).forEach((key) => {
		// Look the entry up with the key exactly as enumerated: in Lua a key written as `[HttpStatus.OK]`
		// is the number 200 while one written as `"200"` is a string, so parsing the key into a number
		// would miss string keys.
		const responseRef = responseRefs[key as unknown as HttpStatus];
		if (!responseRef) return;
		const [response, ref] = responseRef;
		res[key.toString()] = {
			...response,
			content: {
				"application/json": {
					schema: { $ref: `#/components/schemas/${ref}` },
				},
			},
		};
	});

	return res;
};

export const body = (schema: string) => ({
	content: {
		"application/json": {
			schema: { $ref: `#/components/schemas/${schema}` },
		},
	},
});
