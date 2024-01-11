import { _lfs } from "./exports/lfs.export";

/**
 * @noSelf
 */
export interface l_lfs extends _lfs {
	/**
	 * Returns the current temp write directory.
	 *
	 * @example
	 * lfs.tempdir() // ""C:\\Users\\username\\AppData\\Local\\Temp\\DCS.openbeta\\""
	 */
	tempdir(): string;

	/**
	 * Returns the current write directory.
	 *
	 * @example
	 * lfs.writedir() // "C:\\Users\\username\\Saved Games\\DCS.openbeta\\"
	 */
	writedir(): string;

	/**
	 * Returns the current installation directory
	 *
	 * @example
	 * lfs.currentdir() // "C:\\Program Files\\Eagle Dynamics\\DCS World OpenBeta\\"
	 */
	currentdir(): string;
}
