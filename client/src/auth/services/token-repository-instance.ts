import TokenRepository from "../types/token-repository";

const tokenRepository: TokenRepository = {
    getSessionToken() {
        return _getSessionToken();
    },

    setSessionToken(token: string | undefined) {
        _setSessionToken(token);
    },

    getRefreshToken() {
        return _getRefreshToken();
    },

    setRefreshToken(token: string | undefined) {
        _setRefreshToken(token);
    },

    clearTokens() {
        this.setSessionToken(undefined);
        this.setRefreshToken(undefined);
    }
}

export default tokenRepository;

function _getSessionToken(): string | undefined {
    return window.localStorage.getItem("sessionToken") || undefined;
}

function _setSessionToken(token: string | undefined) {
    if (!token) {
        window.localStorage.removeItem("sessionToken");
        return;
    }

    return window.localStorage.setItem("sessionToken", token);
}

function _getRefreshToken(): string | undefined {
    return window.localStorage.getItem("refreshToken") || undefined;
}

function _setRefreshToken(token: string | undefined) {
    if (!token) {
        window.localStorage.removeItem("refreshToken");
        return;
    }

    return window.localStorage.setItem("refreshToken", token);
}