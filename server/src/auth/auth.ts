import { FastifyInstance } from "fastify";
import * as headerParsing from "./impl/header-parsing";
import TokenStore from "./types/token-store";
import LoginService from "./impl/login-service";
import BasicAuthContent from "./types/basic-auth-content";
import TokenPair from "./types/token-pair";
import SessionRefreshService from "./impl/session-refresh-service";
import RegisterService from "./impl/register-service";
import { createUser, getUserById, getUserByUsername, getUserForRefreshToken, putRefreshToken } from "./impl/auth-sql";
import { performUnconfirmedRegistration } from "./impl/register";

export class AuthService {

    #tokenStore;
    #sessionRefreshService;
    #loginService;
    #registerService;

    constructor(fastify: FastifyInstance) {
        /* Create in-memory store for session tokens */
        this.#tokenStore = new TokenStore();

        /* Create services */
        this.#sessionRefreshService = new SessionRefreshService(
            async (userId, sessionToken, creationTime) => this.#tokenStore.putSessionToken(userId, sessionToken, creationTime),
            (userId, refreshToken, creationTime) => putRefreshToken(fastify, userId, refreshToken, creationTime),
            (refreshToken) => getUserForRefreshToken(fastify, refreshToken)
        );

        this.#loginService = new LoginService(
            (username) => getUserByUsername(fastify, username),
            (userId) => this.#sessionRefreshService.refreshTokenForUser(userId)
        );

        this.#registerService = new RegisterService(
            (username, passwordHash, emailAddress) => createUser(fastify, username, passwordHash, emailAddress)
        );
    }

    /**
     * Performs a login using the given basic auth. Returns a created token pair for that user. Returns undefined if the
     * login failed (most likely due to bad credentials).
     */
    async login(basicAuth: BasicAuthContent): Promise<TokenPair | undefined> {
        return this.#loginService.performLogin(basicAuth);
    }

    /**
     * Registers a new user with the given username and password. Returns the created user id if this succeeds, or
     * undefined if it doesn't (most likely due to the user already existing).
     */
    async registerUser(username: string, password: string, emailAddress: string): Promise<number | undefined> {
        return this.#registerService.registerUser(username, password, emailAddress);
    }

    async refreshSession(refreshToken: string): Promise<TokenPair | undefined> {
        return this.#sessionRefreshService.refreshSession(refreshToken);
    }

    /**
     * Returns the user id for the user of the given token. Returns undefined if the session token is unknown or
     * expired.
     */
    async getUserIdForSession(sessionToken: string): Promise<number | undefined> {
        return this.#tokenStore.getUserId(sessionToken);
    }

}

const auth = {
    parseBasicAuthHeader: headerParsing.parseBasicAuthHeader,
    parseBearerAuthHeader: headerParsing.parseBearerAuthHeader,

    getUserById: getUserById,

    performUnconfirmedRegistration: performUnconfirmedRegistration
}

export default auth;