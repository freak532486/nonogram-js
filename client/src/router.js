import * as app from "./app"

export class Router
{

    /**
     * Performs routing logic.
     */
    async run() {
        const path = window.location.pathname;
        
        if (path == "/") {
            await app.openStartPage();
            return;
        }

        if (path == "/settings") {
            await app.openSettings();
            return;
        }

        if (path == "/register/confirm") {
            const params = new URLSearchParams(window.location.search);
            const token = params.get("token");
            if (!token) {
                app.navigateTo("/");
                return;
            }

            await app.registrationManager.confirmRegistration(token);
            return;
        }
        
        if (path == "/catalog") {
            await app.openCatalog();
            return;
        }

        if (path == "/login") {
            await app.openLoginPage();
            return;
        }
        
        if (path.startsWith("/n/")) {
            const nonogramId = path.split("/")[2];
            const nonogramExists = await app.openNonogram(nonogramId);
    
            if (!nonogramExists) {
                app.showNotFoundPage();
            }
    
            return;
        }
        
        app.showNotFoundPage();
    }
}