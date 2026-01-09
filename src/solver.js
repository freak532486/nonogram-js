import { CellKnowledge, DeductionStatus, FullDeductionResult, LineId, LineKnowledge, LineType, NonogramState, SingleDeductionResult } from "./common/nonogram-types.js"
import { arraysEqual } from "./util.js";

const TIMEOUT_SECS = 5;

/**
 * Performs a fullsolve.
 * 
 * @param {NonogramState} state
 * @returns {FullDeductionResult} 
 */
export function deduceAll(state) {
    /* Create new state */
    const startTs = Date.now();
    const newState = NonogramState.clone(state);

    /* Create list of all lines */
    let lines = [];

    for (let row = 0; row < state.height; row++) {
        lines.push(new LineId(LineType.ROW, row));
    }

    for (let col = 0; col < state.width; col++) {
        lines.push(new LineId(LineType.COLUMN, col));
    }

    /* Deduce until no line is left */
    while (lines.length > 0) {
        if (Date.now() - startTs > 1000 * TIMEOUT_SECS) {
            return new FullDeductionResult(DeductionStatus.TIMEOUT, newState);
        }

        const deduction = deduceNextInternal(newState, lines);

        /* Quit if no deduction was made anymore */
        if (deduction.status != DeductionStatus.DEDUCTION_MADE) {
            return new FullDeductionResult(deduction.status, newState);
        }

        /* Remove deduced line from lines */
        lines = lines.filter(lineId => lineId !== deduction.lineId);

        /* Add all changed perpendicular lines to lines to check */
        if (deduction.lineId.lineType == LineType.ROW) {
            const y = deduction.lineId.index;
            for (let x = 0; x < state.width; x++) {
                const col = new LineId(LineType.COLUMN, x);
                if (deduction.newKnowledge.cells[x] == newState.getCell(x, y)) {
                    continue;
                }

                if (!lines.find(lineId => lineId.lineType == col.lineType && lineId.index == col.index)) {
                    lines.push(col);
                }
            }
        } else {
            const x = deduction.lineId.index;
            for (let y = 0; y < state.height; y++) {
                const row = new LineId(LineType.ROW, y);
                if (deduction.newKnowledge.cells[y] == newState.getCell(x, y)) {
                    continue;
                }

                if (!lines.find(lineId => lineId.lineType == row.lineType && lineId.index == row.index)) {
                    lines.push(row);
                }
            }
        }

        /* Apply deduction to state */
        newState.applyDeduction(deduction);
    }

    /* Really shouldn't get here ever, but just in case... */
    return new FullDeductionResult(DeductionStatus.COULD_NOT_DEDUCE, newState);
}

/**
 * Based on the given input, performs the next possible deduction for the nonogram.
 * @param {NonogramState} state
 * @returns {SingleDeductionResult}
 */
export function deduceNext(state) {
    /* Create list of all lines */
    const allLines = [];

    for (let row = 0; row < state.height; row++) {
        allLines.push(new LineId(LineType.ROW, row));
    }

    for (let col = 0; col < state.width; col++) {
        allLines.push(new LineId(LineType.COLUMN, col));
    }

    /* Perform internal deduction */
    return deduceNextInternal(state, allLines);
}

/**
 * @param {NonogramState} state
 * @param {Array<LineId>} lines
 * @returns {SingleDeductionResult}
 */
