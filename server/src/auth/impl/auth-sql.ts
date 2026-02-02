import { FastifyInstance } from "fastify";
import { REFRESH_TOKEN_EXPIRY_MS } from "../internal/constants";
import UserEntry from "../types/user-entry";
import database from "../../db/database";


export async function putRefreshToken(
    fastify: FastifyInstance,
    userId: number,
    refreshToken: string,
    creationTime: number
): Promise<void>
{
    const db = fastify.state.db;
    const sql = `
        INSERT INTO user_sessions (refresh_token, user_id, creation_timestamp)
        VALUES ($refreshToken, $userId, $creationTimestamp)
        ON CONFLICT DO NOTHING
    `;

    await database.runSql(db, sql, {
        $userId: userId,
        $refreshToken: refreshToken,
        $creationTimestamp: creationTime
    });
}

export async function getUserForRefreshToken(fastify: FastifyInstance, refreshToken: string): Promise<number | undefined> {
    const db = fastify.state.db;
    const lastValidCreationTimestamp = Date.now() - REFRESH_TOKEN_EXPIRY_MS;

    const sql = `
        SELECT user_id
        FROM user_sessions
        WHERE refresh_token = $refreshToken
        AND creation_timestamp >= $lastValidCreationTimestamp
    `;

    const result = await database.runSql(db, sql, {
        $refreshToken: refreshToken,
        $lastValidCreationTimestamp: lastValidCreationTimestamp
    });

    if (result.length == 0) {
        return undefined;
    }

    return result[0].user_id;
}

export async function getUserByUsername(fastify: FastifyInstance, username: string): Promise<UserEntry | undefined> {
    const db = fastify.state.db;
    const sql = "SELECT * FROM users WHERE username = $username";
    const result = await database.runSql(db, sql, { $username: username });

    if (result.length == 0) {
        return undefined;
    }

    return {
        userId: result[0].id,
        username: result[0].username,
        passwordHash: result[0].password_hash,
        emailAddress: result[0].email_address
    };
}

export async function getUserById(fastify: FastifyInstance, userId: number): Promise<UserEntry | undefined> {
    const db = fastify.state.db;
    const sql = "SELECT * FROM users WHERE id = $userId";
    const result = await database.runSql(db, sql, { $userId: userId });

    if (result.length == 0) {
        return undefined;
    }

    return {
        userId: result[0].id,
        username: result[0].username,
        passwordHash: result[0].password_hash,
        emailAddress: result[0].email_address
    };
}

export async function createUser(
    fastify: FastifyInstance,
    username: string,
    passwordHash: string,
    emailAddress: string
): Promise<number | undefined>
{
    const db = fastify.state.db;
    const sql = `
        INSERT INTO users (username, password_hash, email_address)
        VALUES ($username, $passwordHash, $emailAddress)
        ON CONFLICT DO NOTHING
        RETURNING id
    `;

    const result = await database.runSql(db, sql, {
        $username: username,
        $passwordHash: passwordHash,
        $emailAddress: emailAddress
    });

    if (result.length == 0) {
        return undefined;
    }

    return result[0].id;
}

export async function createPendingRegistration(
    fastify: FastifyInstance,
    token: string,
    username: string,
    hashedPassword: string,
    emailAddress: string
)
{
    const sql = `
        INSERT INTO pending_confirmations (token, username, password_hash, email_address)
        VALUES ($token, $username, $hashedPassword, $emailAddress)
    `;

    await database.runSql(fastify.state.db, sql, {
        "$token": token,
        "$username": username,
        "$hashedPassword": hashedPassword,
        "$emailAddress": emailAddress
    });
}

export interface PendingRegistrationEntry {
    username: string,
    hashedPassword: string,
    emailAddress: string
};

export async function getPendingRegistration(
    fastify: FastifyInstance,
    token: string
): Promise<PendingRegistrationEntry | undefined>
{
    const sql = `
        SELECT username, password_hash, email_address
        FROM pending_confirmations
        WHERE token = $token
    `;
    const result = await database.runSql(fastify.state.db, sql, { $token: token });
    if (result.length == 0) {
        return undefined;
    }

    return {
        username: result[0].username,
        hashedPassword: result[0].password_hash,
        emailAddress: result[0].email_address
    };
}

export async function removePendingRegistration(
    fastify: FastifyInstance,
    token: string
)
{
    const removalSql = `
        DELETE FROM pending_confirmations
        WHERE token = $token
    `;
    
    await database.runSql(fastify.state.db, removalSql, { $token: token });
}