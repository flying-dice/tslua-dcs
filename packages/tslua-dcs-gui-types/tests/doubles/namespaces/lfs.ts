/** @noSelfInFile */

import type { l_lfs, LfsAttributes } from "../../../src";
import { copy, type DoubleContext } from "../context";

const SEPARATOR = "\\";

/**
 * Normalizes a Windows-style path the way the double stores it: `/` becomes `\`, repeated
 * separators collapse, and `.` / `..` segments are resolved. A trailing separator is kept.
 */
export function normalize(path: string): string {
	const [unified] = string.gsub(path, "[/\\]+", SEPARATOR);
	const trailing = string.sub(unified, -1) === SEPARATOR;
	const isDrive = (part: string) => string.find(part, "^%a:$")[0] !== undefined;
	const parts: string[] = [];
	for (const [part] of string.gmatch(unified, "[^\\]+")) {
		if (part === "..") {
			// `..` never climbs above a drive root.
			if (parts.length > 0 && !(parts.length === 1 && isDrive(parts[0])))
				parts.pop();
		} else if (part !== ".") parts.push(part);
	}
	const joined = parts.join(SEPARATOR);
	const root = parts.length === 1 && isDrive(parts[0]);
	return trailing || root ? `${joined}${SEPARATOR}` : joined;
}

/** The stored key of a directory: normalized, with a trailing separator. */
function directoryKey(path: string): string {
	const normalized = normalize(path);
	return string.sub(normalized, -1) === SEPARATOR
		? normalized
		: `${normalized}${SEPARATOR}`;
}

function parentOf(key: string): string {
	const [parent] = string.match(key, "^(.*\\)[^\\]+\\$");
	return parent ?? key;
}

/**
 * `lfs` double over an in-memory Windows file system (`state.directories` and `state.files`).
 * Nothing touches the real disk. Errors follow LuaFileSystem: `undefined` plus a message.
 */
export function createLfs(ctx: DoubleContext): l_lfs {
	const s = () => ctx.state();
	const fileKey = (path: string) => {
		const normalized = normalize(path);
		return s().files[normalized] !== undefined ? normalized : undefined;
	};
	const children = (key: string) => {
		const names: string[] = [];
		const prefix = key;
		const collect = (candidate: string, isDirectory: boolean) => {
			if (
				candidate === key ||
				string.sub(candidate, 1, prefix.length) !== prefix
			)
				return;
			const rest = string.sub(candidate, prefix.length + 1);
			const pattern = isDirectory ? "^([^\\]+)\\$" : "^([^\\]+)$";
			const [name] = string.match(rest, pattern);
			if (name !== undefined) names.push(name);
		};
		for (const [candidate] of pairs(s().directories))
			collect(candidate as string, true);
		for (const [candidate] of pairs(s().files))
			collect(candidate as string, false);
		names.sort();
		return names;
	};
	const attributesOf = (path: string): LfsAttributes | undefined => {
		const base = {
			dev: 2,
			ino: 0,
			nlink: 1,
			uid: 0,
			gid: 0,
			rdev: 2,
			access: 1700000000,
			change: 1700000000,
			blocks: 0,
			blksize: 0,
		};
		if (s().directories[directoryKey(path)])
			return {
				...base,
				mode: "directory",
				modification: 1700000000,
				size: 0,
				permissions: "rwxrwxrwx",
			};
		const key = fileKey(path);
		if (key === undefined) return undefined;
		const file = s().files[key];
		return {
			...base,
			mode: "file",
			modification: file.modification,
			size: file.content.length,
			permissions: "rw-rw-rw-",
		};
	};
	// One implementation serves both `attributes` overloads.
	const attributes = ((path: string, field?: keyof LfsAttributes) => {
		const result = attributesOf(path);
		if (result === undefined || field === undefined) return result;
		return result[field];
	}) as l_lfs["attributes"];

	return {
		tempdir: () => s().tempdir,
		writedir: () => s().writedir,
		currentdir: () => s().currentdir,
		chdir: (path) => {
			const key = directoryKey(path);
			if (!s().directories[key])
				return $multi(undefined, `${path}: No such file or directory`);
			s().currentdir = key;
			return $multi(true);
		},
		attributes,
		dir: (path) => {
			const key = directoryKey(path);
			if (!s().directories[key])
				error(`cannot open ${path}: No such file or directory`, 2);
			const names = [".", "..", ...children(key)];
			let index = 0;
			const iterator = () => {
				index++;
				return names[index - 1];
			};
			return iterator as unknown as LuaIterable<string>;
		},
		mkdir: (path) => {
			const key = directoryKey(path);
			if (s().directories[key] || fileKey(path) !== undefined)
				return $multi(undefined, "File exists");
			if (!s().directories[parentOf(key)])
				return $multi(undefined, "No such file or directory");
			s().directories[key] = true;
			return $multi(true);
		},
		rmdir: (path) => {
			const key = directoryKey(path);
			if (!s().directories[key])
				return $multi(undefined, "No such file or directory");
			if (children(key).length > 0)
				return $multi(undefined, "Directory not empty");
			s().directories[key] = undefined as unknown as boolean;
			return $multi(true);
		},
		normpath: (path) => normalize(path),
		realpath: (path) => {
			const [absolute] = string.find(path, "^%a:[/\\]");
			return normalize(
				absolute !== undefined ? path : `${s().currentdir}${path}`,
			);
		},
		locations: () => copy(s().locations),
		add_location: (name, path) => {
			s().locations.push({ name, path });
		},
		del_location: (identifier) => {
			const locations = s().locations;
			for (let index = 0; index < locations.length; index++)
				if (
					locations[index].name === identifier ||
					locations[index].path === identifier
				) {
					locations.splice(index, 1);
					return true;
				}
			return false;
		},
		md5sum: (path) => {
			const key = fileKey(path);
			return key === undefined ? undefined : s().files[key].md5;
		},
		create_lockfile: (...arguments_) =>
			ctx.native("lfs.create_lockfile", arguments_),
	};
}
