import { IGroup } from "@flying-dice/tslua-dcs-types";

/**
 * Retrieves the names of all helicopter groups on the BLUE side.
 *
 * This function fetches all helicopter groups from the BLUE coalition,
 * extracts their names, and joins them into a comma-separated string.
 *
 * @returns {string} A comma-separated string containing the names of all
 * helicopter groups on the BLUE side.
 */
export const getHeloGroupNames = () => {
	const groups = coalition.getGroups(
		coalition.side.BLUE,
		Group.Category.HELICOPTER,
	) as IGroup[];

	return groups.map((group: IGroup) => group.getName()).join(",");
};
