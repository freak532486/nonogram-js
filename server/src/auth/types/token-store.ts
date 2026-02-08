import TwoWayMap from "../../common/types/two-way-map";
import { SESSION_TOKEN_EXPIRY_MS } from "../internal/constants";

/**
 * A token store. It can store a single session token per user id.
 */
export default class TokenStore {
    #sessionTokenToUserId = new Map<string, number>();
    #sessionTokenToRefreshToken = new TwoWayMap<string, string>();
    #creationTimestamps = new Map<string, number>();

    /**
     * Returns the refresh token associated with the given session token.
     */
    getRefreshTokenForSessionToken(sessionToken: string): string | undefined
    {
        if (!this.#isTokenValid(sessionToken)) {
            return undefined;
        }

        return this.#sessionTokenToRefreshToken.getByKey(sessionToken);
    }

    /**
     * Returns the session token associated with the given refresh token.
     */
    getSessionTokenForRefreshToken(refreshToken: string): string | undefined
    {
        const sessionToken = this.#sessionTokenToRefreshToken.getByValue(refreshToken);
        if (!sessionToken) {
            return undefined;
        }

        if (!this.#isTokenValid(sessionToken)) {
            return undefined;
        }

        return sessionToken;
    }

    /**
     * Returns the matching user id for the given session token, or undefined if no such user exists.
     */
    getUserId(sessionToken: string): number | undefined {
        if (!this.#isTokenValid(sessionToken)) {
            return undefined;
        }

        return this.#sessionTokenToUserId.get(sessionToken);
    }

    /**
     * Returns true if the given token exists and has not expired yet. Cleans up expired tokens.
     */
    #isTokenValid(sessionToken: string): boolean {
        const creationTimestamp = this.#creationTimestamps.get(sessionToken);
        if (creationTimestamp && Date.now() - creationTimestamp < SESSION_TOKEN_EXPIRY_MS) {
            return true;
        }

        /* Token is expired. Remove it. */
        this.removeSessionToken(sessionToken);
        return false;
    }

    /**
     * Updates the session token of the given user.
     */
    putSessionToken(userId: number, sessionToken: string, refreshToken: string, creationTimestamp: number) {
        this.#sessionTokenToUserId.set(sessionToken, userId);
        this.#sessionTokenToRefreshToken.set(sessionToken, refreshToken);
        this.#creationTimestamps.set(sessionToken, creationTimestamp);
    }

    /**
     * Removes the given session token from the store.
     */
    removeSessionToken(sessionToken: string)
    {
        this.#sessionTokenToUserId.delete(sessionToken);
        this.#sessionTokenToRefreshToken.deleteByKey(sessionToken);
        this.#creationTimestamps.delete(sessionToken);
    }
}