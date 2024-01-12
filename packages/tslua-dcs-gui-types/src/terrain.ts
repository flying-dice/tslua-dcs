import { _terrain } from "./exports/terrain.export";

/**
 * @noSelf
 */
export interface l_terrain extends _terrain {
    /**
     * Takes a latitude and longitude and returns the x and y coordinates in meters.
     *
     * See usage in DCS Source files
     *
     * @example
     * local x, y = terrain.convertLatLonToMeters(beaconData.position.latitude, beaconData.position.longitude)
     *
     * @param lat {number} Latitude in degrees
     * @param lon {number} Longitude in degrees
     * @returns {LuaMultiReturn<[number, number]>} x and y coordinates in meters
     */
    convertLatLonToMeters(
        lat: number,
        lon: number,
    ): LuaMultiReturn<[number, number]>;

    /**
     * Returns the height of the terrain at the given coordinates.
     *
     * See usage in DCS Source files
     *
     * @example
     * local airdrome.height = Terrain.GetHeight(airdrome.x, airdrome.y)
     *
     * @param x {number} x coordinate in meters
     * @param y {number} y coordinate in meters
     */
    GetHeight(x: number, y: number): number;
}
