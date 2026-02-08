import { FastifyInstance } from "fastify";
import database from "../../database";

export default async function createSavestateTable(fastify: FastifyInstance): Promise<void>
{
    /* Get database from server instance */
    const db = fastify.state.db;

    /* Create table */
    const sql = `
        CREATE TABLE savefiles (
            user_id INTEGER PRIMARY KEY,
            save_file BLOB NOT NULL,
            timestamp INTEGER NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;

    await database.runSql(db, sql);
}