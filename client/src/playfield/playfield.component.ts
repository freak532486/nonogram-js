import { CellKnowledge, LineId, LineKnowledge, LineType, NonogramState } from "../common/nonogram-types.js";
import { Point } from "../common/point.js";
import { htmlToElement } from "../loader.js";
import { checkHints, HintCheckResult, isSolved } from "../solver.js";
import { ControlPad, ControlPadButton } from "./control-pad/control-pad.component.js";
import { MessageBox } from "./message-box/message-box.component.js";
import { BoardComponentFullState, NonogramBoardComponent } from "./nonogram-board/nonogram-board.component.js";
import { ZoomWindow } from "./zoom-window/zoom-window.component.js";
import playfield from "./playfield.html"
import "./playfield.css"
import { LineIdSet } from "../common/line-id-set.js";
import { Timer } from "./timer/timer.js";
import PlayfieldSolverService from "./playfield-solver-service.js";
import { PlayfieldLineHandler } from "./playfield-line-handler.js";

export class PlayfieldComponent {

    #nonogramId: string;
    #view: HTMLElement | undefined;
    #nonogramBoard: NonogramBoardComponent;

    #timer: Timer = new Timer();
    #messageBox: MessageBox = new MessageBox();
    #controlPad: ControlPad | undefined;

    #lineHandler = new PlayfieldLineHandler();

    #stateHistory: Array<BoardComponentFullState> = [];
    #activeStateIdx: number = 0;

    #hasWon: boolean = false;

    #solverService: PlayfieldSolverService;

    #onStateChanged: () => void = () => {};

