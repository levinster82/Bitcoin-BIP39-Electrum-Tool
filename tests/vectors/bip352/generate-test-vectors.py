#!/usr/bin/env python3
"""
BIP-352 Test Vector Generator (Python)

Generates test vectors for BIP-352 Silent Payments derivation testing
Uses: mnemonic -> seed -> BIP32 derivation -> scan/spend keys -> SP address
"""

import json
import hashlib
from datetime import datetime
from mnemonic import Mnemonic
from bip32 import BIP32

# Bech32m implementation for Silent Payment address encoding
CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"
BECH32M_CONST = 0x2BC830A3

def bech32_polymod(values):
    GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
    chk = 1
    for v in values:
        b = chk >> 25
        chk = (chk & 0x1ffffff) << 5 ^ v
        for i in range(5):
            chk ^= GEN[i] if ((b >> i) & 1) else 0
    return chk

def bech32_hrp_expand(hrp):
    return [ord(x) >> 5 for x in hrp] + [0] + [ord(x) & 31 for x in hrp]

def bech32_verify_checksum(hrp, data, const):
    return bech32_polymod(bech32_hrp_expand(hrp) + data) == const

def bech32_create_checksum(hrp, data, const):
    values = bech32_hrp_expand(hrp) + data
    polymod = bech32_polymod(values + [0, 0, 0, 0, 0, 0]) ^ const
    return [(polymod >> 5 * (5 - i)) & 31 for i in range(6)]

def bech32_encode(hrp, data, const):
    combined = data + bech32_create_checksum(hrp, data, const)
    return hrp + '1' + ''.join([CHARSET[d] for d in combined])

def convertbits(data, frombits, tobits, pad=True):
    acc = 0
    bits = 0
    ret = []
    maxv = (1 << tobits) - 1
    max_acc = (1 << (frombits + tobits - 1)) - 1
    for value in data:
        if value < 0 or (value >> frombits):
            return None
        acc = ((acc << frombits) | value) & max_acc
        bits += frombits
        while bits >= tobits:
            bits -= tobits
            ret.append((acc >> bits) & maxv)
    if pad:
        if bits:
            ret.append((acc << (tobits - bits)) & maxv)
    elif bits >= frombits or ((acc << (tobits - bits)) & maxv):
        return None
    return ret

def encode_silent_payment_address(scan_pubkey, spend_pubkey, testnet=False):
    """
    Encode Silent Payment address from scan and spend public keys

    Args:
        scan_pubkey: 33-byte compressed public key (bytes)
        spend_pubkey: 33-byte compressed public key (bytes)
        testnet: boolean for network type

    Returns:
        Silent Payment address string (sp1q... or tsp1q...)
    """
    hrp = "tsp" if testnet else "sp"

    # scan_pubkey (33 bytes) + spend_pubkey (33 bytes)
    data = scan_pubkey + spend_pubkey

    # Convert to 5-bit groups for bech32m
    data_words = convertbits(list(data), 8, 5, True)

    # Prepend version as a 5-bit word (not a byte)
    words = [0] + data_words

    return bech32_encode(hrp, words, BECH32M_CONST)

# Test cases with known mnemonics
test_cases = [
    {
        "name": "BIP39 Test Vector 1",
        "mnemonic": "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
        "passphrase": "",
        "accounts": [0, 1, 2],
        "address_indices": [0, 1, 2]
    },
    {
        "name": "BIP39 Test Vector 2",
        "mnemonic": "legal winner thank year wave sausage worth useful legal winner thank yellow",
        "passphrase": "",
        "accounts": [0, 1],
        "address_indices": [0, 1]
    },
    {
        "name": "BIP39 with Passphrase",
        "mnemonic": "letter advice cage absurd amount doctor acoustic avoid letter advice cage above",
        "passphrase": "TREZOR",
        "accounts": [0],
        "address_indices": [0, 1]
    },
    {
        "name": "12-word Mnemonic",
        "mnemonic": "zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong",
        "passphrase": "",
        "accounts": [0],
        "address_indices": [0]
    }
]

