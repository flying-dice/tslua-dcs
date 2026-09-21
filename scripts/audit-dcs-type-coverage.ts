import { readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import ts from "typescript";

interface PackageAudit {
	generated: number;
	typed: number;
	excluded: number;
	tested: number;
	missing: string[];
	untested: string[];
}

interface CoveragePolicy {
	excluded: Record<string, string>;
}

const packages = ["tslua-dcs-mission-types", "tslua-dcs-gui-types"] as const;

function memberName(member: ts.TypeElement): string | undefined {
	const name = member.name;
	if (
		name &&
		(ts.isIdentifier(name) ||
			ts.isStringLiteral(name) ||
			ts.isNumericLiteral(name))
	)
		return name.text;
	return undefined;
}

function collectTypeLiteralFunctions(
	members: ts.NodeArray<ts.TypeElement>,
	prefix = "",
): string[] {
	const functions: string[] = [];
	for (const member of members) {
		const name = memberName(member);
		if (!name) continue;
		const path = prefix ? `${prefix}.${name}` : name;
		if (ts.isMethodSignature(member)) functions.push(path);
		if (
			ts.isPropertySignature(member) &&
			member.type &&
			ts.isTypeLiteralNode(member.type)
		)
			functions.push(...collectTypeLiteralFunctions(member.type.members, path));
	}
	return functions;
}

function generatedFunctions(filename: string): string[] {
	const source = ts.createSourceFile(
		filename,
		readFileSync(filename, "utf8"),
		ts.ScriptTarget.Latest,
		true,
	);
	const functions: string[] = [];
	source.forEachChild((node) => {
		if (ts.isInterfaceDeclaration(node))
			functions.push(...collectTypeLiteralFunctions(node.members));
	});
	return functions;
}

function handwrittenFunctionNames(filename: string): Set<string> {
	let text = "";
	try {
		text = readFileSync(filename, "utf8");
	} catch {
		return new Set();
	}
	const source = ts.createSourceFile(
		filename,
		text,
		ts.ScriptTarget.Latest,
		true,
	);
	const names = new Set<string>();
	function visit(node: ts.Node) {
		if (ts.isMethodSignature(node)) {
			const name = memberName(node);
			if (name) names.add(name);
		}
		ts.forEachChild(node, visit);
	}
	visit(source);
	return names;
}

function referencedNames(filename: string): Set<string> {
	let text = "";
	try {
		text = readFileSync(filename, "utf8");
	} catch {
		return new Set();
	}
	const source = ts.createSourceFile(
		filename,
		text,
		ts.ScriptTarget.Latest,
		true,
	);
	const names = new Set<string>();
	function visit(node: ts.Node) {
		if (ts.isPropertyAccessExpression(node)) names.add(node.name.text);
		if (
			ts.isElementAccessExpression(node) &&
			node.argumentExpression &&
			ts.isStringLiteral(node.argumentExpression)
		)
			names.add(node.argumentExpression.text);
		ts.forEachChild(node, visit);
	}
	visit(source);
	return names;
}

function auditPackage(packageName: string): PackageAudit {
	const packageRoot = resolve("packages", packageName);
	const sourceRoot = join(packageRoot, "src");
	const exportRoot = join(sourceRoot, "exports");
	const policy = JSON.parse(
		readFileSync(join(packageRoot, "coverage-policy.json"), "utf8"),
	) as CoveragePolicy;
	let generated = 0;
	let typed = 0;
	let excluded = 0;
	let tested = 0;
	const missing: string[] = [];
	const untested: string[] = [];
	const testRoot = resolve("packages", `${packageName}_test`, "src");

	for (const exportFile of readdirSync(exportRoot).filter((filename) =>
		filename.endsWith(".export.ts"),
	)) {
		const namespace = basename(exportFile, ".export.ts");
		const generatedPaths = generatedFunctions(join(exportRoot, exportFile));
		const handwrittenNames = handwrittenFunctionNames(
			join(sourceRoot, `${namespace}.ts`),
		);
		const testNames = referencedNames(join(testRoot, `${namespace}_test.ts`));
		for (const memberPath of generatedPaths) {
			generated++;
			const key = `${namespace}.${memberPath}`;
			const leaf = memberPath.slice(memberPath.lastIndexOf(".") + 1);
			const generatedInternal =
				memberPath.includes("parentClass_.") ||
				memberPath.includes("database_.") ||
				leaf === "tonumber";
			if (generatedInternal || policy.excluded[key]) {
				excluded++;
				continue;
			}
			if (handwrittenNames.has(leaf)) typed++;
			else missing.push(key);
			if (testNames.has(leaf)) tested++;
			else untested.push(key);
		}
	}

	return { generated, typed, excluded, tested, missing, untested };
}

let failed = false;
for (const packageName of packages) {
	const result = auditPackage(packageName);
	console.log(
		`${packageName}: generated=${result.generated} typed=${result.typed} tested=${result.tested} excluded=${result.excluded} missing=${result.missing.length} untested=${result.untested.length}`,
	);
	for (const missing of result.missing) console.log(`  MISSING ${missing}`);
	for (const untested of result.untested) console.log(`  UNTESTED ${untested}`);
	failed ||= result.missing.length > 0 || result.untested.length > 0;
}

if (process.argv.includes("--strict") && failed) process.exitCode = 1;
