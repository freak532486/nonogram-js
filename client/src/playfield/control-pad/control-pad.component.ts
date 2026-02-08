import { htmlToElement } from "../../loader.js";

import controlPad from "./control-pad.html"
import "./control-pad.css"

export enum ControlPadButton {
    LEFT, UP, RIGHT, DOWN, WHITE, BLACK, ERASE, UNDO, REDO
};

export class ControlPad {
    #view: HTMLElement | undefined;

    /**
     * Creates and attaches this control pad.
     */
    async init(parent: HTMLElement) {
        this.#view = htmlToElement(controlPad);
        parent.appendChild(this.#view);

        /* Checking behaviour for black and white button */
        const btnBlack = this.getButton(ControlPadButton.BLACK);
        this.setBlackChecked(false);
        btnBlack.addEventListener("click", ev => {
            if (ev.button != 0) {
                return;
            }

            this.setBlackChecked(this.isBlackChecked() ? false : true);
        })
        
        const btnWhite = this.getButton(ControlPadButton.WHITE);
        this.setWhiteChecked(false);
        btnWhite.addEventListener("click", ev => {
            if (ev.button != 0) {
                return;
            }

            this.setWhiteChecked(this.isWhiteChecked() ? false : true);
        })
    }

    get view(): HTMLElement {
        if (!this.#view) {
            throw new Error("init() was not called");
        }

        return this.#view;
    }

    /**
     * Sets the callback function for a button.
     */
    setButtonFunction(button: ControlPadButton, fn: () => void) {
        this.getButton(button).onmouseup = ev => {
            if (ev.button == 0) {
                fn();
            }
        }
    }

     /**
     * Returns the element for the given button.
     */
    getButton(button: ControlPadButton): HTMLInputElement {
        let buttonId = null;

        switch (button) {
            case ControlPadButton.LEFT: buttonId = "control-left"; break;
            case ControlPadButton.UP: buttonId = "control-up"; break;
            case ControlPadButton.DOWN: buttonId = "control-down"; break;
            case ControlPadButton.RIGHT: buttonId = "control-right"; break;
            case ControlPadButton.BLACK: buttonId = "control-black"; break;
            case ControlPadButton.WHITE: buttonId = "control-white"; break;
            case ControlPadButton.ERASE: buttonId = "control-erase"; break;
            case ControlPadButton.UNDO: buttonId = "control-undo"; break;
            case ControlPadButton.REDO: buttonId = "control-redo"; break;
        }

        if (!buttonId) {
            throw new Error("Unknown button: " + button);
        }

        return this.view.querySelector("#" + buttonId) as HTMLInputElement;
    }

    isWhiteChecked(): boolean {
        const btnWhite = this.getButton(ControlPadButton.WHITE);
        return btnWhite.getAttribute("data-checked") == "true";
    }

    setWhiteChecked(checked: boolean) {
        const btnWhite = this.getButton(ControlPadButton.WHITE);
        btnWhite.setAttribute("data-checked", checked ? "true" : "false");

        if (checked && this.isBlackChecked()) {
            this.setBlackChecked(false);
        }
    }

    isBlackChecked(): boolean {
        const btnBlack = this.getButton(ControlPadButton.BLACK);
        return btnBlack.getAttribute("data-checked") == "true";
    }

    setBlackChecked(checked: boolean) {
        const btnBlack = this.getButton(ControlPadButton.BLACK);
        btnBlack.setAttribute("data-checked", checked ? "true" : "false");

        if (checked && this.isWhiteChecked()) {
            this.setWhiteChecked(false);
        }
    }
}