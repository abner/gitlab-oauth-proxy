import * as express from 'express';
import { Encrypter } from './encrypter';
import { GitlabOAuthOptions, GitlabAccessTokenObject } from './models';
import { get as getConfig } from './config';
import { oauthAuthorizeRoute } from './routes/authorize';
import { oauthCallbackRoute } from './routes/callback';
const expressJwt = require('express-jwt');
const expressProxy = require('express-http-proxy');
const bodyParser = require('body-parser');
/**
 * The Express Server Application
 *
 * @export
 * @class GitlabOAuthProxyApplication
 */
export class GitlabOAuthProxyApplication {
    public app: express.Application;
    private gitlabTargetDomain: string;
    private clientId: string;
    private clientSecret: string;
    private serviceDomain: string;
    private privateKey: string;
    private encrypter = new Encrypter();
    private config: GitlabOAuthOptions;

    public static PORT = 8080;
    public static NON_SECURED_ROUTES = [
        '/oauth_callback',
        '/authorize',
        '/bla',
        '/'
    ];

    constructor() {
        this.app = express();
        this.config = getConfig();
        this.setupJwt();
        this.setupProxy();
        this.setupErrorHandler();
        this.setupMiddlewares();
        this.setupRoutes();
        this.app.listen(GitlabOAuthProxyApplication.PORT, () => {
            console.log('Express server listening on port ' + GitlabOAuthProxyApplication.PORT);
        });
    }

    public static bootstrap(): GitlabOAuthProxyApplication {
        return new GitlabOAuthProxyApplication();
    }

    private setupMiddlewares() {
        this.app.use(bodyParser.urlencoded({ extended: true }))
    }

    private setupJwt() {
        this.app.use(expressJwt(this.config.jwtConfig).unless({ path: GitlabOAuthProxyApplication.NON_SECURED_ROUTES }));
    }

    private setupRoutes() {
        this.app.get('/', (req, resp) => {
            resp.redirect('/authorize');
        });
        this.app.get('/authorize', oauthAuthorizeRoute);
        this.app.get('/oauth_callback', oauthCallbackRoute);
    }



    private setupProxy() {
        this.app.use('/gitlab', expressProxy(this.config.domainName, {
            https: true,
            forwardPath: (req, resp) => {
                let originalPath = require('url').parse(req.url).path;

                let targetPath = '/api/v3' + originalPath.replace('gitlab', '');

                return targetPath;
            },
            decorateRequest: (proxyReq, originalReq) => {
                // pega o token de autenticacao jwt
                let jwtToken: string = originalReq.headers['Authorization'];
                // extrai o access_token criptgrafado e descriptografa para enviar no cabeçalho para o gitlab
                let gitlabAccessToken = this.encrypter.decrypt<GitlabAccessTokenObject>(originalReq.user.payload.gitlabToken.accessTokenEnc);

                delete proxyReq.headers['Authorization'];
                delete proxyReq.headers['authorization'];
                // seta o novo cabeçalho
                proxyReq.headers['Content-Type'] = 'application/json';
                proxyReq.headers['Authorization'] = 'Bearer ' + gitlabAccessToken;

                return proxyReq;

            }/*,
        intercept: () => {
            console.log('AQUI INTERCEPT');
            // remover access token do response que veio do targetPath

            // colocar token de autorização da App corrente
        }*/
        }));
    }

    private setupErrorHandler() {
        this.app.use(function (err, req, res, next) {
            if (err.name === 'UnauthorizedError') {
                res.status(401).send('invalid token...' + JSON.stringify(err));
            }
        });
    }

}