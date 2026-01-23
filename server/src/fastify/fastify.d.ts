import "fastify";
import { Config } from "../config/access/config-access";
import { Database } from "sqlite";
import { TokenStore } from "../auth/access/login";

declare module "fastify" {
    interface FastifyInstance {
        state: {
            config: Config;
            db: Database;
            tokenStore: TokenStore;
        };
    }
}