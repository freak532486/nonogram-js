import SavefileAccess from "./savefile-access";
import SavefileMerger from "./savefile-merger";

const SYNC_INTERVAL_MS = 1 * 1000;

export default class SavefileSyncService
{

    #syncQueued: boolean = false;
    #lastSyncTs: number | undefined;

    constructor (
        private readonly access: SavefileAccess,
        private readonly merger: SavefileMerger
    ) {}


    /**
     * Queues a sync between server savefile and local savefile.
     */
    queueSync() {
        if (this.#syncQueued) {
            return;
        }

        this.#syncQueued = true;
        setTimeout(() => this.#doSync(), this.getTimeToSyncMs());
    }

    /**
     * Forces a sync between server savefile and local savefile. Use queueSync() unless an immediate sync is really
     * absolutely necessary.
     */
    forceSync() {
        this.#doSync();
    }

    async #doSync() {
        const serverSavefile = await this.access.fetchServerSavefile() ;
        const localSavefile = this.access.fetchLocalSavefile();
        const merged = this.merger.mergeSavefiles(serverSavefile, localSavefile);
        await this.access.writeServerSavefile(merged);

        this.#syncQueued = false;
        this.#lastSyncTs = Date.now();
    }

    /**
     * Returns the number of milliseconds until the next sync will happen. Returns 'undefined' if the local and server
     * state are sync and no sync is planned.
     */
    getTimeToSyncMs(): number | undefined
    {
        if (!this.#syncQueued) {
            return undefined;
        }

        if (!this.#lastSyncTs) {
            return 0;
        }

        const nextSyncTs = this.#lastSyncTs + SYNC_INTERVAL_MS;
        return Math.max(0, nextSyncTs - Date.now());
    }

};