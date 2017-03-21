import * as qs from 'querystring';
import * as _ from 'lodash';
import * as request from 'request';
import * as https from 'https';
import * as jsonWebToken from 'jsonwebtoken';

import { GitlabOAuthOptions, GitlabAccessTokenObject } from './models';
import { Encrypter } from './encrypter';



export class GitlabOAuth {
    options: GitlabOAuthOptions;
    defaultOptions: GitlabOAuthOptions = <any>{ protocol: 'https' };

    authorizeUrl: string;
    accessTokenUrl: string;

    encrypter = new Encrypter();

    constructor(options: GitlabOAuthOptions) {
        if (!options || !options.clientId || !options.clientSecret || !options.domainName) {
            throw new Error('Parameter is not valid, need client_id and client_secret and server_url!');
        }
        this.options = Object.assign(this.defaultOptions, options);

        this.authorizeUrl = '://' + options.domainName + '/oauth/authorize';
        this.accessTokenUrl = '://' + options.domainName + '/oauth/token';
    }

    getAuthorizeURL(redirectUrl: string) {
        if (!redirectUrl) {
            throw new Error('Parameter is not valid, redirect_uri is needed!');
        }

        var query = {
            client_id: this.options.clientId,
            response_type: 'code',
            redirect_uri: redirectUrl
        };
        var queryString = qs.stringify(query);
        return this.options.protocol + this.authorizeUrl + '?' + queryString;
    };


    getAccessToken(code: any, redirectUrl: any, callback: any) {
        if (!code) { // || !opts.redirect_uri) {
            throw new Error('Options cannot be null and need the exchange code and redirect_uri!');
        }

        var that = this;
        var oauthData = {
            client_id: this.options.clientId,
            client_secret: this.options.clientSecret,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUrl
        };
        // _.merge(oauth_data, opts);

        var accessToken = new Promise<any>(function (resolve: (value: any) => any, reject: (value: any) => any) {
            request.post({
                url: that.options.protocol + that.accessTokenUrl,
                form: oauthData,
                headers: {
                    'Accept': 'application/json'
                }
            }, function (err: any, response: any, body: any) {
                if (err || response.statusCode >= 400) {
                    return reject(err || body || response.statusCode);
                }
                try {
                    var result = JSON.parse(body);
                    if (result.error) {
                        return reject(result);
                    }
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            });
        });

        if (typeof callback !== 'function') {
            return accessToken;
        }

        return accessToken.then(
            function (res: any) {
                callback(null, res);
            }, function (err: any) {
                callback(err);
            });
    };

    generateJwt(gitlabToken: GitlabAccessTokenObject) {
        // get info from gitlab to the logged User
        return this.getGitlabUser(this.options.domainName, gitlabToken.access_token).then((userData) => {

            // creates the jwt token
            var token = jsonWebToken.sign({
                payload: {
                    gitlabToken: {
                        accessTokenEnc: this.encrypter.encrypt(gitlabToken.access_token),
                        expiresIn: gitlabToken.expires_in,
                        tokenType: gitlabToken.token_type,
                        refreshTokenEnc: this.encrypter.encrypt(gitlabToken.refresh_token),
                    }
                }
            },
                this.encrypter.keys.privateKey,
                {
                    algorithm: 'RS256',
                    subject: `${this.options.domainName}/user/${userData.id}`,
                    issuer: 'fast-gitlab-client',
                    expiresIn: '360 minutes'
                });


            jsonWebToken.verify(token, this.encrypter.keys.publicKey, { algorithms: ['RS256'] }, (err) => {
                if (err) {
                    console.error('TOken não é válido!', err);
                }
            });
            return token;
        });
    }

    getGitlabUser(domainName: string, accessToken: string) {
        var promise = new Promise<any>((resolve, reject) => {
            var req = https.request({
                host: domainName,
                port: 443,
                path: '/api/v3/user?access_token=' + accessToken,
                method: 'GET',
                rejectUnauthorized: false,
                agent: false
            }, (res => {
                if (res.statusCode === 200) {
                    res.on('data', (payload) => {
                        var userData = JSON.parse(<string>payload);
                        resolve(userData);
                    });
                } else {
                    reject({
                        statusCode: res.statusCode
                    });
                }

            }));
            req.end();
        });
        return promise;
    }
}