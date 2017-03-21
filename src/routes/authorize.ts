import * as express from 'express';
import { GitlabOAuth } from '../gitlab-oauth';
import { get as getConfig} from '../config';
export function oauthAuthorizeRoute(req: express.Request, resp: express.Response) {
    let hostUrl: string = req.protocol + '://' + req.hostname;
    let authorizeUrl = new GitlabOAuth(getConfig()).getAuthorizeURL(hostUrl + '/oauth_callback');
    resp.redirect(authorizeUrl);
}