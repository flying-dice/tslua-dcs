import type { _lfs } from "./exports/lfs.export";

/**
 * @noSelf
 * @see [Authoritative executable examples](https://github.com/flying-dice/tslua-dcs/blob/main/packages/tslua-dcs-gui-types_test/src/lfs_test.ts)
 */
export interface l_lfs
	extends Omit<
		_lfs,
		| "add_location"
		| "attributes"
		| "chdir"
		| "create_lockfile"
		| "currentdir"
		| "del_location"
		| "dir"
		| "locations"
		| "md5sum"
		| "mkdir"
		| "normpath"
		| "realpath"
		| "rmdir"
		| "tempdir"
		| "writedir"
	> {
	/**
	 * Metadata returned by `attributes`; see `LfsAttributes`.
	 */
	attributes(path: string): LfsAttributes | undefined;
	/**
	 * Returns one named metadata field, or `undefined` when the path does not exist.
	 *
	 * @example `const mode = lfs.attributes(fileName, "mode");`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/FileDialogUtils.lua:121
	 */
	attributes<K extends keyof LfsAttributes>(
		path: string,
		field: K,
	): LfsAttributes[K] | undefined;
	/**
	 * Changes the process working directory.
	 *
	 * @returns `true` on success, otherwise `undefined` and an error string.
	 * @example `const [ok, error] = lfs.chdir(lfs.writedir());`
	 * @see https://lunarmodules.github.io/luafilesystem/manual.html#reference
	 */
	chdir(path: string): LuaMultiReturn<[true] | [undefined, string]>;
	/**
	 * Iterates entry names in a directory, including `.` and `..`.
	 *
	 * @example `for (const name of lfs.dir(lfs.writedir())) { log.info("%s", name); }`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/FileDialogUtils.lua:118
	 */
	dir(path: string): LuaIterable<string>;
	/**
	 * Creates one directory level.
	 *
	 * @returns `true` on success, otherwise `undefined` plus an error.
	 * @example `const [ok] = lfs.mkdir(`${lfs.tempdir()}my-mod`);`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/MissionEditor.lua:172
	 */
	mkdir(path: string): LuaMultiReturn<[true] | [undefined, string]>;
	/**
	 * Removes an empty directory.
	 *
	 * @returns `true` on success, otherwise `undefined` plus an error.
	 * @example `const [ok] = lfs.rmdir(`${lfs.tempdir()}my-mod`);`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/me_mission.lua:8609
	 */
	rmdir(path: string): LuaMultiReturn<[true] | [undefined, string]>;
	/**
	 * Resolves a relative path against the current directory without requiring it to exist.
	 *
	 * @example `const path = lfs.realpath("Scripts");`
	 * @see %DCS_INSTALL_DIR%/MissionEditor/modules/FileDialogUtils.lua:178
	 */
	realpath(path: string): string;
	/**
	 * Normalizes separators and `.`/`..` path segments.
	 *
	 * @example `const path = lfs.normpath("Scripts/../Scripts");`
	 * @see %DCS_INSTALL_DIR%/API/Sim_ControlAPI.md:90
	 */
	normpath(path: string): string;
	/**
	 * Returns configured file-dialog locations.
	 *
	 * @example `const missionFolders = lfs.locations();`
	 * @see %DCS_INSTALL_DIR%/Scripts/UserFiles.lua:16
	 */
	locations(): LfsLocation[];
	/**
	 * Adds a named file-dialog location.
	 *
	 * @example `lfs.add_location("My Missions", `${lfs.writedir()}Missions\\`);`
	 * @see %DCS_INSTALL_DIR%/Scripts/UserFiles.lua:31
	 */
	add_location(name: string, path: string): void;
	/**
	 * TODO: DCS exports this native function but installed Lua scripts contain no callsite proving whether deletion is keyed by display name or path.
	 *
	 * @see %DCS_INSTALL_DIR%/Scripts/UserFiles.lua
	 */
	del_location(identifier: unknown): unknown;
	/**
	 * Computes the MD5 digest of a file.
	 *
	 * @example `const digest = lfs.md5sum(fileName);`
	 * @returns Lower-case hexadecimal digest, or `undefined` when the file cannot be read.
	 */
	md5sum(path: string): string | undefined;
	/**
	 * TODO: DCS exports this native lock helper but the installed public API and Lua sources do not expose its argument or return contract.
	 */
	create_lockfile(...arguments_: unknown[]): unknown;
	/**
	 * Returns the current temp write directory.
	 *
	 * @example
	 * ```ts
	 * const temporaryDirectory = lfs.tempdir();
	 * ```
	 *
	 * @returns DCS-specific temporary directory with a trailing path separator.
	 */
	tempdir(): string;

	/**
	 * Returns the current write directory.
	 *
	 * @example
	 * ```ts
	 * const logPath = `${lfs.writedir()}Logs\\my-export.log`;
	 * ```
	 *
	 * @returns Current DCS Saved Games directory with a trailing path separator.
	 */
	writedir(): string;

	/**
	 * Returns the current DCS installation directory.
	 *
	 * @example
	 * ```ts
	 * const installDirectory = lfs.currentdir();
	 * ```
	 *
	 * @returns DCS installation directory with a trailing path separator.
	 */
	currentdir(): string;
}

/**
 * Standard LuaFileSystem file metadata. Times are Unix timestamps and sizes are bytes.
 */
export interface LfsAttributes {
	mode:
		| "file"
		| "directory"
		| "link"
		| "socket"
		| "named pipe"
		| "char device"
		| "block device"
		| "other";
	dev: number;
	ino: number;
	nlink: number;
	uid: number;
	gid: number;
	rdev: number;
	access: number;
	modification: number;
	change: number;
	size: number;
	permissions: string;
	blocks: number;
	blksize: number;
}

/**
 * A named root displayed by DCS file dialogs.
 */
export interface LfsLocation {
	name: string;
	path: string;
}
