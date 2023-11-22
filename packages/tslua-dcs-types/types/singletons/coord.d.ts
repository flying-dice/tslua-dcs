/**
 * The coord singleton contains functions used to convert coordinates between the game's XYZ,
 * Longitude and Latitude, and the MGRS coordinate systems.
 *
 * @see https://wiki.hoggitworld.com/view/DCS_singleton_coord
 *
 * https://typescripttolua.github.io/docs/the-self-parameter
 * @noSelfInFile
 */
declare namespace coord {
	interface Vec3 {
		x: number;
		y: number;
		z: number;
	}

	/**
	 * Returns a point from latitude and longitude and optional altitude in the vec3 format.
	 * @param latitude
	 * @param longitude
	 * @param altitude
	 *
	 * @return Vec3
	 */
	function LLtoLO(latitude: number, longitude: number, altitude?: number): Vec3;
}
