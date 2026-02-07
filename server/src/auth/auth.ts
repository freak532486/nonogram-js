import * as headerParsing from "./impl/header-parsing";
import { deleteUser, getUserById } from "./impl/auth-sql";
import { confirmRegistration, performUnconfirmedRegistration } from "./impl/registration";
import { getUserIdForSession } from "./internal/utils";
import { performLogin } from "./impl/login";
import { refreshSession } from "./impl/session-refresh";
import { performLogout } from "./impl/logout";

const auth = {
    parseBasicAuthHeader: headerParsing.parseBasicAuthHeader,
    parseBearerAuthHeader: headerParsing.parseBearerAuthHeader,

    getUserById: getUserById,
    getUserIdForSession: getUserIdForSession,

    refreshSession: refreshSession,

    login: performLogin,
    logout: performLogout,
    performUnconfirmedRegistration: performUnconfirmedRegistration,
    confirmRegistration: confirmRegistration,
    deleteUser: deleteUser
}

export default auth;