export function deduceNextInternal(state, lines) {
    let allLinesSolved = true;

    /* Order by hint size and number of filled squares */
    /** @param {LineId} lineId */
    const lineSortKey = (lineId) => {
        const line = (lineId.lineType == LineType.ROW) ? state.getRowKnowledge(lineId.index) : 
            state.getColKnowledge(lineId.index);
        
        const hints = (lineId.lineType == LineType.ROW) ? state.rowHints[lineId.index] : 
            state.colHints[lineId.index];

        const minRequiredLength = hints.reduce((a, b) => a + b, 0) + hints.length - 1;
        const slack = line.cells.length - minRequiredLength;
        const numKnown = line.cells.reduce((sum, x) => sum + (x == CellKnowledge.UNKNOWN ? 0 : 1));
        
        if (minRequiredLength == 0) {
            return Number.MAX_VALUE;
        }

        return numKnown - slack;
    };

    /**
     * Comparator for lines.
     * 
     * @param {LineId} a 
     * @param {LineId} b 
     * @returns number
     */
    const lineComp = (a, b) => lineSortKey(b) - lineSortKey(a);

    lines.sort(lineComp);

    /* Deduce lines */
    for (const lineId of lines) {
        const newKnowledge = deduceLine(state, lineId);

        if (newKnowledge.status == DeductionStatus.WAS_IMPOSSIBLE) {
            return SingleDeductionResult.impossible();
        }

        const solved = newKnowledge.status == DeductionStatus.WAS_SOLVED;
        const deductionMade = newKnowledge.status == DeductionStatus.DEDUCTION_MADE;
        allLinesSolved = allLinesSolved && solved;

        if (!deductionMade) {
            continue;
        }

        return new SingleDeductionResult(DeductionStatus.DEDUCTION_MADE, lineId, newKnowledge.newKnowledge);
    }

    /* Nothing was deducible */
    if (allLinesSolved) {
        return new SingleDeductionResult(DeductionStatus.WAS_SOLVED, null, null);
    } else {
        return new SingleDeductionResult(DeductionStatus.COULD_NOT_DEDUCE, null, null);
    }
}

/**
 * Performs a single line deduction.
 * 
 * @param {NonogramState} state 
 * @param {LineId} lineId 
 */
function deduceLine(state, lineId) {
    const curKnowledge = (lineId.lineType == LineType.ROW) ? 
        state.getRowKnowledge(lineId.index) : 
        state.getColKnowledge(lineId.index);

    const hints = (lineId.lineType == LineType.ROW) ? 
        state.rowHints[lineId.index] : 
        state.colHints[lineId.index];
    
    return overlapLineDeduction(curKnowledge, hints);
}

class LineDeductionResult {

    /** @type {DeductionStatus} */
    status;

    /** @type {LineKnowledge | null} */
    newKnowledge;

    /**
     * @param {DeductionStatus} status 
     * @param {LineKnowledge | null} newKnowledge 
     */
    constructor (status, newKnowledge) {
        this.status = status;
        this.newKnowledge = newKnowledge;
    }
}

/**
 * 
 * 
 * @param {LineKnowledge} lineKnowledge 
 * @param {Array<number>} hints
 * @returns {LineDeductionResult}
 */
