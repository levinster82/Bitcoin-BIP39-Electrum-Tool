# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 24-Word Mnemonic Generation Flow

When you select 24 words and click generate, here's the complete technical flow:

### **1. Click Generate Button** (`generateClicked()` - line 837)
- Checks if using custom entropy (exits if true)
- Calls `generateRandomPhrase()` after 50ms delay
- Then calls `phraseChanged()`

### **2. Generate Random Phrase** (`generateRandomPhrase()` - line 921)  
- **Entropy Generation**: For 24 words, calculates `strength = 24/3 * 32 = 256 bits`
- **Secure Randomness**: Uses `crypto.getRandomValues(buffer)` to fill a 32-byte array (256 bits)
- **Entropy Quality Validation**: Validates randomness quality using Shannon entropy and chi-square tests
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

The process follows BIP39 → BIP32 standards precisely: **Entropy → Quality Validation → Mnemonic → Seed → BIP32 Root Key**.

## Entropy Quality Validation (Complete Implementation)

**Status**: Fully implemented and production-ready ✅

### Core Features
- **Shannon Entropy Calculation**: Measures information content and randomness quality
- **Pattern Detection**: Identifies weak entropy patterns (repeating bytes, zeros, 0xFF bytes, sequential patterns)
- **Chi-Square Statistical Testing**: Validates uniform distribution of byte values
- **Dynamic Thresholds**: Size-specific validation for all BIP39 mnemonic lengths

### BIP39 Size Support
- **12 words (16 bytes)**: 128-bit entropy, max Shannon entropy ~4.0 bits, chi-square range 180-320
- **15 words (20 bytes)**: 160-bit entropy, max Shannon entropy ~4.3 bits, chi-square range 200-350
- **18 words (24 bytes)**: 192-bit entropy, max Shannon entropy ~4.6 bits, chi-square range 220-380
- **21 words (28 bytes)**: 224-bit entropy, max Shannon entropy ~4.8 bits, chi-square range 240-410
- **24 words (32 bytes)**: 256-bit entropy, max Shannon entropy ~5.0 bits, chi-square range 260-440

### Implementation Details
- **Primary Function**: `validateEntropyQualityForSize(buffer)` - Used by both generation and manual input
- **Pattern Detection**: `detectPatterns(buffer)` - Strict security-focused validation
- **Shannon Entropy**: `calculateShannonEntropy(buffer)` - Information theory calculation
- **Chi-Square**: `calculateChiSquare(buffer)` - Statistical uniformity test
- **UI Integration**: Quality display shown when "Show entropy details" is checked

### Security Design
- **Retry Logic**: Automatically retries generation until high-quality entropy is achieved
- **Strict Thresholds**: Zero tolerance for pattern detection (>5% zeros/0xFF bytes flagged)
- **Mathematical Accuracy**: Realistic entropy limits based on sample size constraints
- **No Compromise**: Prioritizes security over convenience for maximum cryptographic safety

### Usage
1. **Automatic**: Quality validation runs during mnemonic generation
2. **Manual**: Validates user-provided entropy when "Show entropy details" is enabled
3. **Visual Feedback**: Shows entropy quality score and chi-square test results in UI
4. **Silent Operation**: No debug output in production, clean user experience