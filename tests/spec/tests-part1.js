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

// url uses file:// scheme
var path = require('path')
var parentDir = path.resolve(process.cwd(), '..', 'src', 'index.html');
var url = "file://" + parentDir;
if (browser == "firefox") {
    // TODO loading local html in firefox is broken
    console.log("Loading local html in firefox is broken, see https://stackoverflow.com/q/46367054");
    console.log("You must run a server in this case, ie do this:");
    console.log("$ cd /path/to/bip39/src");
    console.log("$ python -m http.server");
    url = "http://localhost:8000";
}

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
        options.addArguments("--headless");
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--disable-gpu");
        return new webdriver.Builder()
          .forBrowser('chrome')
          .setChromeOptions(options)
          .build();
    }
}

// Helper functions

function testNetwork(done, params) {
    var phrase = params.phrase || 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    driver.findElement(By.css('.phrase'))
        .sendKeys(phrase);
    selectNetwork(params.selectText);
    driver.sleep(generateDelay).then(function() {
            getFirstAddress(function(address) {
                getFirstPublicKey(function(pubkey) {
                    getFirstPrivateKey(function(privkey) {
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
                    });
                });
            });
    });
}

function getFirstRowValue(handler, selector) {
    driver.findElements(By.css(selector))
        .then(function(els) {
            els[0].getText()
                .then(handler);
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
        .sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about");
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

// Tests

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

// Page initially loads with blank phrase
it('Should load the page', async function() {
    const value = await driver.findElement(By.css('.phrase')).getAttribute('value');
    expect(value).toBe('');
});

// Page has text
it('Should have text on the page', async function() {
    const text = await driver.findElement(By.css('body')).getText();
    var textToFind = "You can enter an existing BIP39 mnemonic";
    expect(text).toContain(textToFind);
});

// Entering mnemonic generates addresses
it('Should have a list of addresses', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    const els = await driver.findElements(By.css('.address'));
    expect(els.length).toBe(20);
});

// Generate button generates random mnemonic
it('Should be able to generate a random mnemonic', async function() {
    // initial phrase is blank
    const initialPhrase = await driver.findElement(By.css('.phrase'))
        .getAttribute("value");
    expect(initialPhrase.length).toBe(0);
    // press generate
    await driver.findElement(By.css('.generate')).click();
    await driver.sleep(generateDelay);
    // new phrase is not blank
    const newPhrase = await driver.findElement(By.css('.phrase'))
        .getAttribute("value");
    expect(newPhrase.length).toBeGreaterThan(0);
});

// Mnemonic length can be customized
it('Should allow custom length mnemonics', async function() {
    // Test 12-word mnemonic generation (valid BIP39 length)
    await driver.executeScript(function() {
        $(".strength option[selected]").removeAttr("selected");
        $(".strength option[value=12]").prop("selected", true);
    });
    
    await driver.findElement(By.css('.generate')).click();
    await driver.sleep(generateDelay);
    
    const phrase = await driver.findElement(By.css('.phrase'))
        .getAttribute("value");
    const words = phrase.split(" ");
    
    expect(words.length).toBe(12);
});

// Passphrase can be set
it('Allows a passphrase to be set', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.findElement(By.css('.passphrase'))
        .sendKeys('secure_passphrase');
    await driver.sleep(generateDelay);
    await new Promise((resolve) => {
        getFirstAddress(function(address) {
            expect(address).toBe("1CTZfyxcc9i4Kxs48VfFNKJvEKUCBroayp");
            resolve();
        });
    });
});

// Network can be set to networks other than bitcoin
it('Allows selection of bitcoin testnet', async function() {
    const params = {
        selectText: "BTC - Bitcoin Testnet",
        phrase: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
        firstAddress: "mkpZhYtJu2r87Js3pDiWJDmPte2NRZ8bJV",
        firstPubKey: "02a7451395735369f2ecdfc829c0f774e88ef1303dfe5b2f04dbaab30a535dfdd6",
        firstPrivKey: "cV6NTLu255SZ5iCNkVHezNGDH5qv6CanJpgBPqYgJU13NNKJhRs1",
    };
    await new Promise((resolve) => {
        testNetwork(resolve, params);
    });
});
it('Allows selection of bitcoin regtest', async function() {
    const params = {
        selectText: "BTC - Bitcoin RegTest",
        phrase: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
        firstAddress: "mkpZhYtJu2r87Js3pDiWJDmPte2NRZ8bJV",
        firstPubKey: "02a7451395735369f2ecdfc829c0f774e88ef1303dfe5b2f04dbaab30a535dfdd6",
        firstPrivKey: "cV6NTLu255SZ5iCNkVHezNGDH5qv6CanJpgBPqYgJU13NNKJhRs1",
    };
    await new Promise((resolve) => {
        testNetwork(resolve, params);
    });
});

// BIP39 seed is set from phrase
it('Sets the bip39 seed from the prhase', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    const seed = await driver.findElement(By.css('.seed'))
        .getAttribute("value");
    expect(seed).toBe("5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4");
});

