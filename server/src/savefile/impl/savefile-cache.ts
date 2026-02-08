import { FastifyInstance } from "fastify";
import { SaveFile } from "nonojs-common";
import { getSavefileForUser, putSavefileForUser } from "./savefile-sql";
import database from "../../db/database";

export default class SavefileCache
{
    #lock = Promise.resolve();

    #cache = new Map<number, SaveFile>();
    #flush = new Map<number, SaveFile>();

    constructor(
        private readonly fastify: FastifyInstance
    ) {}

    /**
     * Reads a savefile from the cache. On cache miss, this reads from the database.
     */
    async read(userId: number): Promise<SaveFile | undefined>
    {
        const fromCache = this.#cache.get(userId);
        if (fromCache) {
            return fromCache;
        }

        const fromFlush = this.#flush.get(userId);
        if (fromFlush) {
            await this.write(userId, fromFlush);
            return fromFlush;
        }

        const fromDb = await getSavefileForUser(this.fastify, userId);
        if (fromDb) {
            await this.write(userId, fromDb);
        }

        return fromDb;
    }

    /**
     * Writes a savefile to the cache.
     */
    async write(userId: number, saveFile: SaveFile)
    {
        await this.#withLock(() => this.#cache.set(userId, saveFile));
    }

    /*
     * Flushes the cache to the database.
     */
    async flush()
    {
        /* Copy cache into flush cache */
        await this.#withLock(() => {
            this.#flush = new Map(this.#cache);
            this.#cache.clear();
        });

        /* Write flush cache into database */
        await database.performInTransaction(this.fastify.state.db, async () => {
            for (const entry of this.#flush.entries()) {
                await putSavefileForUser(this.fastify, entry[1], entry[0]);
            }
        });
    }

    async #withLock(fn: () => void) {
        const next = this.#lock.then(fn, fn);
        this.#lock = next.catch(() => {});
        return next;
    }
}