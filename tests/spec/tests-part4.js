// Usage:
// cd /path/to/repo/tests
// jasmine spec/tests.js
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
    console.log("BROWSER=firefox jasmine spec/tests.js");
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
// Delays in ms
var generateDelay = 1500;
var feedbackDelay = 500;
var entropyFeedbackDelay = 500;
var bip38delay = 15000;

// Use localhost server for all browsers
var url = "http://localhost:8000";

// Variables dependent on specific browser selection

if (browser == "firefox") {
    var firefox = require('selenium-webdriver/firefox');
    newDriver = function() {
        var options = new firefox.Options();
        options.addArguments("--headless");
        return new webdriver.Builder()
              .forBrowser('firefox')
              .setFirefoxOptions(options)
              .build();
    }
}
else if (browser == "chrome") {
    var chrome = require('selenium-webdriver/chrome');
    newDriver = function() {
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

async function testNetwork(done, params) {
    var phrase = params.phrase || 'abandon abandon ability';
    await driver.findElement(By.css('.phrase'))
        .sendKeys(phrase);
    await selectNetwork(params.selectText);
    await driver.sleep(generateDelay);
    const address = await new Promise((resolve) => {
        getFirstAddress(resolve);
    });
    const pubkey = await new Promise((resolve) => {
        getFirstPublicKey(resolve);
    });
    const privkey = await new Promise((resolve) => {
        getFirstPrivateKey(resolve);
    });
    if ("firstAddress" in params) {
        expect(address).toBe(params.firstAddress);
    }
    if ("firstPubKey" in params) {
        expect(pubkey).toBe(params.firstPubKey);
    }
    if ("firstPrivKey" in params) {
        expect(privkey).toBe(params.firstPrivKey);
    }
    done();
}

function getFirstRowValue(handler, selector) {
    driver.findElements(By.css(selector))
        .then(function(els) {
            if (els.length > 0) {
                els[0].getText()
                    .then(handler);
            } else {
                handler("");
            }
        })
}

function getFirstAddress(handler) {
    getFirstRowValue(handler, ".address");
}

function getFirstPublicKey(handler) {
    getFirstRowValue(handler, ".pubkey");
}

function getFirstPrivateKey(handler) {
    getFirstRowValue(handler, ".privkey");
}

function getFirstPath(handler) {
    getFirstRowValue(handler, ".index");
}

function testColumnValuesAreInvisible(done, columnClassName) {
    var selector = "." + columnClassName + " span";
    driver.findElements(By.css(selector))
        .then(function(els) {
            els[0].getAttribute("class")
                .then(function(classes) {
                    expect(classes).toContain("invisible");
                    done();
                });
        })
}

function testRowsAreInCorrectOrder(done) {
    driver.findElements(By.css('.index'))
        .then(function(els) {
            var testRowAtIndex = function(i) {
                if (i >= els.length) {
                    done();
                }
                else {
                    els[i].getText()
                        .then(function(actualPath) {
                            var noHardened = actualPath.replace(/'/g, "");
                            var pathBits = noHardened.split("/")
                            var lastBit = pathBits[pathBits.length-1];
                            var actualIndex = parseInt(lastBit);
                            expect(actualIndex).toBe(i);
                            testRowAtIndex(i+1);
                        });
                }
            }
            testRowAtIndex(0);
        });
}

function selectNetwork(name) {
    driver.executeScript(function() {
        var selectText = arguments[0];
        $(".network option[selected]").removeAttr("selected");
        $(".network option").filter(function(i,e) {
            return $(e).html() == selectText;
        }).prop("selected", true);
        $(".network").trigger("change");
    }, name);
}

function selectBip85Language(language) {
    driver.executeScript(function() {
        var selectText = arguments[0];
        $(".bip85-mnemonic-language option[selected]").removeAttr("selected");
        $(".bip85-mnemonic-language option").filter(function(i,e) {
            return $(e).html() == selectText;
        }).prop("selected", true);
        $(".bip85-mnemonic-language").trigger("change");
    }, language);
}

function testEntropyType(done, entropyText, entropyTypeUnsafe) {
    // entropy type is compiled into regexp so needs escaping
    // see https://stackoverflow.com/a/2593661
    var entropyType = (entropyTypeUnsafe+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .sendKeys(entropyText);
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.entropy-container'))
            .getText()
            .then(function(text) {
                var re = new RegExp("Entropy Type\\s+" + entropyType);
                expect(text).toMatch(re);
                done();
            });
    });
}

function testEntropyBits(done, entropyText, entropyBits) {
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .sendKeys(entropyText);
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.entropy-container'))
            .getText()
            .then(function(text) {
                var re = new RegExp("Total Bits\\s+" + entropyBits);
                expect(text).toMatch(re);
                done();
            });
    });
}