function overlapLineDeduction(lineKnowledge, hints) {
    /* Create new line knowledge */
    const lineLength = lineKnowledge.cells.length;
    const newKnowledge = new LineKnowledge(Array(lineLength).fill(CellKnowledge.DEFINITELY_WHITE));

    /* Check each hint */
    for (let k = 0; k < hints.length; k++) {
        const hint = hints[k];
        let minLeft = hints.slice(0, k).reduce((a, b) => a + b, 0) + k;
        let maxRight = lineLength - hints.slice(k + 1).reduce((a, b) => a + b, 0) - (hints.length - k - 1);

        /* Move hint between its minimum and maximum position */
        const maxLeft = maxRight - hint;
        let maxValidLeft = -Number.MAX_VALUE;
        let minValidRight = Number.MAX_VALUE;
        for (let x = minLeft; x <= maxLeft; x++) {
            /* Check hint validity */
            let valid = true;

            /* Create new simulated cell knowledge */
            const simulatedKnowledge = new LineKnowledge([...lineKnowledge.cells]);
            
            const whiteLeft = k == 0 ? 0 : Math.max(0, x - 1);
            for (let j = x - 1; j >= whiteLeft; j--) {
                if (simulatedKnowledge.cells[j] == CellKnowledge.DEFINITELY_BLACK) {
                    valid = false;
                }

                simulatedKnowledge.cells[j] = CellKnowledge.DEFINITELY_WHITE;
            }

            /* Place black squares */
            for (let j = x; j < x + hint; j++) {
                if (simulatedKnowledge.cells[j] == CellKnowledge.DEFINITELY_WHITE) {
                    valid = false;
                }

                simulatedKnowledge.cells[j] = CellKnowledge.DEFINITELY_BLACK;
            }

            /* Place white square right of hint */
            if (x + hint < lineLength) {
                if (simulatedKnowledge.cells[x + hint] == CellKnowledge.DEFINITELY_BLACK) {
                    valid = false;
                }

                simulatedKnowledge.cells[x + hint] = CellKnowledge.DEFINITELY_WHITE;
            }

            /* Final validation by trying to place hints */
            if (valid) {
                valid = valid && canHintsBePlaced(simulatedKnowledge, hints);
            }

            /* Skip this position if invalid */
            if (!valid) {
                continue;
            }

            /* This position is valid */
            maxValidLeft = Math.max(maxValidLeft, x);
            minValidRight = Math.min(minValidRight, x + hint);
        }

        /* If no valid position, then there is a contradiction */
        if (maxValidLeft == Number.MIN_VALUE) {
            return new LineDeductionResult(DeductionStatus.WAS_IMPOSSIBLE, null);
        }

        /* Cells inside the overlap are definitely black. Cells inside valid area, but outside of overlap are unknown */
        for (let i = minValidRight - hint; i < maxValidLeft + hint; i++) {
            const insideOverlap = i >= maxValidLeft && i < minValidRight;
            newKnowledge.cells[i] = insideOverlap ? CellKnowledge.DEFINITELY_BLACK : lineKnowledge.cells[i];
        }
    }

    /* Check if anything changed */
    let anythingChanged = false;
    let anythingUnknown = false;

    for (let i = 0; i < lineLength; i++) {
        anythingUnknown = anythingUnknown || newKnowledge.cells[i] == CellKnowledge.UNKNOWN;
        anythingChanged = anythingChanged || newKnowledge.cells[i] != lineKnowledge.cells[i];
    }

    /* Return result */
    if (!anythingChanged && !anythingUnknown) {
        return new LineDeductionResult(DeductionStatus.WAS_SOLVED, newKnowledge);
    } else if (!anythingChanged) {
        return new LineDeductionResult(DeductionStatus.COULD_NOT_DEDUCE, newKnowledge);
    } else {
        return new LineDeductionResult(DeductionStatus.DEDUCTION_MADE, newKnowledge);
    }
}

/**
 * Checks if the given hints can still be placed onto the given line.
 * 
 * @param {LineKnowledge} lineKnowledge 
 * @param {Array<number>} hints
 * @returns {boolean} 
 */
function canHintsBePlaced(lineKnowledge, hints) {
    /* No hints => No black squares must exist */
    if (hints.length == 0) {
        return !lineKnowledge.cells.some(cell => cell == CellKnowledge.DEFINITELY_BLACK);
    }

    /* Place first hint, then recurse */
    const lineLength = lineKnowledge.cells.length;
    const hintSum = hints.reduce((a, b) => a + b, 0);

    if (hintSum + hints.length - 1 > lineLength) {
        return false;
    }

    const maxPos = lineLength - hintSum - hints.length + 1;

    for (let i = 0; i <= maxPos; i++) {
        const endIdx = i + hints[0];

        /* Check if placement is valid */
        let placementValid = true;

        /* Everything left from the hint must be white */
        for (let j = 0; j < i; j++) {
            if (lineKnowledge.cells[j] == CellKnowledge.DEFINITELY_BLACK) {
                placementValid = false;
                break;
            }
        }

        /* Inside hint everything must be black-able */
        for (let j = i; j < endIdx; j++) {
            if (j >= lineLength) {
                placementValid = false;
                break;
            }

            if (lineKnowledge.cells[j] == CellKnowledge.DEFINITELY_WHITE) {
                placementValid = false;
                break;
            }
        }

        /* One next to the hint must be white */
        if (endIdx < lineLength && lineKnowledge.cells[endIdx] == CellKnowledge.DEFINITELY_BLACK) {
            placementValid = false;
        }

        /* Skip invalid placements */
        if (!placementValid) {
            continue;
        }

        /* Recurse */
        const remainingKnowledge = new LineKnowledge(lineKnowledge.cells.slice(endIdx + 1));
        const remainingHints = hints.slice(1);
        if (canHintsBePlaced(remainingKnowledge, remainingHints)) {
            return true;
        }
    }

    return false;
}

