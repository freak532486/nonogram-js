import database from "../../database"
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
            password_hash TEXT NOT NULL,
            email_address TEXT NOT NULL
        )
    `;

    await database.runSql(db, userTableSql);

    /* Create session table */
    const userSessionSql = `
        CREATE TABLE user_sessions (
            refresh_token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            creation_timestamp INTEGER NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `

    await database.runSql(db, userSessionSql);

    /* Create table for pending registrations */
    const pendingConfirmationsSql = `
        CREATE TABLE pending_confirmations (
            token TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            email_address TEXT NOT NULL,
            creation_timestamp INTEGER NOT NULL
        )
    `

    await database.runSql(db, pendingConfirmationsSql);
}