/* eslint-disable @typescript-eslint/no-explicit-any */

// Support for Specification Extensions
// as described in
// https://github.com/OAI/OpenAPI-Specification/blob/3.0.0-rc0/versions/3.0.md#specificationExtensions

//  Specification Extensions
//   ^x-
export type IExtensionName = `x-${string}`;
export type IExtensionType = any;
export type ISpecificationExtension = {
	[extensionName: IExtensionName]: IExtensionType;
};

export class SpecificationExtension implements ISpecificationExtension {
	[extensionName: IExtensionName]: any;

	static isValidExtension(extensionName: string): boolean {
		return extensionName.startsWith("x-");
	}

	getExtension(extensionName: string): any {
		if (!SpecificationExtension.isValidExtension(extensionName)) {
			throw new Error(
				`Invalid specification extension: '${extensionName}'. Extensions must start with prefix 'x-`,
			);
		}
		if (this[extensionName as IExtensionName]) {
			return this[extensionName as IExtensionName];
		}
		return null;
	}
	addExtension(extensionName: string, payload: any): void {
		if (!SpecificationExtension.isValidExtension(extensionName)) {
			throw new Error(
				`Invalid specification extension: '${extensionName}'. Extensions must start with prefix 'x-`,
			);
		}
		this[extensionName as IExtensionName] = payload;
	}
	listExtensions(): string[] {
		const res: string[] = [];
		// `for...in` compiles to `pairs(self)`, which visits only the instance's own keys (methods live
		// on the class metatable), so no `hasOwnProperty` check is needed; it does not exist in Lua.
		for (const propName in this) {
			if (
				typeof propName === "string" &&
				SpecificationExtension.isValidExtension(propName)
			) {
				res.push(propName);
			}
		}
		return res;
	}
}
