import template from "./registration-confirmation.html"
import "./registration-confirmation.css"
import "../../../common/styles/boxes.css"
import { htmlToElement } from "../../../loader";

export default class RegistrationConfirmationComponent
{
    #view: HTMLElement;

    constructor() {
        this.#view = htmlToElement(template);
    }

    init(parent: HTMLElement) {
        parent.appendChild(this.#view);
    }

    setTitle(title: string) {
        const headerElem = this.#view.querySelector(".box-header") as HTMLElement;
        headerElem.textContent = title;
    }

    setMessage(msg: string) {
        const msgElem = this.#view.querySelector(".box-content .message") as HTMLElement;
        msgElem.textContent = msg;
    }
}