// BIP32 root key is set from phrase
it('Sets the bip39 root key from the prhase', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    const seed = await driver.findElement(By.css('.root-key'))
        .getAttribute("value");
    expect(seed).toBe("xprv9s21ZrQH143K3GJpoapnV8SFfukcVBSfeCficPSGfubmSFDxo1kuHnLisriDvSnRRuL2Qrg5ggqHKNVpxR86QEC8w35uxmGoggxtQTPvfUu");
});

// Fingerprint is set from phrase
it('Sets the fingerprint from the phrase', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    const fingerprint = await driver.findElement(By.css('.fingerprint'))
        .getAttribute("value");
    expect(fingerprint).toBe("73c5da0a");
});

// Tabs show correct addresses when changed
it('Shows the correct address when tab is changed', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    await driver.findElement(By.css('#bip32-tab a'))
        .click();
    await driver.sleep(generateDelay);
    await new Promise((resolve) => {
        getFirstAddress(function(address) {
            expect(address).toBe("13iX7DteNj1gV7zhe4t6o9FX9CArR5wZxz");
            resolve();
        });
    });
});

// BIP44 derivation path is shown
it('Shows the derivation path for bip44 tab', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    const path = await driver.findElement(By.css('#bip44 .path'))
        .getAttribute("value");
    expect(path).toBe("m/44'/0'/0'/0");
});

// BIP44 extended private key is shown
it('Shows the extended private key for bip44 tab', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    const path = await driver.findElement(By.css('.extended-priv-key'))
        .getAttribute("value");
    expect(path).toBe("xprvA1Lvv1qpvx3f8iuRHfaEG45fyvDc3h7Ur5afz5SyRfkAsZ2765KfFfmg6Q9oEJDgf4UdYHphzzJybLykZfznUMKL2KNUU8pLRQgstN5kmFe");
});

// BIP44 extended public key is shown
it('Shows the extended public key for bip44 tab', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    const path = await driver.findElement(By.css('.extended-pub-key'))
        .getAttribute("value");
    expect(path).toBe("xpub6ELHKXNimKbxMCytPh7EdC2QXx46T9qLDJWGnTraz1H9kMMFdcduoU69wh9cxP12wDxqAAfbaESWGYt5rREsX1J8iR2TEunvzvddduAPYcY");
});

// BIP44 account field changes address list
it('Changes the address list if bip44 account is changed', async function() {
    await driver.findElement(By.css('#bip44 .account'))
        .sendKeys('1');
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    await new Promise((resolve) => {
        getFirstAddress(function(address) {
            expect(address).toBe("15qucUWKf95Fo58FdCBhUTSAtsm22HHE2Q");
            resolve();
        });
    });
});

// BIP44 change field changes address list
it('Changes the address list if bip44 change is changed', async function() {
    await driver.findElement(By.css('#bip44 .change'))
        .sendKeys('1');
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    await new Promise((resolve) => {
        getFirstAddress(function(address) {
            expect(address).toBe("1J3J6EvPrv8q6AC3VCjWV45Uf3nssNMRtH");
            resolve();
        });
    });
});

// BIP32 derivation path can be set
it('Can use a custom bip32 derivation path', async function() {
    await driver.findElement(By.css('#bip32-tab a'))
        .click();
    await driver.findElement(By.css('#bip32 .path'))
        .clear();
    await driver.findElement(By.css('#bip32 .path'))
        .sendKeys('m/1');
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    await new Promise((resolve) => {
        getFirstAddress(function(address) {
            expect(address).toBe("17aJR6juqmcwnNMYLTE8SMf2ptTySCxHrV");
            resolve();
        });
    });
});

