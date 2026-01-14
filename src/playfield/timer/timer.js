import timer from "./timer.html"
import "./timer.css"
import { loadHtml } from "../../loader.js";

export class Timer {

    #view = /** @type {HTMLElement | null} */ (null);

    #startTimestamp = 0;
    #curElapsed = 0;

    #paused = false;

    /**
     * Creates a new timer component. Can be started with some already-elapsed time if desired.
     * 
     * @param {number} elapsedSeconds 
     */
    constructor(elapsedSeconds = 0) {
        this.restart(elapsedSeconds);
    }

    /**
     * Initialized and attaches this component
     * 
     * @param {HTMLElement} parent 
     */
    async init(parent) {
        this.#view = await loadHtml(timer);
        parent.appendChild(this.view);

        this.#updateDisplayedTime();

        /* Start animation for timer */
        const anim = () => {
            if (this.#paused) {
                requestAnimationFrame(anim);
                return;
            }

            const elapsed = Math.floor((Date.now() - this.#startTimestamp) / 1000);
            if (elapsed == this.#curElapsed) {
                requestAnimationFrame(anim);
                return;
            }

            this.#curElapsed = elapsed;
            this.#updateDisplayedTime();
            requestAnimationFrame(anim);
        };

        requestAnimationFrame(anim);
    }

    /** @returns {HTMLElement} */
    get view() {
        if (!this.#view) {
            throw new Error("init() has not been called");
        }

        return this.#view;
    }

    /**
     * Returns the currently elapsed time on the timer in seconds.
     * 
     * @returns {number}
     */
    getCurrentElapsedTime() {
        return this.#curElapsed;
    }

    /**
     * Returns the currently elapsed time on the time as a string "HH:MM:SS".
     * 
     * @returns {string}
     */
    getElapsedTimeAsString() {
        return getTimeString(this.#curElapsed);
    }

    /**
     * Returns true if the timer is currently paused.
     * 
     * @returns {boolean}
     */
    get paused() {
        return this.#paused;
    }

    /**
     * Pauses or unpauses the timer.
     * 
     * @param {boolean} value 
     */
    set paused(value) {
        this.#paused = value;
    }

    /**
     * Restarts the timer. This does not unpause the timer!
     * 
     * @param {number} startElapsed
     */
    restart(startElapsed = 0) {
        this.#startTimestamp = Date.now() - startElapsed * 1000;
        this.#curElapsed = startElapsed;
        this.#updateDisplayedTime();
    }

    #updateDisplayedTime() {
        const timeSpan = /** @type {HTMLElement} */ (this.view.querySelector(".time"));
        timeSpan.textContent = getTimeString(this.#curElapsed);
    }

}

/**
 * @param {number} elapsedSeconds 
 * @returns {string}
 */
function getTimeString(elapsedSeconds) {
    const seconds = Math.floor(elapsedSeconds % 60);
    const minutes = Math.floor(((elapsedSeconds - seconds) / 60)) % 60;
    const hours = Math.floor((elapsedSeconds - seconds - 60 * minutes) / (60 * 60));

    if (hours == 0) {
        return withLeadingZero(minutes) + ":" + withLeadingZero(seconds);
    } else {
        return withLeadingZero(hours) + ":" + withLeadingZero(minutes) + ":" + withLeadingZero(seconds);
    }
}

/**
 * @param {number} n 
 * @returns {string}
 */
function withLeadingZero(n) {
    return n < 10 ? "0" + n : String(n);
}