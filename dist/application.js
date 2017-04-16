"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const encrypter_1 = require("./encrypter");
const config_1 = require("./config");
const authorize_1 = require("./routes/authorize");
const callback_1 = require("./routes/callback");
const expressJwt = require('express-jwt');
const expressProxy = require('express-http-proxy');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
/**
 * The Express Server Application
 *
 * @export
 * @class GitlabOAuthProxyApplication
 */
class GitlabOAuthProxyApplication {
    constructor() {
        this.encrypter = new encrypter_1.Encrypter(config_1.GITLAB_OAUTH_PROXY_CONFIG.privateKey);
        this.app = express();
        this.config = config_1.GITLAB_OAUTH_PROXY_CONFIG;
        this.setupJwt();
        this.setupProxy();
        this.setupErrorHandler();
        this.setupMiddlewares();
        this.setupRoutes();
        this.app.listen(GitlabOAuthProxyApplication.PORT, () => {
            console.log('Express server listening on port ' + GitlabOAuthProxyApplication.PORT);
        });
    }
    static bootstrap() {
        return new GitlabOAuthProxyApplication();
    }
    setupMiddlewares() {
        this.app.use(cookieParser());
        this.app.use(bodyParser.urlencoded({ extended: true }));
    }
    setupJwt() {
        this.app.use(expressJwt(this.config.jwtConfig).unless({ path: GitlabOAuthProxyApplication.NON_SECURED_ROUTES }));
    }
    setupRoutes() {
        this.app.get('/', (req, resp) => {
            resp.redirect('/authorize');
        });
        this.app.get('/authorize', authorize_1.oauthAuthorizeRoute);
        this.app.get('/oauth_callback', callback_1.oauthCallbackRoute);
    }
    setupProxy() {
        this.app.use('/gitlab', expressProxy(this.config.domainName, {
            https: true,
            forwardPath: (req, resp) => {
                let originalPath = require('url').parse(req.url).path;
                let targetPath = '/api/v3' + originalPath.replace('gitlab', '');
                return targetPath;
            },
            decorateRequest: (proxyReq, originalReq) => {
                // pega o token de autenticacao jwt
                let jwtToken = originalReq.headers['Authorization'];
                // extrai o access_token criptgrafado e descriptografa para enviar no cabeçalho para o gitlab
                let gitlabAccessToken = this.encrypter.decrypt(originalReq.user.payload.gitlabToken.accessTokenEnc);
                delete proxyReq.headers['Authorization'];
                delete proxyReq.headers['authorization'];
                // seta o novo cabeçalho
                proxyReq.headers['Content-Type'] = 'application/json';
                proxyReq.headers['Authorization'] = 'Bearer ' + gitlabAccessToken;
                return proxyReq;
            } /*,
        intercept: () => {
            console.log('AQUI INTERCEPT');
            // remover access token do response que veio do targetPath

            // colocar token de autorização da App corrente
        }*/
        }));
    }
    setupErrorHandler() {
        this.app.use(function (err, req, res, next) {
            if (err.name === 'UnauthorizedError') {
                res.status(401).send('invalid token...' + JSON.stringify(err));
            }
        });
    }
}
GitlabOAuthProxyApplication.PORT = 8080;
GitlabOAuthProxyApplication.NON_SECURED_ROUTES = [
    '/oauth_callback',
    '/authorize',
    '/bla',
    '/'
];
exports.GitlabOAuthProxyApplication = GitlabOAuthProxyApplication;
