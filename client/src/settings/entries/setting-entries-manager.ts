import SavefileAccess from "../../savefile/savefile-access";
import Settings from "../index/settings.component";
import DeleteAccountEntry from "./delete-account-entry/delete-account-entry.component";
import ExportImportEntry from "./export-import-entry/export-import-entry.component";
import SavefileMergeEntry from "./savefile-merge-entry/savefile-merge-entry.component";

export default class SettingEntriesManager
{
    
    constructor(
        private readonly settings: Settings,
        private readonly savefileAccess: SavefileAccess,
        private readonly getActiveUsername: () => string | undefined,
        private readonly mergeLocalSavefileWithAccount: () => void,
        private readonly deleteActiveAccount: () => void
    ) {}

    createSettingsEntries()
    {
        /* Entry for importing/exporting savefiles */
        const importExportEntry = new ExportImportEntry(this.savefileAccess);
        this.settings.addEntry(importExportEntry.view);

        /* Entry for merging local savefile to user savefile */
        const username = this.getActiveUsername();
        const localSavefile = this.savefileAccess.fetchLocalSavefileForUser(undefined);

        if (username && localSavefile) {
            const mergeEntry = new SavefileMergeEntry(username, this.mergeLocalSavefileWithAccount);
            this.settings.addEntry(mergeEntry.view);
        }

        /* Entry for deleting active account */
        if (username) {
            const deleteAccountEntry = new DeleteAccountEntry(username, this.deleteActiveAccount);
            this.settings.addEntry(deleteAccountEntry.view);
        }
    }

}