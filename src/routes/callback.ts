import * as express from 'express';
import { GitlabOAuth } from '../gitlab-oauth';
import { GITLAB_OAUTH_PROXY_CONFIG } from '../config';
export function oauthCallbackRoute(req: express.Request, resp: express.Response) {
    let hostUrl: string = req.protocol + '://' + req.hostname;

    console.log('BASE URL', req.baseUrl);

    let gitlabOAuth = new GitlabOAuth(GITLAB_OAUTH_PROXY_CONFIG);
    let promisAccessToken = gitlabOAuth.getAccessToken(req.query.code, null);
    promisAccessToken.then((gitlabAccessTokenObject: any) => {
        gitlabOAuth.generateJwt(gitlabAccessTokenObject).then(
            token => {
                resp.send(token);
                resp.cookie('gitlab_oauth_proxy_token', token, {
                    httpOnly: true,
                    domain: req.host
                });
                let returnUrl = req.cookies[GITLAB_OAUTH_PROXY_CONFIG.returnUrlCookieName];
                resp.clearCookie(GITLAB_OAUTH_PROXY_CONFIG.returnUrlCookieName);
                resp.redirect(returnUrl);
            }
        ).catch(reason => {
            console.error(reason);
            resp.status(500);
            resp.end(reason);
        });
    }).catch(error => {
        resp.status(500);
        resp.end('Unexpected error.');
        console.error(error);
    });
}