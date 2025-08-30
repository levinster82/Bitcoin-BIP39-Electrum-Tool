/* bech32 */
const bech32Module = require('bech32')

/* biginteger */
const BigIntegerModule = require('javascript-biginteger')

/* bitcoinjs-bip38 */
const bip38Module = require('bip38')

/* bip39 */
const bip39Module = require('bip39')

/* bip85 */
const bip85Module = require('bip85')

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

/* fast-levenshtein */
const levenshteinModule = require('fast-levenshtein')

/* kjua qr codes */
const kjuaModule = require('kjua')

/* unorm */
const unormModule = require('unorm')

/* zxcvbn */
const zxcvbnModule = require('zxcvbn')

/* jquery */
const jQuery = require('jquery')

/* bootstrap */
const bootstrapModule = require('bootstrap')

/* sjcl */
const sjcl = require('sjcl')

/* bs58 */
let bs58Module;
try {
    bs58Module = require('bs58')
} catch(e) {
    console.warn('bs58 module not available:', e.message)
    bs58Module = null
}

// Create the main library object
const libs = {
    bech32: bech32Module,
    BigInteger: BigIntegerModule,
    bip38: bip38Module,
    bip39: bip39Module,
    bip85: bip85Module,
    bitcoin: bitcoinjsLib,
    bip32: bip32,
    ECPair: ecpair,
    buffer: bufferModule,
    levenshtein: levenshteinModule,
    kjua: kjuaModule,
    unorm: unormModule,
    zxcvbn: zxcvbnModule,
    jquery: jQuery,
    bootstrap: bootstrapModule,
    sjcl: sjcl,
    bs58: bs58Module
}

// Create bitcoinjs compatibility object for legacy code
libs.bitcoinjs = {
    bitcoin: bitcoinjsLib,
    bip32: bip32,
    ECPair: ecpair,
    bip39: bip39Module,
    bip38: bip38Module,
    bip85: bip85Module,
    buffer: bufferModule,
    levenshtein: levenshteinModule,
    BigInteger: BigIntegerModule,
    zxcvbn: zxcvbnModule,
    kjua: kjuaModule
}

// Make globals available in browser
if (typeof window !== 'undefined') {
    window.jQuery = jQuery
    window.$ = jQuery
    window.sjcl = sjcl
    window.bitcoinjs = libs.bitcoinjs
}

module.exports = libs