    /**
     * Constructs a playfield for the given nonogram. Call init() before using!
     */
    constructor (
        nonogramId: string,
        rowHints: Array<Array<number>>,
        colHints: Array<Array<number>>,
        initialState: Array<number> | undefined,
        initialElapsedTime: number | undefined
    )
    {
        this.#nonogramId = nonogramId;
        this.#nonogramBoard = new NonogramBoardComponent(rowHints, colHints);
        this.#solverService = new PlayfieldSolverService(this);

        /* Apply stored state if exists */
        if (initialState) {
            this.#nonogramBoard.applyState(new BoardComponentFullState(
                initialState,
                Array(this.#nonogramBoard.height).fill(null).map(() => []),
                Array(this.#nonogramBoard.width).fill(null).map(() => []),
                []
            ));
        }

        if (initialElapsedTime) {
            this.#timer.elapsed = initialElapsedTime;
        }

        /* Prepare history */
        this.#stateHistory.push(this.#nonogramBoard.getFullState());

        /* Recheck hints */
        const emptyState = Array(this.#nonogramBoard.width * this.#nonogramBoard.height).fill(CellKnowledge.UNKNOWN);
        this.#recheckLineHints(emptyState, false); // No win message if board was already solved
    }

    /**
     * Initializes this component and attaches it to the parent.
     */
    async init(parent: HTMLElement) {
        /* Create view */
        this.#view = htmlToElement(playfield);
        parent.appendChild(this.#view);

        /* Create timer */
        await this.#timer.init(this.view);

        /* Create control pad */
        const footer = this.view.querySelector("#footer") as HTMLElement;
        const controlPad = new ControlPad();
        await controlPad.init(footer);

        controlPad.setButtonFunction(ControlPadButton.LEFT, () => this.#moveSelectionAndSet(-1, 0));
        controlPad.setButtonFunction(ControlPadButton.UP, () => this.#moveSelectionAndSet(0, -1));
        controlPad.setButtonFunction(ControlPadButton.RIGHT, () => this.#moveSelectionAndSet(1, 0));
        controlPad.setButtonFunction(ControlPadButton.DOWN, () => this.#moveSelectionAndSet(0, 1));
        controlPad.setButtonFunction(ControlPadButton.ERASE, () => {
            const x = this.#nonogramBoard.selection.x;
            const y = this.#nonogramBoard.selection.y;
            const curState = this.#nonogramBoard.getFullState().cells;

            if (this.#nonogramBoard.getCellState(x, y) == CellKnowledge.UNKNOWN) {
                return;
            }
            
            this.#nonogramBoard.setCellState(x, y, CellKnowledge.UNKNOWN);
            this.#recheckLineHints(curState, true);
            this.#updateHistory();
        })

        controlPad.setButtonFunction(ControlPadButton.BLACK, () => {
                const p = this.#nonogramBoard.selection;
                if (!controlPad.isBlackChecked()) {
                    this.#lineHandler.startLine(p, CellKnowledge.DEFINITELY_BLACK);
                    this.#setLineEndPosition(p);
                } else if (this.#lineHandler.lineStarted()) {
                    this.#applyLine();
                }
        });
        controlPad.setButtonFunction(ControlPadButton.WHITE, () => { 
                const p = this.#nonogramBoard.selection;
                if (!controlPad.isWhiteChecked()) {
                    this.#lineHandler.startLine(p, CellKnowledge.DEFINITELY_WHITE);
                    this.#setLineEndPosition(p);
                } else if (this.#lineHandler.lineStarted()) {
                    this.#applyLine();
                }
        });

        this.#controlPad = controlPad;

        /* Create zoomable window */
        const nonogramRoot = this.#view.querySelector("#nonogram-root") as HTMLElement;
        const zoomWindow = new ZoomWindow(this.#nonogramBoard.view, nonogramRoot);
        this.#nonogramBoard.init(zoomWindow.view);

        const undoButton = controlPad.getButton(ControlPadButton.UNDO);
        const redoButton = controlPad.getButton(ControlPadButton.REDO);

        undoButton.style.visibility = "hidden";
        redoButton.style.visibility = "hidden";

        /* Create message box */
        await this.#messageBox.init(zoomWindow.view);

        /* Undo and redo */
        undoButton.onclick = () => {
            if (this.#activeStateIdx == 0) {
                undoButton.style.visibility = "hidden";
                return;
            }

            this.#activeStateIdx -= 1;
            this.#nonogramBoard.applyState(this.#stateHistory[this.#activeStateIdx]);
            undoButton.style.visibility = (this.#activeStateIdx == 0) ? "hidden" : "visible";
            redoButton.style.visibility = "visible";
        };

        redoButton.onclick = () => {
            if (this.#activeStateIdx == this.#stateHistory.length - 1) {
                return;
            }

            this.#activeStateIdx += 1;
            this.#nonogramBoard.applyState(this.#stateHistory[this.#activeStateIdx]);
            undoButton.style.visibility = "visible";
            redoButton.style.visibility = (this.#activeStateIdx == this.#stateHistory.length - 1) ? "hidden" : "visible";
        };
    }

    #applyLine() {
        /* Nothing to do if there is no line */
        if (!this.#lineHandler.lineStarted()) {
            return;
        }

        /* Remember already checked lines */
        const width = this.#nonogramBoard.width;
        const curState = this.#nonogramBoard.getFullState().cells;
        const newState = [...curState];

        const line = this.#lineHandler.getCurrentLine();
        for (const p of line.points) {
            newState[p.x + p.y * width] =  line.type;
        }

        /* Perform checks */
        this.#nonogramBoard.applyState(new BoardComponentFullState(
            newState,
            this.#nonogramBoard.getFullState().finishedRowHints,
            this.#nonogramBoard.getFullState().finishedColHints,
            this.#nonogramBoard.getFullState().errorLines
        ));
        this.#recheckLineHints(curState, true);

        /* Update history and clear line */
        this.#updateHistory();

        this.#lineHandler.clearLine();
        this.#nonogramBoard.clearLinePreview();
    }

    #setLineEndPosition(p: Point) {
        /* Update line handler */
        const lineBroken = this.#lineHandler.setEndPosition(p);

        /* Stop drawing on line break */
        if (lineBroken) {
            this.#controlPad?.setWhiteChecked(false);
            this.#controlPad?.setBlackChecked(false);
            this.#nonogramBoard.clearLinePreview();
            this.#lineHandler.clearLine();
            return;
        }

        /* Draw preview */
        const curLine = this.#lineHandler.getCurrentLine();
        this.#nonogramBoard.updateLinePreview(curLine.points, curLine.type);
    }

    /**
     * Moves the selection on the nonogram board and extends the current line.
     */
    #moveSelectionAndSet(dx: number, dy: number) {
        this.#nonogramBoard.moveSelection(dx, dy);
        if (this.#lineHandler.lineStarted()) {
            this.#setLineEndPosition(this.#nonogramBoard.selection);
        }
    }

    #extractSolverState(): NonogramState {
        const activeState = [...this.#nonogramBoard.getFullState().cells];

        return new NonogramState(
            this.#nonogramBoard.rowHints,
            this.#nonogramBoard.colHints,
            activeState
        );
    }

    /**
     * Changes the state of the board to the given cell state.
     */
    updateState(cells: Array<CellKnowledge>, displayWinMessage: boolean) {
        if (cells.length !== this.width * this.height) {
            throw new Error("Cells do not match playfield size");
        }

        const oldState = this.currentState;
        this.#nonogramBoard.applyState(new BoardComponentFullState(
            cells,
            oldState.finishedRowHints,
            oldState.finishedColHints,
            oldState.errorLines
        ));

        this.#recheckLineHints(oldState.cells, displayWinMessage);
        this.#updateHistory();
    }

    /**
     * Resets the playfield, this clears all progress.
     */
    reset()
    {
        const emptyState = (BoardComponentFullState.empty(
            this.#nonogramBoard.width,
            this.#nonogramBoard.height
        ));

        this.#nonogramBoard.applyState(emptyState);
        this.#stateHistory = [emptyState];
        this.#activeStateIdx = 0;
        this.controlPad.getButton(ControlPadButton.UNDO).style.visibility = "hidden";
        this.controlPad.getButton(ControlPadButton.REDO).style.visibility = "hidden";
        this.#hasWon = false;
        this.#timer.paused = false;
        this.#timer.restart();
        this.#onStateChanged();
    }

    /**
     * Adds the current state of the board into the history.
     */
    #updateHistory() {
        const lastState = this.#stateHistory[this.#stateHistory.length - 1];
        const curState = this.#nonogramBoard.getFullState();

        if (lastState.equals(curState)) {
            return; // Nothing to do
        }

        this.#onStateChanged();

        const undoButton = this.controlPad.getButton(ControlPadButton.UNDO);
        const redoButton = this.controlPad.getButton(ControlPadButton.REDO);

        while (this.#stateHistory.length != this.#activeStateIdx + 1) {
            this.#stateHistory.pop();
        }

        this.#stateHistory.push(this.#nonogramBoard.getFullState());
        this.#activeStateIdx += 1;
        undoButton.style.visibility = "visible";
        redoButton.style.visibility = "hidden";
    }

    /**
     * Rechecks the line hints for all changed lines between the current state and the given previous state.
     */
    #recheckLineHints(prevState: Array<CellKnowledge>, displayWinMessage: boolean) {
        /* Placing crosses for hints can cause other deductions, so this happens in a loop */
        const LOOP_LIMIT = 50;

        let actualPrevState = prevState;
        for (let i = 0; i < LOOP_LIMIT; i++) {
            /* Compare with previous state and deduce all changed lines */
            const curState = this.#nonogramBoard.getFullState().cells;
            const changed = calcChangedLines(this.#nonogramBoard.width, this.#nonogramBoard.height, actualPrevState, curState);
            if (changed.size == 0) {
                this.#checkWin(displayWinMessage); // Crosses from line hints can cause a win.
                return;
            }

            for (const line of changed.asArray()) {
                const lineKnowledge = this.getLineKnowledge(line);
                const hints = this.getHints(line);
                this.#applyHintCheckDeduction(line, checkHints(lineKnowledge, hints));
            }

            /* Next comparison goes against the current state (after hint deduction) */
            actualPrevState = curState;
        }

        console.error("Canceled hint checking after " + LOOP_LIMIT + " iterations");
    }

    #checkWin(displayWinMessage: boolean) {
        /* Do not display win message twice */
        if (this.#hasWon) {
            return;
        }

        /* Check if the nonogram is solved */
        const curState = this.#extractSolverState();
        if (!isSolved(curState)) {
            return;
        }

        if (displayWinMessage) {
            alert("Congratulations! You solved the puzzle in " + this.#timer.getElapsedTimeAsString());
        }
        this.#hasWon = true;
        this.#timer.paused = true;
    }

    /**
     * Returns the current line knowledge of the given line.
     */
    getLineKnowledge(lineId: LineId): LineKnowledge {
        return this.#nonogramBoard.getLineState(lineId);
    }

    /**
     * Returns the hints for the given line.
     */
    getHints(lineId: LineId): Array<number> {
        const relevantHints = lineId.lineType == LineType.ROW ?
            this.#nonogramBoard.rowHints :
            this.#nonogramBoard.colHints;
        
        return relevantHints[lineId.index];
    }

    #applyHintCheckDeduction(lineId: LineId, deduction: HintCheckResult | undefined) {
        /* If no deduction possible, mark an error for this line */
        if (!deduction) {
            this.#nonogramBoard.markError(lineId, true);
            return;
        }

        /* Update finished hints and apply new knowledge */
        this.#nonogramBoard.markError(lineId, false);
        this.#nonogramBoard.updateFinishedHints(lineId, deduction.finishedHints);
        this.#nonogramBoard.applyLineKnowledge(lineId, deduction.newKnowledge);
    }

