import template from "./export-import-entry.html"
import { htmlToElement } from "../../../loader";
import SavefileAccess from "../../../savefile/savefile-access";
import { SaveFile } from "nonojs-common";

export default class ExportImportEntry
{
    #view: HTMLElement;

    constructor(
        private readonly savefileAccess: SavefileAccess
    ) {
        console.log("Constructed with savefileAccess" + (savefileAccess == undefined ? " " : " not ") + "undefined");

        this.#view = htmlToElement(template);

        const importButton = this.#view.querySelector("#btn-import-savefile") as HTMLInputElement;
        importButton.onclick = () => this.#import();

        const exportButton = this.#view.querySelector("#btn-export-savefile") as HTMLButtonElement;
        exportButton.onclick = () => this.#export();
    }

    async #import()
    {
        /* Fake input element to open file dialog */
        const fileInput = document.createElement("input");
        fileInput.type = "file";

        fileInput.onchange = async () => {
            const file = fileInput.files?.[0];

            if (!file) {
                alert("No savefile was selected");
                return;
            }

            try {
                const parsed = JSON.parse(await file.text()) as SaveFile;
                this.savefileAccess.writeLocalSavefile(parsed);
                alert("Savefile imported");
            } catch (err: any) {
                alert("Invalid savefile");
            }
        }

        fileInput.click();
    }

    async #export()
    {
        const savefile = this.savefileAccess.fetchLocalSavefile();
        const json = JSON.stringify(savefile);

        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "savefile.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    get view() {
        return this.#view;
    }
}