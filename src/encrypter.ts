import * as crypto from 'crypto';
import * as constants from 'constants';


export class Encrypter {
    private certificate: string;

    constructor(certificate: string | Buffer) {
        this.certificate = (certificate instanceof Buffer) ? certificate.toString() : certificate;
    }

    encrypt(data: any) {
        console.log('Encrypting ...', data);
        var jsonData = JSON.stringify(data);
        console.log('After Stringify', this.certificate, (typeof this.certificate));

        try {

            var bufferEncrypted = crypto.publicEncrypt(
                {
                    key: this.certificate,
                    padding: constants.RSA_PKCS1_PADDING
                }, new Buffer(jsonData));
        } catch (e) {
            console.error('Eeror encrypting', e);
        }

        console.log('After buffer encrypted');
        return bufferEncrypted.toString('base64');
    }

    decrypt<T>(data: any): T {
        var bufferEncrypted = new Buffer(data, 'base64');

        var bufferDecrypted = crypto.privateDecrypt({
            key: this.certificate,
            padding: constants.RSA_PKCS1_PADDING
        }, bufferEncrypted);

        var stringJsonData = bufferDecrypted.toString('utf-8');

        return JSON.parse(stringJsonData);
    }
}