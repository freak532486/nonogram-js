import { htmlToElement } from "../../../loader"
import loginTemplate from "./login.template.html"
import "./login.style.css"
import "../../../common/styles/boxes.css"

export default class LoginComponent {

    #view: HTMLElement;

    constructor(
        private readonly onLogin: (username: string, password: string) => Promise<void>,
        private readonly onRegister: (username: string, password: string, emailAddress: string) => Promise<void>
    ) {
        this.#view = htmlToElement(loginTemplate);
    }

    async init(parent: HTMLElement): Promise<void>
    {
        /* Attach view to parent */
        parent.appendChild(this.#view);

        /* Fetch all relevant elements */
        const inputLoginUsername = this.#view.querySelector("#input-login-username") as HTMLInputElement;
        const inputLoginPassword = this.#view.querySelector("#input-login-password") as HTMLInputElement;
        const buttonLogin = this.#view.querySelector("#button-login") as HTMLButtonElement;
        const labelLogin = this.#view.querySelector("#label-login-message") as HTMLElement;

        const inputRegisterUsername = this.#view.querySelector("#input-register-username") as HTMLInputElement;
        const inputRegisterEmail = this.#view.querySelector("#input-register-email") as HTMLInputElement;
        const inputRegisterPassword = this.#view.querySelector("#input-register-password") as HTMLInputElement;
        const inputRegisterPasswordConfirm = this.#view.querySelector("#input-register-password-confirm") as HTMLInputElement;
        const buttonRegister = this.#view.querySelector("#button-register") as HTMLButtonElement;
        const labelRegister = this.#view.querySelector("#label-register-message") as HTMLElement;
        
        /* Handle login button pressed */
        buttonLogin.onclick = () => {
            const username = inputLoginUsername.value;
            const password = inputLoginPassword.value;

            if (username.length == 0 || password.length == 0) {
                labelLogin.textContent = "Enter all required fields."
                return;
            }
            
            labelLogin.textContent = "";
            this.onLogin(username, password);
        }

        /* Handle register button pressed */
        buttonRegister.onclick = () => {
            const username = inputRegisterUsername.value;
            const emailAddress = inputRegisterEmail.value;
            const password = inputRegisterPassword.value;
            const passwordConfirmation = inputRegisterPasswordConfirm.value;

            if (username.length == 0 || emailAddress.length == 0 || password.length == 0) {
                this.registerMessage = "Enter all required fields.";
                this.registerMessageColor = "#FF0000";
                return;
            }
            
            if (password !== passwordConfirmation) {
                this.registerMessage = "Passwords do not match.";
                this.registerMessageColor = "#FF0000";
                return;
            }

            labelRegister.textContent = "";
            this.onRegister(username, password, emailAddress);
        }
    }

    async destroy() {
        this.#view?.remove();
    }

    set loginMessage(msg: string) {
        const labelLogin = this.#view.querySelector("#label-login-message") as HTMLElement;
        labelLogin.textContent = msg;
    }

    set loginMessageColor(color: string) {
        const labelLogin = this.#view.querySelector("#label-login-message") as HTMLElement;
        labelLogin.style.color = color;
    }

    set registerMessage(msg: string) {
        const labelRegister = this.#view.querySelector("#label-register-message") as HTMLElement;
        labelRegister.textContent = msg;
    }

    set registerMessageColor(color: string) {
        const labelRegister = this.#view.querySelector("#label-register-message") as HTMLElement;
        labelRegister.style.color = color;
    }

}