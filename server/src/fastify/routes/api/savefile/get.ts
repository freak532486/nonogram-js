import { FastifyPluginAsync } from 'fastify'
import { SaveFile, SaveFileSchema } from 'nonojs-common';
import { getActiveUserIdOrThrow } from '../api-utils';

const get: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.route<{
        Reply: SaveFile
    }>
    ({
        method: "GET",
        url: "/",
        schema: {
            response: {
                200: SaveFileSchema
            }
        },
        handler: async (request, response) => {
            const userId = await getActiveUserIdOrThrow(fastify, request);
            const ret = await fastify.state.savefileCache.read(userId);
            if (!ret) {
                throw fastify.httpErrors.notFound();
            }

            return ret; 
        }
    });
}

export default get