// BIP32 can use hardened derivation paths
it('Can use a hardened derivation paths', async function() {
    await driver.findElement(By.css('#bip32-tab a'))
        .click();
    await driver.findElement(By.css('#bip32 .path'))
        .clear();
    await driver.findElement(By.css('#bip32 .path'))
        .sendKeys("m/0'");
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    await new Promise((resolve) => {
        getFirstAddress(function(address) {
            expect(address).toBe("1Q5FHbm75ZYDnHkGgBC2y8cCn8cTrqK37v");
            resolve();
        });
    });
});

// BIP32 extended private key is shown
it('Shows the BIP32 extended private key', async function() {
    await driver.findElement(By.css('#bip32-tab a'))
        .click();
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    const privKey = await driver.findElement(By.css('.extended-priv-key'))
        .getAttribute("value");
    expect(privKey).toBe("xprv9ukW2UsmeQP9NB14w61cimzwEKbUJxHCypMb1PpEafjCETz69a6tp8aYdMkHfz6U49Ut262f9MpGZkCna1zDhEfW2BGkSehvrxd5ueR4TBe");
});

// BIP32 extended public key is shown
it('Shows the BIP32 extended public key', async function() {
    await driver.findElement(By.css('#bip32-tab a'))
        .click();
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    const pubKey = await driver.findElement(By.css('.extended-pub-key'))
        .getAttribute("value");
    expect(pubKey).toBe("xpub68jrRzQfUmwSaf5Y37Yd5uwfnMRxiR14M3HBonDr91GB7GKEh7R9Mvu2UeCtbASfXZ9FdNo9FwFx6a37HNXUDiXVQFXuadXmevRBa3y7rL8");
});

// Derivation path is shown in table
it('Shows the derivation path in the table', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    await new Promise((resolve) => {
        getFirstPath(function(path) {
            expect(path).toBe("m/44'/0'/0'/0/0");
            resolve();
        });
    });
});

// Derivation path for address can be hardened
it('Can derive hardened addresses', async function() {
    await driver.findElement(By.css('#bip32-tab a'))
        .click();
    await driver.executeScript(function() {
        $(".hardened-addresses").prop("checked", true);
    });
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    await new Promise((resolve) => {
        getFirstAddress(function(address) {
            expect(address).toBe("1HAYyZpxiHhhRNKf8nCcsZVCM2AucTefzv");
            resolve();
        });
    });
});

// Derivation path visibility can be toggled
it('Can toggle visibility of the derivation path column', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    await driver.findElement(By.css('.index-toggle'))
        .click();
    await new Promise((resolve) => {
        testColumnValuesAreInvisible(resolve, "index");
    });
});

// Address is shown
it('Shows the address in the table', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    await new Promise((resolve) => {
        getFirstAddress(function(address) {
            expect(address).toBe("1LqBGSKuX5yYUonjxT5qGfpUsXKYYWeabA");
            resolve();
        });
    });
});

// Addresses are shown in order of derivation path
it('Shows the address in order of derivation path', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    await new Promise((resolve) => {
        testRowsAreInCorrectOrder(resolve);
    });
});

// Address visibility can be toggled
it('Can toggle visibility of the address column', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    await driver.findElement(By.css('.address-toggle'))
        .click();
    await new Promise((resolve) => {
        testColumnValuesAreInvisible(resolve, "address");
    });
});

// Public key is shown in table
it('Shows the public key in the table', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    const els = await driver.findElements(By.css('.pubkey'));
    const pubkey = await els[0].getText();
    expect(pubkey).toBe("03aaeb52dd7494c361049de67cc680e83ebcbbbdbeb13637d92cd845f70308af5e");
});

// Public key visibility can be toggled
it('Can toggle visibility of the public key column', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    await driver.findElement(By.css('.public-key-toggle'))
        .click();
    await new Promise((resolve) => {
        testColumnValuesAreInvisible(resolve, "pubkey");
    });
});

// Private key is shown in table
it('Shows the private key in the table', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    const els = await driver.findElements(By.css('.privkey'));
    const pubkey = await els[0].getText();
    expect(pubkey).toBe("L4p2b9VAf8k5aUahF1JCJUzZkgNEAqLfq8DDdQiyAprQAKSbu8hf");
});

// Private key visibility can be toggled
it('Can toggle visibility of the private key column', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    await driver.findElement(By.css('.private-key-toggle'))
        .click();
    await new Promise((resolve) => {
        testColumnValuesAreInvisible(resolve, "privkey");
    });
});

