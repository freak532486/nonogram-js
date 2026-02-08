import template from "./savefile-merge-entry.html"
import "./savefile-merge-entry.css"
import { htmlToElement } from "../../../loader";

export default class SavefileMergeEntry
{
    #view: HTMLElement;

    constructor(
        username: string,
        private readonly mergeLocalSavefileToUser: () => void
    ) {
        this.#view = htmlToElement(template.replace("$username", username));
        const button = this.#view.querySelector("#btn-savefile-merge") as HTMLButtonElement;
        button.onclick = () =>  this.mergeLocalSavefileToUser();
    }

    get view() {
        return this.#view;
    }

}