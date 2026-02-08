import { GetTokenResponse } from "nonojs-common";
import TokenRepository from "../auth/types/token-repository";

export interface RequestResultOk { status: "ok", data: Response };
export interface RequestResultUnauthorized { status: "unauthorized", data: undefined };
export interface RequestResultBadResponse { status: "bad_response", data: Response };
export interface RequestResultError { status: "error", data: any };

export type RequestResult = 
    RequestResultOk | 
    RequestResultUnauthorized |
    RequestResultBadResponse |
    RequestResultError;

export interface ApiService {

    /**
     * Performs the given request. No authorization is appended. All error cases must be handled explicitly.
     */
    performRequest(request: Request): Promise<RequestResult>;

    /**
     * Performs the given request using the current session token. Refreshes the session token if necessary.
     */
    performRequestWithSessionToken(request: Request): Promise<RequestResult>;

    /**
     * Refreshes session- and refresh token. Returns the result of the refresh-call to check for failures.
     */
    refreshTokens(refreshToken: string): Promise<RequestResult>;
}