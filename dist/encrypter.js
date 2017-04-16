"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const constants = require("constants");
class Encrypter {
    constructor(certificate) {
        this.certificate = (certificate instanceof Buffer) ? certificate.toString() : certificate;
    }
    encrypt(data) {
        console.log('Encrypting ...', data);
        var jsonData = JSON.stringify(data);
        console.log('After Stringify', this.certificate, (typeof this.certificate));
        try {
            var bufferEncrypted = crypto.publicEncrypt({
                key: this.certificate,
                padding: constants.RSA_PKCS1_PADDING
            }, new Buffer(jsonData));
        }
        catch (e) {
            console.error('Eeror encrypting', e);
        }
        console.log('After buffer encrypted', bufferEncrypted);
        return bufferEncrypted.toString('base64');
    }
    decrypt(data) {
        var bufferEncrypted = new Buffer(data, 'base64');
        var bufferDecrypted = crypto.privateDecrypt({
            key: this.certificate,
            padding: constants.RSA_PKCS1_PADDING
        }, bufferEncrypted);
        var stringJsonData = bufferDecrypted.toString('utf-8');
        return JSON.parse(stringJsonData);
    }
}
exports.Encrypter = Encrypter;
