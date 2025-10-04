/**
 * Simple test script for BIP-352 Silent Payments
 * Run with: node test-bip352.js
 */

const bip39 = require('bip39');
const BIP32Factory = require('bip32').default;
const ecc = require('tiny-secp256k1');
const bip32 = BIP32Factory(ecc);
const BIP352 = require('./src/index.js');

console.log('=== BIP-352 Silent Payments Test ===\n');

// Test mnemonic (DO NOT use in production!)
const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
console.log('Mnemonic:', mnemonic);
console.log('Valid:', bip39.validateMnemonic(mnemonic));

// Generate seed
const seed = bip39.mnemonicToSeedSync(mnemonic);
console.log('\nSeed (hex):', seed.toString('hex').substring(0, 64) + '...');

// Create root key
const rootKey = bip32.fromSeed(seed);
console.log('Root key (xprv):', rootKey.toBase58().substring(0, 20) + '...');

// Test 1: Derive Silent Payment keys
console.log('\n--- Test 1: Derive Silent Payment Keys ---');
const keys = BIP352.deriveSilentPaymentKeys(rootKey, 0);

console.log('\nScan Key:');
console.log('  Path:', keys.scan.path);
console.log('  xprv:', keys.scan.xprv);
console.log('  xpub:', keys.scan.xpub);
console.log('  Public Key (hex):', keys.scan.publicKey.toString('hex'));

console.log('\nSpend Key:');
console.log('  Path:', keys.spend.path);
console.log('  xprv:', keys.spend.xprv);
console.log('  xpub:', keys.spend.xpub);
console.log('  Public Key (hex):', keys.spend.publicKey.toString('hex'));

// Test 2: Generate Silent Payment address
console.log('\n--- Test 2: Generate Silent Payment Address ---');
const result = BIP352.generateSilentPaymentAddress(rootKey, 0, false);

console.log('Silent Payment Address (mainnet):', result.address);
console.log('Address length:', result.address.length);
console.log('Prefix:', result.address.substring(0, 4));

// Test with testnet
const resultTestnet = BIP352.generateSilentPaymentAddress(rootKey, 0, true);
console.log('Silent Payment Address (testnet):', resultTestnet.address);

// Test 3: Decode Silent Payment address
console.log('\n--- Test 3: Decode Silent Payment Address ---');
try {
    const decoded = BIP352.decodeSilentPaymentAddress(result.address);
    console.log('Version:', decoded.version);
    console.log('Scan PubKey (hex):', decoded.scanPubKey.toString('hex'));
    console.log('Spend PubKey (hex):', decoded.spendPubKey.toString('hex'));
    console.log('Testnet:', decoded.testnet);

    // Verify round-trip
    const matches =
        decoded.scanPubKey.equals(keys.scan.publicKey) &&
        decoded.spendPubKey.equals(keys.spend.publicKey);
    console.log('\nRound-trip verification:', matches ? '✓ PASSED' : '✗ FAILED');
} catch (e) {
    console.error('Decode error:', e.message);
}

// Test 4: Get derivation paths
console.log('\n--- Test 4: Derivation Paths ---');
console.log('Scan path (account 0):', BIP352.getDerivationPath('scan', 0));
console.log('Spend path (account 0):', BIP352.getDerivationPath('spend', 0));
console.log('Scan path (account 1):', BIP352.getDerivationPath('scan', 1));
console.log('Spend path (account 1):', BIP352.getDerivationPath('spend', 1));

// Test 5: Multiple accounts
console.log('\n--- Test 5: Multiple Accounts ---');
for (let account = 0; account < 3; account++) {
    const addr = BIP352.generateSilentPaymentAddress(rootKey, account, false);
    console.log(`Account ${account}: ${addr.address}`);
}

console.log('\n=== All Tests Complete ===');
