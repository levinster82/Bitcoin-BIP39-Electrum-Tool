/**
 * BIP-352 Silent Payments Implementation
 *
 * This library provides key derivation and address generation for Bitcoin Silent Payments.
 *
 * Derivation Paths:
 * - Scan Key:  m/352'/0'/0'/1'/0
 * - Spend Key: m/352'/0'/0'/0'/0
 *
 * Reference: https://github.com/bitcoin/bips/blob/master/bip-0352.mediawiki
 */

const bip32 = require('bip32');
const { bech32m } = require('bech32');

/**
 * BIP-352 Constants
 */
const BIP352_PURPOSE = 352;
const BIP352_COIN_TYPE = 0; // Bitcoin mainnet
const BIP352_ACCOUNT = 0;   // First account
const SILENT_PAYMENT_VERSION = 0;
const SILENT_PAYMENT_HRP = 'sp'; // Human-readable part for mainnet
const SILENT_PAYMENT_HRP_TESTNET = 'tsp'; // For testnet

/**
 * Derive Silent Payment keys from a BIP32 root key
 *
 * @param {BIP32Interface} rootKey - The master BIP32 key (from mnemonic seed)
 * @param {number} account - Account index (default: 0)
 * @returns {Object} Object containing scan and spend keys
 */
function deriveSilentPaymentKeys(rootKey, account = 0) {
    // BIP-352 derivation paths
    // m/352'/0'/account'/1'/0 for scan key
    // m/352'/0'/account'/0'/0 for spend key

    const basePath = rootKey
        .deriveHardened(BIP352_PURPOSE)
        .deriveHardened(BIP352_COIN_TYPE)
        .deriveHardened(account);

    // Derive scan key (change = 1)
    const scanKey = basePath
        .deriveHardened(1)  // Change index 1 for scan
        .derive(0);         // Address index 0

    // Derive spend key (change = 0)
    const spendKey = basePath
        .deriveHardened(0)  // Change index 0 for spend
        .derive(0);         // Address index 0

    return {
        scan: {
            privateKey: scanKey.privateKey,
            publicKey: scanKey.publicKey,
            xprv: scanKey.toBase58(),
            xpub: scanKey.neutered().toBase58(),
            path: `m/352'/0'/${account}'/1'/0`
        },
        spend: {
            privateKey: spendKey.privateKey,
            publicKey: spendKey.publicKey,
            xprv: spendKey.toBase58(),
            xpub: spendKey.neutered().toBase58(),
            path: `m/352'/0'/${account}'/0'/0`
        }
    };
}

/**
 * Encode Silent Payment address from scan and spend public keys
 *
 * @param {Buffer} scanPubKey - 33-byte compressed scan public key
 * @param {Buffer} spendPubKey - 33-byte compressed spend public key
 * @param {boolean} testnet - Whether to use testnet prefix (default: false)
 * @returns {string} Bech32m-encoded Silent Payment address (sp1q... or tsp1q...)
 */
function encodeSilentPaymentAddress(scanPubKey, spendPubKey, testnet = false) {
    if (!Buffer.isBuffer(scanPubKey) || scanPubKey.length !== 33) {
        throw new Error('Scan public key must be a 33-byte compressed public key');
    }
    if (!Buffer.isBuffer(spendPubKey) || spendPubKey.length !== 33) {
        throw new Error('Spend public key must be a 33-byte compressed public key');
    }

    // Per BIP-352: scan_pubkey (33 bytes) + spend_pubkey (33 bytes)
    // Total: 66 bytes of data
    const hrp = testnet ? SILENT_PAYMENT_HRP_TESTNET : SILENT_PAYMENT_HRP;

    // Concatenate scan and spend public keys
    const data = Buffer.concat([scanPubKey, spendPubKey]);

    // Convert 8-bit bytes to 5-bit words
    const dataWords = convertBits(Array.from(data), 8, 5, true);

    // Prepend version as a 5-bit word (not a byte)
    // BIP-352 specifies: The character 'q' represents version 0
    const words = [SILENT_PAYMENT_VERSION, ...dataWords];

    // Encode using bech32m (not bech32)
    // Note: bech32 library accepts (hrp, words, LIMIT) where LIMIT is optional
    const address = bech32m.encode(hrp, words, 1023); // Increase limit to support Silent Payments

    return address;
}

