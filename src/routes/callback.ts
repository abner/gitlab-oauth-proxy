import * as express from 'express';
import { GitlabOAuth } from '../gitlab-oauth';
import { get as getConfig} from '../config';

export function oauthCallbackRoute(req: express.Request, resp) {
    let hostUrl: string = req.protocol + '://' + req.hostname;

    let returnUrl = hostUrl + '/oauth_callback');

    let gitlabOAuth = new GitlabOAuth(getConfig());
    let promisAccessToken = gitlabOAuth.getAccessToken(req.query.code, returnUrl, null);
    promisAccessToken.then((gitlabAccessTokenObject: any) => {
        gitlabOAuth.generateJwt(gitlabAccessTokenObject).then(
            token => resp.send(token)
        ).catch(reason => {
            //throw new Error(reason);
            resp.end(reason);
        });
    });
}