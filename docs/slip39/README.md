# SLIP-39 submodule integration — the `crypto.timingSafeEqual` gap

**Status: resolved and implemented.** This documents a blocker discovered while
scoping the `slip39-js` submodule integration, the fix chosen for it, and how it
was carried through. The submodule is vendored at `libs/slip39-js/` (pinned to
`v0.4.0-levinster82.2`, which contains the fix), `libs/slip39-bundle/` bundles it
to `src/js/slip39-js.js`, and the bundle has been round-trip tested (split →
validate → recover, single- and multi-group). UI integration is also done — see
the checklist at the bottom, and `CLAUDE.md`'s "SLIP-39 Library" section for
the architecture. This file stays scoped to the `crypto.timingSafeEqual` gap
specifically, not a general changelog for the feature.

This file is kept as the record of *why* the fix looks the way it does, since
that reasoning doesn't otherwise show up in either repo's diff.

## Background

[`levinster82/slip39-js`](https://github.com/levinster82/slip39-js) was added
as a git submodule at `libs/slip39-js/` (initially scoped against release tag
`v0.4.0-levinster82.1`, ultimately pinned to `v0.4.0-levinster82.2` once the fix
below landed), following the exact pattern already used for `libs/bip352-js/`:
a plain npm package with no bundler config of its own, wrapped by a
parent-owned webpack harness (`libs/slip39-bundle/`, mirroring
`libs/bip352-bundle/`) that produces a UMD bundle at `src/js/slip39-js.js`.

That pattern works unmodified for `bip352-js` because it has no Node built-in
dependencies — its bundle harness sets `resolve.fallback: { crypto: false, ... }`
and never needs a real polyfill. `slip39-js` is different.

## The problem

`src/slip39_helper.js` in `slip39-js` calls Node's `crypto` module directly:

| Call | Site | Purpose |
|---|---|---|
| `crypto.randomBytes` | share/ID generation | random group ID, padding |
| `crypto.pbkdf2Sync` | `roundFunction` (Feistel network) | SLIP-39 encryption rounds |
| `crypto.createHmac` | pseudo-random shard generation | HMAC-SHA256 |
| `crypto.timingSafeEqual` | `listsAreEqual()`, `slip39_helper.js:810` | constant-time digest/checksum comparison |

The first three have mature, widely-used browser shims via
[`crypto-browserify`](https://github.com/browserify/crypto-browserify)
(`randombytes`, `pbkdf2`, `create-hmac` under the hood). **`crypto-browserify`
does not implement `timingSafeEqual`** — confirmed by reading its `index.js`
(v3.12.1): it re-exports hashing, HMAC, cipher, Diffie-Hellman, sign/verify, and
random-fill functions, but has no `timingSafeEqual` export at all.

Copy-pasting the `bip352-bundle` webpack pattern
(`resolve.fallback: { crypto: require.resolve('crypto-browserify') }`) would
therefore build cleanly and then throw `TypeError: crypto.timingSafeEqual is
not a function` the first time the browser bundle validates a SLIP-39 share
checksum during reconstruction — a core code path (every "recover secret from
shares" flow calls `listsAreEqual`), not an edge case.

This also isn't a comparison that can be silently downgraded to `Buffer.equals`
or `===`. It exists specifically to compare secret-derived checksum bytes
without leaking equality information through early-exit timing, i.e. it is a
deliberate side-channel mitigation on a security-sensitive path. Swapping in a
short-circuiting comparison would build and pass tests while quietly
reintroducing the timing leak the original code was written to avoid.

## Decision: patch the submodule, not the bundle harness

Two ways to close the gap were considered:

1. **Shim it in `libs/slip39-bundle/`** (webpack-level): alias `crypto` to
   `crypto-browserify`, then monkey-patch a `timingSafeEqual` implementation
   (e.g. sourced from the small, audited `buffer-equal-constant-time` package)
   onto the polyfilled module before it reaches `slip39_helper.js`. No changes
   to the submodule; the fix lives entirely in this repo's build tooling.
2. **Patch the submodule itself** — chosen approach. `levinster82/slip39-js` is
   the user's own fork (same GitHub account, same pattern as maintaining a
   purpose-fitted fork the way `bip352-js` already is), so it can carry a
   proper fix rather than a build-time workaround.

The submodule route was chosen because a constant-time comparison is
security-relevant code: it should be visible, tested, and versioned where the
rest of the SLIP-39 logic lives and where `test/bip352.spec.js`-style unit
tests can cover it directly, not buried in a webpack config that most readers
would not think to audit for cryptographic correctness. It also removes
`slip39-js`'s last remaining Node-only dependency, so the eventual
`slip39-bundle` harness can stay as close to the `bip352-bundle` template
(`crypto: false`, no polyfill needed) as possible — consistent with how
`bip352-js` was already written to have no Node built-in dependencies.

## The patch, as applied in `levinster82/slip39-js`

Applied in commit `1b6eefd` (`fix: replace crypto.timingSafeEqual with a
pure-JS constant-time compare`), tagged `v0.4.0-levinster82.2`. It replaces the
`crypto.timingSafeEqual` call in `listsAreEqual()` (`src/slip39_helper.js`)
with a self-contained constant-time comparison:

```js
function listsAreEqual(a, b) {
  if (a === null || b === null || a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}
```

`a.length !== b.length` short-circuiting *before* the constant-time loop
matches Node's own `timingSafeEqual`, which throws on length mismatch rather
than comparing — the leak this guards against is early-exit on a *byte
mismatch* within equal-length secret material, not on public length metadata.
The fix also exports `listsAreEqual` from the module (previously private) and
adds direct unit test coverage in `test/test.js` (equal, unequal-length,
unequal-content, and null-input cases) — so this function is no longer only
exercised indirectly through a full share reconstruction.

`randomBytes`, `pbkdf2Sync`, and `createHmac` were left on Node's `crypto` —
only the one call with no browser-safe polyfill was removed. `libs/slip39-bundle/`
polyfills those three at the build-tooling layer instead (see below).

## The bundle harness: a minimal `crypto` shim instead of `crypto-browserify`

A second, smaller decision came up while actually wiring `libs/slip39-bundle/`:
how to polyfill the three remaining Node `crypto` calls in the browser bundle.

The obvious move — copy the `bip352-bundle` pattern but with
`resolve.fallback: { crypto: require.resolve('crypto-browserify') }` — builds,
but pulls in the whole `crypto-browserify` umbrella: `browserify-sign`,
`diffie-hellman`, `public-encrypt`, `browserify-cipher`, `create-ecdh`,
`randomfill`, none of which `slip39-js` calls. In practice this bloated the
bundle from 138 KiB to 351 KiB and left an unresolved `vm` import warning
(from `asn1.js`, several layers under `browserify-sign`) that would need its
own polyfill or explicit `vm: false` to silence cleanly.

Instead, `libs/slip39-bundle/crypto-shim.js` requires only the three focused
packages directly — `randombytes`, `pbkdf2`, `create-hmac`. These aren't a
downgrade in provenance: they're `crypto-browserify`'s own direct dependencies
(confirmed by reading its `package.json`), maintained by the same people
(dcousens, Calvin Metcalf, ljharb, Fedor Indutny). Using them directly is
`crypto-browserify`'s own code, minus the RSA/DH/cipher/sign-verify modules
this library never touches. Aliasing `crypto` straight to this shim keeps the
build clean (no `vm` warning) and the output smaller.

The shim still needed `stream-browserify` polyfilled (`cipher-base`, used
transitively by `create-hash`/`create-hmac`/`pbkdf2`, extends Node's
`stream.Transform`), so `libs/slip39-bundle/webpack.config.js` carries that
fallback alongside `buffer` and `process`, same as `bip352-bundle`.

## Verification

The built `src/js/slip39-js.js` was round-trip tested directly (not just
compiled) via Node, loading the UMD bundle and exercising it end-to-end:

- Single-group split → `fromPath()` → `recoverSecret()`, byte-for-byte match.
- Multi-group split (the README's 4-group, threshold-2 example) → partial
  share collection across groups → `validateMnemonic()` on every share →
  `recoverSecret()`, byte-for-byte match.
- Recovery with the wrong passphrase correctly fails / produces a mismatched
  secret, confirming the `pbkdf2Sync`-derived encryption round-trips
  correctly through the shim.

This exercises `randomBytes`, `pbkdf2Sync`, and `createHmac` (via
`crypto-shim.js`) and the patched constant-time `listsAreEqual`, all through
the actual bundled output rather than the submodule's own Node-side tests.

## Done

- [x] Apply the patch above in `levinster82/slip39-js`, tag `v0.4.0-levinster82.2`.
- [x] Add `libs/slip39-js/` as a submodule pinned to that tag (detached HEAD,
      no `branch =` key in `.gitmodules`).
- [x] Create `libs/slip39-bundle/` (webpack harness, UMD global `SLIP39`,
      entry `libs/slip39-js/index.js`, output `src/js/slip39-js.js`).
- [x] Round-trip test the built bundle.
- [x] Document the new submodule in `CLAUDE.md` alongside the BIP-352 section.
- [x] Wire up `src/index.html` / `src/js/index.js` UI integration — SLIP-39 is
      a third `#mnemonic-type` option alongside BIP39/Electrum, reusing the
      existing BIP44/49/84/86/352/NIP06 tabs (no derivation-path tab of its
      own) and the existing "Show entropy details" panel for custom master
      secret entry. See `CLAUDE.md`'s "SLIP-39 Architecture" section.
- [x] Add browser spec files under `tests/spec/`: `tests-slip39.js` (UI
      behavior) and `slip39vectors-fast.js` (all 45 official vectors from
      trezor/python-shamir-mnemonic against the real UI). Also
      `tests/vectors/slip39/validate-vectors.js` for a fast Node-side check
      of the same 45 vectors against the shipped bundle, no browser needed.

Nothing outstanding for this branch as of the last update to this file.
