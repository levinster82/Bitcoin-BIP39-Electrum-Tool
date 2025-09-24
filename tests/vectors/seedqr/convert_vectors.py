#!/usr/bin/env python3

def binary_to_hex(binary_str):
    """Convert binary string to hex"""
    # Remove any spaces and ensure it's a valid binary string
    binary_str = binary_str.replace(' ', '')
    if len(binary_str) % 8 != 0:
        # Pad to make it divisible by 8
        binary_str = binary_str.ljust((len(binary_str) + 7) // 8 * 8, '0')

    hex_value = hex(int(binary_str, 2))[2:].upper()
    return hex_value

def numeric_to_hex(numeric_str):
    """Convert numeric string to hex"""
    # Convert to bytes (assuming each pair of digits is a value 0-99, but we need to be smarter)
    # For SeedQR, it's a numeric string that should be converted to bytes
    # We'll convert the entire number to hex
    hex_value = hex(int(numeric_str))[2:].upper()
    return hex_value

def process_bytestream(bytestream_python):
    """Extract hex from python bytestream notation"""
    # Extract hex values from the python byte string
    import re
    hex_values = []
    # Find all \x followed by two hex digits
    matches = re.findall(r'\\x([0-9a-fA-F]{2})', bytestream_python)
    for match in matches:
        hex_values.append(match.upper())

    # Also handle direct characters (non-escaped)
    # This is more complex, but for now return what we found
    return ''.join(hex_values)

# Test vectors data
test_vectors = [
    {
        "id": 1,
        "word_count": 24,
        "seed_phrase": "attack pizza motion avocado network gather crop fresh patrol unusual wild holiday candy pony ranch winter theme error hybrid van cereal salon goddess expire",
        "standard_seedqr": "011513251154012711900771041507421289190620080870026613431420201617920614089619290300152408010643",
        "compact_bitstream": "0000111001110100101101100100000100000111111110010100110011000000110011001111101011100110101000010011110111001011111011000011011001100010000101010100111111101100011001111110000011100000000010011001100111000000011110001001001001011001011111010001100100001010",
        "compact_bytestream": "b'\\x0et\\xb6A\\x07\\xf9L\\xc0\\xcc\\xfa\\xe6\\xa1=\\xcb\\xec6b\\x15O\\xecg\\xe0\\xe0\\t\\x99\\xc0x\\x92Y}\\x19\\n'"
    },
    {
        "id": 2,
        "word_count": 24,
        "seed_phrase": "atom solve joy ugly ankle message setup typical bean era cactus various odor refuse element afraid meadow quick medal plate wisdom swap noble shallow",
        "standard_seedqr": "011416550964188800731119157218870156061002561932122514430573003611011405110613292018175411971576",
        "compact_bitstream": "0000111001011001110111011110001001110110000000001001001100010111111100010010011101011111000100111000100110001000100000000111100011001001100100110110100011010001111010000010010010001001101101011111011000101001010100110001111111000101101101101010010101101110",
        "compact_bytestream": "b'\\x0eY\\xdd\\xe2v\\x00\\x93\\x17\\xf1\\'_\\x13\\x89\\x88\\x80x\\xc9\\x93h\\xd1\\xe8$\\x89\\xb5\\xf6)S\\x1f\\xc5\\xb6\\xa5n'"
    },
    {
        "id": 4,
        "word_count": 12,
        "seed_phrase": "forum undo fragile fade shy sign arrest garment culture tube off merit",
        "standard_seedqr": "073318950739065415961602009907670428187212261116",
        "compact_bitstream": "01011011101111011001110101110001101010001110110001111001100100001000001100011010111111110011010110011101010000100110010101000101",
        "compact_bytestream": "b'[\\xbd\\x9dq\\xa8\\xecy\\x90\\x83\\x1a\\xff5\\x9dBeE'"
    },
    {
        "id": 5,
        "word_count": 12,
        "seed_phrase": "good battle boil exact add seed angle hurry success glad carbon whisper",
        "standard_seedqr": "080301540200062600251559007008931730078802752004",
        "compact_bitstream": "000011000001110000011000000001100101000110101001000000000000000111100000100010010000100111100001100000000111100001011000000100",
        "compact_bytestream": "b'\\x0c\\x1c\\x18\\x06Q\\xa4\\x00\\x07\\xc1\\x12\\t\\xe1\\x80\\x1eK\\x04'"
    }
]

print("=== SeedQR Test Vector Hex Conversions ===\n")

for vector in test_vectors:
    print(f"Test Vector {vector['id']} ({vector['word_count']}-word):")
    print(f"Seed: {vector['seed_phrase']}")
    print()

    # Convert standard SeedQR to hex
    standard_hex = numeric_to_hex(vector['standard_seedqr'])
    print(f"Standard SeedQR:")
    print(f"  Numeric: {vector['standard_seedqr']}")
    print(f"  Hex:     {standard_hex}")
    print()

    # Convert compact bitstream to hex
    if 'compact_bitstream' in vector:
        compact_hex = binary_to_hex(vector['compact_bitstream'])
        print(f"Compact SeedQR:")
        print(f"  Binary:    {vector['compact_bitstream']}")
        print(f"  Hex:       {compact_hex}")

        # Also show the bytestream hex
        if 'compact_bytestream' in vector:
            bytestream_hex = process_bytestream(vector['compact_bytestream'])
            print(f"  Bytestream: {bytestream_hex}")
        print()

    print("-" * 80)
    print()