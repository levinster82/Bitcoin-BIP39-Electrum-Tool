# SLIP-39 official test vectors

`vectors.json` is vendored verbatim from
[trezor/python-shamir-mnemonic](https://github.com/trezor/python-shamir-mnemonic)
(`vectors.json`, `master` branch), the reference implementation's own repository. MIT licensed.

## Format

An array of 45 `[description, mnemonics, master_secret_hex, bip32_master_xprv]` quadruples:

- `description` — human-readable label for the case, including bit size and case number
- `mnemonics` — array of SLIP-39 share mnemonic strings to combine
- `master_secret_hex` — the expected recovered master secret, hex-encoded; **empty string means
  combining `mnemonics` is expected to fail** (bad checksum, mismatched thresholds, insufficient
  shares, etc.)
- `bip32_master_xprv` — the BIP32 master extended private key derived directly from the master
  secret (per SLIP-39's spec: the secret is used as the BIP32 seed with no extra KDF); also empty
  for invalid cases

Valid cases use passphrase `"TREZOR"` throughout. 16 valid cases, 29 invalid (covering bad
checksums, bad padding, mismatched group/member thresholds and counts, duplicate member indices,
insufficient shares, invalid digests, and the newer "extendable backup" mnemonic variant).

## Where these are used

- `validate-vectors.js` (this directory) — exhaustive Node-side check of all 45 vectors against
  the shipped `src/js/slip39-js.js` bundle, no browser needed. Run with `node validate-vectors.js`.
- `tests/spec/slip39vectors-fast.js` — the same 45 vectors run through the actual browser UI via
  Selenium (one shared driver session, mirroring `trezorvectors-fast.js`'s pattern for BIP39's
  vectors), confirming the full mnemonic-field → seed → root-key pipeline end to end.
- `tests/spec/tests-slip39.js` — separate, UI-behavior-focused specs (mode switching, the
  group-config table, tab-switch regression, custom-secret entry) that these vectors don't cover,
  since they're pure combine-and-check cases with no concept of this app's UI.
