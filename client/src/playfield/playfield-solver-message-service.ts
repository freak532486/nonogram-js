import { DeductionStatus, FullDeductionResult, LineId, SingleDeductionResult } from "../common/nonogram-types";
import { PlayfieldComponent } from "./playfield.component";

export default class PlayfieldSolverMessageService
{
    constructor(
        private readonly playfield: PlayfieldComponent
    ) {}

    /**
     * Displays the hint message that the user can make a deduction in the given line.
     */
    displayHintMessage(hint: LineId) {
        this.playfield.showMessage("You can make a deduction in " + hint + ".");
    }

    /**
     * Displays an appropriate message for a line deduction.
     */
    displayLineDeductionMessage(deduction: SingleDeductionResult) {
        if (deduction.status == DeductionStatus.DEDUCTION_MADE) {
            this.playfield.showMessage("A deduction was made in " + deduction.lineId + ".");
        } else {
            this.playfield.showMessage(getTextForStatus(deduction.status));
        }
    }

    /**
     * Dsiplays an appropriate message for a full deduction.
     */
    displayFullDeductionMessage(deduction: FullDeductionResult) {
        this.playfield.showMessage(getTextForStatus(deduction.status));
    }
}

/**
 * Returns an appropriate status text for the given deduction status.
 */
function getTextForStatus(status: DeductionStatus): string {
    switch (status) {
        case DeductionStatus.COULD_NOT_DEDUCE: return "Solver could not make a deduction.";
        case DeductionStatus.DEDUCTION_MADE: return "A deduction was made.";
        case DeductionStatus.WAS_IMPOSSIBLE: return "Puzzle is impossible.";
        case DeductionStatus.WAS_SOLVED: return "Puzzle is solved.";
        case DeductionStatus.TIMEOUT: return "Solver timeout.";
    }

    throw new Error("Unknown status: " + status);
}