import * as global from "../../../global";
import { FastifyPluginAsync } from 'fastify'

const getToken: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/token', async function (request, reply) {
        const auth = request.headers.authorization;
        if (!auth) {
            throw fastify.httpErrors.unauthorized("Missing authorization header.");
        }

        return await global.getServices().loginService.performLogin(auth);
    });
}

export default getToken
