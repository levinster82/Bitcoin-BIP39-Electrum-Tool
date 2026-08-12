// Usage:
// cd /path/to/repo/tests
// jasmine spec/tests-slip39.js
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
    console.log("BROWSER=firefox jasmine spec/tests-slip39.js");
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
var Select = webdriver.Select;
var until = webdriver.until;
var newDriver = null;
var driver = null;
// Delays in ms
var generateDelay = 800;
var feedbackDelay = 500;

// Use localhost server for both browsers
var url = "http://localhost:8000";

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

// Selects an option in a plain <select> by its value attribute, dispatching a real
// change event (needed since mnemonicTypeChanged()/generatedStrengthChanged() etc.
// are bound to jQuery .on("change", ...) handlers).
function selectOption(cssSelector, value) {
    return driver.findElement(By.css(cssSelector)).then(function(el) {
        return new Select(el).selectByValue(value);
    });
}

function setFieldValue(cssSelector, value) {
    return driver.findElement(By.css(cssSelector)).then(function(el) {
        return el.clear().then(function() {
            return el.sendKeys(value);
        });
    });
}

function clickElement(cssSelector) {
    return driver.findElement(By.css(cssSelector)).then(function(el) {
        return el.click();
    });
}

function getValue(cssSelector) {
    return driver.findElement(By.css(cssSelector)).then(function(el) {
        return el.getAttribute('value');
    });
}

function isDisplayed(cssSelector) {
    return driver.findElement(By.css(cssSelector)).then(function(el) {
        return el.isDisplayed();
    });
}

function elementCount(cssSelector) {
    return driver.findElements(By.css(cssSelector)).then(function(els) {
        return els.length;
    });
}

// Tests