function testEntropyFeedback(done, entropyDetail) {
    // entropy type is compiled into regexp so needs escaping
    // see https://stackoverflow.com/a/2593661
    if ("type" in entropyDetail) {
        entropyDetail.type = (entropyDetail.type+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
    }
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .sendKeys(entropyDetail.entropy);
    driver.sleep(entropyFeedbackDelay).then(function() {
        driver.findElement(By.css('.entropy-container'))
            .getText()
            .then(function(text) {
                driver.findElement(By.css('.phrase'))
                    .getAttribute("value")
                    .then(function(phrase) {
                        if ("filtered" in entropyDetail) {
                            var key = "Filtered Entropy";
                            var value = entropyDetail.filtered;
                            var reText = key + "\\s+" + value;
                            var re = new RegExp(reText);
                            expect(text).toMatch(re);
                        }
                        if ("type" in entropyDetail) {
                            var key = "Entropy Type";
                            var value = entropyDetail.type;
                            var reText = key + "\\s+" + value;
                            var re = new RegExp(reText);
                            expect(text).toMatch(re);
                        }
                        if ("events" in entropyDetail) {
                            var key = "Event Count";
                            var value = entropyDetail.events;
                            var reText = key + "\\s+" + value;
                            var re = new RegExp(reText);
                            expect(text).toMatch(re);
                        }
                        if ("bits" in entropyDetail) {
                            var key = "Total Bits";
                            var value = entropyDetail.bits;
                            var reText = key + "\\s+" + value;
                            var re = new RegExp(reText);
                            expect(text).toMatch(re);
                        }
                        if ("bitsPerEvent" in entropyDetail) {
                            var key = "Bits Per Event";
                            var value = entropyDetail.bitsPerEvent;
                            var reText = key + "\\s+" + value;
                            var re = new RegExp(reText);
                            expect(text).toMatch(re);
                        }
                        if ("words" in entropyDetail) {
                            var actualWords = phrase.split(/\s+/)
                                .filter(function(w) { return w.length > 0 })
                                .length;
                            expect(actualWords).toBe(entropyDetail.words);
                        }
                        if ("strength" in entropyDetail) {
                            var key = "Time To Crack";
                            var value = entropyDetail.strength;
                            var reText = key + "\\s+" + value;
                            var re = new RegExp(reText);
                            expect(text).toMatch(re);
                        }
                        done();
                    });
            });
    });
}

function testClientSelect(done, params) {
    // set mnemonic and select bip32 tab
    driver.findElement(By.css('#bip32-tab a'))
        .click()
    driver.findElement(By.css('.phrase'))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        // BITCOIN CORE
        // set bip32 client to bitcoin core
        driver.executeScript(function() {
            $("#bip32-client").val(arguments[0]).trigger("change");
        }, params.selectValue);
        driver.sleep(generateDelay).then(function() {
            // check the derivation path is correct
            driver.findElement(By.css("#bip32-path"))
                .getAttribute("value")
                .then(function(path) {
                expect(path).toBe(params.bip32path);
                // check hardened addresses is selected
                driver.findElement(By.css(".hardened-addresses"))
                    .getAttribute("checked")
                    .then(function(isChecked) {
                        expect(isChecked).toBe(params.useHardenedAddresses);
                        // check input is readonly
                        driver.findElement(By.css("#bip32-path"))
                            .getAttribute("readonly")
                            .then(function(isReadonly) {
                                expect(isReadonly).toBe("true");
                                done();
                            });
                    });
            });
        });
    });
}

