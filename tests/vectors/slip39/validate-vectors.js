// Validates the shipped src/js/slip39-js.js bundle against the official SLIP-39 test vectors
// from trezor/python-shamir-mnemonic (MIT licensed), vendored at ./vectors.json - see
// README.md in this directory for provenance.
//
// Usage: node validate-vectors.js
//
// Unlike the browser-based tests/spec/slip39vectors-fast.js, this doesn't need a running
// dev server or browser - it exercises the same shipped library artifact directly under Node
// (not just the submodule source), so it's fast enough to run on every change.

const fs = require('fs');
const path = require('path');
const SLIP39 = require('../../../src/js/slip39-js.js');
const { BIP32Factory } = require('../../../libs/combined/node_modules/bip32');
const ecc = require('../../../libs/combined/node_modules/tiny-secp256k1');

const bip32 = BIP32Factory(ecc);

const vectors = JSON.parse(fs.readFileSync(path.join(__dirname, 'vectors.json'), 'utf8'));

let passed = 0;
let failed = 0;
const failures = [];

for (const [description, mnemonics, expectedSecretHex, expectedXprv] of vectors) {
    const isValidCase = expectedSecretHex.length > 0;
    let actualSecretHex = null;
    let actualXprv = null;
    let threw = false;
    let errorMessage = null;

    try {
        const secretBytes = SLIP39.recoverSecret(mnemonics, 'TREZOR');
        actualSecretHex = Buffer.from(secretBytes).toString('hex');
        actualXprv = bip32.fromSeed(Buffer.from(secretBytes)).toBase58();
    } catch (e) {
        threw = true;
        errorMessage = e.message;
    }

    const ok = isValidCase
        ? (!threw && actualSecretHex === expectedSecretHex && actualXprv === expectedXprv)
        : threw;

    if (ok) {
        passed++;
    } else {
        failed++;
        failures.push({ description, isValidCase, threw, errorMessage, actualSecretHex, expectedSecretHex, actualXprv, expectedXprv });
    }
}

console.log(`${passed}/${vectors.length} vectors passed`);
if (failed > 0) {
    console.log(`\n${failed} FAILURE(S):`);
    for (const f of failures) {
        console.log(`\n- ${f.description}`);
        console.log(`  expected ${f.isValidCase ? 'success' : 'an error'}, got ${f.threw ? 'error: ' + f.errorMessage : 'success'}`);
        if (f.isValidCase && !f.threw) {
            console.log(`  secret: expected ${f.expectedSecretHex}, got ${f.actualSecretHex}`);
            console.log(`  xprv:   expected ${f.expectedXprv}, got ${f.actualXprv}`);
        }
    }
    process.exit(1);
}
