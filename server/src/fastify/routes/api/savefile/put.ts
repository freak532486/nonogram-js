import { FastifyPluginAsync } from 'fastify'
import { SaveFile, SaveFileSchema } from 'nonojs-common';
import { getActiveUserIdOrThrow } from '../api-utils';

const put: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.route<{
        Body: SaveFile
    }>
    ({
        method: "PUT",
        url: "/",
        schema: {
            body: SaveFileSchema
        },
        handler: async (request, response) => {
            const userId = await getActiveUserIdOrThrow(fastify, request);
            await fastify.state.savefileCache.write(userId, request.body);
        }
    });
}

export default put
