Build (will create a bundle and copy it to /tmp/bitcoinjs-lib.js):

    npm install
    npm run build
    cp bitcoinjs-lib.js ../../src/js/bip39-libs.js
    manually add changes in https://github.com/iancoleman/bip39/commit/0702ecd3520c44cb8016f80329dcb5a3c8df88fc

## Library Build Process

1. Edit `src.js` to modify library exports or dependencies
2. Run `npm run build` to compile with browserify 
3. Copy `bitcoinjs-lib.js` to `../../src/js/bip39-libs.js` for inclusion in standalone HTML
4. Run `python3 compile.py` from project root to generate final standalone HTML

Note: The file `../../src/js/bip39-libs.js` is what gets compiled into the final standalone HTML by compile.py. Any changes to the library must be copied there to take effect.
