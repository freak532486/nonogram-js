import { FastifyPluginAsync } from 'fastify'
import auth from "../../../../auth/auth"
import { getBearerTokenOrThrow } from '../api-utils';

const logout: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.route({
        method: "GET",
        url: "/logout",
        handler: async (request, reply) => {
            const refreshToken = getBearerTokenOrThrow(fastify, request);
            const result = await auth.logout(fastify, refreshToken);
            if (!result) {
                throw fastify.httpErrors.notFound("Could not find session for logout");
            }
        }
    });
}

export default logout
