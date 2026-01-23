import { FastifyPluginAsync } from 'fastify'
import performLogin from "../../../auth/access/login"

const getToken: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/token', async function (request, reply) {
        const auth = request.headers.authorization;
        if (!auth) {
            throw fastify.httpErrors.unauthorized("Missing authorization header.");
        }

        const tokens = await performLogin(fastify, auth);
        if (!tokens) {
            throw fastify.httpErrors.unauthorized("Bad credentials");
        }

        return tokens;
    });
}

export default getToken
