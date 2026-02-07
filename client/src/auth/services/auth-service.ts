import { CheckLoginStatusResponse, GetTokenResponse, RegisterUserRequest } from "nonojs-common";
import { ApiService } from "../../api/api-service";
import TokenRepository from "../types/token-repository";

export default class AuthService {

    constructor(
        private readonly apiService: ApiService,
        private readonly tokenRepository: TokenRepository
    ) {}

    /**
     * Registers a new user with the given username and password.
     */
    async register(username: string, password: string, emailAddress: string): Promise<
        { status: "ok", data: undefined } | /** User was created successfully */
        { status: "invalid_auth", data: undefined } | /** Username or password contains non-ASCII characters */
        { status: "user_exists", data: undefined } | /** User already exists. */
        { status: "error", data: any } /** An error occured. */
    >
    {
        /* Check if username/password contain non-ASCII characters */
        if (!isASCII(username) || !isASCII(password)) {
            return { status: "invalid_auth", data: undefined };
        }

        const body: RegisterUserRequest = {
            username: username,
            password: password,
            emailAddress: emailAddress
        };

        const request = new Request("/api/auth/register", {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json"
            }
        });

        const response = await this.apiService.performRequest(request);

        if (response.status == "unauthorized") {
            throw new Error("Registration does not need authorization.");
        }

        if (response.status == "error") {
            return { status: "error", data: response.data };
        }

        if (response.status == "ok") {
            return { status: "ok", data: undefined };
        }

        /* Check if the bad response is a 409 Conflict. In that case, the user already exists */
        if (response.data.status == 409) {
            return { status: "user_exists", data: undefined };
        }

        return { status: "error", data: response };
    }

    /**
     * Performs a login. If the login is successful, the new tokens are written into the token store.
     */
    async login(username: string, password: string): Promise<
        { "status": "ok", data: undefined } |
        { "status": "bad_credentials", data: undefined } |
        { "status": "error", data: any }
    >
    {
        /* Check if username/password contain non-ASCII characters */
        if (!isASCII(username) || !isASCII(password)) {
            return { status: "bad_credentials", data: undefined };
        }

        /* Attempt login using basic auth */
        const basicAuth = btoa(username + ":" + password);
        const request = new Request("/api/auth/login", {
            method: "GET",
            headers: {
                "Authorization": "Basic " + basicAuth
            }
        });

        const response = await this.apiService.performRequest(request);

        /* Handle bad cases */
        if (response.status == "unauthorized") {
            return { status: "bad_credentials", data: undefined };
        }

        if (response.status == "bad_response") {
            return { status: "error", data: response.data };
        }

        if (response.status == "error") {
            return { status: "error", data: response.data };
        }

        /* Handle the good case */
        const responseBody = (await response.data.json()) as GetTokenResponse;
        this.tokenRepository.setSessionToken(responseBody.sessionToken);
        this.tokenRepository.setRefreshToken(responseBody.refreshToken);
        return { status: "ok", data: undefined }
    }

    /**
     * Returns the name of the currently logged-in user. Returns undefined if the current user is not logged in.
     */
    async getCurrentUsername(): Promise<string | undefined> {
        const request = new Request("/api/auth/check-login-status", {
            "method": "GET"
        });

        const response = await this.apiService.performRequestWithSessionToken(request);

        if (response.status == "unauthorized" || response.status == "error" || response.status == "bad_response") {
            return undefined;
        }

        const parsed = (await response.data.json()) as CheckLoginStatusResponse;
        return parsed.username;
    }

    /**
     * Logs out the current active session. Does nothing if no session exists.
     */
    async logout()
    {
        const refreshToken = this.tokenRepository.getRefreshToken();
        if (!refreshToken) {
            return;
        }

        const request = new Request("/api/auth/logout", {
            "method": "GET",
            "headers": {
                "Authorization": "Bearer " + refreshToken
            }
        });
        const response = await this.apiService.performRequest(request);
        if (response.status !== "ok") {
            window.alert("An error occured. Logout was not successful.");
            return;
        }

        this.tokenRepository.clearTokens();
    }

    /**
     * Removes the active user from the server.
     */
    async deleteUser()
    {
        const request = new Request("/api/auth/user", {
            "method": "DELETE"
        });
        const response = await this.apiService.performRequestWithSessionToken(request);
        if (response.status !== "ok") {
            window.alert("An error occured. Your user could not be deleted.");
        }
    }

}

function isASCII(str: string): boolean {
    return /^[\x00-\x7F]*$/.test(str);
}