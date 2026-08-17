# Release Process

Once all code changes for this version have been committed, a release can be
created with the following steps.

## 1. Submodules, if `libs/bip352-js` or `libs/slip39-js` changed

Both `libs/bip352-js` and `libs/slip39-js` are git submodules pinned to a release
tag on their own `master` branch. Skip this section entirely if neither library
was touched this cycle; otherwise repeat these steps per library that changed.

1. Commit the change in the library's own repo, then tag it there
   `git tag -a vX.Y.Z -m "vX.Y.Z — summary"`
1. Push the commit and the tag `git push origin master && git push origin vX.Y.Z`
1. Point the submodule at the new tag
   `git -C libs/<name>-js fetch --tags && git -C libs/<name>-js checkout vX.Y.Z`
1. Rebuild the matching bundle (see Build below) and commit the new pointer
   together with the regenerated `src/js/<name>-js.js`

A detached HEAD in the submodule is expected: a gitlink always records a commit,
never a tag or branch name.

**The parent release tag records the submodule commit, not the tag name.** That
commit must stay reachable from a ref on the submodule's remote, or
`git submodule update --init` breaks for this release permanently. Guard against
it once, globally for this repo:

```bash
git config push.recurseSubmodules check
```

This aborts any push whose submodule commit is not present on its own remote.
Do not add a `branch =` key to `.gitmodules` for either submodule — it would let
`git submodule update --remote` drag the pointer off the release tag.

## 2. `libs/electrum-mnemonic`, if the upstream package changed

Unlike `bip352-js`/`slip39-js`, this one is **not** a submodule or a fork - `libs/electrum-mnemonic/`
is a thin browserify harness around the third-party
[`bitcoinjs/electrum-mnemonic`](https://github.com/bitcoinjs/electrum-mnemonic) npm package. No
tag-pin dance needed; check for a new release and bump it like a normal dependency:

```bash
cd libs/electrum-mnemonic
npm view electrum-mnemonic version   # compare against the installed version
npm install electrum-mnemonic@latest --save
npm run build                        # writes src/js/electrum-mnemonic.js
```

Commit the updated `package.json`/`package-lock.json` and the regenerated
`src/js/electrum-mnemonic.js` together. As of this writing the upstream package has had no
commits since 2020 and is effectively dormant, so this step is usually a no-op - worth a quick
`npm view` check regardless, since a release can happen at any time.

## 3. Test

1. Submodule unit tests (no browser needed)
   `cd libs/bip352-js && npm install && npm test`
   `cd libs/slip39-js && npm install && npm test`
1. Vector validation against the shipped bundles (no browser needed)
   `cd tests/vectors/bip352 && node validate-vectors.js`
   `node tests/vectors/slip39/validate-vectors.js` (run from the repo root)
1. Serve the app for the browser suite `cd src && python -m http.server`
1. Run each spec file explicitly, from `tests/`:
   `jasmine spec/tests-part1.js` — repeat for `tests-part2.js` through
   `tests-part5.js`, `tests-nip06.js`, `tests-bip352.js`, `tests-seedqr.js`,
   `tests-slip39.js`, `trezorvectors-fast.js`, and `slip39vectors-fast.js`
1. Ensure all tests pass

A bare `jasmine` run discovers nothing: the spec files are named `tests-*.js`,
which does not match the `**/*[sS]pec.js` pattern in
`tests/spec/support/jasmine.json`. The `npm test` script in `tests/package.json`
points at a non-existent `spec/tests.js` and is inherited from upstream.

## 4. Version and notes

1. Set the version in the release link in the `src/index.html` page header
1. Update the version and tagline in the Standalone Versions section of `README.md`
1. Add the new `# vX.Y.Z` section at the top of `changelog.md`

## 5. Build

Rebuild only the libraries that actually changed. Webpack re-emits identical
bytes when its inputs are unchanged, so a no-op rebuild leaves the tree clean.

1. Combined Bitcoin libraries
   `cd libs/combined && npm install --no-optional && npm run build`
1. Electrum mnemonic
   `cd libs/electrum-mnemonic && npm install && npm run build`
1. BIP-352 Silent Payments bundle
   `cd libs/bip352-bundle && npm install && npm run build`
1. SLIP-39 Shamir's Secret-Sharing bundle
   `cd libs/slip39-bundle && npm install && npm run build`
1. Generate the standalone `python compile.py`

Each library build writes into `src/js/`; the combined build also regenerates
`src/css/bootstrap.css`. `compile.py` writes both
`bip39-slip39-electrum-standalone.html` and `bip39-slip39-electrum-standalone.html.sha256sum`.

1. Sign the checksum, naming the key explicitly
   `rm -f bip39-slip39-electrum-standalone.html.sha256sum.asc`
   `gpg --armor --local-user E3BCAA9688A7BF6A --detach-sign bip39-slip39-electrum-standalone.html.sha256sum`

`--local-user` is not optional: this keyring holds more than one secret key and has no
`default-key` set, so a bare `gpg --detach-sign` picks the first suitable key rather than the
`levinster82 <levinster82@protonmail.com>` key every previous release was signed with — producing
a signature that fails to verify against the published key. The stale `.asc` must be removed
first, or gpg prompts to overwrite. Confirm before attaching:
`gpg --verify bip39-slip39-electrum-standalone.html.sha256sum.asc bip39-slip39-electrum-standalone.html.sha256sum`

## 6. Commit, tag, push

1. Commit these changes with message `Release vX.Y.Z`
1. Tag the commit `git tag vX.Y.Z`
1. Push the commits `git push`
1. Push the new tag `git push origin vX.Y.Z`

## 7. Publish on GitHub

Create a release from the tagged commit:

1. include the changelog for this release as text for the release
1. attach the `bip39-slip39-electrum-standalone.html` file
1. attach the `bip39-slip39-electrum-standalone.html.sha256sum` file
1. attach the `bip39-slip39-electrum-standalone.html.sha256sum.asc` file

## 8. Verify the published artifacts

1. Download the html and the checksum from the release, and confirm the hash
   `sha256sum -c bip39-slip39-electrum-standalone.html.sha256sum`
1. Download the signature from the release and verify it
   `gpg --verify bip39-slip39-electrum-standalone.html.sha256sum.asc bip39-slip39-electrum-standalone.html.sha256sum`
1. Open the downloaded file with no network connection and confirm it loads and
   generates a mnemonic
