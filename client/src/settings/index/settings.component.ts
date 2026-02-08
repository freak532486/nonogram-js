import template from "./settings.html"
import "./settings.css"
import { htmlToElement } from "../../loader";
import SettingEntriesManager from "../entries/setting-entries-manager";
import SavefileAccess from "../../savefile/savefile-access";

export default class Settings
{
    #view: HTMLElement;
    #entriesManager: SettingEntriesManager;

    constructor(
        savefileAccess: SavefileAccess,
        getActiveUsername: () => string | undefined,
        mergeLocalSavefileWithAccount: () => void,
        deleteActiveAccount: () => void
    )
    {
        this.#view = htmlToElement(template);
        this.#entriesManager = new SettingEntriesManager(
            this,
            savefileAccess,
            getActiveUsername,
            mergeLocalSavefileWithAccount,
            deleteActiveAccount
        );
    }

    init(parent: HTMLElement)
    {
        parent.appendChild(this.#view);
        this.#entriesManager.createSettingsEntries();
    }

    addEntry(entry: HTMLElement)
    {
        entry.classList.add("settings-entry");
        const entriesContainer = this.#view.querySelector("#entries") as HTMLElement;
        entriesContainer.appendChild(entry);
    }
}