const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'bip352-silentpayments.js',
        path: path.resolve(__dirname, 'dist'),
        library: {
            name: 'BIP352',
            type: 'umd'
        },
        globalObject: 'this'
    },
    resolve: {
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
    ],
    mode: 'production'
};
