import * as authUtils from "../internal/utils"
import * as dbAccess from "../../db/access/database-access"
import { Database } from "sqlite";
import TokenStore from "../types/token-store"
import { FastifyInstance } from "fastify"
import TokenPair from "../types/token-pair"

/**
 * Regenerates the session- and refresh-token for the given user.
 */
export default async function refreshTokenForUser(fastify: FastifyInstance, userId: number): Promise<TokenPair> {
    /* Fetch state from fastify instance */
    const db: Database = fastify.state.db;
    const tokenStore: TokenStore = fastify.state.tokenStore;

    /* Generate tokens */
    const sessionToken = authUtils.generateRandomToken();
    const refreshToken = authUtils.generateRandomToken();
    const creationTimestamp = Date.now();

    /* Write refresh token into database */
    const sql = `
        INSERT INTO sessions
        VALUES ($userId, $refreshToken, $creationTimestamp)
        ON CONFLICT DO UPDATE 
        SET refresh_token = $refreshToken, creation_timestamp = $creationTimestamp
    `;

    const params = {
        "userId": userId,
        "refreshToken": refreshToken,
        "creationTimestamp": creationTimestamp
    };

    await dbAccess.runSql(db, sql, params);

    /* Write session token into memory */
    tokenStore.putSessionToken(userId, sessionToken);

    /* Done */
    return {
        "sessionToken": sessionToken,
        "refreshToken": refreshToken
    }
}