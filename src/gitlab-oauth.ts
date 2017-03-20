import * as qs from 'querystring';
import * as _ from 'lodash';
import * as request from 'request';
import { GitlabOAuthOptions } from "./models";



export class GitlabOAuth {
    options: GitlabOAuthOptions;
    defaultOptions: GitlabOAuthOptions = <any>{ protocol: 'https' };

    authorizeUrl: string;
    accessTokenUrl: string;

    constructor(options: GitlabOAuthOptions) {
        if (!options || !options.clientId || !options.clientSecret || !options.domainName) {
            throw new Error('Parameter is not valid, need client_id and client_secret and server_url!');
        }
        this.options = Object.assign(this.defaultOptions, options);

        this.authorizeUrl = '://' + options.domainName + '/oauth/authorize';
        this.accessTokenUrl = '://' + options.domainName + '/oauth/token';
    }

    getAuthorizeURL(redirectUrl) {
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


    getAccessToken(code, redirectUrl, callback) {
        if (!code) { // || !opts.redirect_uri) {
            throw new Error('Options cannot be null and need the exchange code and redirect_uri!');
        }

        var that = this;
        var oauth_data = {
            client_id: this.options.clientId,
            client_secret: this.options.clientSecret,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUrl
        };
        // _.merge(oauth_data, opts);

        var accessToken = new Promise<any>(function (resolve, reject) {
            request.post({
                url: that.options.protocol + that.accessTokenUrl,
                form: oauth_data,
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
                } catch (e) {
                    reject(e);
                }
            });
        });

        if (typeof callback !== 'function') {
            return accessToken;
        }

        return accessToken.then(
            function (res) {
                callback(null, res);
            }, function (err) {
                callback(err);
            });
    };


}