import fp from "fastify-plugin";
import { Database } from "sqlite";
import openDatabase from "../../db/access/database-init";
import TokenStore from "../../auth/types/token-store";
import Config from "../../config/types/config";
import * as configAccess from "../../config/access/config-access"

const CONFIG_PATH = "nonojs-server-settings.json";
const CONFIG_KEY_DATABASE_PATH = "databasePath";

export interface AppState {
    config: Config;
    db: Database;
    tokenStore: TokenStore;
}

export default fp(async (fastify) => {
    /* Load config */
    const config = configAccess.readConfig("nonojs-server-settings.json");
    if (!config) {
        throw new Error("Could not read configuration file '" + CONFIG_PATH + "'.");
    }

    /* Read database path from config */
    const dbPath = configAccess.getStringSetting(config, "databasePath");
    if (!dbPath) {
        throw new Error("Config setting '" + CONFIG_KEY_DATABASE_PATH + "' was undefined or invalid.");
    }

    /* Open database connection */
    const db = await openDatabase(fastify, dbPath);

    /* Create token store for session tokens */
    const tokenStore = new TokenStore();

    /* Decore and add to state */
    fastify.decorate("state", {
        config,
        db,
        tokenStore
    } satisfies AppState);
});