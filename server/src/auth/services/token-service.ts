import * as crypto from "crypto"
import { TwoWayMap } from "../internal/two-way-map";
import { DatabaseAccess } from "../../database/database-access";

const TOKEN_LENGTH = 32;

export interface TokenPair {
    sessionToken: string;
    refreshToken: string;
}

interface SessionTokenEntry {
    sessionToken: string;
    creationTimestamp: number;
}

export class TokenService {

    readonly #dbAccess: DatabaseAccess;

    #sessionUserMap = new TwoWayMap<number, SessionTokenEntry>();

    constructor(dbAccess: DatabaseAccess) {
        this.#dbAccess = dbAccess;
    }

    /**
     * Regenerates the session- and refresh-token for the given user.
     */
    async refreshTokenForUser(userId: number): Promise<TokenPair> {
        /* Generate tokens */
        const sessionToken = generateRandomToken();
        const refreshToken = generateRandomToken();
        const creationTimestamp = Date.now();

        /* Write refresh token into database */
        const sql = `
            INSERT INTO sessions
            VALUES ($userId, $refreshToken, $creationTimestamp)
            ON CONFLICT DO UPDATE 
            SET refresh_token = $refreshToken, creation_timestamp = $creationTimestamp
        `;

        const params = {
            "userId": userId,
            "refreshToken": refreshToken,
            "creationTimestamp": creationTimestamp
        };

        await this.#dbAccess.run(sql, params);

        /* Write session token into memory */
        this.#sessionUserMap.set(userId, {
            "sessionToken": sessionToken,
            "creationTimestamp": creationTimestamp
        });

        /* Done */
        return {
            "sessionToken": sessionToken,
            "refreshToken": refreshToken
        }
    }

}

function generateRandomToken() {
    return crypto.randomBytes(TOKEN_LENGTH).toString("hex");
}