import { DatabaseAccess } from "../../database/database-access";
import { GetTokenResponse } from "nonojs-common";
import { parseBasicAuthHeader, validatePassword } from "../internal/auth-utils";
import { FastifyInstance } from "fastify";
import { TokenService } from "./token-service";

export class LoginService {

    readonly #fastify;
    readonly #dbAccess;
    readonly #tokenService;

    constructor (fastify: FastifyInstance, dbAccess: DatabaseAccess, tokenService: TokenService) {
        this.#fastify = fastify;
        this.#dbAccess = dbAccess;
        this.#tokenService = tokenService;
    }

    async performLogin(authHeader: string): Promise<GetTokenResponse> {
        /* Parse basic auth */
        const parsedAuth = parseBasicAuthHeader(authHeader);
        if (!parsedAuth) {
            throw this.#fastify.httpErrors.unauthorized("Bad credentials");
        }

        /* Find user entry in database */
        const sql = "SELECT id, password_hash FROM users WHERE username = ?";
        const results = await this.#dbAccess.run(sql, parsedAuth.username);

        /* Bad auth if user was not found */
        if (results.length == 0) {
            throw this.#fastify.httpErrors.unauthorized("Bad credentials");
        }

        /* Compare password hash */
        const storedHash = results[0].password_hash;
        if (await validatePassword(parsedAuth.password, storedHash) == false) {
            throw this.#fastify.httpErrors.unauthorized("Bad credentials");
        }

        /* Correct credentials. Generate new tokens and return */
        const userId = results[0].id;
        return await this.#tokenService.refreshTokenForUser(userId);
    }

}