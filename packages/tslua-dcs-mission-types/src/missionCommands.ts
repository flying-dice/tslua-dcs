import type { _missionCommands } from "./exports/missionCommands.export";

/**
 * Opaque F10 menu path returned by DCS menu-creation functions.
 */
export type MissionCommandPath = string[];

/**
 * @noSelf
 */
export interface l_missionCommands extends _missionCommands {
	/**
	 * Adds a command for every player.
	 *
	 * @param name Caption.
	 * @param path Parent submenu or root.
	 * @param callback Selection callback.
	 * @param argument Callback value.
	 * @returns Created path.
	 * @example `const path = missionCommands.addCommand("Report", undefined, env.info, "Ready");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_addCommand
	 */
	addCommand<T>(
		name: string,
		path: MissionCommandPath | undefined,
		callback: (this: void, argument: T) => void,
		argument: T,
	): MissionCommandPath;

	/**
	 * Adds a coalition-only command.
	 *
	 * @param coalitionId Value from `coalition.side`.
	 * @param name Caption.
	 * @param path Parent submenu or root.
	 * @param callback Selection callback.
	 * @param argument Callback value.
	 * @returns Created path.
	 * @example `missionCommands.addCommandForCoalition(coalition.side.BLUE, "Report", undefined, env.info, "Ready");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_addCommandForCoalition
	 */
	addCommandForCoalition<T>(
		coalitionId: number,
		name: string,
		path: MissionCommandPath | undefined,
		callback: (this: void, argument: T) => void,
		argument: T,
	): MissionCommandPath;

	/**
	 * Adds a group-only command.
	 *
	 * @param groupId Runtime group ID.
	 * @param name Caption.
	 * @param path Parent submenu or root.
	 * @param callback Selection callback.
	 * @param argument Callback value.
	 * @returns Created path.
	 * @example `missionCommands.addCommandForGroup(group.getID(), "Report", undefined, env.info, "Ready");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_addCommandForGroup
	 */
	addCommandForGroup<T>(
		groupId: number,
		name: string,
		path: MissionCommandPath | undefined,
		callback: (this: void, argument: T) => void,
		argument: T,
	): MissionCommandPath;

	/**
	 * Creates a submenu for every player.
	 *
	 * @param name Caption.
	 * @param path Parent submenu or root.
	 * @returns Created path.
	 * @example `const requests = missionCommands.addSubMenu("Requests");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_addSubMenu
	 */
	addSubMenu(name: string, path?: MissionCommandPath): MissionCommandPath;

	/**
	 * Creates a coalition-only submenu.
	 *
	 * @param coalitionId Value from `coalition.side`.
	 * @param name Caption.
	 * @param path Parent submenu or root.
	 * @returns Created path.
	 * @example `const menu = missionCommands.addSubMenuForCoalition(coalition.side.BLUE, "Requests");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_addSubMenuForCoalition
	 */
	addSubMenuForCoalition(
		coalitionId: number,
		name: string,
		path?: MissionCommandPath,
	): MissionCommandPath;

	/**
	 * Creates a group-only submenu.
	 *
	 * @param groupId Runtime group ID.
	 * @param name Caption.
	 * @param path Parent submenu or root.
	 * @returns Created path.
	 * @example `const menu = missionCommands.addSubMenuForGroup(group.getID(), "Requests");`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_addSubMenuForGroup
	 */
	addSubMenuForGroup(
		groupId: number,
		name: string,
		path?: MissionCommandPath,
	): MissionCommandPath;

	/**
	 * Dispatches the numeric action index associated with a radio-command item. This low-level index is normally supplied by DCS's radio-command UI rather than constructed by mission scripts.
	 *
	 * @param actionId Runtime action index.
	 * @returns Nothing.
	 * @example `missionCommands.doAction(actionId);`
	 * @see %DCS_INSTALL_DIR%/Scripts/UI/RadioCommandDialogPanel/RadioCommandDialogsPanel.lua:177
	 */
	doAction(actionId: number): void;

	/**
	 * Removes a global item, or clears the root when omitted.
	 *
	 * @param path Returned item path.
	 * @returns Nothing.
	 * @example `missionCommands.removeItem(path);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_removeItem
	 */
	removeItem(path?: MissionCommandPath): void;

	/**
	 * Removes a coalition item, or clears its root when omitted.
	 *
	 * @param coalitionId Value from `coalition.side`.
	 * @param path Returned item path.
	 * @returns Nothing.
	 * @example `missionCommands.removeItemForCoalition(coalition.side.BLUE, path);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_removeItemForCoalition
	 */
	removeItemForCoalition(coalitionId: number, path?: MissionCommandPath): void;

	/**
	 * Removes a group item, or clears its root when omitted.
	 *
	 * @param groupId Runtime group ID.
	 * @param path Returned item path.
	 * @returns Nothing.
	 * @example `missionCommands.removeItemForGroup(group.getID(), path);`
	 * @see https://wiki.hoggitworld.com/view/DCS_func_removeItemForGroup
	 */
	removeItemForGroup(groupId: number, path?: MissionCommandPath): void;
}
