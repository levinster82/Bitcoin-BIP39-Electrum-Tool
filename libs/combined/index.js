
/* bech32 */

module.exports.bech32 = require('bech32')

/* biginteger */

module.exports.BigInteger = require('javascript-biginteger')

/* bitcoinjs-bip38 */

module.exports.bip38 = require('bip38')

/* bip85 */

module.exports.bip85 = require('bip85')

/* bitcoinjs-lib */

// Import the updated bitcoinjs-lib with separated libraries
const bitcoinjsLib = require('bitcoinjs-lib')
const ECPairFactory = require('ecpair').default
const BIP32Factory = require('bip32').default
const ecc = require('@bitcoinerlab/secp256k1')

// Initialize BIP32 with the elliptic curve library
const bip32 = BIP32Factory(ecc)

// Initialize ECPair with the elliptic curve library  
const ecpair = ECPairFactory(ecc)

module.exports.bitcoin = bitcoinjsLib
module.exports.bip32 = bip32
module.exports.ECPair = ecpair

/* buffer */

module.exports.buffer = require('buffer');


/* fast-levenshtein */

module.exports.levenshtein = require('fast-levenshtein')


/* kjua qr codes */

module.exports.kjua = require('kjua')





/* unorm */

module.exports.unorm = require('unorm')

/* zxcvbn */

module.exports.zxcvbn = require('zxcvbn')


/* bs58 */
try {
    module.exports.bs58 = require('bs58')
}
catch (e) {
    console.warn("Error loading bs58 library");
    console.warn(e);
};

/* create-hash */
try {
    module.exports.createHash = require('create-hash')
}
catch (e) {
    console.warn("Error loading create-hash library");
    console.warn(e);
};

