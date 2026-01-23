import * as dbAccess from "../../access/database-access"
import { FastifyInstance } from "fastify";

/**
 * Creates tables necessary for authentification.
 */
export default async function authTableCreation(fastify: FastifyInstance) {
    const db = fastify.state.db;

    /* Create user table */
    const userTableSql = `
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    `;

    await dbAccess.runSql(db, userTableSql);

    /* Create session table */
    const userSessionSql = `
    CREATE TABLE user_sessions (
        user_id INTEGER PRIMARY KEY,
        refresh_token TEXT NOT NULL,
        refresh_token_created INTEGER NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    `

    await dbAccess.runSql(db, userSessionSql);
}