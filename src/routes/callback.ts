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
                if (req.cookies[GITLAB_OAUTH_PROXY_CONFIG.originUrlCookieName]) {
                    console.log('ORIGIN URL >>> ', req.cookies[GITLAB_OAUTH_PROXY_CONFIG.originUrlCookieName]);
                }
                if (req.cookies[GITLAB_OAUTH_PROXY_CONFIG.returnUrlCookieName]) {
                    console.log('RETURN URL >>> ', req.cookies[GITLAB_OAUTH_PROXY_CONFIG.returnUrlCookieName]);
                }
                resp.send(token);
                // resp.cookie('access_token', token, {
                //     httpOnly: true,
                //     domain: req.host
                // });
                // resp.clearCookie('gitlab-proxy-returnUrl');
                // let returnUrl = req.cookies['gitlab-proxy-returnUrl'];
                // resp.redirect(returnUrl);
            }
        ).catch(reason => {
            //throw new Error(reason);
            resp.end(reason);
        });
    }).catch(error => {
        console.error(error);
    });
}