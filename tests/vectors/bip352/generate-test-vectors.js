/**
 * BIP-352 Test Vector Generator (JavaScript)
 *
 * Generates test vectors for BIP-352 Silent Payments derivation testing
 * Uses: mnemonic -> seed -> BIP32 derivation -> scan/spend keys -> SP address
 */

const bip39 = require('bip39');
const BIP32Factory = require('bip32').default;
const ecc = require('tiny-secp256k1');
const bip32 = BIP32Factory(ecc);
const { encodeSilentPaymentAddress } = require('../../../libs/bip352-silentpayments/src/index.js');

// Test cases with known mnemonics
const testCases = [
    {
        name: "BIP39 Test Vector 1",
        mnemonic: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
        passphrase: "",
        accounts: [0, 1, 2],
        addressIndices: [0, 1, 2]
    },
    {
        name: "BIP39 Test Vector 2",
        mnemonic: "legal winner thank year wave sausage worth useful legal winner thank yellow",
        passphrase: "",
        accounts: [0, 1],
        addressIndices: [0, 1]
    },
    {
        name: "BIP39 with Passphrase",
        mnemonic: "letter advice cage absurd amount doctor acoustic avoid letter advice cage above",
        passphrase: "TREZOR",
        accounts: [0],
        addressIndices: [0, 1]
    },
    {
        name: "12-word Mnemonic",
        mnemonic: "zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong",
        passphrase: "",
        accounts: [0],
        addressIndices: [0]
    }
];

function generateTestVectors() {
    const vectors = [];

    for (const testCase of testCases) {
        console.log(`\n=== Generating: ${testCase.name} ===`);

        // Validate mnemonic
        if (!bip39.validateMnemonic(testCase.mnemonic)) {
            console.error(`Invalid mnemonic: ${testCase.name}`);
            continue;
        }

        // Generate seed
        const seed = bip39.mnemonicToSeedSync(testCase.mnemonic, testCase.passphrase);
        const rootKey = bip32.fromSeed(seed);

        console.log(`Mnemonic: ${testCase.mnemonic}`);
        console.log(`Passphrase: "${testCase.passphrase}"`);
        console.log(`Seed (hex): ${seed.toString('hex')}`);
        console.log(`Root xprv: ${rootKey.toBase58()}`);

        for (const account of testCase.accounts) {
            for (const addressIndex of testCase.addressIndices) {

                // Derive scan key: m/352'/0'/account'/1'/addressIndex
                const scanPath = `m/352'/0'/${account}'/1'/${addressIndex}`;
                const scanKey = rootKey
                    .deriveHardened(352)
                    .deriveHardened(0)
                    .deriveHardened(account)
                    .deriveHardened(1)
                    .derive(addressIndex);

                // Derive spend key: m/352'/0'/account'/0'/addressIndex
                const spendPath = `m/352'/0'/${account}'/0'/${addressIndex}`;
                const spendKey = rootKey
                    .deriveHardened(352)
                    .deriveHardened(0)
                    .deriveHardened(account)
                    .deriveHardened(0)
                    .derive(addressIndex);

                // Generate Silent Payment address
                const silentPaymentAddress = encodeSilentPaymentAddress(
                    scanKey.publicKey,
                    spendKey.publicKey,
                    false // mainnet
                );

                const vector = {
                    test_name: testCase.name,
                    mnemonic: testCase.mnemonic,
                    passphrase: testCase.passphrase,
                    seed_hex: seed.toString('hex'),
                    root_xprv: rootKey.toBase58(),
                    root_xpub: rootKey.neutered().toBase58(),
                    account: account,
                    address_index: addressIndex,
                    derivation: {
                        scan_path: scanPath,
                        spend_path: spendPath
                    },
                    scan_key: {
                        private_key_hex: scanKey.privateKey.toString('hex'),
                        public_key_hex: scanKey.publicKey.toString('hex'),
                        xprv: scanKey.toBase58(),
                        xpub: scanKey.neutered().toBase58()
                    },
                    spend_key: {
                        private_key_hex: spendKey.privateKey.toString('hex'),
                        public_key_hex: spendKey.publicKey.toString('hex'),
                        xprv: spendKey.toBase58(),
                        xpub: spendKey.neutered().toBase58()
                    },
                    silent_payment_address: silentPaymentAddress
                };

                vectors.push(vector);

                console.log(`\nAccount ${account}, Address ${addressIndex}:`);
                console.log(`  Scan:  ${scanPath}`);
                console.log(`    priv: ${vector.scan_key.private_key_hex}`);
                console.log(`    pub:  ${vector.scan_key.public_key_hex}`);
                console.log(`  Spend: ${spendPath}`);
                console.log(`    priv: ${vector.spend_key.private_key_hex}`);
                console.log(`    pub:  ${vector.spend_key.public_key_hex}`);
                console.log(`  SP Address: ${silentPaymentAddress}`);
            }
        }
    }

    return vectors;
}

// Generate and output
const vectors = generateTestVectors();

// Write to JSON file
const fs = require('fs');
const output = {
    generated_by: "JavaScript BIP-352 Test Vector Generator",
    generated_at: new Date().toISOString(),
    implementation: "bip39 + bip32 + tiny-secp256k1 + custom bip352",
    note: "Test vectors for BIP-352 Silent Payments full derivation from mnemonic",
    test_vectors: vectors
};

const outputPath = __dirname + '/derivation_test_vectors_js.json';
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(`\n✅ Generated ${vectors.length} test vectors`);
console.log(`📝 Saved to: ${outputPath}`);
