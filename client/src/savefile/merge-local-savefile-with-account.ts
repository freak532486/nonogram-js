import SavefileAccess from "./savefile-access";
import SavefileMerger from "./savefile-merger";

export default class MergeLocalSavefileWithAccount
{
    constructor(
        private readonly access: SavefileAccess,
        private readonly merger: SavefileMerger,
        private readonly getActiveUsername: () => string | undefined
    ) {}

    /**
     * Merges the local user-less savefile to the local savefile of the active user. The result is written to local
     * storage and to the server. The userless savefile is deleted.
     */
    perform()
    {
        const username = this.getActiveUsername();
        const freeSavefile = this.access.fetchLocalSavefileForUser(undefined);
        const accountSavefile = this.access.fetchLocalSavefile();

        /* No sense merging if not logged in or no free savefile exists */
        if (!freeSavefile || !username) {
            return;
        }

        /* Merge, userless savefile wins */
        const merged = this.merger.mergeSavefiles(accountSavefile, freeSavefile);

        /* Write savefile */
        this.access.writeLocalSavefile(merged);
        this.access.writeServerSavefile(merged);

        /* Delete userless savefile */
        this.access.deleteLocalSavefileForUser(undefined);
    }
}