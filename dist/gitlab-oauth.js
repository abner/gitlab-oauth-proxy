"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const qs = require("querystring");
const request = require("request");
const https = require("https");
const jsonWebToken = require("jsonwebtoken");
const encrypter_1 = require("./encrypter");
const config_1 = require("./config");
class GitlabOAuth {
    constructor(options) {
        this.defaultOptions = { protocol: 'https' };
        if (!options || !options.clientId || !options.clientSecret || !options.domainName) {
            throw new Error('Parameter is not valid, need client_id and client_secret and server_url!');
        }
        this.options = Object.assign(this.defaultOptions, options);
        this.authorizeUrl = '://' + options.domainName + '/oauth/authorize';
        this.accessTokenUrl = '://' + options.domainName + '/oauth/token';
        this.encrypter = new encrypter_1.Encrypter(options.privateKey);
    }
    getAuthorizeURL() {
        var query = {
            client_id: this.options.clientId,
            response_type: 'code',
            redirect_uri: this.getRedirectUri()
        };
        var queryString = qs.stringify(query);
        return this.options.protocol + this.authorizeUrl + '?' + queryString;
    }
    ;
    getRedirectUri() {
        return this.options.baseUrl + 'oauth_callback';
    }
    getAccessToken(code, callback) {
        if (!code) {
            throw new Error('Options cannot be null and need the exchange code and redirect_uri!');
        }
        var that = this;
        var oauthData = {
            client_id: this.options.clientId,
            client_secret: this.options.clientSecret,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: this.getRedirectUri()
        };
        // _.merge(oauth_data, opts);
        var accessToken = new Promise(function (resolve, reject) {
            request.post({
                url: that.options.protocol + that.accessTokenUrl,
                form: oauthData,
                headers: {
                    'Accept': 'application/json'
                }
            }, function (err, response, body) {
                if (err || response.statusCode >= 400) {
                    return reject(err || body || response.statusCode);
                }
                try {
                    var result = JSON.parse(body);
                    if (result.error) {
                        return reject(result);
                    }
                    resolve(result);
                }
                catch (e) {
                    reject(e);
                }
            });
        });
        if (typeof callback !== 'function') {
            return accessToken;
        }
        return accessToken.then(function (res) {
            callback(null, res);
        }, function (err) {
            callback(err);
        });
    }
    ;
    generateJwt(gitlabToken) {
        // get info from gitlab to the logged User
        return this.getGitlabUser(this.options.domainName, gitlabToken.access_token).then((userData) => {
            debugger;
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
            }, config_1.GITLAB_OAUTH_PROXY_CONFIG.privateKey, {
                algorithm: 'RS256',
                subject: `${this.options.domainName}/user/${userData.id}`,
                issuer: 'fast-gitlab-client',
                expiresIn: '360 minutes'
            });
            jsonWebToken.verify(token, config_1.GITLAB_OAUTH_PROXY_CONFIG.publicKey, { algorithms: ['RS256'] }, (err) => {
                if (err) {
                    console.error('TOken não é válido!', err);
                }
            });
            return token;
        });
    }
    getGitlabUser(domainName, accessToken) {
        var promise = new Promise((resolve, reject) => {
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
                        var userData = JSON.parse(payload);
                        resolve(userData);
                    });
                }
                else {
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
exports.GitlabOAuth = GitlabOAuth;
