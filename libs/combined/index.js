
/* bech32 */

module.exports.bech32 = require('bech32')

/* biginteger */

module.exports.BigInteger = require('javascript-biginteger')

/* bitcoinjs-bip38 */

module.exports.bip38 = require('bip38')

/* bip39 */

module.exports.bip39 = require('bip39')

/* bip85 */

module.exports.bip85 = require('bip85')

/* bitcoinjs-lib */

// Import the updated bitcoinjs-lib with separated libraries
const bitcoinjsLib = require('bitcoinjs-lib')
const ECPairFactory = require('ecpair').default
const BIP32Factory = require('bip32').default
const ecc = require('@bitcoinerlab/secp256k1')

// Initialize bitcoinjs-lib with ECC library for Taproot support
bitcoinjsLib.initEccLib(ecc)

// Initialize BIP32 with the elliptic curve library
const bip32 = BIP32Factory(ecc)

// Initialize ECPair with the elliptic curve library  
const ecpair = ECPairFactory(ecc)

const bufferModule = require('buffer')

module.exports.bitcoin = bitcoinjsLib
module.exports.bip32 = bip32
module.exports.ECPair = ecpair

/* buffer */

module.exports.buffer = bufferModule


/* fast-levenshtein */

module.exports.levenshtein = require('fast-levenshtein')


/* kjua qr codes */

module.exports.kjua = require('kjua')





/* unorm */

module.exports.unorm = require('unorm')

/* zxcvbn */

module.exports.zxcvbn = require('zxcvbn')

/* jquery */

const jQuery = require('jquery')
module.exports.jquery = jQuery

// Make jQuery available globally
if (typeof window !== 'undefined') {
    window.jQuery = jQuery
    window.$ = jQuery
}

/* bootstrap */

module.exports.bootstrap = require('bootstrap')

/* sjcl */

const sjcl = require('sjcl')
module.exports.sjcl = sjcl

// Make sjcl available globally
if (typeof window !== 'undefined') {
    window.sjcl = sjcl
}


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

// Make all libraries available globally as bitcoinjs object
if (typeof window !== 'undefined') {
    window.bitcoinjs = {
        bitcoin: bitcoinjsLib,
        bip32: bip32,
        ECPair: ecpair,
        buffer: bufferModule,
        bip38: module.exports.bip38,
        bip39: module.exports.bip39,
        bip85: module.exports.bip85,
        BigInteger: module.exports.BigInteger,
        kjua: module.exports.kjua,
        levenshtein: module.exports.levenshtein,
        unorm: module.exports.unorm,
        zxcvbn: module.exports.zxcvbn,
        bech32: module.exports.bech32,
        bs58: module.exports.bs58,
        createHash: module.exports.createHash
    }
}

