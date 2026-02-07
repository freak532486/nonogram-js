import { SaveFile, SaveFileEntry, SaveState } from "nonojs-common";
import { ACTIVE_VERSION_KEY } from "./savefile-migrator";

export enum MergeStrategy {
    LOCAL_WINS,
    SERVER_WINS
};

export default class SavefileMerger
{

    getMergedSavefileForUser(
        serverSavefile: SaveFile | undefined,
        localSavefile: SaveFile | undefined,
        username: string | undefined,
        mergeStrategy: MergeStrategy
    ): SaveFile
    {
        /* Remove savefiles that do not match requested user */
        if (serverSavefile && serverSavefile.username !== username) {
            serverSavefile = undefined;
        }

        if (localSavefile && localSavefile.username !== username) {
            localSavefile = undefined;
        }

        /* Empty savefile on no savefile */
        if (!serverSavefile && !localSavefile) {
            return {
                versionKey: ACTIVE_VERSION_KEY,
                username: username,
                lastPlayedNonogramId: undefined,
                entries: []
            };
        }

        /* No merge necessary if only server/local save exists */
        if (!serverSavefile) {
            return localSavefile!;
        }

        if (!localSavefile) {
            return serverSavefile!;
        }

        /* Merge savefiles */
        const losingSavefile = mergeStrategy == MergeStrategy.LOCAL_WINS ? serverSavefile : localSavefile;
        const winningSavefile = mergeStrategy == MergeStrategy.SERVER_WINS ? serverSavefile : localSavefile;
        return this.mergeSavefiles(losingSavefile, winningSavefile);
    }

    /**
     * Merges two savefiles. If there is a conflict on some data, then the winning savefile wins.
     */
    mergeSavefiles(
        losingSavefile: SaveFile,
        winningSavefile: SaveFile
    ): SaveFile
    {
        /* Assumption: Server has more recent state. */
        const lastPlayedNonogramId = winningSavefile.lastPlayedNonogramId;
        
        /* Merge entries: Overwrite based on merge strategy, but keep all entries from both sources */
        const entryMap = new Map<string, SaveState>();

        for (const entry of losingSavefile.entries) {
            entryMap.set(entry.nonogramId, entry.state);
        }

        for (const entry of winningSavefile.entries) {
            entryMap.set(entry.nonogramId, entry.state);
        }

        const mergedEntries: Array<SaveFileEntry> = [];
        for (const entry of entryMap.entries()) {
            mergedEntries.push({ nonogramId: entry[0], state: entry[1] });
        }

        /* Done */
        return {
            versionKey: ACTIVE_VERSION_KEY,
            username: winningSavefile.username || losingSavefile.username,
            lastPlayedNonogramId: lastPlayedNonogramId,
            entries: mergedEntries
        };
    }

};