describe('BIP39 Tool Tests', function() {

    beforeEach(async function() {
        driver = newDriver();
        await driver.get(url);
    });

    // Close the website after each test is run (so that it is opened fresh each time)
    afterEach(async function() {
        if (driver) {
            await driver.quit();
        }
    });

// BEGIN TESTS

it('Changes the address list if bip49 change is changed', async function() {
    await driver.findElement(By.css('#bip49-tab a'))
        .click();
    await driver.findElement(By.css('#bip49 .change'))
        .clear();
    await driver.findElement(By.css('#bip49 .change'))
        .sendKeys("1");
    await driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about");
    await driver.sleep(generateDelay);
    const address = await new Promise((resolve) => {
        getFirstAddress(resolve);
    });
    expect(address).toBe("34K56kSjgUCUSD8GTtuF7c9Zzwokbs6uZ7");
});

// BIP49 account extendend private key is shown
it('Shows the bip49 account extended private key', async function() {
    await driver.findElement(By.css('#bip49-tab a'))
        .click();
    await driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about");
    await driver.sleep(generateDelay);
    const xprv = await driver.findElement(By.css('#bip49 .account-xprv'))
        .getAttribute("value");
    expect(xprv).toBe("yprvAHwhK6RbpuS3dgCYHM5jc2ZvEKd7Bi61u9FVhYMpgMSuZS613T1xxQeKTffhrHY79hZ5PsskBjcc6C2V7DrnsMsNaGDaWev3GLRQRgV7hxF");
});

// BIP49 account extendend public key is shown
it('Shows the bip49 account extended public key', async function() {
    await driver.findElement(By.css('#bip49-tab a'))
        .click();
    await driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about");
    await driver.sleep(generateDelay);
    const xprv = await driver.findElement(By.css('#bip49 .account-xpub'))
        .getAttribute("value");
    expect(xprv).toBe("ypub6Ww3ibxVfGzLrAH1PNcjyAWenMTbbAosGNB6VvmSEgytSER9azLDWCxoJwW7Ke7icmizBMXrzBx9979FfaHxHcrArf3zbeJJJUZPf663zsP");
});


// github issue 43
// Cleared mnemonic and root key still allows addresses to be generated
// https://github.com/iancoleman/bip39/issues/43
it('Clears old root keys from memory when mnemonic is cleared', async function() {
    // set the phrase
    driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon ability");
    await driver.sleep(generateDelay);
    // clear the mnemonic and root key
    // using selenium .clear() doesn't seem to trigger the 'input' event
    // so clear it using keys instead
    await driver.findElement(By.css('.phrase'))
        .sendKeys(Key.CONTROL,"a");
    await driver.findElement(By.css('.phrase'))
        .sendKeys(Key.DELETE);
    await driver.findElement(By.css('.root-key'))
        .sendKeys(Key.CONTROL,"a");
    await driver.findElement(By.css('.root-key'))
        .sendKeys(Key.DELETE);
    await driver.sleep(generateDelay);
    // try to generate more addresses
    var moreButton = await driver.findElement(By.css('.more'));
    await driver.executeScript("arguments[0].scrollIntoView({behavior: 'instant', block: 'nearest'});", moreButton);
    await driver.sleep(100);
    await moreButton.click();
    await driver.sleep(generateDelay);
    const els = await driver.findElements(By.css(".addresses tr"));
    // check there are no addresses shown
    expect(els.length).toBe(0);
});

// Github issue 95
// error trying to generate addresses from xpub with hardened derivation
it('Shows error for hardened addresses with xpub root key', async function() {
    await driver.findElement(By.css('#bip32-tab a'))
        .click();
    await driver.executeScript(function() {
        $(".hardened-addresses").prop("checked", true);
    });
    // set xpub for account 0 of bip44 for 'abandon abandon ability'
    await driver.findElement(By.css("#root-key"))
        .sendKeys("xpub6CzDCPbtLrrn4VpVbyyQLHbdSMpZoHN4iuW64VswCyEpfjM2mJGdaHJ2DyuZwtst96E16VvcERb8BBeJdHSCVmAq9RhtRQg6eAZFrTKCNqf");
    await driver.sleep(generateDelay);
    // Check feedback is correct
    const feedback = await driver.findElement(By.css('.feedback'))
        .getText();
    const msg = "Hardened derivation path is invalid with xpub key";
    expect(feedback).toBe(msg);
});

// Litecoin uses ltub by default, and can optionally be set to xprv
// github issue 96
// https://github.com/iancoleman/bip39/issues/96
// Issue with extended keys on Litecoin

// github issue 99
// https://github.com/iancoleman/bip39/issues/99#issuecomment-327094159
// "warn me emphatically when they have detected invalid input" to the entropy field
// A warning is shown when entropy is filtered and discarded
it('Warns when entropy is filtered and discarded', async function() {
    await driver.findElement(By.css('.use-entropy'))
        .click();
    // set entropy to have no filtered content
    await driver.findElement(By.css('.entropy'))
        .sendKeys("00000000 00000000 00000000 00000000");
    await driver.sleep(generateDelay);
    // check the filter warning does not show
    const initialClasses = await driver.findElement(By.css('.entropy-container .filter-warning'))
        .getAttribute("class");
    expect(initialClasses).toContain("hidden");
    // set entropy to have some filtered content
    await driver.findElement(By.css('.entropy'))
        .sendKeys("10000000 zxcvbn 00000000 00000000 00000000");
    await driver.sleep(generateDelay);
    // check the filter warning shows
    const finalClasses = await driver.findElement(By.css('.entropy-container .filter-warning'))
        .getAttribute("class");
    expect(finalClasses).not.toContain("hidden");
});




// End of tests ported from old suit, so no more comments above each test now

it('Can generate more addresses from a custom index', async function() {
    const expectedIndexes = [
        0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,
        40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59
    ];
    await driver.findElement(By.css('.phrase'))
        .sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length");
    await driver.sleep(generateDelay);
    // Set start of next lot of rows to be from index 40
    // which means indexes 20-39 will not be in the table.
    await driver.findElement(By.css('.more-rows-start-index'))
        .sendKeys("40");
    var moreButton = await driver.findElement(By.css('.more'));
    await driver.executeScript("arguments[0].scrollIntoView({behavior: 'instant', block: 'nearest'});", moreButton);
    await driver.sleep(100);
    await moreButton.click();
    await driver.sleep(generateDelay);
    // Check actual indexes in the table match the expected pattern
    const els = await driver.findElements(By.css(".index"));
    expect(els.length).toBe(expectedIndexes.length);
    for (let i = 0; i < expectedIndexes.length; i++) {
        const actualPath = await els[i].getText();
        const noHardened = actualPath.replace(/'/g, "");
        const pathBits = noHardened.split("/");
        const lastBit = pathBits[pathBits.length-1];
        const actualIndex = parseInt(lastBit);
        const expectedIndex = expectedIndexes[i];
        expect(actualIndex).toBe(expectedIndex);
    }
});

it('Can generate BIP141 addresses with P2WPKH-in-P2SH semanitcs', async function() {
    // Sourced from BIP49 official test specs
    await driver.findElement(By.css('#bip141-tab a'))
        .click();
    await driver.findElement(By.css('.bip141-path'))
        .clear();
    await driver.findElement(By.css('.bip141-path'))
        .sendKeys("m/49'/1'/0'/0");
    await selectNetwork("BTC - Bitcoin Testnet");
    await driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about");
    await driver.sleep(generateDelay);
    const address = await new Promise((resolve) => {
        getFirstAddress(resolve);
    });
    expect(address).toBe("2Mww8dCYPUpKHofjgcXcBCEGmniw9CoaiD2");
});

it('Can generate BIP141 addresses with P2WSH semanitcs', async function() {
    await driver.findElement(By.css('#bip141-tab a'))
        .click();
    // Choose P2WSH
    await driver.executeScript(function() {
        $(".bip141-semantics option[selected]").removeAttr("selected");
        $(".bip141-semantics option").filter(function(i,e) {
            return $(e).html() == "P2WSH (1-of-1 multisig)";
        }).prop("selected", true);
        $(".bip141-semantics").trigger("change");
    });
    await driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length");
    await driver.sleep(generateDelay);
    const rootKey = await driver.findElement(By.css("#root-key"))
        .getAttribute("value");
    expect(rootKey).toBe("ZprvAhadJRUYsNge9YKDZPdURy6SDk3NQkeuWzXahhrghswvRE3XMvLtgRBzSfcnDedpz9TPSXNpcPT2Vbq4wSpDY9syDbSgwzhHYhYqL2RkyMK");
    const address = await new Promise((resolve) => {
        getFirstAddress(resolve);
    });
    expect(address).toBe("bc1qmtf9rx7js0wg9sku6zvl8jtwnk4grygyljqytxd8kkwjsua94wrsa3cmrq");
});

it('Can generate BIP141 addresses with P2WSH-in-P2SH semanitcs', async function() {
    driver.findElement(By.css('#bip141-tab a'))
        .click();
    // Choose P2WSH-in-P2SH
    await driver.executeScript(function() {
        $(".bip141-semantics option[selected]").removeAttr("selected");
        $(".bip141-semantics option").filter(function(i,e) {
            return $(e).html() == "P2WSH nested in P2SH (1-of-1 multisig)";
        }).prop("selected", true);
        $(".bip141-semantics").trigger("change");
    });
    await driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length");
    await driver.sleep(generateDelay);
    const rootKey = await driver.findElement(By.css("#root-key"))
        .getAttribute("value");
    expect(rootKey).toBe("YprvANkMzkodih9AJF86j2qrDszw3mtvU8fQbt1MvJxoKsa3N8EJ7GBL4MXrRTfCDjyuaWLah3nG9j6UcKDWDkQCjvCNMFkGN5soGyVBwR3kiLZ");
    const address = await new Promise((resolve) => {
        getFirstAddress(resolve);
    });
    expect(address).toBe("3HbJPHu2dcNyi9ccB7kiePB52WsigpxVe9");
});

it('Uses Vprv for bitcoin testnet p2wsh', async function() {
    await selectNetwork("BTC - Bitcoin Testnet");
    await driver.findElement(By.css('#bip141-tab a'))
        .click();
    // Choose P2WSH
    await driver.executeScript(function() {
        $(".bip141-semantics option[selected]").removeAttr("selected");
        $(".bip141-semantics option").filter(function(i,e) {
            return $(e).html() == "P2WSH (1-of-1 multisig)";
        }).prop("selected", true);
        $(".bip141-semantics").trigger("change");
    });
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length');
    await driver.sleep(generateDelay);
    const path = await driver.findElement(By.css('.root-key'))
        .getAttribute("value");
    expect(path).toBe("Vprv16YtLrHXxePM5NbRSLMPZM13Wsn8tQDreTmX5zeTKvAzF8rzGSBJZUG42ysJhtTDw7z2q96UPznaj8Rwo1esGpxsDH7zbBV9nwTGTMhjaTY");
});

it('Uses Uprv for bitcoin testnet p2wsh-in-p2sh', async function() {
    await selectNetwork("BTC - Bitcoin Testnet");
    await driver.findElement(By.css('#bip141-tab a'))
        .click();
    // Choose P2WSH-in-P2SH
    await driver.executeScript(function() {
        $(".bip141-semantics option[selected]").removeAttr("selected");
        $(".bip141-semantics option").filter(function(i,e) {
            return $(e).html() == "P2WSH nested in P2SH (1-of-1 multisig)";
        }).prop("selected", true);
        $(".bip141-semantics").trigger("change");
    });
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length');
    await driver.sleep(generateDelay);
    const path = await driver.findElement(By.css('.root-key'))
        .getAttribute("value");
    expect(path).toBe("Uprv95RJn67y7xyEu4MdPbhMPXcvMuK8hehQwRvUnjPFor4X9iyP6dX5a6uJLdprE7NDwwsMh9Q2K5gH5AmFLxk9YyTxstxa2SbrC5EcP583b1K");
});

it('Can generate BIP141 addresses with P2WPKH semanitcs', async function() {
    // This result tested against bitcoinjs-lib test spec for segwit address
    // using the first private key of this mnemonic and default path m/0
    // https://github.com/bitcoinjs/bitcoinjs-lib/blob/9c8503cab0c6c30a95127042703bc18e8d28c76d/test/integration/addresses.js#L50
    // so whilst not directly comparable, substituting the private key produces
    // identical results between this tool and the bitcoinjs-lib test.
    // Private key generated is:
    // L3L8Nu9whawPBNLGtFqDhKut9DKKfG3CQoysupT7BimqVCZsLFNP
    await driver.findElement(By.css('#bip141-tab a'))
        .click();
    // Choose P2WPKH
    await driver.executeScript(function() {
        $(".bip141-semantics option[selected]").removeAttr("selected");
        $(".bip141-semantics option").filter(function(i,e) {
            return $(e).html() == "P2WPKH";
        }).prop("selected", true);
        $(".bip141-semantics").trigger("change");
    });
    await driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length");
    await driver.sleep(generateDelay);
    const address = await new Promise((resolve) => {
        getFirstAddress(resolve);
    });
    expect(address).toBe("bc1q6av85y2uceauxzqc7w9eg5av7frcfns06q02g8");
});

it('Shows the entropy used by the PRNG when clicking generate', async function() {
    await driver.findElement(By.css('.generate')).click();
    await driver.sleep(generateDelay);
    const entropy = await driver.findElement(By.css('.entropy'))
        .getAttribute("value");
    expect(entropy).not.toBe("");
});

it('Shows the index of each word in the mnemonic', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length");
    await driver.sleep(generateDelay);
    await driver.executeScript(function() {
        document.querySelector('.use-entropy').click();
    });
    const indexes = await driver.findElement(By.css('.word-indexes'))
        .getText();
    expect(indexes).toBe("0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1024");
});

it('Shows the derivation path for bip84 tab', async function() {
    await driver.findElement(By.css('#bip84-tab a'))
        .click();
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    await driver.sleep(generateDelay);
    const path = await driver.findElement(By.css('#bip84 .path'))
        .getAttribute("value");
    expect(path).toBe("m/84'/0'/0'/0");
});

it('Shows the extended private key for bip84 tab', async function() {
    await driver.findElement(By.css('#bip84-tab a'))
        .click();
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length');
    await driver.sleep(generateDelay);
    const path = await driver.findElement(By.css('.extended-priv-key'))
        .getAttribute("value");
    expect(path).toBe("zprvAeQjQdPtRbd4cMsJPNhJTfLRv4uqYN4t5xh8VusUtTU6zAmbeTYsmTrnqCyvdY25AH4m1bsFZ3aBHRsyi8rVDFKKq1sYjGRAHsUS5yUL5QH");
});

it('Shows the extended public key for bip84 tab', async function() {
    await driver.findElement(By.css('#bip84-tab a'))
        .click();
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length');
    await driver.sleep(generateDelay);
    const path = await driver.findElement(By.css('.extended-pub-key'))
        .getAttribute("value");
    expect(path).toBe("zpub6sQ5p8vnFyBMpqwmVQEJpoHAU6kKwpnjTBcjJJH6So15ry6kBzs8KGBGgT5b1HNTHx13mXM2maSWgYXX9x5QX8WwHcTMGLZWw8aV8AeUTNE");
});

it('Changes the address list if bip84 account is changed', async function() {
    await driver.findElement(By.css('#bip84-tab a'))
        .click();
    await driver.findElement(By.css('#bip84 .account'))
        .sendKeys('1');
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length');
    await driver.sleep(generateDelay);
    const address = await new Promise((resolve) => {
        getFirstAddress(resolve);
    });
    expect(address).toBe("bc1q4ujkqcas64sf6ycazmrhylu8q3pyuf7cnm8zld");
});

it('Changes the address list if bip84 change is changed', async function() {
    await driver.findElement(By.css('#bip84-tab a'))
        .click();
    await driver.findElement(By.css('#bip84 .change'))
        .sendKeys('1');
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length');
    await driver.sleep(generateDelay);
    const address = await new Promise((resolve) => {
        getFirstAddress(resolve);
    });
    expect(address).toBe("bc1qj2jqyk97mcema6ed2jmzfpmc3h20gsh8aj9mp9");
});

it('Passes the official BIP84 test spec for rootpriv', async function() {
    await driver.findElement(By.css('#bip84-tab a'))
        .click();
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    const rootKey = await driver.findElement(By.css(".root-key"))
        .getAttribute("value");
    expect(rootKey).toBe("zprvAWgYBBk7JR8Gjrh4UJQ2uJdG1r3WNRRfURiABBE3RvMXYSrRJL62XuezvGdPvG6GFBZduosCc1YP5wixPox7zhZLfiUm8aunE96BBa4Kei5");
});

it('Passes the official BIP84 test spec for account 0 xprv', async function() {
    await driver.findElement(By.css('#bip84-tab a'))
        .click();
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    const rootKey = await driver.findElement(By.css("#bip84 .account-xprv"))
        .getAttribute("value");
    expect(rootKey).toBe("zprvAdG4iTXWBoARxkkzNpNh8r6Qag3irQB8PzEMkAFeTRXxHpbF9z4QgEvBRmfvqWvGp42t42nvgGpNgYSJA9iefm1yYNZKEm7z6qUWCroSQnE");
});

it('Passes the official BIP84 test spec for account 0 xpub', async function() {
    await driver.findElement(By.css('#bip84-tab a'))
        .click();
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    const rootKey = await driver.findElement(By.css("#bip84 .account-xpub"))
        .getAttribute("value");
    expect(rootKey).toBe("zpub6rFR7y4Q2AijBEqTUquhVz398htDFrtymD9xYYfG1m4wAcvPhXNfE3EfH1r1ADqtfSdVCToUG868RvUUkgDKf31mGDtKsAYz2oz2AGutZYs");
});

it('Passes the official BIP84 test spec for account 0 first address', async function() {
    await driver.findElement(By.css('#bip84-tab a'))
        .click();
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    const address = await new Promise((resolve) => {
        getFirstAddress(resolve);
    });
    expect(address).toBe("bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu");
});

it('Passes the official BIP84 test spec for account 0 first change address', async function() {
    await driver.findElement(By.css('#bip84-tab a'))
        .click();
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.findElement(By.css('#bip84 .change'))
        .sendKeys('1');
    await driver.sleep(generateDelay);
    const address = await new Promise((resolve) => {
        getFirstAddress(resolve);
    });
    expect(address).toBe("bc1q8c6fshw2dlwun7ekn9qwf37cu2rn755upcp6el");
});

it('Can display the table as csv', async function() {
    const headings = "path,address,public key,private key";
    const row1 = "m/44'/0'/0'/0/0,17RXG3ur4cdNtdYoefwt3FAYz776HczEt5,03e864804186aca80b58181c6311bced0d5c8763013b358cd4724999b686add219,KyaBHCuNuHdbH2MsXtPBHgG7dV64AGwZD5qqwinTgmXaRXLNxXRU";
    const row20 = "m/44'/0'/0'/0/19,1KhBy28XLAciXnnRvm71PvQJaETyrxGV55,02b4b3e396434d8cdd20c03ac4aaa07387784d5d867b75987f516f5705ee68cb3a,L4GrDrjReMsCAu5DkLXn79jSb95qR7Zfx7eshybCQZ1qL32MXJab";
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length');
    await driver.sleep(generateDelay);
    // Click CSV tab to activate it and populate CSV field
    const csvTab = await driver.findElement(By.css('#csv-tab a'));
    await driver.executeScript("arguments[0].scrollIntoView({behavior: 'instant', block: 'nearest'});", csvTab);
    await driver.sleep(100);
    await csvTab.click();
    await driver.sleep(500);
    const csv = await driver.findElement(By.css('#csv-textarea'))
        .getAttribute("value");
    expect(csv).toContain(headings);
    expect(csv).toContain(row1);
});


it('Can encrypt private keys using BIP38', async function() {
    // see https://github.com/iancoleman/bip39/issues/140
    await driver.executeScript(function() {
        $(".use-bip38").prop("checked", true);
    });
    await driver.findElement(By.css('.bip38-password'))
        .sendKeys('bip38password');
    await driver.findElement(By.css('.rows-to-add'))
        .clear();
    await driver.findElement(By.css('.rows-to-add'))
        .sendKeys('1');
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length');
    await driver.sleep(bip38delay);
    // address
    const address = await new Promise((resolve) => {
        getFirstRowValue(resolve, ".address");
    });
    expect(address).toBe("12Z8r4DZj7yo6Jh1DABN8RaC7H9DxiCSWx");
    // pubkey
    const pubkey = await new Promise((resolve) => {
        getFirstRowValue(resolve, ".pubkey");
    });
    expect(pubkey).toBe("04e864804186aca80b58181c6311bced0d5c8763013b358cd4724999b686add219451fa91e2fb67d52ff7c293ee16cd2ac55735406e57084d9356ead0d79d95db5");
    // privkey
    const privkey = await new Promise((resolve) => {
        getFirstRowValue(resolve, ".privkey");
    });
    expect(privkey).toBe("6PRV7MfuEJuzpMxqFymwMPQ9DbEPLZ8DKhykWPqpn2i1TERWxNF9kArL2p");
}, bip38delay + 5000);

it('Shows the checksum for the entropy', async function() {
    await driver.executeScript(function() {
        document.querySelector('.use-entropy').click();
    });
    await driver.findElement(By.css('.entropy'))
        .sendKeys("00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");
    await driver.sleep(generateDelay);
    const text = await driver.findElement(By.css('.checksum'))
        .getText();
    expect(text).toBe("0011");
});

it('Shows the checksum for the entropy with the correct groupings', async function() {
    await driver.executeScript(function() {
        document.querySelector('.use-entropy').click();
    });
    // create a checksum of 20 bits, which spans multiple words
    await driver.findElement(By.css('.entropy'))
        .sendKeys("f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0");
    await driver.sleep(generateDelay);
    const text = await driver.findElement(By.css('.checksum'))
        .getText();
    // first group is 9 bits, second group is 11
    expect(text).toBe("10000010");
});

it('Uses vprv for bitcoin testnet p2wpkh', async function() {
    await selectNetwork("BTC - Bitcoin Testnet");
    await driver.findElement(By.css('#bip84-tab a'))
        .click();
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length');
    await driver.sleep(generateDelay);
    const path = await driver.findElement(By.css('.root-key'))
        .getAttribute("value");
    expect(path).toBe("vprv9DMUxX4ShgxMKnPNHJ1zmYNcp5RKRv1KYGo2es1bp5bzaeDhatJN73hWZ8pxfaoF87vBa2zTtXeKqHm3mS1DCj2tumYbCwxLa52PBmLt6wW");
});


it('Does not show a warning if generating strong mnemonics', async function() {
    driver.executeScript(function() {
        $(".strength option[selected]").removeAttr("selected");
        $(".strength option[value=12]").prop("selected", true);
    });
    const classes = await driver.findElement(By.css(".generate-container .warning"))
        .getAttribute("class");
    expect(classes).toContain("hidden");
});


it('Does not show a warning if entropy is stronger than mnemonic length', async function() {
    await driver.findElement(By.css('.use-entropy'))
        .click();
    await driver.findElement(By.css('.entropy'))
        .sendKeys("0123456789abcdef0123456789abcdef0123456789abcdef"); // 18 words
    await driver.executeScript(function() {
        $(".mnemonic-length").val("12").trigger("change");
    });
    const classes = await driver.findElement(By.css(".weak-entropy-override-warning"))
        .getAttribute("class");
    expect(classes).toContain("hidden");
});



it('Can use root keys to generate segwit table rows', async function() {
    // segwit uses ypub / zpub instead of xpub but the root key should still
    // be valid regardless of the encoding used to import that key.
    // Maybe this breaks the reason for the different extended key prefixes, but
    // since the parsed root key is used behind the scenes anyhow this should be
    // allowed.
    await driver.findElement(By.css('#root-key'))
        .sendKeys('xprv9s21ZrQH143K2jkGDCeTLgRewT9F2pH5JZs2zDmmjXes34geVnFiuNa8KTvY5WoYvdn4Ag6oYRoB6cXtc43NgJAEqDXf51xPm6fhiMCKwpi');
    await driver.findElement(By.css('#bip49-tab a'))
        .click();
    // bip49 addresses are shown
    await driver.sleep(generateDelay);
    const address = await new Promise((resolve) => {
        getFirstAddress(resolve);
    });
    expect(address).toBe("3QG2Y9AA4xZ846gKHZqNf7mvVKbLqMKxr2");
});

// Pull Request 271
// Allow converting mnemonic back to raw entropy value
it('Converts mnemonics into raw entropy', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length');
    await driver.sleep(generateDelay);
    await driver.executeScript(function() {
        document.querySelector('.use-entropy').click();
    });
    const entropy = await driver.findElement(By.css('.entropy'))
        .getAttribute("value");
    expect(entropy).toBe("00000000000000000000000000000040");
    const phrase = await driver.findElement(By.css('.phrase'))
        .getAttribute("value");
    expect(phrase).toBe("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length");
});

// Pull Request 279
// Added Split Phrase Card Output
it('Shows split prase cards', async function() {
    const originalPhrase = "ugly charge strong giant once anchor capable october thumb inject dwarf legal alley mixture shoot";
    const originalWords = originalPhrase.split(' ');
    await driver.findElement(By.css('.phrase'))
        .sendKeys(originalPhrase);
    await driver.sleep(generateDelay);
    const cardsStr = await driver.findElement(By.css('.phraseSplit'))
        .getAttribute("value");
    const cards = cardsStr.split("\n");
    expect(cards.length).toBe(3);
    // test all 2-of-3 combos can be used to form full phrase
    const combos = [[0,1],[0,2],[1,2]];
    for (let i=0; i<combos.length; i++) {
        const combo = combos[i];
        const a = combo[0];
        const b = combo[1];
        const phrase = cards[a] + " " + cards[b];
        // check all original words are present
        for (let j=0; j<originalWords.length; j++) {
            const originalWord = originalWords[j];
            expect(phrase).toContain(originalWord);
        }
    }
});

// Pull Request 454 https://github.com/iancoleman/bip39/pull/454
// Add BIP85 support
it('Show BIP85', async function() {
  const originalPhrase = "install scatter logic circle pencil average fall shoe quantum disease suspect usage";
  await driver.findElement(By.css('.phrase'))
      .sendKeys(originalPhrase);
  await driver.sleep(generateDelay);
  await driver.findElement(By.css('.showBip85')).click();
  const isSelected = await driver.findElement(By.css('.showBip85')).isSelected();
  expect(isSelected).toBe(true);
  const childMnemonic = await driver.findElement(By.css('#bip85Field')).getAttribute("value");
  expect(childMnemonic).toBe('girl mad pet galaxy egg matter matrix prison refuse sense ordinary nose');
});

it('Show BIP85 in non-English languages', async function() {
  pending("BIP85 library update");
});

// It allows manually specifying the entropy type
it('Allows entropy type to be manually selected', async function() {
    await driver.findElement(By.css('.use-entropy'))
        .click();
    // use decimal entropy
    await driver.findElement(By.css('.entropy'))
        .sendKeys("91");
    await driver.sleep(generateDelay);
    // manually change to binary entropy
    await driver.executeScript(function() {
        $(".entropy-container input[value='binary']").click();
    });
    await driver.sleep(generateDelay);
    const text = await driver.findElement(By.css('.entropy-container'))
        .getText();
    // overide 91 to be just 1
    expect(text).toMatch(/Filtered Entropy\s+1/);
    // overide automatic decimal to binary
    expect(text).toMatch(/Entropy Type\s+binary/);
    // overide 2 events to 1
    expect(text).toMatch(/Event Count\s+1/);
    // overide log2(10)*2 bits to 1 bit
    expect(text).toMatch(/Total Bits\s+1/);
});

// https://github.com/iancoleman/bip39/issues/388
// Make field for bip39 seed editable
it('Generates addresses when seed is set', async function() {
    await driver.findElement(By.css('.seed'))
        .sendKeys("20da140d3dd1df8713cefcc4d54ce0e445b4151027a1ab567b832f6da5fcc5afc1c3a3f199ab78b8e0ab4652efd7f414ac2c9a3b81bceb879a70f377aa0a58f3");
    await driver.sleep(generateDelay);
    const address = await new Promise((resolve) => {
        getFirstAddress(resolve);
    });
    expect(address).toBe("1Di3Vp7tBWtyQaDABLAjfWtF6V7hYKJtug");
});

// https://github.com/iancoleman/bip39/issues/169

// https://github.com/iancoleman/bip39/issues/469

});
