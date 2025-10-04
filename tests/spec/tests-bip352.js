// Usage:
// cd /path/to/repo/tests
// jasmine spec/tests-bip352.js
//
// Dependencies:
// nodejs
// selenium
// jasmine
// see https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Headless_mode#Automated_testing_with_headless_mode

// USER SPECIFIED OPTIONS
var browser = process.env.BROWSER; //"firefox"; // or "chrome"
if (!browser) {
    console.log("Browser can be set via environment variable, eg");
    console.log("BROWSER=firefox jasmine spec/tests-bip352.js");
    console.log("Options for BROWSER are firefox chrome");
    console.log("Using default browser: chrome");
    browser = "chrome";
}
else if (browser !== 'chrome' && browser !== 'firefox') {
    throw `Unsupported browser: "${browser}", must be "chrome" or "firefox"`
}
else {
    console.log("Using browser: " + browser);
}

// Globals

var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var Key = webdriver.Key;
var until = webdriver.until;
var newDriver = null;
var driver = null;
// Delays in ms - optimized for speed
var generateDelay = 1000;
var feedbackDelay = 500;

// Use localhost server for both browsers
var url = "http://localhost:8000";

// Load test vectors
var fs = require('fs');
var testVectors = JSON.parse(fs.readFileSync('vectors/bip352/derivation_test_vectors_js.json', 'utf8'));

// Variables dependent on specific browser selection

if (browser == "firefox") {
    newDriver = function() {
        return new webdriver.Builder()
            .forBrowser('firefox')
            .build();
    }
}
if (browser == "chrome") {
    newDriver = function() {
        var chrome = require('selenium-webdriver/chrome');
        var options = new chrome.Options();
        options.addArguments('--headless=new');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--disable-gpu');
        options.addArguments('--allow-file-access-from-files');
        options.addArguments('--window-size=1920,3000');
        return new webdriver.Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
    }
}

// Helper functions

function testBip352Keys(done, params, comparisons) {
    // enter the mnemonic
    driver.findElement(By.css('.phrase'))
        .then(function(el) {
            return el.sendKeys(params.phrase);
        })
        // set passphrase if provided
        .then(function() {
            if (params.passphrase) {
                return driver.findElement(By.css('.passphrase')).then(function(el) {
                    el.clear();
                    return el.sendKeys(params.passphrase);
                });
            }
        })
        // wait 1 second for address generation
        .then(function() {
            return driver.sleep(generateDelay);
        })
        // select the bip352 tab
        .then(function() {
            return driver.findElement(By.css('#bip352-tab a'));
        })
        .then(function(el) {
            return el.click();
        })
        // set the account if not 0
        .then(function() {
            if (params.account !== 0) {
                return driver.findElement(By.css('#account-bip352')).then(function(el) {
                    el.clear();
                    el.sendKeys(params.account.toString());
                    return driver.sleep(300);
                });
            }
        })
        // set the address index if not 0
        .then(function() {
            if (params.addressIndex !== 0) {
                return driver.findElement(By.css('#address-index-bip352')).then(function(el) {
                    el.clear();
                    el.sendKeys(params.addressIndex.toString());
                    return driver.sleep(300);
                });
            }
        })
        // wait for everything to be calculated
        .then(function() {
            return driver.sleep(feedbackDelay);
        })
        // check scan private key
        .then(function() {
            return driver.findElement(By.css('#scan-key-priv-bip352'));
        })
        .then(function(el) {
            return el.getAttribute('value');
        })
        .then(function(scanPriv) {
            expect(scanPriv).toBe(comparisons.scanPrivateKey);
        })
        // check scan public key
        .then(function() {
            return driver.findElement(By.css('#scan-key-pub-bip352'));
        })
        .then(function(el) {
            return el.getAttribute('value');
        })
        .then(function(scanPub) {
            expect(scanPub).toBe(comparisons.scanPublicKey);
        })
        // check spend private key
        .then(function() {
            return driver.findElement(By.css('#spend-key-priv-bip352'));
        })
        .then(function(el) {
            return el.getAttribute('value');
        })
        .then(function(spendPriv) {
            expect(spendPriv).toBe(comparisons.spendPrivateKey);
        })
        // check spend public key
        .then(function() {
            return driver.findElement(By.css('#spend-key-pub-bip352'));
        })
        .then(function(el) {
            return el.getAttribute('value');
        })
        .then(function(spendPub) {
            expect(spendPub).toBe(comparisons.spendPublicKey);
        })
        // check silent payment address
        .then(function() {
            return driver.findElement(By.css('#silent-payment-address-bip352'));
        })
        .then(function(el) {
            return el.getAttribute('value');
        })
        .then(function(spAddress) {
            expect(spAddress).toBe(comparisons.silentPaymentAddress);
        })
        // check scan xprv
        .then(function() {
            return driver.findElement(By.css('#scan-xprv-bip352'));
        })
        .then(function(el) {
            return el.getAttribute('value');
        })
        .then(function(scanXprv) {
            expect(scanXprv).toBe(comparisons.scanXprv);
        })
        // check scan xpub
        .then(function() {
            return driver.findElement(By.css('#scan-xpub-bip352'));
        })
        .then(function(el) {
            return el.getAttribute('value');
        })
        .then(function(scanXpub) {
            expect(scanXpub).toBe(comparisons.scanXpub);
        })
        // check spend xprv
        .then(function() {
            return driver.findElement(By.css('#spend-xprv-bip352'));
        })
        .then(function(el) {
            return el.getAttribute('value');
        })
        .then(function(spendXprv) {
            expect(spendXprv).toBe(comparisons.spendXprv);
        })
        // check spend xpub
        .then(function() {
            return driver.findElement(By.css('#spend-xpub-bip352'));
        })
        .then(function(el) {
            return el.getAttribute('value');
        })
        .then(function(spendXpub) {
            expect(spendXpub).toBe(comparisons.spendXpub);
        })
        .then(done);
}

