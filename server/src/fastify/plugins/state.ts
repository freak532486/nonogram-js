import fp from "fastify-plugin";
import { Database } from "sqlite";
import openDatabase from "../../db/impl/database-init";
import Config from "../../config/types/config";
import config from "../../config/config"
import Mailjet from "node-mailjet";
import TokenStore from "../../auth/types/token-store";
import SavefileCache from "../../savefile/impl/savefile-cache";
import { CONFIG_PATH } from "../constants";

const CONFIG_KEY_DATABASE_PATH = "database_path";

export interface AppState {
    config: Config;
    db: Database;
    tokenStore: TokenStore;
    savefileCache: SavefileCache;
    mailjet: Mailjet;
}

export default fp(async (fastify) => {
    /* Create state object, initially empty */
    fastify.decorate("state", {} as AppState);

    /* Load config */
    const serverConfig = config.readConfig(CONFIG_PATH);
    if (!serverConfig) {
        throw new Error("Could not read configuration file '" + CONFIG_PATH + "'.");
    }

    fastify.state.config = serverConfig;

    /* Initialize mailjet client */
    const mailjetPrivateKey = config.getStringSetting(fastify.state.config, "mailjet_apikey_private");
    const mailjetPublicKey = config.getStringSetting(fastify.state.config, "mailjet_apikey_public");
    if (!mailjetPublicKey || !mailjetPrivateKey) {
        throw new Error("Mailjet keys have not been configured.");
    }

    fastify.state.mailjet = Mailjet.apiConnect(mailjetPublicKey, mailjetPrivateKey);

    /* Read database path from config */
    const dbPath = config.getStringSetting(fastify.state.config, CONFIG_KEY_DATABASE_PATH);
    if (!dbPath) {
        throw new Error("Config setting '" + CONFIG_KEY_DATABASE_PATH + "' was undefined or invalid.");
    }

    /* Open database connection */
    fastify.state.db = await openDatabase(fastify, dbPath);

    /* Create token store for storing session tokens */
    fastify.state.tokenStore = new TokenStore();

    /* Savefile cache: Savefiles are only periodically persisted into the database. */
    fastify.state.savefileCache = new SavefileCache(fastify);
});