def generate_test_vectors():
    vectors = []
    mnemo = Mnemonic("english")

    for test_case in test_cases:
        print(f"\n=== Generating: {test_case['name']} ===")

        # Validate mnemonic
        if not mnemo.check(test_case['mnemonic']):
            print(f"Invalid mnemonic: {test_case['name']}")
            continue

        # Generate seed
        seed = mnemo.to_seed(test_case['mnemonic'], test_case['passphrase'])
        bip32 = BIP32.from_seed(seed)

        print(f"Mnemonic: {test_case['mnemonic']}")
        print(f"Passphrase: \"{test_case['passphrase']}\"")
        print(f"Seed (hex): {seed.hex()}")
        print(f"Root xprv: {bip32.get_xpriv()}")

        for account in test_case['accounts']:
            for address_index in test_case['address_indices']:

                # Derive scan key: m/352'/0'/account'/1'/address_index
                scan_path = f"m/352'/0'/{account}'/1'/{address_index}"
                scan_key = bip32.get_privkey_from_path(scan_path)
                scan_pubkey = bip32.get_pubkey_from_path(scan_path)
                scan_xpriv = bip32.get_xpriv_from_path(scan_path)
                scan_xpub = bip32.get_xpub_from_path(scan_path)

                # Derive spend key: m/352'/0'/account'/0'/address_index
                spend_path = f"m/352'/0'/{account}'/0'/{address_index}"
                spend_key = bip32.get_privkey_from_path(spend_path)
                spend_pubkey = bip32.get_pubkey_from_path(spend_path)
                spend_xpriv = bip32.get_xpriv_from_path(spend_path)
                spend_xpub = bip32.get_xpub_from_path(spend_path)

                # Generate Silent Payment address
                silent_payment_address = encode_silent_payment_address(
                    scan_pubkey,
                    spend_pubkey,
                    False  # mainnet
                )

                vector = {
                    "test_name": test_case['name'],
                    "mnemonic": test_case['mnemonic'],
                    "passphrase": test_case['passphrase'],
                    "seed_hex": seed.hex(),
                    "root_xprv": bip32.get_xpriv(),
                    "root_xpub": bip32.get_xpub(),
                    "account": account,
                    "address_index": address_index,
                    "derivation": {
                        "scan_path": scan_path,
                        "spend_path": spend_path
                    },
                    "scan_key": {
                        "private_key_hex": scan_key.hex(),
                        "public_key_hex": scan_pubkey.hex(),
                        "xprv": scan_xpriv,
                        "xpub": scan_xpub
                    },
                    "spend_key": {
                        "private_key_hex": spend_key.hex(),
                        "public_key_hex": spend_pubkey.hex(),
                        "xprv": spend_xpriv,
                        "xpub": spend_xpub
                    },
                    "silent_payment_address": silent_payment_address
                }

                vectors.append(vector)

                print(f"\nAccount {account}, Address {address_index}:")
                print(f"  Scan:  {scan_path}")
                print(f"    priv: {vector['scan_key']['private_key_hex']}")
                print(f"    pub:  {vector['scan_key']['public_key_hex']}")
                print(f"  Spend: {spend_path}")
                print(f"    priv: {vector['spend_key']['private_key_hex']}")
                print(f"    pub:  {vector['spend_key']['public_key_hex']}")
                print(f"  SP Address: {silent_payment_address}")

    return vectors

if __name__ == "__main__":
    # Generate and output
    vectors = generate_test_vectors()

    # Write to JSON file
    output = {
        "generated_by": "Python BIP-352 Test Vector Generator",
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "implementation": "mnemonic + bip32 + custom bech32m",
        "note": "Test vectors for BIP-352 Silent Payments full derivation from mnemonic",
        "test_vectors": vectors
    }

    output_path = "derivation_test_vectors_py.json"
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"\n✅ Generated {len(vectors)} test vectors")
    print(f"📝 Saved to: {output_path}")
