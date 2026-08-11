// Minimal browser polyfill for the subset of Node's crypto module that
// slip39-js still uses at runtime: randomBytes, pbkdf2Sync, createHmac.
//
// Deliberately built from the same packages crypto-browserify itself depends
// on (randombytes, pbkdf2, create-hmac — see crypto-browserify's own
// package.json), rather than requiring the crypto-browserify umbrella
// package. slip39-js never calls the RSA/DH/cipher/sign-verify APIs that
// umbrella also bundles (browserify-sign, diffie-hellman, public-encrypt,
// browserify-cipher, create-ecdh, randomfill), so pulling it in wholesale
// only adds dead weight — including an unresolved `vm` import from
// asn1.js deep under browserify-sign. Requiring the three focused packages
// directly avoids that, at identical maintenance/provenance to
// crypto-browserify's own dependency graph.
//
// crypto.timingSafeEqual — the one Node crypto call with no
// crypto-browserify equivalent — was removed upstream instead of polyfilled
// here; see docs/slip39/README.md.
module.exports = {
    randomBytes: require('randombytes'),
    pbkdf2Sync: require('pbkdf2').pbkdf2Sync,
    createHmac: require('create-hmac')
};
