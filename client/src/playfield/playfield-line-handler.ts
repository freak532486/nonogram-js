import { CellKnowledge } from "../common/nonogram-types";
import { Point } from "../common/point";

interface LineData
{
    type: CellKnowledge,
    startPos: Point,
    endPos: Point
};

export class PlayfieldLineHandler
{

    #line: LineData | undefined;

    /**
     * Starts a new line. If a line has already been started, it will be canceled. 
     */
    startLine(pos: Point, color: CellKnowledge) {
        this.#line = {
            type: color,
            startPos: pos,
            endPos: pos
        };
    }

    /**
     * Sets the new end position of the line. If the given position does not fit into a horizontal/vertical line with
     * the start position, returns 'false'.
     */
    setEndPosition(pos: Point): boolean {
        if (!this.#line) {
            return false;
        }

        this.#line.endPos = pos;
        return pos.x !== this.#line.startPos.x && pos.y !== this.#line.startPos.y;
    }

    /**
     * Returns the current line as defined by the start and end points.
     */
    getCurrentLine() : { "type": CellKnowledge, "points": Array<Point> }
    {
        if (!this.#line) {
            return { "type": CellKnowledge.UNKNOWN, "points": [] };
        }

        /* Calculate points from start position and end position */
        const sx = this.#line.startPos.x;
        const sy = this.#line.startPos.y;
        const tx = this.#line.endPos.x;
        const ty = this.#line.endPos.y;

        const points = [];
        if (sx == tx) {
            for (let y = Math.min(sy, ty); y <= Math.max(sy, ty); y++) {
                points.push(new Point(sx, y));
            }
        } else if (sy == ty) {
            for (let x = Math.min(sx, tx); x <= Math.max(sx, tx); x++) {
                points.push(new Point(x, sy));
            }
        }

        /* Return line */
        return {
            type: this.#line.type,
            points: points
        };
    }

    /**
     * Clears the line.
     */
    clearLine() {
        this.#line = undefined;
    }

    /**
     * Returns true iff a line is started.
     */
    lineStarted(): boolean {
        return this.#line !== undefined;
    }

}