/** @noSelf */
declare module "@flying-dice/tslua-rxi-json" {
	function encode<T = any>(value: T): string;
	function decode<T = any>(text: string): T;
}
