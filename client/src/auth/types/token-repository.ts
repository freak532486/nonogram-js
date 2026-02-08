export default interface TokenRepository {
    getSessionToken(): string | undefined,
    setSessionToken(token: string | undefined): void,
    getRefreshToken(): string | undefined,
    setRefreshToken(token: string | undefined): void;
    clearTokens(): void;
}