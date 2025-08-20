// Source file for building bitcoinjs-lib bundle with all dependencies
const bitcoin = require('bitcoinjs-lib')
const ECPair = require('ecpair')
const bip32Module = require('bip32')
const ecc = require('@bitcoinerlab/secp256k1')
const buffer = require('buffer')
const bip38 = require('bip38')
const bip85 = require('bip85')
const BigInteger = require('javascript-biginteger')
const kjua = require('kjua')
const levenshtein = require('fast-levenshtein')
const zxcvbn = require('zxcvbn')

// Initialize bitcoinjs-lib with ECC library for Taproot support
bitcoin.initEccLib(ecc)

// Initialize BIP32 with the elliptic curve library
const bip32 = bip32Module.BIP32Factory(ecc)

// Initialize ECPair with the elliptic curve library  
const ecpair = ECPair.ECPairFactory(ecc)

module.exports = {
  bitcoin,
  bip32,
  ECPair: ecpair,
  buffer,
  bip38,
  bip85,
  BigInteger,
  kjua,
  levenshtein,
  zxcvbn
}