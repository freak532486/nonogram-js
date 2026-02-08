import { FastifyInstance } from "fastify";
import { getStringSettingOrThrow } from "../../config/impl/config-access";


/**
 * Sends a mail to the given recipient. Returns 'true' if this succeeded. Returns 'false' if there was some error.
 */
export async function sendMail(
    fastify: FastifyInstance, 
    to: string, 
    subject: string, 
    content: string
): Promise<boolean>
{
    const sourceMailAddress = getStringSettingOrThrow(fastify.state.config, "mailjet_mail_address");
    const mailjet = fastify.state.mailjet;

    const response = await mailjet
        .post("send", { version: "v3.1" })
        .request({
            "Messages": [
                {
                    "From": {
                        "Email": sourceMailAddress,
                        "Name": "NonoJs"
                    },
                    "To": [{
                        "Email": to
                    }],
                    "Subject": subject,
                    "HTMLPart": content
                }
            ]
        });

    return statusIsOk(response.response.status);
}

function statusIsOk(status: number) {
    return status >= 200 && status <= 299;
}