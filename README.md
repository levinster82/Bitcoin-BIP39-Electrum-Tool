# Bitcoin BIP39 + Electrum Mnemonic Tool

A Bitcoin-focused fork of [iancoleman/bip39](https://github.com/iancoleman/bip39).

## New Features (This Fork)

### Fingerprint Display
- **Fingerprint Display**: Shows wallet fingerprint for identification

### BIP-86 Taproot Support ⚡
- **Native Taproot**: Full BIP-86 implementation with `m/86'/0'/account'/change` derivation
- **P2TR Addresses**: Generate native Taproot addresses (bc1p...)

### Electrum Wallet Support (singlesig)
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
- Original Release  `bip39-electrum-standalone.html` - v1.0.0 - Bitcoin Only Toxic Maxi Edition
- Latest Release    `bip39-electrum-standalone.html` - v1.0.2 - Taproot for TOXIC Bitcoin Maxi's
- https://github.com/levinster82/Bitcoin-BIP39-Electrum-Tool/releases/latest

Build from source:
```
# Generate libs ./libs/combined ./libs/electrum-mnemonic
npm install --no-optional
npm run build
# copy output combined-libs.js & electrum-mnemonic.js to ./src/js
### Build
python compile.py
```

## Testing

tests.js has been split into multiple parts within tests/spec directory.

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
