import * as authUtils from "../internal/utils"
import { Database } from "sqlite";
import * as dbAccess from "../../db/access/database-access";
import { FastifyInstance } from "fastify";
import TokenPair from "../types/token-pair";
import refreshTokenForUser from "./token-refresh";

/**
 * Performs a basic auth login. On success, returns new session- and refresh-token for that user. On failure, returns
 * undefined.
 */
export default async function performLogin(fastify: FastifyInstance, authHeader: string): Promise<TokenPair | undefined> {
    /* Fetch state from fastify object */
    const db: Database = fastify.state.db;

    /* Parse basic auth */
    const parsedAuth = authUtils.parseBasicAuthHeader(authHeader);
    if (!parsedAuth) {
        return undefined;
    }

    /* Find user entry in database */
    const sql = "SELECT id, password_hash FROM users WHERE username = ?";
    const results = await dbAccess.runSql(db, sql, parsedAuth.username);

    /* Bad auth if user was not found */
    if (results.length == 0) {
        return undefined;
    }

    /* Compare password hash */
    const storedHash = results[0].password_hash;
    if (await authUtils.validatePassword(parsedAuth.password, storedHash) == false) {
        return undefined;
    }

    /* Correct credentials. Generate new tokens and return */
    const userId = results[0].id;
    return await refreshTokenForUser(fastify, userId);
}