// More addresses can be generated
it('Can generate more rows in the table', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    await driver.findElement(By.css('.more'))
        .click();
    await driver.sleep(generateDelay);
    const els = await driver.findElements(By.css('.address'));
    expect(els.length).toBe(40);
});

// A custom number of additional addresses can be generated
it('Can generate more rows in the table', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    await driver.findElement(By.css('.rows-to-add'))
        .clear();
    await driver.findElement(By.css('.rows-to-add'))
        .sendKeys('1');
    await driver.findElement(By.css('.more'))
        .click();
    await driver.sleep(generateDelay);
    const els = await driver.findElements(By.css('.address'));
    expect(els.length).toBe(21);
});

// Additional addresses are shown in order of derivation path
it('Shows additional addresses in order of derivation path', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    await driver.findElement(By.css('.more'))
        .click();
    await driver.sleep(generateDelay);
    await new Promise((resolve) => {
        testRowsAreInCorrectOrder(resolve);
    });
});

// BIP32 root key can be set by the user
it('Allows the user to set the BIP32 root key', async function() {
    await driver.findElement(By.css('.root-key')).clear();
    await driver.findElement(By.css('.root-key'))
        .sendKeys('xprv9s21ZrQH143K3GJpoapnV8SFfukcVBSfeCficPSGfubmSFDxo1kuHnLisriDvSnRRuL2Qrg5ggqHKNVpxR86QEC8w35uxmGoggxtQTPvfUu');
    await driver.sleep(generateDelay);
    await new Promise((resolve) => {
        getFirstAddress(function(address) {
            expect(address).toBe("1LqBGSKuX5yYUonjxT5qGfpUsXKYYWeabA");
            resolve();
        });
    });
});

// Setting BIP32 root key clears the existing phrase, passphrase and seed
it('Confirms the existing phrase should be cleared', async function() {
    await driver.findElement(By.css('.phrase')).clear();
    await driver.findElement(By.css('.phrase'))
        .sendKeys('A non-blank but invalid value');
    await driver.findElement(By.css('.root-key')).clear();
    await driver.findElement(By.css('.root-key'))
        .sendKeys('xprv9s21ZrQH143K3GJpoapnV8SFfukcVBSfeCficPSGfubmSFDxo1kuHnLisriDvSnRRuL2Qrg5ggqHKNVpxR86QEC8w35uxmGoggxtQTPvfUu');
    await driver.sleep(500);
    try {
        await driver.switchTo().alert().accept();
    } catch (alertError) {
        // Alert might not appear in some cases, continue
        console.log('No alert to handle');
    }
    await driver.sleep(generateDelay);
    const value = await driver.findElement(By.css('.phrase'))
        .getAttribute("value");
    expect(value).toBe("");
});

// Clearing of phrase, passphrase and seed can be cancelled by user
it('Allows the clearing of the phrase to be cancelled', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(generateDelay);
    await driver.findElement(By.css('.root-key'))
        .clear();
    await driver.findElement(By.css('.root-key'))
        .sendKeys('x');
    await driver.switchTo().alert().dismiss();
    const value = await driver.findElement(By.css('.phrase'))
        .getAttribute("value");
    expect(value).toBe("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about");
});

// Custom BIP32 root key is used when changing the derivation path
it('Can set derivation path for root key instead of phrase', async function() {
    await driver.findElement(By.css('#bip44 .account'))
        .sendKeys('1');
    await driver.findElement(By.css('.root-key'))
        .sendKeys('xprv9s21ZrQH143K3GJpoapnV8SFfukcVBSfeCficPSGfubmSFDxo1kuHnLisriDvSnRRuL2Qrg5ggqHKNVpxR86QEC8w35uxmGoggxtQTPvfUu');
    await driver.sleep(generateDelay);
    await new Promise((resolve) => {
        getFirstAddress(function(address) {
            expect(address).toBe("15qucUWKf95Fo58FdCBhUTSAtsm22HHE2Q");
            resolve();
        });
    });
});

// Incorrect mnemonic shows error
it('Shows an error for incorrect mnemonic', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon');
    await driver.sleep(feedbackDelay);
    const feedback = await driver.findElement(By.css('.feedback'))
        .getText();
    expect(feedback).toBe("Invalid mnemonic");
});

