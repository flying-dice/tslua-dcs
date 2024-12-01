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
		const httpStatus: HttpStatus = Number.parseInt(key);
		const responseRef = responseRefs[httpStatus];
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
