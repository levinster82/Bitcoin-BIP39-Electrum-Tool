# Release Process

Once all code changes for this version have been committed, a release can be
created with the following steps.

## 1. Submodule, if `libs/bip352-js` changed

`libs/bip352-js` is a git submodule pinned to a release tag on its `master`
branch. Skip this section if the library was untouched this cycle.

1. Commit the change in the bip352-js repo, then tag it there
   `git tag -a vX.Y.Z -m "vX.Y.Z — summary"`
1. Push the commit and the tag `git push origin master && git push origin vX.Y.Z`
1. Point the submodule at the new tag
   `git -C libs/bip352-js fetch --tags && git -C libs/bip352-js checkout vX.Y.Z`
1. Rebuild the bundle (see Build below) and commit the new pointer together with
   the regenerated `src/js/bip352-js.js`

A detached HEAD in the submodule is expected: a gitlink always records a commit,
never a tag or branch name.

**The parent release tag records the submodule commit, not the tag name.** That
commit must stay reachable from a ref on the submodule's remote, or
`git submodule update --init` breaks for this release permanently. Guard against
it once, globally for this repo:

```bash
git config push.recurseSubmodules check
```

This aborts any push whose submodule commit is not present on the submodule's
remote. Do not add a `branch =` key to `.gitmodules` — it would let
`git submodule update --remote` drag the pointer off the release tag.

## 2. Test

1. Submodule unit tests (no browser needed)
   `cd libs/bip352-js && npm install && npm test`
1. Serve the app for the browser suite `cd src && python -m http.server`
1. Run each spec file explicitly, from `tests/`:
   `jasmine spec/tests-part1.js` — repeat for `tests-part2.js` through
   `tests-part5.js`, `tests-nip06.js`, `tests-bip352.js`, `tests-seedqr.js`,
   and `trezorvectors-fast.js`
1. Ensure all tests pass

A bare `jasmine` run discovers nothing: the spec files are named `tests-*.js`,
which does not match the `**/*[sS]pec.js` pattern in
`tests/spec/support/jasmine.json`. The `npm test` script in `tests/package.json`
points at a non-existent `spec/tests.js` and is inherited from upstream.

## 3. Version and notes

1. Set the version in the release link in the `src/index.html` page header
1. Update the version and tagline in the Standalone Versions section of `README.md`
1. Add the new `# vX.Y.Z` section at the top of `changelog.md`

## 4. Build

Rebuild only the libraries that actually changed. Webpack re-emits identical
bytes when its inputs are unchanged, so a no-op rebuild leaves the tree clean.

1. Combined Bitcoin libraries
   `cd libs/combined && npm install --no-optional && npm run build`
1. Electrum mnemonic
   `cd libs/electrum-mnemonic && npm install && npm run build`
1. BIP-352 Silent Payments bundle
   `cd libs/bip352-bundle && npm install && npm run build`
1. Generate the standalone `python compile.py`

Each library build writes into `src/js/`; the combined build also regenerates
`src/css/bootstrap.css`. `compile.py` writes both
`bip39-electrum-standalone.html` and `bip39-electrum-standalone.html.sha256sum`.

1. Sign the checksum
   `gpg --armor --detach-sign bip39-electrum-standalone.html.sha256sum`

## 5. Commit, tag, push

1. Commit these changes with message `Release vX.Y.Z`
1. Tag the commit `git tag vX.Y.Z`
1. Push the commits `git push`
1. Push the new tag `git push origin vX.Y.Z`

## 6. Publish on GitHub

Create a release from the tagged commit:

1. include the changelog for this release as text for the release
1. attach the `bip39-electrum-standalone.html` file
1. attach the `bip39-electrum-standalone.html.sha256sum` file
1. attach the `bip39-electrum-standalone.html.sha256sum.asc` file

## 7. Verify the published artifacts

1. Download the html and the checksum from the release, and confirm the hash
   `sha256sum -c bip39-electrum-standalone.html.sha256sum`
1. Download the signature from the release and verify it
   `gpg --verify bip39-electrum-standalone.html.sha256sum.asc bip39-electrum-standalone.html.sha256sum`
1. Open the downloaded file with no network connection and confirm it loads and
   generates a mnemonic
