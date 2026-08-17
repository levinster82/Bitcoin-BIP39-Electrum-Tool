# Bitcoin BIP39 + SLIP39 + Electrum Mnemonic Tool

A Bitcoin-focused fork of [iancoleman/bip39](https://github.com/iancoleman/bip39).

## New Features (This Fork)

### SLIP-39 Shamir's Secret-Sharing 🔐
- **Real Cryptographic Secret Sharing**: Splits a master secret into a group/threshold tree of
  mnemonic shares using actual Shamir's Secret-Sharing, not word redistribution
- **Group/Threshold Configuration**: Configurable group threshold plus a dynamic table of groups,
  each with its own threshold and share count — defaults to 2-of-3 groups, each 1-of-1
- **Shared Derivation Tabs**: No separate derivation-path tab — the recovered/generated master
  secret feeds the same BIP44/49/84/86/352/NIP06 tabs as BIP39 mode
- **Custom Master Secret Entry**: Reuses the existing "Show entropy details" panel (binary, base 6,
  dice, base 10, hex, or cards) to split a specific secret instead of a random one
- **20-word (128-bit) or 33-word (256-bit) shares**, matching standard SLIP-39 share lengths
- **Self-Describing Shares**: Each share mnemonic encodes its own group/threshold info, so recovery
  doesn't depend on remembering your configuration

### BIP-352 Silent Payments 🔒
- **Reusable Payment Addresses**: Privacy-preserving addresses that can be published publicly
- **Dual-Key Architecture**: Separate scan and spend keys for enhanced privacy
- **Derivation Paths**:
  - Scan key: `m/352'/0'/account'/1'/address_index`
  - Spend key: `m/352'/0'/account'/0'/address_index`
- **SP Address Format**: Bech32m encoded addresses (sp1q...)
- **Extended Keys**: Full xprv/xpub support for both scan and spend keys
- **Multiple Addresses**: Generate new Silent Payment addresses by incrementing the address index or account
- **Custom Implementation**: Built-in BIP-352 library with comprehensive test coverage (424 automated tests)

### BIP-392 Key Expressions
- **`spscan`**: Encodes the scan private key and spend public key, for watch-only wallets that can scan but not spend
- **`spspend`**: Encodes both private keys, for full wallets that can scan and spend
- **Bech32m Encoded**: `spscan1q...` / `spspend1q...` on mainnet, `tspscan1q...` / `tspspend1q...` on testnet
- **Descriptor Ready**: Key material for `sp()` output script descriptors, shown alongside the Silent Payment address in the BIP352 tab

### SeedQR Display
- **Generate QR codes for easy transcription per [seedqr](https://github.com/SeedSigner/seedsigner/tree/dev/docs/seed_qr) standard**
  - **SeedQR Standard**: 12-word (25×25 modules), 24-word (29×29 modules)
  - **SeedQR Compact**: 12-word (21×21 modules), 24-word (25×25 modules)
  - **Grid Overlay**: Visual grid for manual verification and hand transcription

### Nostr Key Derivation
- **NIP-06 support**: Deterministic derivation of npub nsec from mnemonic

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
- **Updated Offline Usage section.  Don't Trust.. Verify! Always!**
- **Added "Clear All" fields button**
- **Bitcoin-Only Libraries**: Removed altcoin dependencies, upgraded to bitcoinjs-lib 6.1.7+
- **Comprehensive Test Suite**: 278+ tests validating proper function and key generation
- **Auto Day/Night Theme**: Automatically follows system dark/light mode preference
- **Manual Theme Toggle**: Three-way toggle (Light → Dark → Auto) for user control

## Usage

### Standard BIP39
1. Select "BIP39" mnemonic type
1. Generate or enter mnemonic phrase
2. Select derivation path (BIP44, BIP49, BIP84, BIP86, BIP352, etc.)
3. Adjust derivation Path "account" and "change" as needed.
5. View addresses and private keys

### Silent Payments (BIP-352)
1. Select "BIP39" mnemonic type
2. Generate or enter mnemonic phrase
3. Select "BIP352" tab
4. Adjust "Account" and "Address Index" as needed
5. View scan/spend keys and Silent Payment address (sp1q...)
6. View the BIP-392 `spscan`/`spspend` key expressions for use with `sp()` descriptors
7. **Note**: Silent Payments require blockchain scanning to detect incoming payments

### Electrum Wallets
1. Select "Electrum" mnemonic type
2. Choose Legacy or SegWit tab
3. Click Generate or enter mnemonic
4. Toggle "Change addresses" as needed

### SLIP-39 Shamir's Secret-Sharing
1. Select "SLIP-39" mnemonic type
2. Set "Groups Required" and configure the groups table (threshold/shares/description per group),
   or leave the 2-of-3 default
3. Click Generate for a random master secret, or check "Show entropy details" to split a specific
   one (binary, base 6, dice, base 10, hex, or cards)
4. Select derivation path (BIP44, BIP49, BIP84, BIP86, BIP352, etc.) - same tabs as BIP39
5. View addresses and private keys
6. To recover later, paste back in *exactly* the shares needed to meet your thresholds (not every
   share you have, if you have more than needed - see the group-config panel's note)

## Standalone Versions

Download from releases:
- [Latest Release](https://github.com/levinster82/Bitcoin-BIP39-Electrum-Tool/releases/latest)    `bip39-slip39-electrum-standalone.html` - v1.3.0 - SLIP-39 Shamir's Secret-Sharing!

Build from source:
```bash
# Clone the repository
git clone https://github.com/levinster82/Bitcoin-BIP39-Electrum-Tool.git
cd Bitcoin-BIP39-Electrum-Tool

# Initialize git submodules (includes BIP-352 and SLIP-39 libraries)
git submodule update --init --recursive

# Build combined libraries
cd libs/combined
npm install --no-optional
npm run build
cd ../..

# Build Electrum mnemonic library
cd libs/electrum-mnemonic
npm install
npm run build
cd ../..

# Build BIP-352 Silent Payments library (bundles the libs/bip352-js submodule)
cd libs/bip352-bundle
npm install
npm run build
cd ../..

# Build SLIP-39 library (bundles the libs/slip39-js submodule)
cd libs/slip39-bundle
npm install
npm run build
cd ../..

# All libraries automatically copy to src/js/

# Generate standalone HTML
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
