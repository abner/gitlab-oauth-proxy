import * as express from 'express';
import { GitlabOAuth } from '../gitlab-oauth';
import { GITLAB_OAUTH_PROXY_CONFIG } from '../config';
export function oauthAuthorizeRoute(req: express.Request, resp: express.Response) {
    let hostUrl: string = req.protocol + '://' + req.hostname;
    let authorizeUrl = new GitlabOAuth(GITLAB_OAUTH_PROXY_CONFIG).getAuthorizeURL();
    if (req.headers['Referer']) {
        resp.cookie(GITLAB_OAUTH_PROXY_CONFIG.originUrlCookieName, req.headers['Referer']);
    }
    if (req.query['return_url']) {
        resp.cookie(GITLAB_OAUTH_PROXY_CONFIG.returnUrlCookieName, req.query['return_url']);
    }
    resp.redirect(authorizeUrl);
}