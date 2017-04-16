"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gitlab_oauth_1 = require("../gitlab-oauth");
const config_1 = require("../config");
function oauthAuthorizeRoute(req, resp) {
    let hostUrl = req.protocol + '://' + req.hostname;
    let authorizeUrl = new gitlab_oauth_1.GitlabOAuth(config_1.GITLAB_OAUTH_PROXY_CONFIG).getAuthorizeURL();
    resp.cookie(config_1.GITLAB_OAUTH_PROXY_CONFIG.originUrlCookieName, req.headers['Referer']);
    resp.cookie(config_1.GITLAB_OAUTH_PROXY_CONFIG.returnUrlCookieName, req.query['return_url']);
    resp.redirect(authorizeUrl);
}
exports.oauthAuthorizeRoute = oauthAuthorizeRoute;
