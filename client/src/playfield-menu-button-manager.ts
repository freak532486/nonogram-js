import { Menu } from "./menu/menu.component";
import * as solver from "./solver"

/**
 * Object that creates/destroys the menu buttons for the playfield.
 */
export default class PlayfieldMenuButtonManager {

    #buttonsAdded: boolean = false;

    constructor(
        private readonly menu: Menu,
        private readonly onHint: () => void,
        private readonly onSolveLine: () => void,
        private readonly onSolveFull: () => void,
        private readonly onReset: () => void,
        private readonly onExit: () => void
    ) {}

    createButtons()
    {
        /* Nothing to do if buttons already exist */
        if (this.#buttonsAdded) {
            return;
        }

        const menu = this.menu;

        /* Add hint button */
        const hintButton = document.createElement("button");
        hintButton.classList.add("entry", "playfield", "border-right", "border-top");
        hintButton.textContent = "Hint";
        hintButton.onclick = () => {
            menu.toggle();
            this.onHint();
        };
        menu.appendElement(hintButton);

        /* Add Solve Line button */
        const nextButton = document.createElement("button");
        nextButton.classList.add("entry", "playfield", "border-top");
        nextButton.textContent = "Deduce next";
        nextButton.onclick = () => {
            menu.toggle();
            this.onSolveLine();
        };
        menu.appendElement(nextButton);

        /* Add full solve button */
        const solveButton = document.createElement("button");
        solveButton.classList.add("entry", "playfield", "border-top", "border-right" );
        solveButton.textContent = "Solve";
        solveButton.onclick = () => {
            menu.toggle();
            this.onSolveFull();
        };
        menu.appendElement(solveButton);

        /* Add reset button */
        const resetButton = document.createElement("button");
        resetButton.classList.add("entry", "playfield", "border-top");
        resetButton.textContent = "Reset";
        resetButton.onclick = () => {
            menu.toggle();
            this.onReset();
        }
        menu.appendElement(resetButton);

        /* Add exit button */
        const exitButton = document.createElement("button");
        exitButton.classList.add("entry", "playfield", "border-top", "border-right");
        exitButton.textContent = "Exit";
        exitButton.style.gridColumn = "1 / 3";
        exitButton.style.color = "#ff3b3bff";
        exitButton.onclick = () => {
            menu.toggle();
            this.onExit();
        }

        menu.appendElement(exitButton);
    }

    removeButtons()
    {
        if (!this.#buttonsAdded) {
            return;
        }

        this.menu.removeElements("playfield");
    }

};