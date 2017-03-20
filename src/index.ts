import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';

import { GitlabOAuthOptions, GitlabAccessTokenObject } from './models';
import { GitlabOAuth } from "./gitlab-oauth";

import { getGitlabUser } from "./get-gitlab-user";
import * as _ from 'lodash';

import * as jsonWebToken from 'jsonwebtoken';

// import flatten from './src/flatten';

const bodyParser = require('body-parser');
const multer = require('multer');

const app = express();


// proxy for GITLAB_CLIENT_ID
const proxy = require('express-http-proxy');

var jwt = require('express-jwt');

let GITLAB_PROXY_PRIVATE_KEY = process.env.GITLAB_PROXY_PRIVATE_KEY;
let GITLAB_PROXY_PUBLIC_KEY = process.env.GITLAB_PROXY_PUBLIC_KEY;

if (GITLAB_PROXY_PRIVATE_KEY && GITLAB_PROXY_PUBLIC_KEY) {
    GITLAB_PROXY_PRIVATE_KEY = GITLAB_PROXY_PRIVATE_KEY.replace(/\\n/g, '\n');
    GITLAB_PROXY_PUBLIC_KEY = GITLAB_PROXY_PUBLIC_KEY.replace(/\\n/g, '\n');
}
else {
    console.error('Gitlab Proxy Application needs both an GITLAB_PROXY_PRIVATE_KEY and GITLAB_PROXY_PUBLIC_KEY environment variables to be set.');
    process.exit(1);
}

let servers: GitlabOAuthOptions[];

if (fs.existsSync('./servers.json')) {
    servers = require('./servers.json')
} else {
    servers = [{
        domainName: 'gitlab.com',
        // serverUrl: 'gitlab.com',
        protocol: 'https',
        clientId: process.env.GITLAB_CLIENT_ID,
        clientSecret: process.env.GITLAB_CLIENT_SECRET
    }];
}

const oauthGitlab = _.map(servers, (server) => new GitlabOAuth(server));


let nonSecuredRoutes = _.concat(
    _.map(servers, (server) => '/authorize/' + server.domainName),
    _.map(servers, (server) => '/oauth_callback/' + server.domainName),
    [
        "/bla",
        '/'
    ]

)

const jwtConfig = { secret: GITLAB_PROXY_PUBLIC_KEY, algorithms: ['RS256'] };


function getCurrentServer(serverName: string) {
    return servers.find((server) => server.domainName == serverName);
}

app.set('port', 8080)

app.use(bodyParser.urlencoded({ extended: true }))


app.use(jwt(jwtConfig).unless({ path: nonSecuredRoutes }));

// app.use(multer())

app.get('/', (req, resp) => {
    resp.redirect('authorize/gitlab.com');
})



app.get('/authorize/:server_name', (req, resp) => {
    let currentServer = getCurrentServer(req.params['server_name'])

    let hostUrl: string = req.protocol + '://' + req.hostname//;(port == 80 ? req.hostname : req.hostname + ':' + port );

    let authorizeUrl = new GitlabOAuth(currentServer).getAuthorizeURL(hostUrl + '/oauth_callback/' + encodeURIComponent(req.params['server_name']))

    resp.redirect(authorizeUrl);
});

app.get('/oauth_callback/:server_name', (req, resp) => {
    let currentServer = getCurrentServer(req.params['server_name'])

    let hostUrl: string = req.protocol + '://' + req.hostname//;(port == 80 ? req.hostname : req.hostname + ':' + port );

    let returnUrl = hostUrl + '/oauth_callback/' + encodeURIComponent(req.params['server_name']);

    let promisAccessToken = new GitlabOAuth(currentServer).getAccessToken(req.query.code, returnUrl, null);
    promisAccessToken.then((gitlabAccessTokenObject: any) => {
        generateGitlabProxyJwt(gitlabAccessTokenObject).then(
            token => resp.send(token)
        ).catch(reason => {
            //throw new Error(reason);
            resp.end(reason);
        })
    });
});

import * as https from 'https';
import { Encrypter } from './encryption';

const encrypter = new Encrypter(GITLAB_PROXY_PRIVATE_KEY);

function generateGitlabProxyJwt(gitlabToken: GitlabAccessTokenObject, domainName = 'gitlab.com') {

    // get info from gitlab to the logged User
    return getGitlabUser(domainName, gitlabToken.access_token).then((userData) => {

        // creates the jwt token
        var token = jsonWebToken.sign({
            payload: { gitlabToken:  {
                    accessTokenEnc: encrypter.encrypt(gitlabToken.access_token) ,
                    expiresIn: gitlabToken.expires_in,
                    tokenType: gitlabToken.token_type,
                    refreshTokenEnc: encrypter.encrypt(gitlabToken.refresh_token),
            }}
        },
            GITLAB_PROXY_PRIVATE_KEY,
            {
                algorithm: 'RS256',
                subject: `${domainName}/user/${userData.id}`,
                issuer: 'fast-gitlab-client',
                expiresIn: '360 minutes'
            });

      
        jsonWebToken.verify(token, GITLAB_PROXY_PUBLIC_KEY, { algorithms: ['RS256'] }, (err) => {
            if (err) {
                console.error('TOken não é válido!', err);
            }
        })
        return token;
    });
}




app.get('/bla', (req, resp) => {
    resp.send(req['user']);
});
app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.status(401).send('invalid token...' + JSON.stringify(err));
    }
});

// http://blog.jedd-ahyoung.com/2015/07/25/using-asymmetric-jwt-on-the-server-and-the-client/
servers.forEach((server) => {
    app.use('/' + server.domainName, proxy(server.domainName, {
        https: true,
        forwardPath: (req, resp) => {
            let originalPath = require('url').parse(req.url).path;

            let targetPath = '/api/v3' + originalPath.replace(server.domainName, '');

            return targetPath;
        },
        decorateRequest: (proxyReq, originalReq) => {
            // pega o token de autenticacao jwt
            let jwtToken: string = originalReq.headers['Authorization'];
            // extrai o access_token criptgrafado e descriptografa para enviar no cabeçalho para o gitlab
            let gitlabAccessToken = encrypter.decrypt<GitlabAccessTokenObject>(originalReq.user.payload.gitlabToken.accessTokenEnc);

            delete proxyReq.headers['Authorization']
            delete proxyReq.headers['authorization']
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
});


app.listen(app.get('port'), () => {
    console.log('Express server listening on port ' + app.get('port'))
});




