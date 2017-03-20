import { Request } from 'express';
import * as https from 'https';

export function getGitlabUser(domainName: string, accessToken: string) {
    console.log('AQUI');
    var promise = new Promise<any>((resolve, reject) => {
        var req = https.request({
            host: domainName,
            port: 443,
            path: '/api/v3/user?access_token=' + accessToken,
            method: 'GET',
            rejectUnauthorized: false,
            agent: false
        }, (res => {
            console.log('XXXX', res.statusCode)
            if (res.statusCode == 200) {
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