/**
 * This function checks all possible configurations of the line. It skips configurations that are impossible w.r.t.
 * the given line knowledge.
 * Squares that are always black in all remaining configurations are deduced as black, vice versa for white. The
 * function returns the new deduced line knowledge, or null if the current line state is impossible.
 * 
 * @param {LineKnowledge} lineKnowledge 
 * @param {Array<number>} hints
 * @returns {LineDeductionResult}
 */
function bruteForceLineDeduction(lineKnowledge, hints) {
    const lineLength = lineKnowledge.cells.length;

    /*
     * For every valid configuration, the relevant item in this array will be OR-ed with 1 (0b01, black) or 
     * (0b10, white). That way, cells that were always white will have a value of 2, cells that were always black a
     * value of 1 and cells that were both in some combination a value of 3.
     */
    const newDeducedState = Array(lineLength).fill(0);

    /** @type {Array<number>} */ 
    let gaps = [];

    do {
        const configurationComplete = gaps.length == hints.length;
        const gapsValid = checkGapValidity(lineKnowledge, hints, gaps);

        /* If configuration is complete and valid: Write into new deduced state */
        if (configurationComplete && gapsValid) {
            traverseConfiguration(gaps, hints, lineLength, (idx, knowledge) => {
                if (knowledge == CellKnowledge.UNKNOWN) {
                    throw new Error("Configuration was complete, unknown is impossible.");
                }

                newDeducedState[idx] |= knowledge == CellKnowledge.DEFINITELY_BLACK ? 1 : 2;
            });
        }

        nextConfiguration(hints, gaps, lineLength, gapsValid);
    } while (gaps.length > 0);

    /* Check if line is impossible */
    if (newDeducedState[0] == 0) {
        return new LineDeductionResult(DeductionStatus.WAS_IMPOSSIBLE, null);
    }

    /* Create new line knowledge */
    const cells = [];
    for (let i = 0; i < lineLength; i++) {
        let knowledge;
        switch (newDeducedState[i]) {
            case 1: knowledge = CellKnowledge.DEFINITELY_BLACK; break;
            case 2: knowledge = CellKnowledge.DEFINITELY_WHITE; break;
            case 3: knowledge = CellKnowledge.UNKNOWN; break;
            default: throw new Error("Deduced state was: " + newDeducedState[i]);
        }

        cells.push(knowledge);
    }

    const newKnowledge = new LineKnowledge(cells);
    const deductionMade = !arraysEqual(newKnowledge.cells, lineKnowledge.cells);
    const isSolved = !newKnowledge.cells.some(cell => cell == CellKnowledge.UNKNOWN);

    let status;
    if (deductionMade) {
        status = DeductionStatus.DEDUCTION_MADE;
    } else if (isSolved) {
        status = DeductionStatus.WAS_SOLVED;
    } else {
        status = DeductionStatus.COULD_NOT_DEDUCE;
    }

    /* Done */
    return new LineDeductionResult(status, newKnowledge);
}

/**
 * Modifies the given gaps array to represent the next configuration to attempt.
 * 
 * @param {Array<number>} hints 
 * @param {Array<number>} gaps 
 * @param {number} lineLength
 * @param {boolean} wasValid
 */
