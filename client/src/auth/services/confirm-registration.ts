import * as app from "../../app"
import RegistrationConfirmationComponent from "../components/registration-confirmation/registration-confirmation.component";

export default class RegistrationConfirmationManager
{
    constructor(
        private readonly resetContentRoot: () => void,
        private readonly contentRoot: HTMLElement
    ) {}

    async confirmRegistration(token: string): Promise<void>
    {
        const apiService = app.apiService;

        /* Create display component */
        const component = new RegistrationConfirmationComponent();
        this.resetContentRoot();
        component.init(this.contentRoot);

        /* Send confirmation request to server */
        const request = new Request("/api/auth/confirm-registration?token=" + token, {
            method: "GET",
        });
        const response = await apiService.performRequest(request);

        switch (response.status) {
            case "ok":
                component.setTitle("Success");
                component.setMessage("Confirmation successful. You can now log in with your new username.");
                break;

            case "bad_response":
                component.setTitle("Error");
                if (response.data.status == 404) {
                    component.setMessage("Unknown registration token.");
                } else if (response.data.status == 409) {
                    component.setMessage("Someone has registered your username while your confirmation was pending. Please choose a different username.");
                } else {
                    component.setMessage("An unknown error occured.");
                }
                break;

            case "unauthorized":
            case "error":
                component.setTitle("Error");
                component.setMessage("An error occured");
                break;
        }
    }

}