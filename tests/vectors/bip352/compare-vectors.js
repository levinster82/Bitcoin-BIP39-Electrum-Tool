#!/usr/bin/env node
/**
 * Compare test vectors from JavaScript and Python implementations
 * to verify cross-implementation correctness
 */

const fs = require('fs');

// Load both vector files
const jsVectors = JSON.parse(fs.readFileSync('derivation_test_vectors_js.json', 'utf8'));
const pyVectors = JSON.parse(fs.readFileSync('derivation_test_vectors_py.json', 'utf8'));

console.log('=== BIP-352 Test Vector Comparison ===\n');
console.log(`JavaScript vectors: ${jsVectors.test_vectors.length}`);
console.log(`Python vectors:     ${pyVectors.test_vectors.length}\n`);

if (jsVectors.test_vectors.length !== pyVectors.test_vectors.length) {
    console.error('❌ ERROR: Different number of test vectors!\n');
    process.exit(1);
}

let allMatch = true;
let vectorsCompared = 0;

for (let i = 0; i < jsVectors.test_vectors.length; i++) {
    const js = jsVectors.test_vectors[i];
    const py = pyVectors.test_vectors[i];

    const vectorId = `${js.test_name} - Account ${js.account}, Address ${js.address_index}`;

    // Fields to compare
    const fieldsToCompare = [
        { path: ['mnemonic'], name: 'Mnemonic' },
        { path: ['passphrase'], name: 'Passphrase' },
        { path: ['seed_hex'], name: 'Seed' },
        { path: ['root_xprv'], name: 'Root xprv' },
        { path: ['root_xpub'], name: 'Root xpub' },
        { path: ['derivation', 'scan_path'], name: 'Scan path' },
        { path: ['derivation', 'spend_path'], name: 'Spend path' },
        { path: ['scan_key', 'private_key_hex'], name: 'Scan private key' },
        { path: ['scan_key', 'public_key_hex'], name: 'Scan public key' },
        { path: ['scan_key', 'xprv'], name: 'Scan xprv' },
        { path: ['scan_key', 'xpub'], name: 'Scan xpub' },
        { path: ['spend_key', 'private_key_hex'], name: 'Spend private key' },
        { path: ['spend_key', 'public_key_hex'], name: 'Spend public key' },
        { path: ['spend_key', 'xprv'], name: 'Spend xprv' },
        { path: ['spend_key', 'xpub'], name: 'Spend xpub' },
        { path: ['silent_payment_address'], name: 'Silent Payment Address' }
    ];

    let vectorMatches = true;

    for (const field of fieldsToCompare) {
        let jsValue = js;
        let pyValue = py;

        // Navigate nested path
        for (const key of field.path) {
            jsValue = jsValue[key];
            pyValue = pyValue[key];
        }

        if (jsValue !== pyValue) {
            if (vectorMatches) {
                console.log(`\n❌ MISMATCH in: ${vectorId}`);
                vectorMatches = false;
                allMatch = false;
            }
            console.log(`  ${field.name}:`);
            console.log(`    JS: ${jsValue}`);
            console.log(`    PY: ${pyValue}`);
        }
    }

    if (vectorMatches) {
        console.log(`✅ ${vectorId}`);
    }

    vectorsCompared++;
}

console.log(`\n=== Summary ===`);
console.log(`Vectors compared: ${vectorsCompared}`);

if (allMatch) {
    console.log('✅ ALL VECTORS MATCH! Cross-implementation verification successful.');
    process.exit(0);
} else {
    console.log('❌ SOME VECTORS DO NOT MATCH! Please investigate discrepancies.');
    process.exit(1);
}
