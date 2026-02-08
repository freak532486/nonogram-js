import { FastifyInstance, FastifyRequest } from "fastify";
import auth from "../../../auth/auth"

/**
 * If the request is authenticated with a session token, then returns the matching user id, or undefined if session
 * token is invalid for some reason.
 */
export async function getActiveUserIdOrThrow(fastify: FastifyInstance, request: FastifyRequest): Promise<number> {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
        throw fastify.httpErrors.unauthorized();
    }

    const sessionToken = auth.parseBearerAuthHeader(authHeader);
    if (!sessionToken) {
        throw fastify.httpErrors.unauthorized();
    }

    const ret = auth.getUserIdForSession(fastify, sessionToken);
    if (!ret) {
        throw fastify.httpErrors.unauthorized();
    }

    return ret;
}

export function getBearerTokenOrThrow(fastify: FastifyInstance, request: FastifyRequest): string
{
    const authHeader = request.headers.authorization;
    if (!authHeader) {
        throw fastify.httpErrors.unauthorized();
    }

    const parsed = auth.parseBearerAuthHeader(authHeader);
    if (!parsed) {
        throw fastify.httpErrors.unauthorized();
    }

    return parsed;
}