describe('SLIP-39 Shamir Secret-Sharing Tests', function() {

    beforeEach(function(done) {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
        driver = newDriver();
        driver.get(url).then(function() {
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

    it('Should show the SLIP-39 panel and hide BIP39/Electrum-only fields when selected', function(done) {
        selectOption('#mnemonic-type', 'slip39')
            .then(function() {
                return driver.sleep(300);
            })
            .then(function() {
                return isDisplayed('.slip39-container');
            })
            .then(function(slip39Visible) {
                expect(slip39Visible).toBe(true);
                return isDisplayed('#electrum-legacy-tab');
            })
            .then(function(electrumTabVisible) {
                expect(electrumTabVisible).toBe(false);
                return isDisplayed('#bip44-tab');
            })
            .then(function(bip44TabVisible) {
                expect(bip44TabVisible).toBe(true);
                return getValue('.generate-container .strength');
            })
            .then(function(strengthVal) {
                // Default SLIP-39 secret size is 33 words (256-bit)
                expect(strengthVal).toBe('33');
            })
            .then(done);
    });

    it('Should generate a valid single-group (1-of-1) SLIP-39 share and derive a real address', function(done) {
        selectOption('#mnemonic-type', 'slip39')
            .then(function() {
                return driver.sleep(300);
            })
            // Reduce to a single 1-of-1 group: remove the 2nd and 3rd default rows
            .then(function() {
                return driver.findElements(By.css('.slip39-remove-group'));
            })
            .then(function(buttons) {
                // Click the last remove button twice, leaving one row
                return buttons[buttons.length - 1].click().then(function() {
                    return driver.findElements(By.css('.slip39-remove-group'));
                }).then(function(remaining) {
                    return remaining[remaining.length - 1].click();
                });
            })
            .then(function() {
                return setFieldValue('#slip39-group-threshold', '1');
            })
            .then(function() {
                return clickElement('.generate');
            })
            .then(function() {
                return driver.sleep(generateDelay);
            })
            .then(function() {
                return getValue('.phrase');
            })
            .then(function(phrase) {
                var shareLines = phrase.split('\n').filter(function(l) {
                    return l.trim().length > 0 && l.indexOf('#') !== 0;
                });
                expect(shareLines.length).toBe(1);
                expect(phrase.indexOf('# Group 1')).toBe(0);
                return getValue('.root-key');
            })
            .then(function(rootKey) {
                expect(rootKey.indexOf('xprv')).toBe(0);
                return elementCount('.addresses tr');
            })
            .then(function(rowCount) {
                expect(rowCount).toBeGreaterThan(0);
            })
            .then(done);
    });

    it('Should generate the default 2-of-3 group config with correct structure', function(done) {
        selectOption('#mnemonic-type', 'slip39')
            .then(function() {
                return driver.sleep(300);
            })
            .then(function() {
                return getValue('#slip39-group-threshold');
            })
            .then(function(threshold) {
                expect(threshold).toBe('2');
                return elementCount('#slip39-groups-table tbody tr');
            })
            .then(function(rowCount) {
                expect(rowCount).toBe(3);
                return clickElement('.generate');
            })
            .then(function() {
                return driver.sleep(generateDelay);
            })
            .then(function() {
                return getValue('.phrase');
            })
            .then(function(phrase) {
                var groupHeaders = phrase.split('\n').filter(function(l) {
                    return l.indexOf('# Group') === 0;
                });
                expect(groupHeaders.length).toBe(3);
                return getValue('.root-key');
            })
            .then(function(rootKey) {
                expect(rootKey.length).toBeGreaterThan(0);
                return getValue('.feedback');
            })
            .then(function() {
                return driver.findElement(By.css('.feedback')).isDisplayed();
            })
            .then(function(feedbackVisible) {
                // No validation error should be showing right after a fresh generate,
                // even though the group config is over-provisioned relative to the
                // 2-of-3 threshold (regression test: this used to spuriously error,
                // see slip39LastGeneratedPhrase in src/js/index.js)
                expect(feedbackVisible).toBe(false);
            })
            .then(done);
    });

    it('Should recover the identical root key when pasting back exactly enough shares', function(done) {
        var originalRootKey, originalFingerprint, fullPhrase;
        selectOption('#mnemonic-type', 'slip39')
            .then(function() {
                return driver.sleep(300);
            })
            .then(function() {
                return clickElement('.generate');
            })
            .then(function() {
                return driver.sleep(generateDelay);
            })
            .then(function() {
                return getValue('.root-key');
            })
            .then(function(rootKey) {
                originalRootKey = rootKey;
                return getValue('.fingerprint');
            })
            .then(function(fingerprint) {
                originalFingerprint = fingerprint;
                return getValue('.phrase');
            })
            .then(function(phrase) {
                fullPhrase = phrase;
                // Keep only the first 2 of the 3 groups (2-of-3 threshold - exactly enough)
                var lines = phrase.split('\n');
                var headerIdx = [];
                lines.forEach(function(l, i) {
                    if (l.indexOf('# Group') === 0) headerIdx.push(i);
                });
                var twoGroups = lines.slice(headerIdx[0], headerIdx[2]).join('\n');
                return setFieldValue('.phrase', twoGroups);
            })
            .then(function() {
                return driver.sleep(generateDelay);
            })
            .then(function() {
                return getValue('.root-key');
            })
            .then(function(rootKey) {
                expect(rootKey).toBe(originalRootKey);
                return getValue('.fingerprint');
            })
            .then(function(fingerprint) {
                expect(fingerprint).toBe(originalFingerprint);
            })
            .then(done);
    });

    it('Should show a validation error for insufficient shares', function(done) {
        selectOption('#mnemonic-type', 'slip39')
            .then(function() {
                return driver.sleep(300);
            })
            .then(function() {
                return clickElement('.generate');
            })
            .then(function() {
                return driver.sleep(generateDelay);
            })
            .then(function() {
                return getValue('.phrase');
            })
            .then(function(phrase) {
                // Keep only the first group's share - not enough for the 2-of-3 threshold
                var lines = phrase.split('\n');
                var headerIdx = [];
                lines.forEach(function(l, i) {
                    if (l.indexOf('# Group') === 0) headerIdx.push(i);
                });
                var oneGroup = lines.slice(headerIdx[0], headerIdx[1]).join('\n');
                return setFieldValue('.phrase', oneGroup);
            })
            .then(function() {
                return driver.sleep(generateDelay);
            })
            .then(function() {
                return driver.findElement(By.css('.feedback')).isDisplayed();
            })
            .then(function(feedbackVisible) {
                expect(feedbackVisible).toBe(true);
                return driver.findElement(By.css('.feedback')).getText();
            })
            .then(function(feedbackText) {
                expect(feedbackText).toContain('SLIP-39 error');
                expect(feedbackText).toContain('Insufficient');
            })
            .then(done);
    });

    it('Should split a known custom master secret entered via "Show entropy details"', function(done) {
        // Independently verified: bip32.fromSeed(Buffer.from(seedHex, 'hex')).toBase58()
        // computed directly with the bip32/tiny-secp256k1 libraries (not from memory) equals
        // this value for this exact 128-bit seed.
        var seedHex = '00112233445566778899aabbccddeeff';
        var expectedRootKey = 'xprv9s21ZrQH143K4ESMwEYHh44ZyVHhf7t37f9L6vKyVrN6xF9PghTS3fY7Vh8f1gCGbQBgZPByrU2CUwpQCsr7mTxBofa9gLLXP4PWBo2Xd41';

        selectOption('#mnemonic-type', 'slip39')
            .then(function() {
                return driver.sleep(300);
            })
            .then(function() {
                return selectOption('.generate-container .strength', '20'); // 128-bit
            })
            .then(function() {
                return clickElement('#use-entropy');
            })
            .then(function() {
                return driver.sleep(300);
            })
            .then(function() {
                return setFieldValue('#entropy', seedHex);
            })
            .then(function() {
                return driver.sleep(generateDelay);
            })
            .then(function() {
                return getValue('.seed');
            })
            .then(function(seed) {
                expect(seed).toBe(seedHex);
                return getValue('.root-key');
            })
            .then(function(rootKey) {
                expect(rootKey).toBe(expectedRootKey);
            })
            .then(done);
    });

    it('Should keep the same root key when switching derivation-path tabs after generating', function(done) {
        var originalFingerprint;
        selectOption('#mnemonic-type', 'slip39')
            .then(function() {
                return driver.sleep(300);
            })
            .then(function() {
                return clickElement('.generate');
            })
            .then(function() {
                return driver.sleep(generateDelay);
            })
            .then(function() {
                return getValue('.fingerprint');
            })
            .then(function(fingerprint) {
                originalFingerprint = fingerprint;
                return clickElement('#bip49-tab a');
            })
            .then(function() {
                return driver.sleep(feedbackDelay);
            })
            .then(function() {
                return driver.findElement(By.css('.feedback')).isDisplayed();
            })
            .then(function(feedbackVisible) {
                // Regression test: switching tabs used to spuriously trigger a
                // "Wrong number of mnemonic groups" error - see slip39LastGeneratedPhrase
                // in src/js/index.js
                expect(feedbackVisible).toBe(false);
                return getValue('.fingerprint');
            })
            .then(function(fingerprint) {
                expect(fingerprint).toBe(originalFingerprint);
                return clickElement('#bip44-tab a');
            })
            .then(function() {
                return driver.sleep(feedbackDelay);
            })
            .then(function() {
                return getValue('.fingerprint');
            })
            .then(function(fingerprint) {
                expect(fingerprint).toBe(originalFingerprint);
            })
            .then(done);
    });

    it('Should restore BIP39 fields and strength options when switching back from SLIP-39', function(done) {
        selectOption('#mnemonic-type', 'slip39')
            .then(function() {
                return driver.sleep(300);
            })
            .then(function() {
                return selectOption('#mnemonic-type', 'bip39');
            })
            .then(function() {
                return driver.sleep(300);
            })
            .then(function() {
                return isDisplayed('.slip39-container');
            })
            .then(function(slip39Visible) {
                expect(slip39Visible).toBe(false);
                return getValue('.generate-container .strength');
            })
            .then(function(strengthVal) {
                expect(strengthVal).toBe('24');
                return clickElement('.generate');
            })
            .then(function() {
                return driver.sleep(generateDelay);
            })
            .then(function() {
                return getValue('.phrase');
            })
            .then(function(phrase) {
                var wordCount = phrase.trim().split(/\s+/).length;
                expect(wordCount).toBe(24);
            })
            .then(done);
    });

});
