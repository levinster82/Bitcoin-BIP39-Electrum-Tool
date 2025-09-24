# SeedQR Test Suite

Validates SeedQR implementation against official SeedSigner test vectors.

## Quick Start

```bash
# Install dependencies
cd tests && npm install

# Start dev server (separate terminal)
cd src && python -m http.server 8000

# Run tests
cd tests && npm run test-seedqr
```

## Test Coverage

**18 tests total**: 9 official vectors × 2 formats each
- **Standard SeedQR**: Numeric QR codes (4-digit word indices)
- **Compact SeedQR**: Binary QR codes (entropy with checksum removed)

## Results

- **Runtime**: ~43 seconds (optimized)
- **Success**: 18 specs, 0 failures
- **QR Versions**: V1/V2 (Compact), V2/V3 (Standard)

## Browser Options

```bash
BROWSER=firefox npm run test-seedqr
BROWSER=chrome npm run test-seedqr  # default
```