import { FastifyInstance } from "fastify";
import * as dbAccess from "./database-access"
import authTableCreation from "../internal/migrations/auth-table-creation";

/**
 * Performs all necessary database migrations.
 */
export async function performDatabaseMigrations(fastify: FastifyInstance): Promise<void> {
    /* Get state from fastify instance */
    const db = fastify.state.db;

    /* Create list of all migrations */
    const migrations: Array<DatabaseMigration> = [
        { "identifier": "AuthTableCreation", "run": authTableCreation }
    ];

    /* Run each migration */
    for (const migration of migrations) {
        await dbAccess.performInTransaction(db, async () => {
            await migration.run(fastify);
        });
    }
}

interface DatabaseMigration {
    identifier: string;
    run: (fastify: FastifyInstance) => Promise<void>;
}