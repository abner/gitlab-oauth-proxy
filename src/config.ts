
import * as _ from 'lodash';
import { GitlabOAuthOptions } from './models';

let GITLAB_PROXY_PRIVATE_KEY = process.env.GITLAB_PROXY_PRIVATE_KEY || '';
let GITLAB_PROXY_PUBLIC_KEY = process.env.GITLAB_PROXY_PUBLIC_KEY || '';
GITLAB_PROXY_PRIVATE_KEY = GITLAB_PROXY_PRIVATE_KEY.replace(/\\n/g, '\n');
GITLAB_PROXY_PUBLIC_KEY = GITLAB_PROXY_PUBLIC_KEY.replace(/\\n/g, '\n');

const GITLAB_CLIENT_ID = process.env.GITLAB_CLIENT_ID;
const GITLAB_CLIENT_SECRET = process.env.GITLAB_CLIENT_SECRET;
const GITLAB_TARGET_SERVICE = process.env.GITLAB_TARGET_SERVICE;

const ENVIRONMENT_VARIABLES_NAMES = {
    publicKey: 'GITLAB_PROXY_PUBLIC_KEY',
    privateKey: 'GITLAB_PROXY_PRIVATE_KEY',
    clientId: 'GITLAB_CLIENT_ID',
    clientSecret: 'GITLAB_CLIENT_SECRET',
    domainName: 'GITLAB_TARGET_SERVICE'
};
export function get(): GitlabOAuthOptions {
    let configObject = {
        publicKey: GITLAB_PROXY_PUBLIC_KEY,
        privateKey: GITLAB_PROXY_PRIVATE_KEY,
        clientId: GITLAB_CLIENT_ID,
        clientSecret: GITLAB_CLIENT_SECRET,
        domainName: GITLAB_TARGET_SERVICE
    };
    checkConfigObject(configObject);
    configObject['jwtConfig'] = { secret: GITLAB_PROXY_PUBLIC_KEY, algorithms: ['RS256'] };
    return configObject;
}

function checkConfigObject(config: GitlabOAuthOptions) {
    let errors = 0;

    Object.getOwnPropertyNames(config).forEach((name) => {
        if (_.isEmpty(config[name])) {
            console.error(`Envirionment variable "${ENVIRONMENT_VARIABLES_NAMES[name]}" was not defined.`);
            errors += 1;
        }
    });
    if (errors > 0) {
        process.exit(1);
    }
}