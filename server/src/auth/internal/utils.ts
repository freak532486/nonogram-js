import * as bcrypt from "bcrypt"
import * as crypto from "crypto"
import BasicAuthContent from "../types/basic-auth-content";

const BCRYPT_NUM_HASH_ROUNDS = 10;
const TOKEN_LENGTH = 32;


/**
 * Generates a random session- or refresh-token.
 */
export function generateRandomToken() {
    return crypto.randomBytes(TOKEN_LENGTH).toString("hex");
}


/**
 * Creates a password hash. The hash is salted using the username.
 */
export async function createPasswordHash(password: string)
{
    await bcrypt.hash(password, BCRYPT_NUM_HASH_ROUNDS);
}


/**
 * Compares if the stored hash matches the given password.
 */
export async function validatePassword(password: string, storedHash: string) {
    return await bcrypt.compare(password, storedHash);
}


/**
 * Parses a basic auth header. Returns 'undefined' if the header is not a proper basic auth header.
 */
export function parseBasicAuthHeader(header: string): BasicAuthContent | undefined {
    /* Input format: 'Basic <base64(username:password)>' */
    const outerSplit = header
        .trim()
        .replace(/\s\s+/g, " ")
        .split(" ");

    if (outerSplit.length !== 2 || outerSplit[0].toLowerCase() !== "basic") {
        return undefined;
    }

    const b64 = outerSplit[1];

    try {
        /* Try to decode base64 */
        const decoded = Buffer.from(b64, "base64").toString("utf8");
        const innerSplit = decoded.split(":");

        /* Split by colon returns username and password */
        if (innerSplit.length < 2) {
            return undefined;
        }

        /* Done parsing */
        return {
            "username": innerSplit[0],
            "password": innerSplit.slice(1).join(":")
        }

    } catch (error) {
        /* Base 64 decoding failed, so return undefined. */
        return undefined;
    }
}