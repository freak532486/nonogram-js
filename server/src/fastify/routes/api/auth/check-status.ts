import { FastifyPluginAsync } from 'fastify'
import * as apiUtils from "../api-utils"
import { CheckLoginStatusResponse, CheckLoginStatusResponseSchema } from "nonojs-common"
import auth from '../../../../auth/auth';

const checkStatus: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.route<{
        Body: void
        Reply: CheckLoginStatusResponse
    }>({
        method: "GET",
        url: "/check-login-status",
        schema: {
            response: {
                200: CheckLoginStatusResponseSchema
            }
        },
        handler: async (request, reply) => {
            const userId = await apiUtils.getActiveUserIdOrThrow(fastify, request);
            if (!userId) {
                throw fastify.httpErrors.unauthorized();
            }

            const userInfo = await auth.getUserById(fastify, userId);
            return { username: userInfo?.username };
        }
    });
}

export default checkStatus;