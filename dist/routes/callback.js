"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gitlab_oauth_1 = require("../gitlab-oauth");
const config_1 = require("../config");
function oauthCallbackRoute(req, resp) {
    let hostUrl = req.protocol + '://' + req.hostname;
    console.log('BASE URL', req.baseUrl);
    let gitlabOAuth = new gitlab_oauth_1.GitlabOAuth(config_1.GITLAB_OAUTH_PROXY_CONFIG);
    let promisAccessToken = gitlabOAuth.getAccessToken(req.query.code, null);
    promisAccessToken.then((gitlabAccessTokenObject) => {
        gitlabOAuth.generateJwt(gitlabAccessTokenObject).then(token => {
            console.log('ORIGIN URL >>> ', req.cookies(config_1.GITLAB_OAUTH_PROXY_CONFIG.originUrlCookieName));
            console.log('RETURN URL >>> ', req.cookies(config_1.GITLAB_OAUTH_PROXY_CONFIG.returnUrlCookieName));
            resp.send(token);
            // resp.cookie('access_token', token, {
            //     httpOnly: true,
            //     domain: req.host
            // });
            // resp.clearCookie('gitlab-proxy-returnUrl');
            // let returnUrl = req.cookies['gitlab-proxy-returnUrl'];
            // resp.redirect(returnUrl);
        }).catch(reason => {
            //throw new Error(reason);
            resp.end(reason);
        });
    }).catch(error => {
        console.error(error);
    });
}
exports.oauthCallbackRoute = oauthCallbackRoute;
