import { SaveFile } from "nonojs-common";
import { ApiService } from "../api/api-service";
import { ACTIVE_VERSION_KEY } from "./savefile-migrator";
import { CellKnowledge } from "../common/nonogram-types";

const STORAGE_KEY = "storage";

export default class SavefileAccess
{

    constructor(
        private readonly apiService: ApiService,
        private readonly onError: (errMsg: string) => void,
        private readonly getActiveUsername: () => string | undefined
    ) {}

     /**
     * Fetches the savefile from local browser storage.
     */
    fetchLocalSavefile(): SaveFile {
        const username = this.getActiveUsername();
        return this.fetchLocalSavefileForUser(username) || createEmptySavefile(username);
    }

    /**
     * Returns the locally stored save file for the given user. If the username is undefined, this represents the
     * savefile that was made while not logged in. 
     */
    fetchLocalSavefileForUser(username: string | undefined): SaveFile | undefined
    {
        const key = STORAGE_KEY + (username ? "_" + username : "");
        const serialized = window.localStorage.getItem(key);
        if (!serialized) {
            return undefined;
        }

        return JSON.parse(serialized);
    }

    /**
     * Removes the local savefile for the given user.
     */
    deleteLocalSavefileForUser(username: string | undefined)
    {
        const key = STORAGE_KEY + (username ? "_" + username : "");
        window.localStorage.removeItem(key);
    }

    /**
     * Fetches the savefile for the currently logged-in user from the server.
     */
    async fetchServerSavefile(): Promise<SaveFile>
    {
        const username = this.getActiveUsername();
        const request = new Request("/api/savefile", { "method": "GET" });
        const response = await this.apiService.performRequestWithSessionToken(request);
        if (response.status !== "ok") {
            return createEmptySavefile(username);
        }

        return await response.data.json() as SaveFile;
    }

    /**
     * Writes the given savefile to local browser storage.
     */
    writeLocalSavefile(savefile: SaveFile)
    {
        removeEmptySavestates(savefile);

        const activeUsername = this.getActiveUsername();
        const key = STORAGE_KEY + (activeUsername ? "_" + activeUsername : "");
        const serialized = JSON.stringify(savefile);
        window.localStorage.setItem(key, serialized);
    }

    /**
     * Writes the given savefile to the server (based on the currently logged-in user)
     */
    async writeServerSavefile(savefile: SaveFile)
    {
        removeEmptySavestates(savefile);
        
        const serialized = JSON.stringify(savefile);
        const request = new Request("/api/savefile", {
            "method": "PUT",
            "body": serialized,
            "headers": {
                "Content-Type": "application/json"
            }
        });
        const response = await this.apiService.performRequestWithSessionToken(request);

        if (response.status == "unauthorized") {
            this.onError("Unable to write savefile to server - You are not logged in.");
        } else if (response.status == "bad_response" || response.status == "error") {
            this.onError("An error occured when trying to write savefile to server.");
        }
    }

}

function createEmptySavefile(username: string | undefined): SaveFile
{
    return {
        versionKey: ACTIVE_VERSION_KEY,
        username: username,
        lastPlayedNonogramId: undefined,
        entries: []
    };
}

function removeEmptySavestates(savefile: SaveFile)
{
    savefile.entries = savefile.entries.filter(entry => entry.state.cells.some(cell => cell !== CellKnowledge.UNKNOWN))
}