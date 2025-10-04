#!/usr/bin/env node
/**
 * Validate BIP-352 test vectors for internal consistency and correctness
 *
 * Validation checks:
 * 1. Mnemonic → Seed conversion
 * 2. Seed → Root key derivation
 * 3. Root key → Derived keys (scan/spend)
 * 4. Private key → Public key derivation
 * 5. Extended key parent/child relationships
 * 6. Silent Payment address encoding/decoding
 * 7. BIP32 checksum validation
 */

const bip39 = require('bip39');
const BIP32Factory = require('bip32').default;
const ecc = require('tiny-secp256k1');
const bip32 = BIP32Factory(ecc);
const crypto = require('crypto');

const BECH32M_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BECH32M_CONST = 0x2bc830a3;

function bech32Polymod(values) {
    const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
    let chk = 1;
    for (const v of values) {
        const b = chk >> 25;
        chk = (chk & 0x1ffffff) << 5 ^ v;
        for (let i = 0; i < 5; i++) {
            chk ^= ((b >> i) & 1) ? GEN[i] : 0;
        }
    }
    return chk;
}

function bech32HrpExpand(hrp) {
    const ret = [];
    for (let i = 0; i < hrp.length; i++) {
        ret.push(hrp.charCodeAt(i) >> 5);
    }
    ret.push(0);
    for (let i = 0; i < hrp.length; i++) {
        ret.push(hrp.charCodeAt(i) & 31);
    }
    return ret;
}

function bech32Decode(bechString) {
    const pos = bechString.lastIndexOf('1');
    if (pos < 1) return null;

    const hrp = bechString.substring(0, pos);
    const data = [];

    for (let i = pos + 1; i < bechString.length; i++) {
        const d = BECH32M_CHARSET.indexOf(bechString.charAt(i));
        if (d === -1) return null;
        data.push(d);
    }

    const checksum = bech32Polymod([...bech32HrpExpand(hrp), ...data]);
    if (checksum !== BECH32M_CONST) {
        return null;
    }

    return { hrp, data: data.slice(0, -6) };
}

function convertBits(data, fromBits, toBits, pad) {
    let acc = 0;
    let bits = 0;
    const ret = [];
    const maxv = (1 << toBits) - 1;

    for (const value of data) {
        acc = (acc << fromBits) | value;
        bits += fromBits;
        while (bits >= toBits) {
            bits -= toBits;
            ret.push((acc >> bits) & maxv);
        }
    }

    if (pad) {
        if (bits > 0) {
            ret.push((acc << (toBits - bits)) & maxv);
        }
    } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
        return null;
    }

    return ret;
}

// Load test vectors
const fs = require('fs');
const vectors = JSON.parse(fs.readFileSync('derivation_test_vectors_js.json', 'utf8'));

console.log('=== BIP-352 Test Vector Validation ===\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(description, condition, details = '') {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`✅ ${description}`);
        return true;
    } else {
        failedTests++;
        console.log(`❌ ${description}`);
        if (details) console.log(`   ${details}`);
        return false;
    }
}

