import { FastifyPluginAsync } from 'fastify'
import { RegisterUserRequest, RegisterUserRequestSchema } from 'nonojs-common';
import auth from '../../../../auth/auth';

const register: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.route<{
        Body: RegisterUserRequest
    }>({
        method: "POST",
        url: "/register",
        schema: {
            body: RegisterUserRequestSchema
        },
        handler: async function (request, reply) {
            /* Parse auth header */
            const username = request.body.username;
            const password = request.body.password;
            const emailAddress = request.body.emailAddress;
            const result = await auth.performUnconfirmedRegistration(fastify, username, password, emailAddress);

            if (result == 'user_exists') {
                throw fastify.httpErrors.conflict("User already exists");
            }

            if (result == 'failed_sending_mail') {
                throw fastify.httpErrors.internalServerError("Failed sending confirmation mail");
            }

            reply.code(200);
        }
    });
}

export default register
