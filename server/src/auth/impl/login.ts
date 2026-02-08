import * as authUtils from "../internal/utils"
import TokenPair from "../types/token-pair";
import BasicAuthContent from "../types/basic-auth-content";
import { FastifyInstance } from "fastify";
import { getUserByUsername } from "./auth-sql";
import { createSessionForUser } from "./session-refresh";

/**
 * Performs a basic auth login. On success, returns new session- and refresh-token for that user. On failure, returns
 * undefined.
 */
export async function performLogin(fastify: FastifyInstance, basicAuth: BasicAuthContent): Promise<TokenPair | undefined>
{
    const userEntry = await getUserByUsername(fastify, basicAuth.username);
    if (!userEntry) {
        return undefined;
    }

    /* Compare password hash */
    if (await authUtils.validatePassword(basicAuth.password, userEntry.passwordHash) == false) {
        return undefined;
    }

    /* Correct credentials. Generate new tokens and return */
    return await createSessionForUser(fastify, userEntry.userId);
}