// Tests

describe('BIP-352 Silent Payments Derivation Tests', function() {

    beforeEach(function(done) {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
        driver = newDriver();
        driver.get(url).then(function() {
            // Wait a moment for page to fully load
            driver.sleep(300).then(done);
        });
    });

    afterEach(function(done) {
        if (driver) {
            driver.quit().then(function() {
                driver = null;
                done();
            }).catch(function(err) {
                driver = null;
                done();
            });
        } else {
            done();
        }
    });

    // Test Vector 1: BIP39 Test Vector 1 - Account 0, Address 0
    it('Should generate correct BIP-352 keys from "abandon abandon..." mnemonic (account 0, address 0)', function(done) {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
        var vector = testVectors.test_vectors[0]; // First vector

        testBip352Keys(done, {
            phrase: vector.mnemonic,
            passphrase: vector.passphrase,
            account: vector.account,
            addressIndex: vector.address_index
        }, {
            scanPrivateKey: vector.scan_key.private_key_hex,
            scanPublicKey: vector.scan_key.public_key_hex,
            scanXprv: vector.scan_key.xprv,
            scanXpub: vector.scan_key.xpub,
            spendPrivateKey: vector.spend_key.private_key_hex,
            spendPublicKey: vector.spend_key.public_key_hex,
            spendXprv: vector.spend_key.xprv,
            spendXpub: vector.spend_key.xpub,
            silentPaymentAddress: vector.silent_payment_address
        });
    });

    // Test Vector 2: BIP39 Test Vector 1 - Account 0, Address 1
    it('Should generate correct BIP-352 keys from "abandon abandon..." mnemonic (account 0, address 1)', function(done) {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
        var vector = testVectors.test_vectors[1];

        testBip352Keys(done, {
            phrase: vector.mnemonic,
            passphrase: vector.passphrase,
            account: vector.account,
            addressIndex: vector.address_index
        }, {
            scanPrivateKey: vector.scan_key.private_key_hex,
            scanPublicKey: vector.scan_key.public_key_hex,
            scanXprv: vector.scan_key.xprv,
            scanXpub: vector.scan_key.xpub,
            spendPrivateKey: vector.spend_key.private_key_hex,
            spendPublicKey: vector.spend_key.public_key_hex,
            spendXprv: vector.spend_key.xprv,
            spendXpub: vector.spend_key.xpub,
            silentPaymentAddress: vector.silent_payment_address
        });
    });

    // Test Vector 3: BIP39 Test Vector 1 - Account 1, Address 0
    it('Should generate correct BIP-352 keys from "abandon abandon..." mnemonic (account 1, address 0)', function(done) {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
        var vector = testVectors.test_vectors[3]; // Account 1, Address 0

        testBip352Keys(done, {
            phrase: vector.mnemonic,
            passphrase: vector.passphrase,
            account: vector.account,
            addressIndex: vector.address_index
        }, {
            scanPrivateKey: vector.scan_key.private_key_hex,
            scanPublicKey: vector.scan_key.public_key_hex,
            scanXprv: vector.scan_key.xprv,
            scanXpub: vector.scan_key.xpub,
            spendPrivateKey: vector.spend_key.private_key_hex,
            spendPublicKey: vector.spend_key.public_key_hex,
            spendXprv: vector.spend_key.xprv,
            spendXpub: vector.spend_key.xpub,
            silentPaymentAddress: vector.silent_payment_address
        });
    });

    // Test Vector 4: BIP39 Test Vector 2 - "legal winner..." mnemonic
    it('Should generate correct BIP-352 keys from "legal winner..." mnemonic (account 0, address 0)', function(done) {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
        var vector = testVectors.test_vectors[9]; // "legal winner..." - first occurrence

        testBip352Keys(done, {
            phrase: vector.mnemonic,
            passphrase: vector.passphrase,
            account: vector.account,
            addressIndex: vector.address_index
        }, {
            scanPrivateKey: vector.scan_key.private_key_hex,
            scanPublicKey: vector.scan_key.public_key_hex,
            scanXprv: vector.scan_key.xprv,
            scanXpub: vector.scan_key.xpub,
            spendPrivateKey: vector.spend_key.private_key_hex,
            spendPublicKey: vector.spend_key.public_key_hex,
            spendXprv: vector.spend_key.xprv,
            spendXpub: vector.spend_key.xpub,
            silentPaymentAddress: vector.silent_payment_address
        });
    });

    // Test Vector 5: BIP39 with Passphrase - "letter advice..." + "TREZOR"
    it('Should generate correct BIP-352 keys with passphrase "TREZOR" (account 0, address 0)', function(done) {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
        var vector = testVectors.test_vectors[13]; // Passphrase test - first occurrence

        testBip352Keys(done, {
            phrase: vector.mnemonic,
            passphrase: vector.passphrase,
            account: vector.account,
            addressIndex: vector.address_index
        }, {
            scanPrivateKey: vector.scan_key.private_key_hex,
            scanPublicKey: vector.scan_key.public_key_hex,
            scanXprv: vector.scan_key.xprv,
            scanXpub: vector.scan_key.xpub,
            spendPrivateKey: vector.spend_key.private_key_hex,
            spendPublicKey: vector.spend_key.public_key_hex,
            spendXprv: vector.spend_key.xprv,
            spendXpub: vector.spend_key.xpub,
            silentPaymentAddress: vector.silent_payment_address
        });
    });

    // Test Vector 6: 12-word Mnemonic - "zoo zoo..."
    it('Should generate correct BIP-352 keys from 12-word "zoo zoo..." mnemonic (account 0, address 0)', function(done) {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
        var vector = testVectors.test_vectors[15]; // Last vector - 12-word mnemonic

        testBip352Keys(done, {
            phrase: vector.mnemonic,
            passphrase: vector.passphrase,
            account: vector.account,
            addressIndex: vector.address_index
        }, {
            scanPrivateKey: vector.scan_key.private_key_hex,
            scanPublicKey: vector.scan_key.public_key_hex,
            scanXprv: vector.scan_key.xprv,
            scanXpub: vector.scan_key.xpub,
            spendPrivateKey: vector.spend_key.private_key_hex,
            spendPublicKey: vector.spend_key.public_key_hex,
            spendXprv: vector.spend_key.xprv,
            spendXpub: vector.spend_key.xpub,
            silentPaymentAddress: vector.silent_payment_address
        });
    });

    // Test Vector 7: Address index variation
    it('Should generate correct BIP-352 keys with address index 2 (account 0, address 2)', function(done) {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
        var vector = testVectors.test_vectors[2]; // Address index 2

        testBip352Keys(done, {
            phrase: vector.mnemonic,
            passphrase: vector.passphrase,
            account: vector.account,
            addressIndex: vector.address_index
        }, {
            scanPrivateKey: vector.scan_key.private_key_hex,
            scanPublicKey: vector.scan_key.public_key_hex,
            scanXprv: vector.scan_key.xprv,
            scanXpub: vector.scan_key.xpub,
            spendPrivateKey: vector.spend_key.private_key_hex,
            spendPublicKey: vector.spend_key.public_key_hex,
            spendXprv: vector.spend_key.xprv,
            spendXpub: vector.spend_key.xpub,
            silentPaymentAddress: vector.silent_payment_address
        });
    });

    // Test Vector 8: Account 2 variation
    it('Should generate correct BIP-352 keys with account 2 (account 2, address 0)', function(done) {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
        var vector = testVectors.test_vectors[6]; // Account 2, Address 0

        testBip352Keys(done, {
            phrase: vector.mnemonic,
            passphrase: vector.passphrase,
            account: vector.account,
            addressIndex: vector.address_index
        }, {
            scanPrivateKey: vector.scan_key.private_key_hex,
            scanPublicKey: vector.scan_key.public_key_hex,
            scanXprv: vector.scan_key.xprv,
            scanXpub: vector.scan_key.xpub,
            spendPrivateKey: vector.spend_key.private_key_hex,
            spendPublicKey: vector.spend_key.public_key_hex,
            spendXprv: vector.spend_key.xprv,
            spendXpub: vector.spend_key.xpub,
            silentPaymentAddress: vector.silent_payment_address
        });
    });

});