/**
 * Decode a Silent Payment address to extract scan and spend public keys
 *
 * @param {string} address - Silent Payment address (sp1q... or tsp1q...)
 * @returns {Object} Object containing version, scanPubKey, and spendPubKey
 */
function decodeSilentPaymentAddress(address) {
    let decoded;
    try {
        decoded = bech32m.decode(address, 1023);
    } catch (e) {
        throw new Error('Invalid Silent Payment address: ' + e.message);
    }

    const { prefix, words } = decoded;

    // Validate prefix
    if (prefix !== SILENT_PAYMENT_HRP && prefix !== SILENT_PAYMENT_HRP_TESTNET) {
        throw new Error(`Invalid Silent Payment address prefix: ${prefix}`);
    }

    // First word is the version
    const version = words[0];
    if (version !== SILENT_PAYMENT_VERSION) {
        throw new Error(`Unsupported Silent Payment version: ${version}`);
    }

    // Convert remaining 5-bit words back to 8-bit bytes
    const data = convertBits(words.slice(1), 5, 8, false);
    const dataBuffer = Buffer.from(data);

    // Expected: scan_pubkey (33 bytes) + spend_pubkey (33 bytes) = 66 bytes
    if (dataBuffer.length !== 66) {
        throw new Error(`Invalid Silent Payment address data length: ${dataBuffer.length} (expected 66)`);
    }

    const scanPubKey = dataBuffer.slice(0, 33);
    const spendPubKey = dataBuffer.slice(33, 66);

    return {
        version,
        scanPubKey,
        spendPubKey,
        testnet: prefix === SILENT_PAYMENT_HRP_TESTNET
    };
}

/**
 * Generate Silent Payment address from root key
 *
 * @param {BIP32Interface} rootKey - The master BIP32 key
 * @param {number} account - Account index (default: 0)
 * @param {boolean} testnet - Whether to use testnet prefix (default: false)
 * @returns {Object} Object containing address and key information
 */
function generateSilentPaymentAddress(rootKey, account = 0, testnet = false) {
    const keys = deriveSilentPaymentKeys(rootKey, account);
    const address = encodeSilentPaymentAddress(keys.scan.publicKey, keys.spend.publicKey, testnet);

    return {
        address,
        scan: keys.scan,
        spend: keys.spend
    };
}

/**
 * Convert bits between different bit lengths
 * Used for bech32m encoding/decoding
 *
 * @param {Array} data - Input data
 * @param {number} frombits - Input bit length
 * @param {number} tobits - Output bit length
 * @param {boolean} pad - Whether to pad the output
 * @returns {Array} Converted data
 */
function convertBits(data, frombits, tobits, pad) {
    let acc = 0;
    let bits = 0;
    const ret = [];
    const maxv = (1 << tobits) - 1;

    for (let p = 0; p < data.length; ++p) {
        const value = data[p];
        if (value < 0 || (value >> frombits) !== 0) {
            throw new Error('Invalid data');
        }
        acc = (acc << frombits) | value;
        bits += frombits;
        while (bits >= tobits) {
            bits -= tobits;
            ret.push((acc >> bits) & maxv);
        }
    }

    if (pad) {
        if (bits > 0) {
            ret.push((acc << (tobits - bits)) & maxv);
        }
    } else if (bits >= frombits || ((acc << (tobits - bits)) & maxv)) {
        throw new Error('Invalid padding');
    }

    return ret;
}

/**
 * Get derivation path for scan or spend key
 *
 * @param {string} keyType - 'scan' or 'spend'
 * @param {number} account - Account index
 * @returns {string} BIP-32 derivation path
 */
function getDerivationPath(keyType, account = 0) {
    const changeIndex = keyType === 'scan' ? 1 : 0;
    return `m/352'/0'/${account}'/${changeIndex}'/0`;
}

// Export public API
module.exports = {
    deriveSilentPaymentKeys,
    encodeSilentPaymentAddress,
    decodeSilentPaymentAddress,
    generateSilentPaymentAddress,
    getDerivationPath,
    BIP352_PURPOSE,
    BIP352_COIN_TYPE,
    SILENT_PAYMENT_HRP,
    SILENT_PAYMENT_HRP_TESTNET
};
