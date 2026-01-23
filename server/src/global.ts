import { FastifyInstance } from "fastify";
import { ConfigAccess } from "./config/config-access";
import { DatabaseAccess } from "./database/database-access";
import { TokenService } from "./auth/services/token-service";
import { LoginService } from "./auth/services/login-service";

/* Services are kept in global variable for easy access from every file. */
let gServices: Services | undefined;

export interface Services {
    configAccess: ConfigAccess;
    databaseAccess: DatabaseAccess;
    tokenService: TokenService;
    loginService: LoginService;
}

/**
 * Initialized all services. Is called exactly once on server startup.
 */
export async function init(fastify: FastifyInstance) {
    if (gServices) {
        throw new Error("Service initialization was called twice");
    }

    const configAccess = new ConfigAccess();
    await configAccess.init();

    const databaseAccess = new DatabaseAccess(fastify.log, configAccess);
    await databaseAccess.init();

    const tokenService = new TokenService(databaseAccess);

    const loginService = new LoginService(fastify, databaseAccess, tokenService);

    gServices = {
        "configAccess": configAccess,
        "databaseAccess": databaseAccess,
        "tokenService": tokenService,
        "loginService": loginService
    }
}

/**
 * Returns an object containing all available application-scoped services.
 */
export function getServices() {
    if (!gServices) {
        throw new Error("Services have not been initialized.");
    }

    return gServices;
}