import template from "./delete-account-entry.html"
import "./delete-account-entry.css"
import { htmlToElement } from "../../../loader";

export default class DeleteAccountEntry
{
    #view: HTMLElement;

    constructor(
        username: string,
        deleteActiveAccount: () => void
    ) {
        this.#view = htmlToElement(template.replace("$username", username));
        const button = this.#view.querySelector("#btn-delete-account") as HTMLButtonElement;
        const textField = this.#view.querySelector("#input-username-delete-account") as HTMLInputElement;

        button.disabled = textField.value !== username;
        textField.oninput = () => {
            button.disabled = textField.value !== username;
        }

        button.onclick = () => deleteActiveAccount();
    }

    get view() {
        return this.#view;
    }
}