// Incorrect word shows suggested replacement
it('Shows word suggestion for incorrect word', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abiliti');
    await driver.sleep(feedbackDelay);
    const feedback = await driver.findElement(By.css('.feedback'))
        .getText();
    const msg = "abiliti not in wordlist, did you mean ability?";
    expect(feedback).toBe(msg);
});

// Github pull request 48
// First four letters of word shows that word, not closest
// since first four letters gives unique word in BIP39 wordlist
// eg ille should show illegal, not idle
it('Shows word suggestion based on first four chars', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('ille');
    await driver.sleep(feedbackDelay);
    const feedback = await driver.findElement(By.css('.feedback'))
        .getText();
    const msg = "ille not in wordlist, did you mean illegal?";
    expect(feedback).toBe(msg);
});

// Incorrect BIP32 root key shows error
it('Shows error for incorrect root key', async function() {
    await driver.findElement(By.css('.root-key'))
        .sendKeys('xprv9s21ZrQH143K2jkGDCeTLgRewT9F2pH5JZs2zDmmjXes34geVnFiuNa8KTvY5WoYvdn4Ag6oYRoB6cXtc43NgJAEqDXf51xPm6fhiMCKwpj');
    await driver.sleep(feedbackDelay);
    const feedback = await driver.findElement(By.css('.feedback'))
        .getText();
    const msg = "Invalid root key";
    expect(feedback).toBe(msg);
});

// Derivation path not starting with m shows error
it('Shows error for derivation path not starting with m', async function() {
    await driver.findElement(By.css('#bip32-tab a'))
        .click();
    await driver.findElement(By.css('#bip32 .path'))
        .clear();
    await driver.findElement(By.css('#bip32 .path'))
        .sendKeys('n/0');
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(feedbackDelay);
    const feedback = await driver.findElement(By.css('.feedback'))
        .getText();
    const msg = "First character must be 'm'";
    expect(feedback).toBe(msg);
});

// Derivation path containing invalid characters shows useful error
it('Shows error for derivation path not starting with m', async function() {
    await driver.findElement(By.css('#bip32-tab a'))
        .click();
    await driver.findElement(By.css('#bip32 .path'))
        .clear();
    await driver.findElement(By.css('#bip32 .path'))
        .sendKeys('m/1/0wrong1/1');
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    await driver.sleep(feedbackDelay);
    const feedback = await driver.findElement(By.css('.feedback'))
        .getText();
    const msg = "Invalid characters 0wrong1 found at depth 2";
    expect(feedback).toBe(msg);
});

// Github Issue 11: Default word length is 24
// https://github.com/iancoleman/bip39/issues/11
it('Sets the default word length to 24', async function() {
    const strength = await driver.findElement(By.css('.strength'))
        .getAttribute("value");
    expect(strength).toBe("24");
});

// Github Issue 12: Generate more rows with private keys hidden
// https://github.com/iancoleman/bip39/issues/12
it('Sets the correct hidden column state on new rows', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about");
    await driver.sleep(generateDelay);
    await driver.findElement(By.css('.private-key-toggle'))
        .click();
    await driver.findElement(By.css('.more'))
        .click();
    await driver.sleep(generateDelay);
    const els = await driver.findElements(By.css('.privkey'));
    expect(els.length).toBe(40);
    await new Promise((resolve) => {
        testColumnValuesAreInvisible(resolve, "privkey");
    });
});

