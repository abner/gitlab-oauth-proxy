export interface GitlabOAuthOptions {
    domainName: string;
    // serverUrl: string;
    clientId: string;
    clientSecret: string;
    protocol?: string;
}


export interface GitlabAccessTokenObject {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
}