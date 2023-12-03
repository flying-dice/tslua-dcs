import { _Weapon } from "./exports/Weapon.export";
export interface l_Weapon extends _Weapon {
	/**
	 * Returns an enumerator that defines the country that an object currently belongs to
	 */
	getCountry(): number;
}
