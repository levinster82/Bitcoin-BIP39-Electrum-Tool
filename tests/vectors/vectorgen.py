#!/usr/bin/env python3
"""
BIP Test Vector Generator (Optimized)

This script transforms a basic test vectors file into a complete test vector file
according to the provided template, using the bip-utils library.

The script generates:
- BIP44 derivations (account 0 and 58, addresses 0 and 58)
- BIP84 derivations (account 0 and 58, addresses 0 and 58) 
- BIP86 derivations (account 0 and 58, addresses 0 and 58)

All calculations are based on the language and entropy with BIP39 passphrase "TREZOR".
"""

import json
import hashlib
from bip_utils import (
    Bip39SeedGenerator, 
    Bip32Slip10Secp256k1,
    Bip44,
    Bip84,
    Bip86,
    Bip44Coins,
    Bip84Coins,
    Bip86Coins,
    Bip44Changes
)

def generate_derivations(seed_bytes):
    """Generate all required derivations for the test vector"""
    
    # Create master contexts once per seed (use original seed_bytes, not master key bytes)
    bip44_master = Bip44.FromSeed(seed_bytes, Bip44Coins.BITCOIN)
    bip84_master = Bip84.FromSeed(seed_bytes, Bip84Coins.BITCOIN)  
    bip86_master = Bip86.FromSeed(seed_bytes, Bip86Coins.BITCOIN)
    
    derivations = {
        "bip44": {},
        "bip84": {},
        "bip86": {}
    }
    
    # Generate for accounts 0 and 58
    for account_num in [0, 58]:
        # BIP44 derivations
        bip44_acc_ctx = bip44_master.Purpose().Coin().Account(account_num)
        bip44_ext_ctx = bip44_acc_ctx.Change(Bip44Changes.CHAIN_EXT)
        bip44_int_ctx = bip44_acc_ctx.Change(Bip44Changes.CHAIN_INT)
        
        derivations["bip44"][f"account_{account_num}"] = {
            "account_xprv": bip44_acc_ctx.PrivateKey().ToExtended(),
            "account_xpub": bip44_acc_ctx.PublicKey().ToExtended(),
            "address_0": bip44_ext_ctx.AddressIndex(0).PublicKey().ToAddress(),
            "change_address_0": bip44_int_ctx.AddressIndex(0).PublicKey().ToAddress(),
            "address_58": bip44_ext_ctx.AddressIndex(58).PublicKey().ToAddress(),
            "change_address_58": bip44_int_ctx.AddressIndex(58).PublicKey().ToAddress()
        }
        
        # BIP84 derivations (Native SegWit)
        bip84_acc_ctx = bip84_master.Purpose().Coin().Account(account_num)
        bip84_ext_ctx = bip84_acc_ctx.Change(Bip44Changes.CHAIN_EXT)
        bip84_int_ctx = bip84_acc_ctx.Change(Bip44Changes.CHAIN_INT)
        
        derivations["bip84"][f"account_{account_num}"] = {
            "account_zprv": bip84_acc_ctx.PrivateKey().ToExtended(),
            "account_zpub": bip84_acc_ctx.PublicKey().ToExtended(),
            "address_0": bip84_ext_ctx.AddressIndex(0).PublicKey().ToAddress(),
            "change_address_0": bip84_int_ctx.AddressIndex(0).PublicKey().ToAddress(),
            "address_58": bip84_ext_ctx.AddressIndex(58).PublicKey().ToAddress(),
            "change_address_58": bip84_int_ctx.AddressIndex(58).PublicKey().ToAddress()
        }
        
        # BIP86 derivations (Taproot)
        bip86_acc_ctx = bip86_master.Purpose().Coin().Account(account_num)
        bip86_ext_ctx = bip86_acc_ctx.Change(Bip44Changes.CHAIN_EXT)
        bip86_int_ctx = bip86_acc_ctx.Change(Bip44Changes.CHAIN_INT)
        
        derivations["bip86"][f"account_{account_num}"] = {
            "account_xprv": bip86_acc_ctx.PrivateKey().ToExtended(),
            "account_xpub": bip86_acc_ctx.PublicKey().ToExtended(),
            "address_0": bip86_ext_ctx.AddressIndex(0).PublicKey().ToAddress(),
            "change_address_0": bip86_int_ctx.AddressIndex(0).PublicKey().ToAddress(),
            "address_58": bip86_ext_ctx.AddressIndex(58).PublicKey().ToAddress(),
            "change_address_58": bip86_int_ctx.AddressIndex(58).PublicKey().ToAddress()
        }
    
    return derivations

