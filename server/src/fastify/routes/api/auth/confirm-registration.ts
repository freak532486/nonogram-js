import { FastifyPluginAsync } from "fastify";
import auth from "../../../../auth/auth";

const confirmRegistration: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.route<{
        Querystring: {
            token: string
        }
    }>({
        method: "GET",
        url: "/confirm-registration",
        schema: {
            querystring: {
                type: "object",
                required: [ "token" ],
                properties: { token: { type: "string"} }
            }
        },
        handler: async function (request, reply) {
            const token = request.query.token;
            const result = await auth.confirmRegistration(fastify, token);

            switch (result.status) {
                case "ok": reply.code(200); break; // OK
                case "unknown_token": reply.code(404); break; // Not Found
                case "user_exists": reply.code(409); break; // Conflict
            }
        }
    });
}

export default confirmRegistration