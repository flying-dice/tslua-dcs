/**
 * @version 2.9.9.2474
 * @noSelf
 **/
export interface _log {
	FULL: number;
	set_output_rules(...args: any[]): unknown;
	TIME_LOCAL: number;
	ALL: number;
	set_output(...args: any[]): unknown;
	LEVEL: number;
	DEBUG: number;
	IMMEDIATE: number;
	ASYNC: number;
	THREAD: number;
	ALERT: number;
	RELIABLE: number;
	warning(...args: any[]): unknown;
	write(...args: any[]): unknown;
	MODULE: number;
	TRACE: number;
	TIME_UTC: number;
	TIME: number;
	WARNING: number;
	INFO: number;
	error(...args: any[]): unknown;
	info(...args: any[]): unknown;
	ERROR: number;
	TIME_RELATIVE: number;
	debug(...args: any[]): unknown;
	alert(...args: any[]): unknown;
	MESSAGE: number;
}
