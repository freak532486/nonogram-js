import { FastifyPluginAsync } from "fastify";
import auth from "../../../../auth/auth";
import { getActiveUserIdOrThrow } from "../api-utils";

const deleteUser: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.route({
        method: "DELETE",
        url: "/user",
        handler: async function (request, reply) {
            const userId = await getActiveUserIdOrThrow(fastify, request);
            const deleted = auth.deleteUser(fastify, userId);
            if (!deleted) {
                throw fastify.httpErrors.notFound();
            }
        }
    });
}

export default deleteUser