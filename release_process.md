Once all code changes for this version have been committed, a release can be
created with the following steps:

1. Run tests and ensure all tests pass
1. Set the version in index.html
1. Update changelog
1. Compile libs. `cd libs/combined && node run build`
1. Run `python compile.py`
1. Sign checksum `gpg --armor --detach-sign bip39-electrum-standalone.html.sha256sum`
1. Commit these changes with message `Release vX.Y.Z`
1. Tag the commit `git tag X.Y.Z`
1. Push the changes `git push`
1. Push the new tag `git push --tags`
1. Create a release on github from the tagged commit
    1. include the signed release notes as text for the release
    1. include the changelog for this release as text for the release
    1. attach the bip39-electrum-standalone.sha256sum.asc file
    1. attach the bip39-electrum-standalone.sha256sum file
    1. attach the bip39-electrum-standalone.html file
1. Download the file from the release and confirm it hashes to the expected value `sha256sum bip39-electrum-standalone.html`
1. Download the signature from the release and verify it. `gpg --verify bip39-electrum-standalone.sha256sum.asc`
1. Publish to any hosted locations (eg iancoleman.github.io/bip39)