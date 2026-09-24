export interface ProfileOptions {
	/** The folder holding the `DCS*` profiles (default: `~/Saved Games`). */
	root?: string;
}

export declare const TOKEN_FILE: string;
export declare function findSavedGames(options?: ProfileOptions): string;
export declare function tokenPath(options?: ProfileOptions): string;
export declare function bridgeToken(options?: ProfileOptions): string;