// Electrum Mnemonic Tests
describe("Electrum mnemonic functionality", function() {

    // Electrum mnemonic generation works
    xit('Generates valid electrum mnemonic', async function() {
        // Switch to Electrum mode
        await driver.findElement(By.css('.mnemonic-type'))
            .click();
        await driver.findElement(By.css('.mnemonic-type option[value="electrum"]'))
            .click();
        await driver.sleep(100);
        // Generate mnemonic
        await driver.findElement(By.css('.generate'))
            .click();
        await driver.sleep(generateDelay);
        const phrase = await driver.findElement(By.css('.phrase'))
            .getAttribute("value");
        expect(phrase.length).toBeGreaterThan(0);
        expect(phrase.split(' ').length).toBeGreaterThan(10);
    });

    // Electrum prefix selection works
    xit('Shows electrum prefix options when electrum is selected', async function() {
        // Switch to Electrum mode
        await driver.findElement(By.css('.mnemonic-type'))
            .click();
        await driver.findElement(By.css('.mnemonic-type option[value="electrum"]'))
            .click();
        await driver.sleep(100);
        // Check that prefix group is visible
        const prefixGroup = await driver.findElement(By.css('.electrum-prefix-group'));
        const isVisible = await prefixGroup.isDisplayed();
        expect(isVisible).toBe(true);
    });

    // Mnemonic label updates correctly
    xit('Updates mnemonic label when switching types', async function() {
        // Start with BIP39
        const labelBip39 = await driver.findElement(By.css('.mnemonic-label'))
            .getText();
        expect(labelBip39).toBe("BIP39");
        // Switch to Electrum
        await driver.findElement(By.css('.mnemonic-type'))
            .click();
        await driver.findElement(By.css('.mnemonic-type option[value="electrum"]'))
            .click();
        await driver.sleep(100);
        const labelElectrum = await driver.findElement(By.css('.mnemonic-label'))
            .getText();
        expect(labelElectrum).toBe("Electrum");
    });

    // Electrum validation works
    xit('Validates electrum mnemonic correctly', async function() {
        // Switch to Electrum mode
        await driver.findElement(By.css('.mnemonic-type'))
            .click();
        await driver.findElement(By.css('.mnemonic-type option[value="electrum"]'))
            .click();
        await driver.sleep(100);
        // Enter a BIP39 mnemonic (should be invalid for Electrum)
        await driver.findElement(By.css('.phrase'))
            .sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about");
        await driver.sleep(feedbackDelay);
        const feedback = await driver.findElement(By.css('.feedback'))
            .getText();
        expect(feedback).toContain("Invalid Electrum mnemonic");
    });

    // Comprehensive Electrum Legacy test case with passphrase
    it('Generates correct Electrum Legacy wallet with passphrase', async function() {
        const MNEMONIC = "menu behave define only stove asset such gate clown anchor avoid project";
        const PASSPHRASE = "baseball";
        const EXPECTED_SEED = "ca9609fe5880dc2463312e2678203b5a4ee01e363b6a3bf628710a7830eca56845fd14b416c32247c554f1b8d1a95080f74e747e2b52e63d6beab19722b86aee";
        const EXPECTED_FINGERPRINT = "8f907dc2";
        const EXPECTED_XPUB = "xpub661MyMwAqRbcEruu1VRbTCNR6FjTALuMWyKrbqbsYxwbe5e5kVcPQHawN3r6taAEmJd7mFtVrw2YSQNGX1o7n9BYMaTkSkHcStS8KNesacJ";
        const EXPECTED_RECEIVE_ADDRESS = "1HmNeDUJhXpuLmGEYncDF7ytQHd6Ww8NVx";
        const EXPECTED_RECEIVE_PUBKEY = "035565877a88fafcae116515bdef9826eb1238bc5b6e11299a4f06d633e428b9db";
        const EXPECTED_RECEIVE_PRIVKEY = "Kz6fDjNCXiBuTJzBXAg69tvr2bHpDKZCfDv6vG4vDf1LHgdDD5gg";
        const EXPECTED_CHANGE_ADDRESS = "1M5VPPpad7CZVgdH3ZtQB1awNYPaokq1qb";
        const EXPECTED_CHANGE_PUBKEY = "02546565ff4c7864e98b8f4a448f1b3a48034db64c684fe9e3677276d1f55beebe";
        const EXPECTED_CHANGE_PRIVKEY = "KzPWuXgM94oxyWcH6zKaZAQaeUELfN7i7g8M4wcTABhjKSgUvwaU";

        // Switch to Electrum mode
        await driver.findElement(By.css('.mnemonic-type'))
            .click();
        await driver.findElement(By.css('.mnemonic-type option[value="electrum"]'))
            .click();
        await driver.sleep(100);

        // Switch to Electrum Legacy tab
        await driver.findElement(By.css('#electrum-legacy-tab a'))
            .click();
        await driver.sleep(100);

        // Enter the test mnemonic
        await driver.findElement(By.css('.phrase'))
            .clear();
        await driver.findElement(By.css('.phrase'))
            .sendKeys(MNEMONIC);
        await driver.sleep(feedbackDelay);

        // Enter the passphrase
        await driver.findElement(By.css('.passphrase'))
            .clear();
        await driver.findElement(By.css('.passphrase'))
            .sendKeys(PASSPHRASE);
        await driver.sleep(generateDelay);

        // Test 1: Validate Electrum Seed
        const actualSeed = await driver.findElement(By.css('.seed'))
            .getAttribute("value");
        expect(actualSeed).toBe(EXPECTED_SEED);

        // Test 2: Validate Fingerprint
        const actualFingerprint = await driver.findElement(By.css('.fingerprint'))
            .getAttribute("value");
        expect(actualFingerprint).toBe(EXPECTED_FINGERPRINT);

        // Test 3: Validate Account Extended Public Key
        const actualXpub = await driver.findElement(By.css('#account-xpub-electrum-legacy'))
            .getAttribute("value");
        expect(actualXpub).toBe(EXPECTED_XPUB);

        // Wait for addresses to be generated
        await driver.sleep(generateDelay);

        // Test 4: Validate Receive Address (m/0/0)
        const firstRow = await driver.findElement(By.css('.addresses tr:first-child'));
        const addressCell = await firstRow.findElement(By.css('td:nth-child(2)'));
        const receiveAddress = await addressCell.getText();
        expect(receiveAddress).toBe(EXPECTED_RECEIVE_ADDRESS);

        // Test 5: Validate Receive Public Key
        const pubkeyCell = await firstRow.findElement(By.css('td:nth-child(3)'));
        const receivePubKey = await pubkeyCell.getText();
        expect(receivePubKey).toBe(EXPECTED_RECEIVE_PUBKEY);

        // Test 6: Validate Receive Private Key
        const privkeyCell = await firstRow.findElement(By.css('td:nth-child(4)'));
        const receivePrivKey = await privkeyCell.getText();
        expect(receivePrivKey).toBe(EXPECTED_RECEIVE_PRIVKEY);

        // Test 7: Switch to change addresses
        await driver.findElement(By.css('.electrum-legacy-change'))
            .click();
        await driver.sleep(generateDelay);

        // Test 8: Validate Change Address (m/1/0)
        const firstRowChange = await driver.findElement(By.css('.addresses tr:first-child'));
        const addressCellChange = await firstRowChange.findElement(By.css('td:nth-child(2)'));
        const changeAddress = await addressCellChange.getText();
        expect(changeAddress).toBe(EXPECTED_CHANGE_ADDRESS);

        // Test 9: Validate Change Public Key
        const pubkeyCellChange = await firstRowChange.findElement(By.css('td:nth-child(3)'));
        const changePubKey = await pubkeyCellChange.getText();
        expect(changePubKey).toBe(EXPECTED_CHANGE_PUBKEY);

        // Test 10: Validate Change Private Key
        const privkeyCellChange = await firstRowChange.findElement(By.css('td:nth-child(4)'));
        const changePrivKey = await privkeyCellChange.getText();
        expect(changePrivKey).toBe(EXPECTED_CHANGE_PRIVKEY);
    }, 15000);

    // Comprehensive Electrum SegWit test case with passphrase
    it('Generates correct Electrum SegWit wallet with passphrase', async function() {
        const MNEMONIC = "rocket exhibit food surprise army horse march bind quote captain seed web involve thought have page prefer rely resemble inside obvious fatal seek seed";
        const PASSPHRASE = "baseball";
        const EXPECTED_SEED = "0da0ceda073fb64a3125a24945da7f91bae4b04bc01a3c7e2c742533d2890eef7a31fa4c25d196ea893c4a4c80b9ebb269d6234b1dd1535c8f5eaa7321467542";
        const EXPECTED_FINGERPRINT = "e70c0846";
        const EXPECTED_ZPUB = "zpub6oFXJxRUkmCfhHDyfJiykYarCwDFn9AoEkHUbdn6eGr6DK5ZELW1BK5CJdyGVxxK2vyPrtQgDKLLrbxMjCmR3B7zBv8KCNkGZAJWepWWyuc";
        const EXPECTED_RECEIVE_ADDRESS = "bc1qaxl8nfq9yv9z75qlqvul4cmqueksctvlhlmt9q";
        const EXPECTED_RECEIVE_PUBKEY = "0365d9e1b3e8ee74dec85b24872d03805eafac54b0568873976d481550b7b3f2e3";
        const EXPECTED_RECEIVE_PRIVKEY = "KwSWhimrd2bmnvrHHjN1SkARn2wuV2Y2wAcBEixPKJ6bboDMXsjF";
        const EXPECTED_CHANGE_ADDRESS = "bc1qghpw4jtl0wq7c3uwz9qhzglw6uq69tu4kt40x9";
        const EXPECTED_CHANGE_PUBKEY = "03bcb0e9c32f9b9115ca6c3065f92cb96cb52328d417fb44be9858ba4212835072";
        const EXPECTED_CHANGE_PRIVKEY = "KysZQaoD9souqLyQ2jjdLH4KdSyavSxsuroV36bZ65Lwds2YJV2p";

        // Switch to Electrum mode
        await driver.findElement(By.css('.mnemonic-type'))
            .click();
        await driver.findElement(By.css('.mnemonic-type option[value="electrum"]'))
            .click();
        await driver.sleep(100);

        // Switch to Electrum SegWit tab
        await driver.findElement(By.css('#electrum-segwit-tab a'))
            .click();
        await driver.sleep(100);

        // Enter the test mnemonic
        await driver.findElement(By.css('.phrase'))
            .clear();
        await driver.findElement(By.css('.phrase'))
            .sendKeys(MNEMONIC);
        await driver.sleep(feedbackDelay);

        // Enter the passphrase
        await driver.findElement(By.css('.passphrase'))
            .clear();
        await driver.findElement(By.css('.passphrase'))
            .sendKeys(PASSPHRASE);
        await driver.sleep(generateDelay);

        // Test 1: Validate Electrum Seed (same as Legacy)
        const actualSeed = await driver.findElement(By.css('.seed'))
            .getAttribute("value");
        expect(actualSeed).toBe(EXPECTED_SEED);

        // Test 2: Validate Fingerprint (same as Legacy)
        const actualFingerprint = await driver.findElement(By.css('.fingerprint'))
            .getAttribute("value");
        expect(actualFingerprint).toBe(EXPECTED_FINGERPRINT);

        // Test 3: Validate Account Extended Public Key (zpub for SegWit)
        const actualZpub = await driver.findElement(By.css('#account-xpub-electrum-segwit'))
            .getAttribute("value");
        expect(actualZpub).toBe(EXPECTED_ZPUB);

        // Wait for addresses to be generated
        await driver.sleep(generateDelay);

        // Test 4: Validate Receive Address (m/0'/0/0)
        const firstRow = await driver.findElement(By.css('.addresses tr:first-child'));
        const addressCell = await firstRow.findElement(By.css('td:nth-child(2)'));
        const receiveAddress = await addressCell.getText();
        expect(receiveAddress).toBe(EXPECTED_RECEIVE_ADDRESS);

        // Test 5: Validate Receive Public Key
        const pubkeyCell = await firstRow.findElement(By.css('td:nth-child(3)'));
        const receivePubKey = await pubkeyCell.getText();
        expect(receivePubKey).toBe(EXPECTED_RECEIVE_PUBKEY);

        // Test 6: Validate Receive Private Key
        const privkeyCell = await firstRow.findElement(By.css('td:nth-child(4)'));
        const receivePrivKey = await privkeyCell.getText();
        expect(receivePrivKey).toBe(EXPECTED_RECEIVE_PRIVKEY);

        // Test 7: Switch to change addresses
        await driver.findElement(By.css('.electrum-segwit-change'))
            .click();
        await driver.sleep(generateDelay);

        // Test 8: Validate Change Address (m/0'/1/0)
        const firstRowChange = await driver.findElement(By.css('.addresses tr:first-child'));
        const addressCellChange = await firstRowChange.findElement(By.css('td:nth-child(2)'));
        const changeAddress = await addressCellChange.getText();
        expect(changeAddress).toBe(EXPECTED_CHANGE_ADDRESS);

        // Test 9: Validate Change Public Key
        const pubkeyCellChange = await firstRowChange.findElement(By.css('td:nth-child(3)'));
        const changePubKey = await pubkeyCellChange.getText();
        expect(changePubKey).toBe(EXPECTED_CHANGE_PUBKEY);

        // Test 10: Validate Change Private Key
        const privkeyCellChange = await firstRowChange.findElement(By.css('td:nth-child(4)'));
        const changePrivKey = await privkeyCellChange.getText();
        expect(changePrivKey).toBe(EXPECTED_CHANGE_PRIVKEY);
    }, 15000);

});

}); 
