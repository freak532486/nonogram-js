import { FastifyInstance } from "fastify";
import { removeSession } from "./auth-sql";

/**
 * Logs out the session with the given refresh token. Returns 'false' if no such session exists. 
 */
export async function performLogout(fastify: FastifyInstance, refreshToken: string): Promise<boolean>
{
    /* Remove session from database */
    const removed = await removeSession(fastify, refreshToken);

    /* Remove session from token store */
    const sessionToken = fastify.state.tokenStore.getSessionTokenForRefreshToken(refreshToken);
    if (sessionToken) {
        fastify.state.tokenStore.removeSessionToken(sessionToken);
    }

    /* Done */
    return removed;
}