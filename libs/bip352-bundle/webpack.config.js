const path = require('path');
const webpack = require('webpack');

// Bundles the bip352-js submodule for the browser. The submodule is a plain npm
// package (pinned to a release tag on its master branch) and deliberately carries
// no bundler config of its own, so the packaging lives here alongside the other
// libs/ build harnesses.
module.exports = {
    entry: path.resolve(__dirname, '../bip352-js/src/index.js'),
    output: {
        path: path.resolve(__dirname, '../../src/js'),
        filename: 'bip352-js.js',
        library: {
            name: 'BIP352',
            type: 'umd'
        },
        globalObject: 'this'
    },
    mode: 'production',
    resolve: {
        // The entry lives outside this directory, so node resolution walks up from
        // libs/bip352-js/ and never reaches our node_modules. Add it explicitly.
        modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
        fallback: {
            "crypto": false,
            "buffer": require.resolve("buffer/"),
            "stream": false,
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
