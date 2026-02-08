import { FastifyInstance } from "fastify";
import { SaveFile } from "nonojs-common";
import database from "../../db/database";

/**
 * Returns the stored savefile for the given user, or undefined if no save file is stored for this user.
 */
export async function getSavefileForUser(fastify: FastifyInstance, userId: Number): Promise<SaveFile | undefined>
{
    const sql = `
        SELECT save_file FROM savefiles WHERE user_id = $userId
    `;

    const result = await database.runSql(fastify.state.db, sql, { $userId: userId });
    if (result.length == 0) {
        return undefined;
    }

    const savefileBlob = result[0].save_file as Buffer;
    return JSON.parse(savefileBlob.toString("utf-8")) as SaveFile;
}

export async function putSavefileForUser(
    fastify: FastifyInstance,
    savefile: SaveFile,
    userId: number
)
{
    const savefileBlob = Buffer.from(JSON.stringify(savefile), "utf-8");
    const timestamp = Date.now();

    const sql = `
        INSERT INTO savefiles (user_id, save_file, timestamp)
        VALUES ($userId, $savefileBlob, $timestamp)
        ON CONFLICT DO UPDATE
        SET save_file = $savefileBlob, timestamp = $timestamp
    `;
    
    await database.runSql(fastify.state.db, sql, {
        $userId: userId,
        $savefileBlob: savefileBlob,
        $timestamp: timestamp
    });
}