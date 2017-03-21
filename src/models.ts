export interface GitlabOAuthOptions {
    domainName: string;
    // serverUrl: string;
    clientId: string;
    clientSecret: string;
    protocol?: string;
    privateKey: string;
    publicKey: string;
    jwtConfig?: { secret: string, algorithms: string[] }
}


export interface GitlabAccessTokenObject {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
}