for (let i = 0; i < vectors.test_vectors.length; i++) {
    const vector = vectors.test_vectors[i];
    const id = `Vector ${i + 1}: ${vector.test_name} (Account ${vector.account}, Address ${vector.address_index})`;

    console.log(`\n=== ${id} ===`);

    // 1. Validate mnemonic is valid
    test(
        'Mnemonic is valid BIP39',
        bip39.validateMnemonic(vector.mnemonic)
    );

    // 2. Validate seed derivation from mnemonic
    const derivedSeed = bip39.mnemonicToSeedSync(vector.mnemonic, vector.passphrase);
    test(
        'Seed correctly derived from mnemonic',
        derivedSeed.toString('hex') === vector.seed_hex,
        `Expected: ${vector.seed_hex}\nGot: ${derivedSeed.toString('hex')}`
    );

    // 3. Validate root key derivation from seed
    const rootKey = bip32.fromSeed(derivedSeed);
    test(
        'Root xprv matches',
        rootKey.toBase58() === vector.root_xprv
    );
    test(
        'Root xpub matches',
        rootKey.neutered().toBase58() === vector.root_xpub
    );

    // 4. Validate derivation paths are correct format
    test(
        'Scan path format correct',
        vector.derivation.scan_path === `m/352'/0'/${vector.account}'/1'/${vector.address_index}`
    );
    test(
        'Spend path format correct',
        vector.derivation.spend_path === `m/352'/0'/${vector.account}'/0'/${vector.address_index}`
    );

    // 5. Derive keys and validate
    const scanPath = vector.derivation.scan_path.replace('m/', '');
    const spendPath = vector.derivation.spend_path.replace('m/', '');

    const scanKey = rootKey.derivePath(scanPath);
    const spendKey = rootKey.derivePath(spendPath);

    test(
        'Scan private key matches',
        scanKey.privateKey.toString('hex') === vector.scan_key.private_key_hex
    );
    test(
        'Scan public key matches',
        scanKey.publicKey.toString('hex') === vector.scan_key.public_key_hex
    );
    test(
        'Scan xprv matches',
        scanKey.toBase58() === vector.scan_key.xprv
    );
    test(
        'Scan xpub matches',
        scanKey.neutered().toBase58() === vector.scan_key.xpub
    );

    test(
        'Spend private key matches',
        spendKey.privateKey.toString('hex') === vector.spend_key.private_key_hex
    );
    test(
        'Spend public key matches',
        spendKey.publicKey.toString('hex') === vector.spend_key.public_key_hex
    );
    test(
        'Spend xprv matches',
        spendKey.toBase58() === vector.spend_key.xprv
    );
    test(
        'Spend xpub matches',
        spendKey.neutered().toBase58() === vector.spend_key.xpub
    );

    // 6. Validate public keys are compressed (33 bytes, prefix 02 or 03)
    test(
        'Scan public key is compressed',
        vector.scan_key.public_key_hex.length === 66 &&
        (vector.scan_key.public_key_hex.startsWith('02') || vector.scan_key.public_key_hex.startsWith('03'))
    );
    test(
        'Spend public key is compressed',
        vector.spend_key.public_key_hex.length === 66 &&
        (vector.spend_key.public_key_hex.startsWith('02') || vector.spend_key.public_key_hex.startsWith('03'))
    );

    // 7. Validate private keys are 32 bytes
    test(
        'Scan private key is 32 bytes',
        vector.scan_key.private_key_hex.length === 64
    );
    test(
        'Spend private key is 32 bytes',
        vector.spend_key.private_key_hex.length === 64
    );

    // 8. Validate Silent Payment address
    const decoded = bech32Decode(vector.silent_payment_address);
    test(
        'Silent Payment address has valid bech32m checksum',
        decoded !== null
    );

    if (decoded) {
        test(
            'Silent Payment address uses correct HRP (sp)',
            decoded.hrp === 'sp'
        );

        // Decode the data payload
        const bytes = convertBits(decoded.data, 5, 8, false);
        if (bytes) {
            test(
                'Silent Payment address decodes to 67 bytes (version + 2 pubkeys)',
                bytes.length === 67
            );

            if (bytes.length === 67) {
                test(
                    'Silent Payment address version is 0',
                    bytes[0] === 0
                );

                const scanPubBytes = Buffer.from(bytes.slice(1, 34));
                const spendPubBytes = Buffer.from(bytes.slice(34, 67));

                test(
                    'Silent Payment address contains correct scan pubkey',
                    scanPubBytes.toString('hex') === vector.scan_key.public_key_hex
                );
                test(
                    'Silent Payment address contains correct spend pubkey',
                    spendPubBytes.toString('hex') === vector.spend_key.public_key_hex
                );
            }
        }
    }

    // 9. Validate xprv/xpub relationships
    const scanXprv = bip32.fromBase58(vector.scan_key.xprv);
    const scanXpub = bip32.fromBase58(vector.scan_key.xpub);
    test(
        'Scan xpub is neutered version of scan xprv',
        scanXprv.neutered().toBase58() === scanXpub.toBase58()
    );

    const spendXprv = bip32.fromBase58(vector.spend_key.xprv);
    const spendXpub = bip32.fromBase58(vector.spend_key.xpub);
    test(
        'Spend xpub is neutered version of spend xprv',
        spendXprv.neutered().toBase58() === spendXpub.toBase58()
    );
}

console.log('\n=== Validation Summary ===');
console.log(`Total tests: ${totalTests}`);
console.log(`Passed: ${passedTests} ✅`);
console.log(`Failed: ${failedTests} ❌`);

if (failedTests === 0) {
    console.log('\n🎉 ALL VALIDATION TESTS PASSED!');
    console.log('✅ Test vectors are internally consistent and cryptographically correct.');
    process.exit(0);
} else {
    console.log('\n⚠️  SOME VALIDATION TESTS FAILED!');
    console.log('Please review the failures above.');
    process.exit(1);
}
