import { GetTokenResponse } from "nonojs-common";
import TokenRepository from "../auth/types/token-repository";
import { ApiService, RequestResult } from "./api-service";

export default class ApiServiceImpl implements ApiService {

    constructor(
        private readonly tokenRepository: TokenRepository
    ) {}

    /**
     * Performs the given request. No authorization is appended. All error cases must be handled explicitly.
     */
    async performRequest(request: Request): Promise<RequestResult>
    {
        try {
            const response = await fetch(request);

            if (response.status == 401) {
                return { status: "unauthorized", data: undefined };
            }

            if (!response.ok) {
                return { status: "bad_response", data: response };
            }

            return { status: "ok", data: response };

        } catch (err) {
            return { status: "error", data: err };
        }
    }

    async performRequestWithSessionToken(request: Request): Promise<RequestResult>
    {
        /* Unauthorized if there is no refresh token, since then there is no session */
        const sessionToken = this.tokenRepository.getSessionToken();
        const refreshToken = this.tokenRepository.getRefreshToken();
        if (!refreshToken) {
            return { status: "unauthorized", data: undefined };
        }

        /* If there is a session token, perform first attempt with existing session token */
        if (sessionToken) {
            /* Augment request with session token */
            request.headers.set("Authorization", "Bearer " + sessionToken);

            /* Perform request */
            const firstResponse = await this.performRequest(request);

            /* Anything except unauthorized does not need special handling */
            if (firstResponse.status !== "unauthorized") {
                return firstResponse;
            }
        }

        /* Refresh session tokens */
        const refreshResponse = await this.refreshTokens(refreshToken);
        if (refreshResponse.status == "bad_response" || refreshResponse.status == "error") {
            return {
                status: "error",
                data: new Error("Failed to refresh tokens", { cause: refreshResponse.data })
            };
        }

        /* If refresh fails due to authorization, then the refresh token expired. */
        if (refreshResponse.status == "unauthorized") {
            return { status: "unauthorized", data: undefined };
        }

        /* Use new session token now */
        const newSessionToken = this.tokenRepository.getSessionToken();
        if (!newSessionToken) {
            return { status: "error", data: new Error("Session token was undefined after token refresh.") };
        }

        request.headers.set("Authorization", "Bearer " + newSessionToken);

        /* Second request attempt. No retry logic, so this will be the final result */
        return this.performRequest(request);
    }

    /**
     * Refreshes session- and refresh token. Returns the result of the refresh-call to check for failures.
     */
    async refreshTokens(refreshToken: string): Promise<RequestResult>
    {
        try {
            const response = await this.performRequest(new Request("/api/auth/refresh-session", {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + refreshToken
                }
            }));

            if (response.status !== "ok") {
                return response;
            }

            const body = (await response.data.json()) as GetTokenResponse;
            this.tokenRepository.setSessionToken(body.sessionToken);
            this.tokenRepository.setRefreshToken(body.refreshToken);
            return response;
        } catch (err) {
            return { status: "error", data: err };
        }
    }
}