    get nonogramId(): string {
        return this.#nonogramId;
    }

    get view(): HTMLElement {
        if (this.#view == null) {
            throw new Error("init() was not called");
        }

        return this.#view;
    }

    get controlPad(): ControlPad {
        if (this.#controlPad == null) {
            throw new Error("init() was not called");
        }

        return this.#controlPad;
    }

    get width() {
        return this.#nonogramBoard.width;
    }

    get height() {
        return this.#nonogramBoard.height;
    }

    get currentState(): BoardComponentFullState {
        return this.#nonogramBoard.getFullState();
    }

    get elapsed(): number {
        return this.#timer.elapsed;
    }

    get rowHints(): Array<Array<number>> {
        return this.#nonogramBoard.rowHints;
    }

    get colHints(): Array<Array<number>> {
        return this.#nonogramBoard.colHints;
    }

    get hasWon(): boolean {
        return this.#hasWon;
    }

    /**
     * Returns a service for performing solving operations on this playfield.
     */
    get solverService(): PlayfieldSolverService
    {
        return this.#solverService;
    }

    /**
     * Displays a message.
     */
    showMessage(msg: string) {
        this.#messageBox.showMessage(msg);
    }

    /**
     * Sets the callback that is called when the state of the board changes.
     */
    set onStateChanged(fn: () => void) {
        this.#onStateChanged = fn;
    }

};

/**
 * Calculates which lines have changed between the two states.
 */
function calcChangedLines(
    width: number, 
    height: number,
    oldState: Array<CellKnowledge>,
    newState: Array<CellKnowledge>
): LineIdSet
{
    const ret = new LineIdSet();

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (oldState[x + y * width] !== newState[x + y * width]) {
                ret.add(new LineId(LineType.ROW, y));
                ret.add(new LineId(LineType.COLUMN, x));
            }
        }
    }

    return ret;
}