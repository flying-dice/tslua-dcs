import { getHeloGroupNames } from "./getHeloGroupNames";

// Example of using a DCS API
env.info(`GROUP_NAMES: ${getHeloGroupNames()}`);

(_G as any).MK = {
	_VERSION: "0.1.0",
	getHeloGroupNames,
};
