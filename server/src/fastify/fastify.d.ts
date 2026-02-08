import "fastify";
import Config from "../config/types/config"
import { Database } from "sqlite";
import TokenStore from "../auth/types/token-store";
import { AuthService } from "../auth/auth";
import Mailjet from "node-mailjet";
import SavefileCache from "../savefile/impl/savefile-cache";

declare module "fastify" {
    interface FastifyInstance {
        state: {
            config: Config;
            db: Database;
            tokenStore: TokenStore;
            savefileCache: SavefileCache;
            mailjet: Mailjet;
        };
    }
}