function nextConfiguration(hints, gaps, lineLength, wasValid) {
    const hintSum = hints.reduce((a, b) => a + b, 0);

    /* If gaps are missing, simply add the next smallest gap */
    if (wasValid && gaps.length < hints.length) {
        const minGap = gaps.length == 0 ? 0 : 1;
        gaps.push(minGap);
        return;
    }

    /* Increment last gap, remove if it exceeds its maximum. Do this "recursively" */
    while (gaps.length > 0) {
        const gapSum = gaps.reduce((a, b) => a + b, 0);
        const remainingGaps = hints.length - gaps.length;

        const lastGap = gaps[gaps.length - 1];
        const maxLastGap = lineLength - hintSum - (gapSum - lastGap) - remainingGaps;

        /* If maximum was not reached: Simply increment gap */
        if (lastGap < maxLastGap) {
            gaps[gaps.length - 1] += 1;
            break;
        }

        /* Pop and increment predecessor in the next loop iteration */
        gaps.pop();
    }
}

/**
 * Checks if the configuration described by the given gaps (which are applied before each hint) is compatible with the
 * given line knowledge.
 * 
 * @param {LineKnowledge} lineKnowledge 
 * @param {Array<number>} hints 
 * @param {Array<number>} gaps
 * @returns {boolean}
 */
function checkGapValidity(lineKnowledge, hints, gaps) {
    const lineLength = lineKnowledge.cells.length;
    let valid = true;
    
    traverseConfiguration(gaps, hints, lineLength, (idx, knowledge) => {
        const curKnowledge = lineKnowledge.cells[idx];
        
        if (curKnowledge == CellKnowledge.DEFINITELY_BLACK && knowledge == CellKnowledge.DEFINITELY_WHITE) {
            valid = false;
        }

        if (curKnowledge == CellKnowledge.DEFINITELY_WHITE && knowledge == CellKnowledge.DEFINITELY_BLACK) {
            valid = false;
        }
    });

    return valid;
}

/**
 * Given a configuration of gaps and hints, performs the function fn on each cell of the line. The function gets the
 * information whether the cell is black, white or undetermined in this configuration.
 * 
 * @param {Array<number>} gaps 
 * @param {Array<number>} hints 
 * @param {number} lineLength 
 * @param {(index: number, knowledge: CellKnowledge) => void} fn 
 */
function traverseConfiguration(gaps, hints, lineLength, fn) {
    /* Preconditions */
    if (gaps.length > hints.length) {
        throw new Error("There can be at most as many gaps as there are hints. The final gap is deduced.");
    }

    if (gaps.reduce((a, b) => a + b, 0) + hints.reduce((a, b) => a + b, 0) > lineLength) {
        throw new Error("Sum of gaps and hints exceed line length");
    }

    for (let i = 0; i < gaps.length; i++) {
        const minGap = (i == 0) ? 0 : 1;
        if (gaps[i] < minGap) {
            throw new Error("Gap is too small!");
        }
    }

    /* Special case: Empty line */
    if (hints.length == 0) {
        for (let i = 0; i < lineLength; i++) {
            fn(i, CellKnowledge.DEFINITELY_WHITE);
        }

        return;
    }

    /* Special case: No gaps yet, everything is possible. */
    if (gaps.length == 0) {
        for (let i = 0; i < lineLength; i++) {
            fn(i, CellKnowledge.UNKNOWN);
        }

        return;
    }

    /* Default case: Iterate over gaps and hints */
    let curIdx = 0;
    for (let i = 0; i < gaps.length; i++) {
        const curGap = gaps[i];
        const curHint = hints[i];

        /* Gap */
        for (let j = 0; j < curGap; j++) {
            fn(curIdx, CellKnowledge.DEFINITELY_WHITE)
            curIdx += 1;
        }

        /* Hint */
        for (let j = 0; j < curHint; j++) {
            fn(curIdx, CellKnowledge.DEFINITELY_BLACK)
            curIdx += 1;
        }
    }

    /* After the last hint there must be a gap */
    if (curIdx < lineLength) {
        fn(curIdx, CellKnowledge.DEFINITELY_WHITE);
        curIdx += 1;
    }

    /* If the line is fully determined, all remaining squares are white */
    while (curIdx < lineLength) {
        fn(curIdx, gaps.length == hints.length ? CellKnowledge.DEFINITELY_WHITE : CellKnowledge.UNKNOWN);
        curIdx += 1;
    }
}