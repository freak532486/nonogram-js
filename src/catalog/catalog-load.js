class JoinedFiletype {
    /** @type {Array<SerializedNonogram>} */
    nonograms = [];
}

export class SerializedNonogram {
    /**
     * @param {String} id
     * @param {Array<Array<Number>>} rowHints 
     * @param {Array<Array<Number>>} colHints 
     */
    constructor (id, rowHints, colHints) {
        this.id = id;
        this.rowHints = rowHints;
        this.colHints = colHints;
    }
};

/**
 * Fetches all stored nonograms and returns them.
 * 
 * @returns {Promise<Array<SerializedNonogram>>}
 */
export async function loadNonograms() {
    const serialized = await fetch("/nonograms/joined.json");
    const joined = /** @type {JoinedFiletype} */ (JSON.parse(await serialized.text()));
    normalizeNonograms(joined);
    return joined.nonograms;
}

/**
 * Removes all hints smaller than or equal to zero from the hint lists.
 * 
 * @param {JoinedFiletype} joined 
 */
function normalizeNonograms(joined) {
    for (const nonogram of joined.nonograms) {
        for (let i = 0; i < nonogram.colHints.length; i++) {
            nonogram.colHints[i] = nonogram.colHints[i].filter(hint => hint > 0);
        }

        for (let i = 0; i < nonogram.rowHints.length; i++) {
            nonogram.rowHints[i] = nonogram.rowHints[i].filter(hint => hint > 0);
        }
    }
}