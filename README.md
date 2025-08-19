# Bitcoin BIP39 + Electrum Mnemonic Tool

A Bitcoin-focused fork of [iancoleman/bip39](https://github.com/iancoleman/bip39).

## New Features (This Fork)

- **Fingerprint Display**: Shows wallet fingerprint for identification

### Electrum Wallet Support
- **Legacy Wallets**: P2PKH addresses with `m/0/n` and `m/1/n` derivation
- **SegWit Wallets**: P2WPKH addresses with `m/0'/0/n` and `m/0'/1/n` derivation
- **Account Extended Keys**: Display xpub/zpub for wallet import
- **Change Addresses**: Toggle between receive and change address generation

### Tool Enhancements
- **Bitcoin-Only Libraries**: Removed altcoin dependencies
- **Modernized Test Suite**: Updated to Bitcoin-only with 182 tests
- **Auto Day/Night Theme**: Automatically follows system dark/light mode preference
- **Manual Theme Toggle**: Three-way toggle (Light → Dark → Auto) for user control

## Usage

### Standard BIP39
1. Generate or enter mnemonic phrase
2. Select derivation path (BIP44, BIP49, BIP84, etc.)
3. View addresses and private keys

### Electrum Wallets
1. Select "Electrum" mnemonic type
2. Choose Legacy or SegWit tab
3. Use Account Extended Public Key for wallet import
4. Toggle "Change addresses" as needed

## Standalone Versions

Download from releases:
- `bip39-electrum-standalone.html` - v1.0.0 - Bitcoin Only Toxic Maxi Edition

Build from source: `python compile.py`

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
