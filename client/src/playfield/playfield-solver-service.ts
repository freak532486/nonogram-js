import { CellKnowledge, DeductionStatus, FullDeductionResult, LineId, LineType, NonogramState, SingleDeductionResult } from "../common/nonogram-types";
import { PlayfieldComponent } from "./playfield.component";
import * as solver from "../solver"
import { BoardComponentFullState } from "./nonogram-board/nonogram-board.component";
import PlayfieldSolverMessageService from "./playfield-solver-message-service";

export default class PlayfieldSolverService
{
    #solverMessageService: PlayfieldSolverMessageService;

    constructor(
        private playfield: PlayfieldComponent
    ) {
        this.#solverMessageService = new PlayfieldSolverMessageService(playfield);
    }

    /**
     * Shows a hint to the user where they could progress.
     */
    hint()
    {
        const deduction = solver.deduceNext(this.#extractSolverState());
        if (deduction.status == DeductionStatus.DEDUCTION_MADE) {
            this.#solverMessageService.displayHintMessage(deduction.lineId!);
        }
    }

    /**
     * Performs a single deduction and applies the result (if applicable).
     */
    solveNext()
    {
        const deduction = solver.deduceNext(this.#extractSolverState());
        this.#solverMessageService.displayLineDeductionMessage(deduction);
        if (deduction.status !== DeductionStatus.DEDUCTION_MADE) {
            return deduction;
        }

        const curState = this.playfield.currentState;
        const newCells = [...curState.cells];
        applyDeduction(deduction, newCells, this.playfield.width);
        this.playfield.updateState(newCells, false);
        return deduction;
    }

    /**
     * Performs a full solve of the nonogram board, applies it and returns the deduction.
     */
    solveFull(): FullDeductionResult
    {
        const deduction = solver.deduceAll(this.#extractSolverState());
        this.#solverMessageService.displayFullDeductionMessage(deduction);
        this.playfield.updateState(deduction.newState.getCellStates(), false);
        return deduction;
    }

    #extractSolverState(): NonogramState {
        const activeState = [...this.playfield.currentState.cells];

        return new NonogramState(
            this.playfield.rowHints,
            this.playfield.colHints,
            activeState
        );
    }

}

/**
 * Applies the given deduction to the given cell states. This function mutates the given array!
 */
function applyDeduction(
    deduction: SingleDeductionResult,
    cells: Array<CellKnowledge>,
    width: number
)
{
    const isRow = deduction.lineId.lineType == LineType.ROW;
    const height = cells.length / width;
    const lineLength = isRow ? width : height;

    for (let i = 0; i < lineLength; i++) {
        const x = isRow ? i : deduction.lineId.index;
        const y = isRow ? deduction.lineId.index : i;
        const idx = x + y * width;

        cells[idx] = deduction.newKnowledge.cells[i];
    }
}