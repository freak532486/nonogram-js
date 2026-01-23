import TwoWayMap from "../../common/types/two-way-map";
import { SESSION_TOKEN_EXPIRY_MS } from "../internal/constants";

/**
 * A token store. It can store a single session token per user id.
 */
export default class TokenStore {
    #store = new TwoWayMap<number, SessionTokenEntry>();

    /**
     * Returns the session token of the given user, or undefined if no such session exists or the session expired.
     */
    getSessionToken(userId: number) {
        const entry = this.#store.getByKey(userId);
        if (!entry) {
            return undefined;
        }

        /* Check expiry */
        if (Date.now() - entry.creationTimestamp < SESSION_TOKEN_EXPIRY_MS) {
            return entry.sessionToken;
        }

        /* Remove expired token */
        this.#store.deleteByKey(userId);
        return undefined;
    }

    /**
     * Updates the session token of the given user.
     */
    putSessionToken(userId: number, token: string) {
        this.#store.set(userId, {
            "sessionToken": token,
            "creationTimestamp": Date.now()
        });
    }
}

/**
 * A session token, together with its creation timestamp (used for expiry).
 */
interface SessionTokenEntry {
    sessionToken: string;
    creationTimestamp: number;
}