def process_test_vector(vector_data, language):
    """Process a single test vector entry"""
    entropy_hex = vector_data[0]
    mnemonic_phrase = vector_data[1] 
    expected_seed = vector_data[2]
    expected_master_xprv = vector_data[3]
    
    # Try to generate seed, handling language validation issues
    try:
        seed_bytes = Bip39SeedGenerator(mnemonic_phrase).Generate("TREZOR")
    except Exception as e:
        # If seed generation fails due to language issues, use manual PBKDF2
        print(f"    Warning: Default seed generation failed ({e}), using fallback PBKDF2")
        normalized_mnemonic = ' '.join(mnemonic_phrase.strip().split())
        seed_bytes = hashlib.pbkdf2_hmac('sha512', normalized_mnemonic.encode('utf-8'), 
                                        b"mnemonicTREZOR", 2048)
        if len(seed_bytes) != 64:
            raise ValueError(f"Generated seed has incorrect length: {len(seed_bytes)}")
    
    # Create master key from seed
    master_key = Bip32Slip10Secp256k1.FromSeed(seed_bytes)
    
    # Generate master fingerprint  
    master_fingerprint = master_key.PublicKey().FingerPrint().ToHex()
    
    # Generate all derivations
    derivations = generate_derivations(seed_bytes)
    
    # Create the complete test vector entry
    complete_vector = {
        "entropy_hex_string": entropy_hex,
        "mnemonic_phrase_space_separated": mnemonic_phrase,
        "seed_hex_512_bits": seed_bytes.hex(),
        "master_extended_private_key_xprv": master_key.PrivateKey().ToExtended(),
        "master_fingerprint_xfp": master_fingerprint,
        "derivations": derivations
    }
    
    # Verify our calculations match the input
    assert complete_vector["seed_hex_512_bits"].lower() == expected_seed.lower(), \
        f"Seed mismatch for entropy {entropy_hex}"
    assert complete_vector["master_extended_private_key_xprv"] == expected_master_xprv, \
        f"Master key mismatch for entropy {entropy_hex}"
    
    return complete_vector

def main():
    """Main function to process the test vectors file"""
    import argparse
    
    # Set up command line argument parsing
    parser = argparse.ArgumentParser(description='Generate complete BIP test vectors')
    parser.add_argument('input_file', help='Input JSON file with basic test vectors')
    parser.add_argument('output_file', help='Output JSON file for complete test vectors')
    parser.add_argument('--limit', type=int, help='Limit number of vectors per language to process')
    
    args = parser.parse_args()
    
    # Load the input test vectors
    try:
        with open(args.input_file, 'r', encoding='utf-8') as f:
            input_vectors = json.load(f)
    except FileNotFoundError:
        print(f"Error: Input file '{args.input_file}' not found")
        return 1
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in input file: {e}")
        return 1
    
    # Initialize the output structure
    output_vectors = {}
    
    # Process each language
    for language, vectors in input_vectors.items():
        print(f"Processing {language}...")
        
        output_vectors[language] = []
        
        # Apply limit if specified
        vectors_to_process = vectors[:args.limit] if args.limit else vectors
        
        # Process each test vector for this language
        for i, vector_data in enumerate(vectors_to_process):
            try:
                complete_vector = process_test_vector(vector_data, language)
                output_vectors[language].append(complete_vector)
                print(f"  Processed vector {i+1}/{len(vectors_to_process)}")
                
            except Exception as e:
                print(f"  Error processing vector {i+1}: {str(e)}")
                continue
        
        if args.limit and len(vectors) > args.limit:
            print(f"  Limited to {args.limit} vectors (total available: {len(vectors)})")
    
    # Save the complete test vectors
    try:
        with open(args.output_file, 'w', encoding='utf-8') as f:
            json.dump(output_vectors, f, indent=2, ensure_ascii=False)
        print(f"Complete test vectors saved to '{args.output_file}'")
    except Exception as e:
        print(f"Error writing output file: {e}")
        return 1
    
    # Final verification: diff check between input and output for overlapping fields
    print("Performing final verification...")
    verification_errors = 0
    
    for language, input_vectors in input_vectors.items():
        if language not in output_vectors:
            continue
            
        output_lang_vectors = output_vectors[language]
        vectors_to_check = min(len(input_vectors), len(output_lang_vectors))
        
        for i in range(vectors_to_check):
            input_vector = input_vectors[i]
            output_vector = output_lang_vectors[i]
            
            # Compare overlapping fields from input vectors.json
            input_fields = {
                "entropy_hex_string": input_vector[0],
                "mnemonic_phrase_space_separated": input_vector[1], 
                "seed_hex_512_bits": input_vector[2],
                "master_extended_private_key_xprv": input_vector[3]
            }
            
            for field_name, expected_value in input_fields.items():
                if field_name in output_vector:
                    actual_value = output_vector[field_name]
                    if field_name == "seed_hex_512_bits":
                        # Case-insensitive comparison for hex strings
                        if actual_value.lower() != expected_value.lower():
                            print(f"  MISMATCH {language}[{i+1}] {field_name}: expected {expected_value}, got {actual_value}")
                            verification_errors += 1
                    else:
                        if actual_value != expected_value:
                            print(f"  MISMATCH {language}[{i+1}] {field_name}: expected {expected_value}, got {actual_value}")
                            verification_errors += 1
    
    if verification_errors == 0:
        print("✓ All input fields verified successfully - no mismatches found")
        return 0
    else:
        print(f"✗ Found {verification_errors} verification errors")
        return 1

if __name__ == "__main__":
    exit(main())