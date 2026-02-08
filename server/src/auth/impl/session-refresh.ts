import { FastifyInstance } from "fastify";
import * as authUtils from "../internal/utils"
import TokenPair from "../types/token-pair"
import { getUserForRefreshToken, putRefreshToken, removeSession } from "./auth-sql";

/**
 * Regenerates the session- and refresh-token for the given user.
 */
export async function createSessionForUser(fastify: FastifyInstance, userId: number): Promise<TokenPair> {
    /* Generate tokens */
    const sessionToken = authUtils.generateRandomToken();
    const refreshToken = authUtils.generateRandomToken();
    const creationTimestamp = Date.now();

    /* Write session token into memory */
    fastify.state.tokenStore.putSessionToken(userId, sessionToken, refreshToken, creationTimestamp);

    /* Write refresh token into database */
    await putRefreshToken(fastify, userId, refreshToken, creationTimestamp);

    /* Done */
    return {
        "sessionToken": sessionToken,
        "refreshToken": refreshToken
    }
}

/**
 * Refreshes the tokens for the session with the given refresh token. Returns undefined if no such session exists.
 */
export async function refreshSession(fastify: FastifyInstance, refreshToken: string): Promise<TokenPair | undefined> {
    const userId = await getUserForRefreshToken(fastify, refreshToken);
    if (userId == undefined) {
        return undefined;
    }

    /* Remove old session */
    const sessionToken = fastify.state.tokenStore.getSessionTokenForRefreshToken(refreshToken);
    if (sessionToken) {
        fastify.state.tokenStore.removeSessionToken(sessionToken);
    }
    removeSession(fastify, refreshToken);

    /* Create new session */
    return createSessionForUser(fastify, userId);
}