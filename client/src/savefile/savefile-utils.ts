import { SaveFile, SaveState } from "nonojs-common";

/**
 * Returns the savestate for the given nonogram in the savefile.
 */
export function getSavestateForNonogram(savefile: SaveFile, nonogramId: string): SaveState | undefined {
    return savefile.entries.find(entry => entry.nonogramId == nonogramId)?.state;
}

/**
 * Returns a map from nonogram id to contained savestate for that nonogram.
 */
export function getAllStoredStates(savefile: SaveFile): Map<string, SaveState> {
    const ret = new Map();
    savefile.entries.forEach(entry => ret.set(entry.nonogramId, entry.state));
    return ret;
}

/**
 * Modifies the savefile by either replacing the savestate for the given nonogram with the given state, or adding the
 * state to the savefile.
 */
export function putSavestate(savefile: SaveFile, nonogramId: string, state: SaveState) {
    const matchingEntry = savefile.entries.find(entry => entry.nonogramId == nonogramId);

    if (matchingEntry) {
        matchingEntry.state = state;
    } else {
        savefile.entries.push({
            nonogramId: nonogramId,
            state: state
        });
    }
}