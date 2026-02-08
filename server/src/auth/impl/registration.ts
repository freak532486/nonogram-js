import { FastifyInstance } from "fastify";
import { createPasswordHash } from "../internal/utils";
import * as crypto from "crypto"
import { getStringSettingOrThrow } from "../../config/impl/config-access";
import { sendMail } from "./mailing";
import { createPendingRegistration, createUser, getPendingRegistration, getUserByUsername, removePendingRegistration } from "./auth-sql";

const CREATION_TOKEN_EXPIRY_TIME_MS = 24 * 60 * 60 * 1000; // One day

const REGISTRATION_MAIL_SUBJECT = "Confirm your NonoJs registration";
const REGISTRATION_MAIL_TEMPLATE = `
    Hello <b>$username</b>. To complete your registration at NonoJs, please click on <a href="$link">this link</a>.<br>
    <br>
    Regards<br>
    Your NonoJs team
`;

/**
 * Performs the initial registration of a user. This will send a confirmation e-mail to the user. 
 */
export async function performUnconfirmedRegistration(
    fastify: FastifyInstance,
    username: string,
    password: string,
    emailAddress: string
) : Promise<"ok" | "user_exists" | "failed_sending_mail">
{
    /* Check if the user already exists */
    if (await getUserByUsername(fastify, username) !== undefined) {
        return "user_exists";
    }

    /* Hash the password immediately */
    const hashedPassword = await createPasswordHash(password);

    /* Create a random token that references the pending registration */
    const token = crypto.randomBytes(16).toString("base64url");

    /* Send the mail first. If this fails, then no entry has to be created in the database */
    const hostname = getStringSettingOrThrow(fastify.state.config, "hostname");
    const confirmationLink = hostname + "/register/confirm?token=" + token;
    const mailContent = REGISTRATION_MAIL_TEMPLATE
        .replace("$username", username)
        .replace("$link", confirmationLink);

    const mailResult = await sendMail(fastify, emailAddress, REGISTRATION_MAIL_SUBJECT, mailContent);
    if (!mailResult) {
        return "failed_sending_mail";
    }

    /* Place the registration token into the database */
    const creationTimestamp = Date.now();
    await createPendingRegistration(fastify, token, username, hashedPassword, emailAddress, creationTimestamp);

    /* Done */
    return "ok";
}

/**
 * Performs a registration confirmation. This actually creates the new user. Returns 'false' if the token does not
 * match a pending confirmation.
 */
export async function confirmRegistration(
    fastify: FastifyInstance,
    token: string
) : Promise<
    { status: "ok", userId: number } |
    { status: "unknown_token", userId: undefined } |
    { status: "user_exists", userId: undefined }
>
{
    /* Get pending confirmation entry */
    const lastValidCreationTimestamp = Date.now() - CREATION_TOKEN_EXPIRY_TIME_MS;
    const entry = await getPendingRegistration(fastify, token, lastValidCreationTimestamp);

    if (!entry) {
        return { status: "unknown_token", userId: undefined };
    }

    /* Remove the pending registration */
    await removePendingRegistration(fastify, token);

    /* Entry was found. Create the user. */
    const userId = await createUser(fastify, entry.username, entry.hashedPassword, entry.emailAddress);
    if (!userId) {
        return { "status": "user_exists", userId: undefined };
    }

    /* Done */
    return { "status": "ok", userId: userId };
}