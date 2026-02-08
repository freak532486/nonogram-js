import { Menu } from "../menu.component";

export default class DefaultMenuButtonManager
{
    #buttonsCreated: boolean = false;

    constructor(
        private readonly menu: Menu,
        private readonly onLogin: () => void,
        private readonly onLogout: () => void,
        private readonly onSettings: () => void
    ) {}


    /**
     * Creates the default menu buttons that are always available. If a username is given, then a log-out button is
     * created, otherwise a log-in button.
     */
    createDefaultMenuButtons(username: string | undefined) {
        if (this.#buttonsCreated) {
            return;
        }

        this.#buttonsCreated = true;

        /* Login / Logout */
        if (!username) {
            const loginButton = document.createElement("button");
            loginButton.classList.add("entry");
            loginButton.classList.add("login");
            loginButton.classList.add("border-right");
            loginButton.textContent = "Log In";
            loginButton.style.color = "#1ca318";
            loginButton.onclick = this.onLogin;
            this.menu.appendElement(loginButton);
        } else {
            const logoutButton = document.createElement("button");
            logoutButton.classList.add("entry");
            logoutButton.classList.add("logout");
            logoutButton.classList.add("border-right");
            logoutButton.textContent = "Log Out (" + username + ")";
            logoutButton.onclick = this.onLogout;
            this.menu.appendElement(logoutButton);
        }

        /* Settings button */
        const settingsButton = document.createElement("button");
        settingsButton.classList.add("entry");
        settingsButton.classList.add("settings");
        settingsButton.textContent = "Settings";
        settingsButton.onclick = this.onSettings;
        this.menu.appendElement(settingsButton);
    }


}