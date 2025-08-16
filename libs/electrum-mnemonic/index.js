// Browser entry point for electrum-mnemonic
const electrumMnemonic = require('electrum-mnemonic');

// Expose electrum-mnemonic to global window object for browser use
if (typeof window !== 'undefined') {
    window.electrumMnemonic = electrumMnemonic;
}

module.exports = electrumMnemonic;