/**
 * The net singleton are a number of functions from the network API that work in the mission scripting environment.
 * Notably for mission scripting purposes there is now a way to send chat, check if players are in Combined Arms slots,
 * kick people from the server, and move players to certain slots.
 *
 * @see https://wiki.hoggitworld.com/view/DCS_singleton_net
 *
 * https://typescripttolua.github.io/docs/the-self-parameter
 * @noSelfInFile
 */
declare namespace net {
    /**
     * Sends a chat message to all players or just allies.
     * @param message The message to be sent.
     * @param all Boolean indicating whether the message should be sent to all players (true) or just allies (false).
     */
    function send_chat(message: string, all: boolean): void;

    /**
     * Sends a chat message to a specific player.
     * @param message The message to be sent.
     * @param playerID The ID of the player to whom the message is sent.
     */
    function send_chat_to(message: string, playerID: number): void;

    /**
     * Receives chat messages.
     * @returns The latest chat message received.
     */
    function recv_chat(): string;

    /**
     * Gets a list of all player IDs.
     * @returns An array of player IDs.
     */
    function get_player_list(): number[];

    /**
     * Gets the player ID of the local player.
     * @returns The player ID of the local player.
     */
    function get_my_player_id(): number;

    /**
     * Gets the server ID.
     * @returns The server ID.
     */
    function get_server_id(): number;

    /**
     * Kicks a player from the server.
     * @param playerID The ID of the player to be kicked.
     * @param reason The reason for kicking the player.
     */
    function kick(playerID: number, reason: string): void;

    /**
     * Gets statistics about a specific player.
     * @param playerID The ID of the player.
     * @returns An object containing the player's statistics.
     */
    function get_stat(playerID: number): any; // Replace 'any' with a more specific type if possible

    /**
     * Retrieves the name of a player based on their ID.
     * @param playerID The ID of the player.
     * @returns The name of the player.
     */
    function get_name(playerID: number): string;

    /**
     * Gets the slot ID a player is occupying.
     * @param playerID The ID of the player.
     * @returns The slot ID the player is occupying.
     */
    function get_slot(playerID: number): number;

    /**
     * Sets a player to a specific slot.
     * @param playerID The ID of the player.
     * @param slotID The ID of the slot to assign the player to.
     */
    function set_slot(playerID: number, slotID: number): void;

    /**
     * Forces a player into a specific slot.
     * @param playerID The ID of the player.
     * @param slotID The ID of the slot to force the player into.
     */
    function force_player_slot(playerID: number, slotID: number): void;

    /**
     * Converts a Lua table to a JSON string.
     * @param luaTable The Lua table to convert.
     * @returns A JSON string representation of the Lua table.
     */
    function lua2json(luaTable: any): string; // Replace 'any' with a more specific type if possible

    /**
     * Converts a JSON string to a Lua table.
     * @param jsonString The JSON string to convert.
     * @returns A Lua table representation of the JSON string.
     */
    function json2lua(jsonString: string): any; // Replace 'any' with a more specific type if possible

    /**
     * Executes a Lua string.
     * @param luaString The Lua string to execute.
     * @returns The result of the Lua string execution.
     */
    function dostring_in(luaString: string): any; // Replace 'any' with a more specific type if possible

    /**
     * Logs a message to the DCS log.
     * @param message The message to log.
     */
    function log(message: string): void;

    /**
     * Enables or disables tracing.
     * @param enable Boolean to enable (true) or disable (false) tracing.
     */
    function trace(enable: boolean): void;
}