/**
 * @version 2.9.29.27468
 * @noSelf
 */
export interface _log {
	ALERT: number;
	ALL: number;
	ALL_LEVELS: number;
	ASYNC: number;
	BACKUP: number;
	DEBUG: number;
	ERROR: number;
	EXTRA_INFO: number;
	FULL: number;
	IMMEDIATE: number;
	INFO: number;
	LEVEL: number;
	MESSAGE: number;
	MODELTIME: number;
	MODULE: number;
	NO_HEADER_FOOTER: number;
	RELIABLE: number;
	THREAD: number;
	TIME: number;
	TIME_LOCAL: number;
	TIME_RELATIVE: number;
	TIME_UTC: number;
	TRACE: number;
	WARNING: number;
	alert(...args: any[]): unknown;
	backup(...args: any[]): unknown;
	debug(...args: any[]): unknown;
	error(...args: any[]): unknown;
	info(...args: any[]): unknown;
	set_output(...args: any[]): unknown;
	set_output_rules(...args: any[]): unknown;
	warning(...args: any[]): unknown;
	write(...args: any[]): unknown;
}
