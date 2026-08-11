const path = require('path');
const webpack = require('webpack');

// Bundles the slip39-js submodule for the browser. The submodule is a plain npm
// package (pinned to a release tag on its master branch) and deliberately carries
// no bundler config of its own, so the packaging lives here alongside the other
// libs/ build harnesses.
//
// Unlike bip352-js, slip39-js still calls Node's crypto module directly
// (randomBytes / pbkdf2Sync / createHmac) for share generation, so — unlike
// bip352-bundle, which sets crypto: false — this harness polyfills crypto via
// ./crypto-shim.js (see that file for why it isn't the crypto-browserify
// umbrella package). The one Node crypto call with no browser equivalent
// (crypto.timingSafeEqual, used for the constant-time checksum compare) was
// removed upstream instead of polyfilled here; see docs/slip39/README.md.
module.exports = {
    entry: path.resolve(__dirname, '../slip39-js/index.js'),
    output: {
        path: path.resolve(__dirname, '../../src/js'),
        filename: 'slip39-js.js',
        library: {
            name: 'SLIP39',
            type: 'umd'
        },
        globalObject: 'this'
    },
    mode: 'production',
    resolve: {
        // The entry lives outside this directory, so node resolution walks up from
        // libs/slip39-js/ and never reaches our node_modules. Add it explicitly.
        modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
        fallback: {
            "crypto": require.resolve("./crypto-shim.js"),
            "buffer": require.resolve("buffer/"),
            "stream": require.resolve("stream-browserify"),
            "process": require.resolve("process/browser")
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process/browser'
        })
    ]
};
