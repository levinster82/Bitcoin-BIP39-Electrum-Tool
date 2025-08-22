# Bitcoin BIP39 + Electrum Mnemonic Tool

A Bitcoin-focused fork of [iancoleman/bip39](https://github.com/iancoleman/bip39).

## New Features (This Fork)

### Fingerprint Display
- **Fingerprint Display**: Shows wallet fingerprint for identification

### BIP-86 Taproot Support ⚡
- **Native Taproot**: Full BIP-86 implementation with `m/86'/0'/account'/change` derivation
- **P2TR Addresses**: Generate native Taproot addresses (bc1p...)

### Electrum Wallet Support
- **Legacy Wallets**: P2PKH addresses with `m/0/n` and `m/1/n` derivation
- **SegWit Wallets**: P2WPKH addresses with `m/0'/0/n` and `m/0'/1/n` derivation
- **Account Extended Keys**: Display xpub/zpub for wallet import
- **Change Addresses**: Toggle between receive and change address generation

### Tool Enhancements
- **Bitcoin-Only Libraries**: Removed altcoin dependencies, upgraded to bitcoinjs-lib 6.1.7+
- **Comprehensive Test Suite**: 190+ tests across 5 test files including BIP-86
- **Auto Day/Night Theme**: Automatically follows system dark/light mode preference
- **Manual Theme Toggle**: Three-way toggle (Light → Dark → Auto) for user control

## Usage

### Standard BIP39
1. Select "BIP39" mnemonic type
1. Generate or enter mnemonic phrase
2. Select derivation path (BIP44, BIP49, BIP84, etc.)
3. Adjust derivation Path "account" and "change" as needed.
5. View addresses and private keys

### Electrum Wallets
1. Select "Electrum" mnemonic type
2. Choose Legacy or SegWit tab
3. Click Generate or enter mnemonic
4. Toggle "Change addresses" as needed

## Standalone Versions

Download from releases:
- `bip39-electrum-standalone.html` - v1.0.0 - Bitcoin Only Toxic Maxi Edition

Build from source: `python compile.py`

## 24-Word Mnemonic Generation Flow

When you select 24 words and click generate, here's the complete technical flow:

### **1. Click Generate Button** (`generateClicked()` - line 837)
- Checks if using custom entropy (exits if true)
- Calls `generateRandomPhrase()` after 50ms delay
- Then calls `phraseChanged()`

### **2. Generate Random Phrase** (`generateRandomPhrase()` - line 921)  
- **Entropy Generation**: For 24 words, calculates `strength = 24/3 * 32 = 256 bits`
- **Secure Randomness**: Uses `crypto.getRandomValues(buffer)` to fill a 32-byte array (256 bits)
- **BIP39 Conversion**: Uses `bip39.entropyToMnemonic(uint8ArrayToHex(data))` to convert entropy to 24-word mnemonic
- **Display**: Sets the phrase in UI and shows hex entropy in entropy field

### **3. Process Phrase** (`phraseChanged()` - line 328)
- **Validation**: Checks mnemonic validity with `findPhraseErrors()`
- **Normalization**: Trims and normalizes whitespace  
- **Seed Generation**: Calls `calcBip32RootKeyFromSeed(phrase, passphrase)`

### **4. Create BIP32 Root Key** (`calcBip32RootKeyFromSeed()` - line 969)
- **BIP39 Seed**: Uses `bip39.mnemonicToSeedSync(phrase, passphrase)` to create 64-byte seed via PBKDF2 with 2048 iterations
- **BIP32 Root**: Uses `bitcoinjs.bip32.fromSeed(seedBuffer, network)` to create the master private key
- **Storage**: Stores as global `bip32RootKey` and `seed` variables

### **Key Technical Details:**
- **Entropy**: 256 bits of cryptographically secure randomness
- **Seed**: 512-bit (64-byte) seed derived using PBKDF2-SHA512 with "mnemonic" + passphrase salt
- **BIP32 Root**: Master private key derived from seed using HMAC-SHA512 with "Bitcoin seed" key
- **Security**: Uses browser's `crypto.getRandomValues()` for entropy generation

The process follows BIP39 → BIP32 standards precisely: **Entropy → Mnemonic → Seed → BIP32 Root Key**.

## Testing

```bash
cd tests && npm install
npm install --global jasmine
cd ../src && python -m http.server
cd ../tests && jasmine spec/tests.js
```

## Original Project

This is a fork of the excellent [BIP39 Tool by Ian Coleman](https://github.com/iancoleman/bip39). 

Original online version: https://iancoleman.io/bip39/

## License

MIT License (same as original project)
