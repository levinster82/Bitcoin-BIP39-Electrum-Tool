# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Bitcoin-focused BIP39 mnemonic tool forked from iancoleman/bip39, with added support for Electrum wallet compatibility. The application generates and validates BIP39/Electrum mnemonics, derives addresses using various BIP standards, and provides a standalone HTML tool for offline usage.

## Build & Development Commands

### Building Standalone Release
```bash
python3 compile.py
```
This generates:
- `bip39-electrum-standalone.html` - Single-file application with all dependencies inlined
- `bip39-electrum-standalone.html.sha256sum` - SHA256 checksum for verification
- Outputs build timestamp and SHA256 hash

### Testing
```bash
cd tests && npm install
npm install --global jasmine
cd ../src && python -m http.server 8080  # Start local server
cd ../tests && jasmine spec/tests-part1.js  # Run individual test parts
# Or run all tests:
jasmine spec/tests-part1.js spec/tests-part2.js spec/tests-part3.js spec/tests-part4.js spec/tests-part5.js
```

Test environment options:
- `BROWSER=firefox jasmine spec/tests.js` (default: chrome)
- Tests use Selenium WebDriver for browser automation
- Requires local HTTP server on port 8080 for src/ directory

### Release Process
After building standalone HTML:
1. Sign checksum: `gpg --detach-sign --armor bip39-electrum-standalone.html.sha256sum`
2. Create GitHub release with tag
3. Upload: HTML file, checksum, and GPG signature

## Architecture

### Core Application Structure
- **Frontend Only**: Pure JavaScript/HTML/CSS application
- **Entry Point**: `src/index.html` - Main application interface
- **Main Logic**: `src/js/index.js` - Core BIP39/Electrum functionality with extensive DOM manipulation
- **Build System**: `compile.py` - Inlines all dependencies into standalone HTML

### Key Components

#### Mnemonic Generation & Validation
- Supports both BIP39 and Electrum mnemonic formats
- Multiple language wordlists (English, Japanese, Spanish, Chinese, etc.)
- Entropy sources: binary, dice, cards, hexadecimal
- Custom PBKDF2 iteration support

#### Address Derivation
- **BIP Standards**: BIP32, BIP44, BIP49, BIP84, BIP86, BIP141
- **BIP-86 Taproot**: `m/86'/0'/account'/change` derivation with P2TR address generation
- **Electrum Compatibility**: 
  - Legacy wallets: `m/0/n` (receive), `m/1/n` (change)
  - SegWit wallets: `m/0'/0/n` (receive), `m/0'/1/n` (change)
- Account extended keys for wallet import

#### Theme System
- Three-way toggle: Light → Dark → Auto (system detection)
- CSS variables for consistent theming (`--bg-color`, `--text-color`, etc.)
- `@media (prefers-color-scheme: dark)` for immediate dark mode application
- Theme function: `toggleTheme()` in `src/js/index.js`

### Dependencies & Libraries
Located in `libs/` and `src/js/`:
- **bitcoinjs-lib**: Bitcoin cryptographic operations
- **Electrum mnemonic**: Electrum-specific mnemonic handling
- **Bootstrap**: UI framework (CSS only)
- **jQuery**: DOM manipulation

### File Organization
```
src/
├── index.html          # Main application
├── css/
│   ├── app.css         # Custom styles with theme variables
│   └── bootstrap.css   # UI framework
└── js/
    ├── index.js        # Main application logic (~3000+ lines)
    ├── bip39-libs.js   # BIP39 cryptographic functions
    └── [wordlists...]  # Multi-language BIP39 wordlists
```

### Generated Files (Git Ignored)
- `bip39-electrum-standalone.html` - Compiled standalone application
- `*.sha256sum` - Checksum files
- `*.asc` - GPG signatures

## Development Notes

### BIP-86 Taproot Implementation (Complete)
**Status**: Fully implemented and tested ✅
- ✅ Added BIP-86 tab with m/86'/0'/account'/change derivation paths
- ✅ Complete UI integration with account extended keys
- ✅ P2TR address generation with `internalPubkey` parameter
- ✅ Library rebuilt with bitcoinjs-lib 6.1.7+ for Taproot support
- ✅ ECC library initialization for cryptographic operations
- ✅ Comprehensive test suite (tests-part5.js) with 8 test scenarios
- ✅ Mainnet and testnet address generation supported
- ✅ Account and change address derivation working

**Build Process**:
1. `cd libs/bitcoinjs-lib && npm run build` 
2. `cp /tmp/bitcoinjs-lib.js src/js/bip39-libs.js`
3. `python3 compile.py`

**Library Structure**: 
- Uses `bitcoinjs` global namespace instead of deprecated `libs`
- All dependencies mapped: bitcoin, bip32, ECPair, buffer, bip38, bip85, etc.
- Source: `libs/bitcoinjs-lib/src.js` exports complete structure with ECC initialization

### Theme Development
- CSS uses custom properties for all colors
- Two theme definitions: light (default) and dark mode
- Media query applies dark theme immediately on page load
- JavaScript handles manual toggle states

### Testing Strategy
- 190+ comprehensive tests across 5 test files (parts 1-5)
- Tests cover BIP39/Electrum mnemonic generation and validation
- Address derivation testing for all supported BIP standards including BIP-86
- **BIP-86 Test Suite** (tests-part5.js):
  - 8 comprehensive test scenarios 
  - Mainnet and testnet address generation
  - Account and change address validation
  - Derivation path verification
  - Error handling and parameter validation
  - Optimized runtime: ~20 seconds
- Browser compatibility testing (Chrome/Firefox)

### Security Considerations
- Tool designed for offline usage
- No network requests in standalone version
- Private data marked with CSS class `private-data` for styling
- GPG signatures provided for release verification