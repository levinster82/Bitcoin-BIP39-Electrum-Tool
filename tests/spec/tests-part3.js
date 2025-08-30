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

function testNetwork(done, params) {
    var phrase = params.phrase || 'abandon abandon ability';
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
        .clear();
    driver.findElement(By.css('.entropy'))
        .sendKeys(entropyText);
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.entropy-container'))
            .getText()
            .then(function(text) {
                var re = new RegExp("Entropy Type\\s+" + entropyType);
                expect(text).toMatch(re);
                // Disable entropy mode to prevent state accumulation
                driver.findElement(By.css('.use-entropy')).click().then(function() {
                    done();
                });
            });
    });
}

function testEntropyBits(done, entropyText, entropyBits) {
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .clear();
    driver.findElement(By.css('.entropy'))
        .sendKeys(entropyText);
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.entropy-container'))
            .getText()
            .then(function(text) {
                var re = new RegExp("Total Bits\\s+" + entropyBits);
                expect(text).toMatch(re);
                // Disable entropy mode to prevent state accumulation
                driver.findElement(By.css('.use-entropy')).click().then(function() {
                    done();
                });
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
        .clear();
    driver.findElement(By.css('.entropy'))
        .sendKeys(entropyDetail.entropy);
    driver.sleep(generateDelay).then(function() {
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
                        // Disable entropy mode to prevent state accumulation
                        driver.findElement(By.css('.use-entropy')).click().then(function() {
                            done();
                        });
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
        // Small delay to ensure previous driver cleanup is complete
        await new Promise(resolve => setTimeout(resolve, 100));
        driver = newDriver();
        await driver.get(url);
    });

    // Close the website after each test is run (so that it is opened fresh each time)
    afterEach(async function() {
        if (driver) {
            try {
                await driver.quit();
            } catch (e) {
                // Ignore quit errors, driver may already be dead
            }
            driver = null;
        }
    });

// Shows details about the entered entropy (hexadecimal)
it('Shows details about the entered entropy', async function() {
    const result = await new Promise((resolve) => {
        testEntropyFeedback(resolve,
            {
                entropy: "AAAAAAAA BBBBBBBB CCCCCCCC DDDDDDDA",
                filtered: "AAAAAAAABBBBBBBBCCCCCCCCDDDDDDDA",
                type: "hexadecimal",
                events: "32",
                bits: "128",
                words: 12,
                strength: "2 days",
            }
        );
    });
});

it("Shows details about the entered entropy", async function() {
    const result = await new Promise((resolve) => {
        testEntropyFeedback(resolve,
            {
                entropy: "AAAAAAAA BBBBBBBB CCCCCCCC DDDDDDDA EEEEEEEE",
                filtered: "AAAAAAAABBBBBBBBCCCCCCCCDDDDDDDAEEEEEEEE",
                type: "hexadecimal",
                events: "40",
                bits: "160",
                words: 15,
                strength: "3 years",
            }
        );
    });
});

it("Shows details about the entered entropy", async function() {
    const result = await new Promise((resolve) => {
        testEntropyFeedback(resolve,
            {
                entropy: "AAAAAAAA BBBBBBBB CCCCCCCC DDDDDDDA EEEEEEEE FFFFFFFF",
                filtered: "AAAAAAAABBBBBBBBCCCCCCCCDDDDDDDAEEEEEEEEFFFFFFFF",
                type: "hexadecimal",
                events: "48",
                bits: "192",
                words: 18,
                strength: "centuries",
            }
        );
    });
});

it("Shows details about the entered entropy", async function() {
    const result = await new Promise((resolve) => {
        testEntropyFeedback(resolve,
            {
                entropy: "7d",
                type: "card",
                events: "1",
                bits: "5",
                words: 0,
                strength: "less than a second",
            }
        );
    });
});

it("Shows details about the entered entropy", async function() {
    const result = await new Promise((resolve) => {
        testEntropyFeedback(resolve,
            {
                entropy: "ac2c3c4c5c6c7c8c9ctcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqsks",
                type: "card (full deck)",
                events: "52",
                bits: "232",
                words: 21,
                strength: "centuries",
            }
        );
    });
});

it("Shows details about the entered entropy", async function() {
    const result = await new Promise((resolve) => {
        testEntropyFeedback(resolve,
            {
                entropy: "ac2c3c4c5c6c7c8c9ctcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqs3d",
                type: "card (1 duplicate: 3d, 1 missing: KS)",
                events: "52",
                bits: "235",
                words: 21,
                strength: "centuries",
            }
        );
    });
});

it("Shows details about the entered entropy", async function() {
    const result = await new Promise((resolve) => {
        testEntropyFeedback(resolve,
            {
                entropy: "ac2c3c4c5c6c7c8c9ctcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqs3d4d",
                type: "card (2 duplicates: 3d 4d, 1 missing: KS)",
                events: "53",
                bits: "240",
                words: 21,
                strength: "centuries",
            }
        );
    });
});

it("Shows details about the entered entropy", async function() {
    const result = await new Promise((resolve) => {
        testEntropyFeedback(resolve,
            {
                entropy: "ac2c3c4c5c6c7c8c9ctcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqs3d4d5d6d",
                type: "card (4 duplicates: 3d 4d 5d..., 1 missing: KS)",
                events: "55",
                bits: "250",
                words: 21,
                strength: "centuries",
            }
        );
    });
});

it("Shows details about the entered entropy", async function() {
    const result = await new Promise((resolve) => {
        testEntropyFeedback(resolve,
            // Fixed: Long entropy is hashed to 256 bits (24 words max)
            {
                entropy: "ac2c3c4c5c6c7c8c9ctcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqsksac2c3c4c5c6c7c8c9ctcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqsks",
                type: "card (full deck, 52 duplicates: ac 2c 3c...)",
                events: "104",
                bits: "464",
                words: 24,
                strength: "centuries",
            }
        );
    });
});

it("Shows details about the entered entropy", async function() {
    const result = await new Promise((resolve) => {
        testEntropyFeedback(resolve,
            // Case insensitivity to duplicate cards
            {
                entropy: "asAS",
                type: "card (1 duplicate: AS)",
                events: "2",
                bits: "8",
                words: 0,
                strength: "less than a second",
            }
        );
    });
});

it("Shows details about the entered entropy", async function() {
    const result = await new Promise((resolve) => {
        testEntropyFeedback(resolve,
            {
                entropy: "ASas",
                type: "card (1 duplicate: as)",
                events: "2",
                bits: "8",
                words: 0,
                strength: "less than a second",
            }
        );
    });
});

it("Shows details about the entered entropy", async function() {
    const result = await new Promise((resolve) => {
        testEntropyFeedback(resolve,
            // Missing cards are detected
            {
                entropy: "ac2c3c4c5c6c7c8c  tcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqsks",
                type: "card (1 missing: 9C)",
                events: "51",
                bits: "227",
                words: 21,
                strength: "centuries",
            }
        );
    });
});

it("Shows details about the entered entropy", async function() {
    const result = await new Promise((resolve) => {
        testEntropyFeedback(resolve,
            {
                entropy: "ac2c3c4c5c6c7c8c  tcjcqckcad2d3d4d  6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqsks",
                type: "card (2 missing: 9C 5D)",
                events: "50",
                bits: "222",
                words: 18,
                strength: "centuries",
            }
        );
    });
});

it("Shows details about the entered entropy", async function() {
    const result = await new Promise((resolve) => {
        testEntropyFeedback(resolve,
            {
                entropy: "ac2c3c4c5c6c7c8c  tcjcqckcad2d3d4d  6d7d8d9dtdjd  kdah2h3h  5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqsks",
                type: "card (4 missing: 9C 5D QD...)",
                events: "48",
                bits: "212",
                words: 18,
                strength: "centuries",
            }
        );
    });
});

it("Shows details about the entered entropy", async function() {
    const result = await new Promise((resolve) => {
        testEntropyFeedback(resolve,
            // More than six missing cards does not show message
            {
                entropy: "ac2c3c4c5c6c7c8c  tcjcqckcad2d3d4d  6d  8d9d  jd  kdah2h3h  5h6h7h8h9hthjhqhkh  2s3s4s5s6s7s8s9stsjsqsks",
                type: "card",
                events: "45",
                bits: "198",
                words: 18,
                strength: "centuries",
            }
        );
    });
});

it("Shows details about the entered entropy", async function() {
    // multiple decks does not affect the bits per event
    // since the bits are hardcoded in entropy.js
    const result = await new Promise((resolve) => {
        testEntropyFeedback(resolve,
            {
                entropy: "3d",
                events: "1",
                bits: "5",
                bitsPerEvent: "4.46",
            }
        );
    });
});

it("Shows details about the entered entropy", async function() {
    const result = await new Promise((resolve) => {
        testEntropyFeedback(resolve,
            {
                entropy: "3d3d",
                events: "2",
                bits: "10",
                bitsPerEvent: "4.46",
            }
        );
    });
});

it("Shows details about the entered entropy", async function() {
    const result = await new Promise((resolve) => {
        testEntropyFeedback(resolve,
            {
                entropy: "3d3d3d",
                events: "3",
                bits: "15",
                bitsPerEvent: "4.46",
            }
        );
    });
});

it("Shows details about the entered entropy", async function() {
    const result = await new Promise((resolve) => {
        testEntropyFeedback(resolve,
            {
                entropy: "3d3d3d3d",
                events: "4",
                bits: "20",
                bitsPerEvent: "4.46",
            }
        );
    });
});

it("Shows details about the entered entropy", async function() {
    const result = await new Promise((resolve) => {
        testEntropyFeedback(resolve,
            {
                entropy: "3d3d3d3d3d",
                events: "5",
                bits: "25",
                bitsPerEvent: "4.46",
            }
        );
    });
});

it("Shows details about the entered entropy", async function() {
    const result = await new Promise((resolve) => {
        testEntropyFeedback(resolve,
            {
                entropy: "3d3d3d3d3d3d",
                events: "6",
                bits: "30",
                bitsPerEvent: "4.46",
            }
        );
    });
});

it("Shows details about the entered entropy", async function() {
    const result = await new Promise((resolve) => {
        testEntropyFeedback(resolve,
            {
                entropy: "3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d",
                events: "33",
                bits: "165",
                bitsPerEvent: "4.46",
                strength: 'less than a second - Repeats like "abcabcabc" are only slightly harder to guess than "abc"',
            }
        );
    });
});

// Entropy is truncated from the left
it('Truncates entropy from the left', async function() {
    // Truncate from left means leading 0000 bytes are removed from the start
    // Use 128+ bits entropy for valid BIP39 mnemonic generation
    const entropy  = "00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000000" +
                     "11111111 11111111 11111111 11111111 11111111 11111111 11111111 11111111 1111";
    await driver.findElement(By.css('.use-entropy')).click();
    await driver.findElement(By.css('.entropy')).clear();
    await driver.findElement(By.css('.entropy')).sendKeys(entropy);
    await driver.sleep(generateDelay);
    const phrase = await driver.findElement(By.css(".phrase")).getAttribute("value");
    expect(phrase).toBe("abandon abandon abandon abandon abandon among zoo zoo zoo zoo zoo write");
    // Disable entropy mode
    await driver.findElement(By.css('.use-entropy')).click();
});


// Is compatible with bip32jp entropy
// https://bip32jp.github.io/english/index.html
// NOTES:
// Is incompatible with:
//     base 6
//     base 20
it('Is compatible with bip32jp.github.io', async function() {
    const entropy  = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const expectedPhrase = "primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary foster";
    await driver.findElement(By.css('.use-entropy')).click();
    await driver.findElement(By.css('.entropy')).sendKeys(entropy);
    await driver.sleep(generateDelay);
    const phrase = await driver.findElement(By.css(".phrase")).getAttribute("value");
    expect(phrase).toBe(expectedPhrase);
});

// Blank entropy does not generate mnemonic or addresses
it('Does not generate mnemonic for blank entropy', async function() {
    await driver.findElement(By.css('.use-entropy')).click();
    await driver.findElement(By.css('.entropy')).clear();
    // check there is no mnemonic
    await driver.sleep(generateDelay);
    const phrase = await driver.findElement(By.css(".phrase")).getAttribute("value");
    expect(phrase).toBe("");
    // check there is no mnemonic
    const addresses = await driver.findElements(By.css(".address"));
    expect(addresses.length).toBe(0);
    // Check the feedback says 'blank entropy'
    const feedbackText = await driver.findElement(By.css(".feedback")).getText();
    expect(feedbackText).toBe("Blank entropy");
});

// Mnemonic length can be selected even for weak entropy

// Github issue 33
// https://github.com/iancoleman/bip39/issues/33
// Final cards should contribute entropy
it('Uses as much entropy as possible for the mnemonic', async function() {
    await driver.findElement(By.css('.use-entropy')).click();
    await driver.findElement(By.css('.entropy')).sendKeys("7S 9H 9S QH 8C KS AS 7D 7C QD 4S 4D TC 2D 5S JS 3D 8S 8H 4C 3C AC 3S QC 9C JC 7H AD TD JD 6D KH 5C QS 2S 6S 6H JH KD 9D-6C TS TH 4H KC 5H 2H AH 2C 8D 3H 5D");
    await driver.sleep(generateDelay);
    // Get mnemonic
    const originalPhrase = await driver.findElement(By.css(".phrase")).getAttribute("value");
    // Set the last 12 cards to be AS
    await driver.findElement(By.css('.entropy')).clear();
    await driver.findElement(By.css('.entropy')).sendKeys("7S 9H 9S QH 8C KS AS 7D 7C QD 4S 4D TC 2D 5S JS 3D 8S 8H 4C 3C AC 3S QC 9C JC 7H AD TD JD 6D KH 5C QS 2S 6S 6H JH KD 9D-AS AS AS AS AS AS AS AS AS AS AS AS");
    await driver.sleep(generateDelay);
    // Get new mnemonic
    const newPhrase = await driver.findElement(By.css(".phrase")).getAttribute("value");
    expect(originalPhrase).not.toEqual(newPhrase);
});

// Github issue 35
// https://github.com/iancoleman/bip39/issues/35
// QR Code support
// TODO this doesn't work in selenium with firefox
// see https://stackoverflow.com/q/40360223
it('Shows a qr code on hover for the phrase', async function() {
    if (browser == "firefox") {
        pending("Selenium + Firefox bug for mouseMove, see https://stackoverflow.com/q/40360223");
    }
    // generate a random mnemonic
    const generateEl = await driver.findElement(By.css('.generate'));
    await generateEl.click();
    // toggle qr to show (hidden by default)
    const phraseEl = await driver.findElement(By.css(".phrase"));
    await phraseEl.click();
    const rootKeyEl = await driver.findElement(By.css(".root-key"));
    await driver.sleep(generateDelay);
    // hover over the root key
    await driver.actions().move({origin: rootKeyEl}).perform();
    // check the qr code shows
    const qrShowing = await driver.executeScript(function() {
        return $(".qr-container").find("canvas").length > 0;
    });
    expect(qrShowing).toBe(true);
    // hover away from the phrase
    await driver.actions().move({origin: generateEl}).perform();
    // check the qr code hides
    const qrHidden = await driver.executeScript(function() {
        return $(".qr-container").find("canvas").length == 0;
    });
    expect(qrHidden).toBe(true);
});

// BIP44 account extendend private key is shown
// github issue 37 - compatibility with electrum
it('Shows the bip44 account extended private key', async function() {
    await driver.findElement(By.css(".phrase")).clear();
    await driver.findElement(By.css(".phrase")).sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length");
    await driver.sleep(generateDelay);
    const xprv = await driver.findElement(By.css("#bip44 .account-xprv")).getAttribute("value");
    expect(xprv).toBe("xprv9yfvRFxb1usFmneN64wB9MSuzLwFa4YKffpvza6BNPGeJW885pAR9T4KmYFsPCgPkM9nbZ5crVNnorM2hxw1HuaU1DyqwhBv4JrMtWQRREt");
});

// BIP44 account extendend public key is shown
// github issue 37 - compatibility with electrum
it('Shows the bip44 account extended public key', async function() {
    await driver.findElement(By.css(".phrase")).clear();
    await driver.findElement(By.css(".phrase")).sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length");
    await driver.sleep(generateDelay);
    const xpub = await driver.findElement(By.css("#bip44 .account-xpub")).getAttribute("value");
    expect(xpub).toBe("xpub6CfGpmVUrHRYzGiqC6UBWVPeYNmjyXGB2tkXnxVnviodBJTGdMUfhFNocoz76Jc4iDhE7TeREXvB7gAJuJ9jnMMEDydRJMQdoT2ofM85YhY");
});

// github issue 40
// BIP32 root key can be set as an xpub
it('Generates addresses from xpub as bip32 root key', async function() {
    await driver.findElement(By.css('#bip32-tab a')).click();
    // set xpub for account 0 of bip44 for 'abandon abandon ability'
    await driver.findElement(By.css("#root-key")).sendKeys("xpub6CzDCPbtLrrn4VpVbyyQLHbdSMpZoHN4iuW64VswCyEpfjM2mJGdaHJ2DyuZwtst96E16VvcERb8BBeJdHSCVmAq9RhtRQg6eAZFrTKCNqf");
    await driver.sleep(generateDelay);
    // check the addresses are generated
    const address = await new Promise((resolve) => {
        getFirstAddress(resolve);
    });
    expect(address).toBe("1Di3Vp7tBWtyQaDABLAjfWtF6V7hYKJtug");
    // check the xprv key is not set
    const xprv = await driver.findElement(By.css(".extended-priv-key")).getAttribute("value");
    expect(xprv).toBe("NA");
    // check the private key is not set
    const els = await driver.findElements(By.css(".privkey"));
    const privkey = await els[0].getText();
    expect(privkey).toBe("NA");
});

// github issue 40
// xpub for bip32 root key will not work with hardened derivation paths
it('Shows error for hardened derivation paths with xpub root key', async function() {
    // set xpub for account 0 of bip44 for 'abandon abandon ability'
    await driver.findElement(By.css("#root-key")).sendKeys("xpub6CzDCPbtLrrn4VpVbyyQLHbdSMpZoHN4iuW64VswCyEpfjM2mJGdaHJ2DyuZwtst96E16VvcERb8BBeJdHSCVmAq9RhtRQg6eAZFrTKCNqf");
    await driver.sleep(feedbackDelay);
    // Check feedback is correct
    const feedback = await driver.findElement(By.css('.feedback')).getText();
    const msg = "Hardened derivation path is invalid with xpub key";
    expect(feedback).toBe(msg);
    // Check no addresses are shown
    const rows = await driver.findElements(By.css('.addresses tr'));
    expect(rows.length).toBe(0);
});

// github issue 39
// no root key shows feedback
it('Shows feedback for no root key', async function() {
    // set xpub for account 0 of bip44 for 'abandon abandon ability'
    await driver.findElement(By.css('#bip32-tab a')).click();
    await driver.sleep(feedbackDelay);
    // Check feedback is correct
    const feedback = await driver.findElement(By.css('.feedback')).getText();
    expect(feedback).toBe("Invalid root key");
});

// Github issue 44
// display error switching tabs while addresses are generating
it('Can change details while old addresses are still being generated', async function() {
    // Set to generate 199 more addresses.
    // This will take a long time allowing a new set of addresses to be
    // generated midway through this lot.
    // The newly generated addresses should not include any from the old set.
    // Any more than 199 will show an alert which needs to be accepted.
    await driver.findElement(By.css('.rows-to-add')).clear();
    await driver.findElement(By.css('.rows-to-add')).sendKeys('199');
    // set the phrase
    await driver.findElement(By.css('.phrase')).clear();
    await driver.findElement(By.css('.phrase')).sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length");
    await driver.sleep(generateDelay);
    // change tabs which should cancel the previous generating
    await driver.findElement(By.css('.rows-to-add')).clear();
    await driver.findElement(By.css('.rows-to-add')).sendKeys('20');
    // Use JavaScript click to avoid element interception issues
    await driver.executeScript("document.querySelector('#bip32-tab a').click();")
    await driver.sleep(generateDelay);
    const els = await driver.findElements(By.css('.index'));
    // check the derivation paths have the right quantity
    expect(els.length).toBe(20);
    // check the derivation paths are in order
    const result = await new Promise((resolve) => {
        testRowsAreInCorrectOrder(resolve);
    });
}, generateDelay + 10000);


// Github pull request 55
// https://github.com/iancoleman/bip39/pull/55
// Client select
it('Can set the derivation path on bip32 tab for bitcoincore', async function() {
    const result = await new Promise((resolve) => {
        testClientSelect(resolve, {
            selectValue: "0",
            bip32path: "m/0'/0'",
            useHardenedAddresses: "true",
        });
    });
});

it('Can set the derivation path on bip32 tab for multibit', async function() {
    const result = await new Promise((resolve) => {
        testClientSelect(resolve, {
            selectValue: "2",
            bip32path: "m/0'/0",
            useHardenedAddresses: null,
        });
    });
});

it('Can set the derivation path on bip32 tab for coinomi/ledger', async function() {
    const result = await new Promise((resolve) => {
        testClientSelect(resolve, {
            selectValue: "3",
            bip32path: "m/44'/0'/0'",
            useHardenedAddresses: null,
        });
    });
});

// github issue 58
// https://github.com/iancoleman/bip39/issues/58
// bip32 derivation is correct, does not drop leading zeros
// see also
// https://medium.com/@alexberegszaszi/why-do-my-bip32-wallets-disagree-6f3254cc5846
it('Retains leading zeros for bip32 derivation', async function() {
    await driver.findElement(By.css(".phrase")).sendKeys("fruit wave dwarf banana earth journey tattoo true farm silk olive fence");
    await driver.findElement(By.css(".passphrase")).sendKeys("banana");
    await driver.sleep(generateDelay);
    const address = await new Promise((resolve) => {
        getFirstAddress(resolve);
    });
    // Note that bitcore generates an incorrect address
    // 13EuKhffWkBE2KUwcbkbELZb1MpzbimJ3Y
    // see the medium.com link above for more details
    expect(address).toBe("17rxURoF96VhmkcEGCj5LNQkmN9HVhWb7F");
});

// github issue 60
// Japanese mnemonics generate incorrect bip32 seed
// BIP39 seed is set from phrase
it('Generates correct seed for Japanese mnemonics', async function() {
    await driver.findElement(By.css(".phrase")).sendKeys("あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あおぞら");
    await driver.findElement(By.css(".passphrase")).sendKeys("メートルガバヴァぱばぐゞちぢ十人十色");
    await driver.sleep(generateDelay);
    const seed = await driver.findElement(By.css(".seed")).getAttribute("value");
    expect(seed).toBe("a262d6fb6122ecf45be09c50492b31f92e9beb7d9a845987a02cefda57a15f9c467a17872029a9e92299b5cbdf306e3a0ee620245cbd508959b6cb7ca637bd55");
});

// BIP49 official test vectors
// https://github.com/bitcoin/bips/blob/master/bip-0049.mediawiki#test-vectors
it('Generates BIP49 addresses matching the official test vectors', async function() {
    await driver.findElement(By.css('#bip49-tab a')).click();
    selectNetwork("BTC - Bitcoin Testnet");
    await driver.findElement(By.css(".phrase")).sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about");
    await driver.sleep(generateDelay);
    const address = await new Promise((resolve) => {
        getFirstAddress(resolve);
    });
    expect(address).toBe("2Mww8dCYPUpKHofjgcXcBCEGmniw9CoaiD2");
});

// BIP49 derivation path is shown
it('Shows the bip49 derivation path', async function() {
    await driver.findElement(By.css('#bip49-tab a')).click();
    await driver.findElement(By.css(".phrase")).sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length");
    await driver.sleep(generateDelay);
    const path = await driver.findElement(By.css('#bip49 .path')).getAttribute("value");
    expect(path).toBe("m/49'/0'/0'/0");
});

// BIP49 extended private key is shown
it('Shows the bip49 extended private key', async function() {
    await driver.findElement(By.css('#bip49-tab a')).click();
    await driver.findElement(By.css(".phrase")).sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length");
    await driver.sleep(generateDelay);
    const xprv = await driver.findElement(By.css('.extended-priv-key')).getAttribute("value");
    expect(xprv).toBe("yprvAM5y8jesQgsgtDHKMERh84yk6PsqMcYrpUKMnu55AuLSX4GifMF4AC41A7vkTScskcKRfwVziQkWHG147LsfCTtusG9GLXA6wJZPr7mtQ7J");
});

// BIP49 extended public key is shown
it('Shows the bip49 extended public key', async function() {
    await driver.findElement(By.css('#bip49-tab a')).click();
    await driver.findElement(By.css(".phrase")).sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length");
    await driver.sleep(generateDelay);
    const xpub = await driver.findElement(By.css('.extended-pub-key')).getAttribute("value");
    expect(xpub).toBe("ypub6a5KYFBmF4Rz6hMnTFxhVCvUeRiKm5GiBhExbHUgjEsRPrbsCtZJhzNV1QrkeCB1VZtxxJsHkHi9qx4NoqFHd4JsvTAizsGeydjnMxWjbvx");
});

// BIP49 account field changes address list
it('Can set the bip49 account field', async function() {
    await driver.findElement(By.css('#bip49-tab a')).click();
    await driver.findElement(By.css('#bip49 .account')).clear();
    await driver.findElement(By.css('#bip49 .account')).sendKeys("1");
    await driver.findElement(By.css(".phrase")).sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length");
    await driver.sleep(generateDelay);
    const address = await new Promise((resolve) => {
        getFirstAddress(resolve);
    });
    expect(address).toBe("34gGTb5Fvp1HMnZ652WtcFYbnf8tubiS8B");
});

// BIP49 change field changes address list
it('Can set the bip49 change field', async function() {
    await driver.findElement(By.css('#bip49-tab a')).click();
    await driver.findElement(By.css('#bip49 .change')).clear();
    await driver.findElement(By.css('#bip49 .change')).sendKeys("1");
    await driver.findElement(By.css(".phrase")).sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon length");
    await driver.sleep(generateDelay);
    const address = await new Promise((resolve) => {
        getFirstAddress(resolve);
    });
    expect(address).toBe("3EvpimqDEiuBEVcpxrYn5x9cpEXPwN88Jv");
});

});
