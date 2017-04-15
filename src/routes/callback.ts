import * as express from 'express';
import { GitlabOAuth } from '../gitlab-oauth';
import { GITLAB_OAUTH_PROXY_CONFIG } from '../config';
export function oauthCallbackRoute(req: express.Request, resp: express.Response) {
    let hostUrl: string = req.protocol + '://' + req.hostname;

    console.log('BASE URL', req.baseUrl);

    let returnUrl = hostUrl + '/oauth_callback';

    let gitlabOAuth = new GitlabOAuth(GITLAB_OAUTH_PROXY_CONFIG);
    let promisAccessToken = gitlabOAuth.getAccessToken(req.query.code, returnUrl, null);
    promisAccessToken.then((gitlabAccessTokenObject: any) => {
        gitlabOAuth.generateJwt(gitlabAccessTokenObject).then(
            token => {
                resp.cookie('access_token', token, {
                    httpOnly: true,
                    domain: req.host
                });
                let returnUrl = req.cookies['gitlab-proxy-returnUrl'];
                resp.clearCookie('gitlab-proxy-returnUrl');
                //resp.send(token);
                resp.redirect(returnUrl);
            }
        ).catch(reason => {
            //throw new Error(reason);
            resp.end(reason);
        });
    });
}