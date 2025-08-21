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
        options.addArguments("--disable-extensions");
        options.addArguments("--disable-background-timer-throttling");
        options.addArguments("--disable-renderer-backgrounding");
        options.addArguments("--disable-backgrounding-occluded-windows");
        options.addArguments("--memory-pressure-off");
        options.addArguments("--max-old-space-size=4096");
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

async function testEntropyBits(entropyText, entropyBits) {
    await driver.findElement(By.css('.use-entropy')).click();
    await driver.findElement(By.css('.entropy')).clear();
    await driver.findElement(By.css('.entropy')).sendKeys(entropyText);
    await driver.sleep(generateDelay);
    const text = await driver.findElement(By.css('.entropy-container')).getText();
    var re = new RegExp("Total Bits\\s+" + entropyBits);
    expect(text).toMatch(re);
    // Disable entropy mode to prevent state accumulation
    await driver.findElement(By.css('.use-entropy')).click();
    // Additional delay to let webdriver process
    await driver.sleep(50);
}

async function testEntropyFeedback(entropyDetail) {
    // entropy type is compiled into regexp so needs escaping
    // see https://stackoverflow.com/a/2593661
    if ("type" in entropyDetail) {
        entropyDetail.type = (entropyDetail.type+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
    }
    await driver.findElement(By.css('.use-entropy')).click();
    await driver.findElement(By.css('.entropy')).clear();
    await driver.findElement(By.css('.entropy')).sendKeys(entropyDetail.entropy);
    await driver.sleep(generateDelay);
    
    const text = await driver.findElement(By.css('.entropy-container')).getText();
    const phrase = await driver.findElement(By.css('.phrase')).getAttribute("value");
    
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
    await driver.findElement(By.css('.use-entropy')).click();
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

// Tests

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

// BEGIN TESTS

it('Ignores excess whitespace in the mnemonic', async function() {
    const doublespace = "  ";
    const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon" + doublespace + "abandon about";
    driver.findElement(By.css('.phrase'))
        .sendKeys(mnemonic);
    await driver.sleep(generateDelay);
    const seed = await driver.findElement(By.css('.root-key'))
        .getAttribute("value");
    expect(seed).toBe("xprv9s21ZrQH143K3GJpoapnV8SFfukcVBSfeCficPSGfubmSFDxo1kuHnLisriDvSnRRuL2Qrg5ggqHKNVpxR86QEC8w35uxmGoggxtQTPvfUu");
});

// Github Issue 23: Part 1: Use correct derivation path when changing tabs
// https://github.com/iancoleman/bip39/issues/23
// This test was failing for default timeout of 5000ms so changed it to +10s
it('Uses the correct derivation path when changing tabs', async function() {
    // 1) and 2) set the phrase
    driver.findElement(By.css('.phrase'))
        .sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about");
    await driver.sleep(generateDelay);
    // 3) select bip32 tab
    driver.findElement(By.css('#bip32-tab a'))
        .click();
    await driver.sleep(generateDelay);
    // 4) switch from bitcoin to bitcoin testnet
    selectNetwork("BTC - Bitcoin Testnet");
    await driver.sleep(generateDelay);
    // 5) Check address is displayed correctly
    const address = await new Promise((resolve) => {
        getFirstAddress(resolve);
    });
    expect(address).toBe("miEUQGydBkSwGEUKMdrUd4Tr1BmZRbQ56F");
    // 5) Check derivation path is displayed correctly
    const path = await new Promise((resolve) => {
        getFirstPath(resolve);
    });
    expect(path).toBe("m/0/0");
}, generateDelay + 10000);

// Github Issue 23 Part 2: Coin selection in derivation path
// https://github.com/iancoleman/bip39/issues/23#issuecomment-238011920
it('Uses the correct derivation path when changing coins', async function() {
    // set the phrase
    driver.findElement(By.css('.phrase'))
        .sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about");
    await driver.sleep(generateDelay);
    // switch from bitcoin to bitcoin testnet
    selectNetwork("BTC - Bitcoin Testnet");
    await driver.sleep(generateDelay);
    // check derivation path is displayed correctly (Bitcoin testnet uses coin type 1)
    const path = await new Promise((resolve) => {
        getFirstPath(resolve);
    });
    expect(path).toBe("m/44'/1'/0'/0/0");
    await driver.sleep(generateDelay);
    const address = await new Promise((resolve) => {
        getFirstAddress(resolve);
    });
    expect(address).toBe("mkpZhYtJu2r87Js3pDiWJDmPte2NRZ8bJV");
});

// Selecting a language with no existing phrase should generate a phrase in
// that language.
it('Generate a random phrase when language is selected and no current phrase', async function() {
    driver.findElement(By.css("a[href='#japanese']"))
        .click();
    await driver.sleep(generateDelay);
    const phrase = await driver.findElement(By.css(".phrase"))
        .getAttribute("value");
    expect(phrase.search(/[a-z]/)).toBe(-1);
    expect(phrase.length).toBeGreaterThan(0);
});

// Selecting a language with existing phrase should update the phrase to use
// that language.
it('Updates existing phrases when the language is changed', async function() {
    driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about");
    await driver.sleep(generateDelay);
    driver.findElement(By.css("a[href='#italian']"))
        .click();
    await driver.sleep(generateDelay);
    const phrase = await driver.findElement(By.css(".phrase"))
        .getAttribute("value");
    // Check only the language changes, not the phrase
    expect(phrase).toBe("abaco abaco abaco abaco abaco abaco abaco abaco abaco abaco abaco abete");
    // Switch to testnet to get the expected address
    selectNetwork("BTC - Bitcoin Testnet");
    await driver.sleep(generateDelay);
    const address = await new Promise((resolve) => {
        getFirstAddress(resolve);
    });
    // Check the address is correct
    expect(address).toBe("muLKJLmpvwfbXUWuehmsnfMqbtMHG8FVV8");
});

// Suggested replacement for erroneous word in non-English language
it('Shows word suggestion for incorrect word in non-English language', async function() {
    await driver.findElement(By.css('.phrase'))
        .sendKeys('abaco abaco abaco abaco abaco abaco abaco abaco abaco abaco abaco azbete');
    await driver.sleep(feedbackDelay);
    const feedback = await driver.findElement(By.css('.feedback'))
        .getText();
    const msg = "azbete not in wordlist, did you mean abete?";
    expect(feedback).toBe(msg);
});

// Japanese word does not break across lines.
// Point 2 from
// https://github.com/bitcoin/bips/blob/master/bip-0039/bip-0039-wordlists.md#japanese
it('Does not break Japanese words across lines', async function() {
    const value = await driver.findElement(By.css('.phrase'))
        .getCssValue("word-break");
    expect(value).toBe("keep-all");
});

// Language can be specified at page load using hash value in url
it('Can set the language from the url hash', async function() {
    await driver.get(url + "#japanese");
    driver.findElement(By.css('.generate')).click();
    await driver.sleep(generateDelay);
    const phrase = await driver.findElement(By.css(".phrase"))
        .getAttribute("value");
    expect(phrase.search(/[a-z]/)).toBe(-1);
    expect(phrase.length).toBeGreaterThan(0);
});

// Entropy can be entered by the user
it('Allows entropy to be entered', async function() {
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .sendKeys('00000000000 00000000000 00000000000 00000000000 00000000000 00000000000 00000000000 00000000000 00000000000 00000000000 00000000000 0000000');
    await driver.sleep(generateDelay);
    const phrase = await driver.findElement(By.css(".phrase"))
        .getAttribute("value");
    expect(phrase).toBe("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about");
    const address = await new Promise((resolve) => {
        getFirstAddress(resolve);
    });
    expect(address).toBe("1LqBGSKuX5yYUonjxT5qGfpUsXKYYWeabA");
});

// A warning about entropy is shown to the user, with additional information
it('Shows a warning about using entropy', async function() {
    driver.findElement(By.css('.use-entropy'))
        .click();
    const containerText = await driver.findElement(By.css('.entropy-container'))
        .getText();
    const warning = "mnemonic may be insecure";
    expect(containerText).toContain(warning);
    const notesText = await driver.findElement(By.css('#entropy-notes'))
        .findElement(By.xpath("parent::*"))
        .getText();
    const detail = "flipping a fair coin, rolling a fair dice, noise measurements etc";
    expect(notesText).toContain(detail);
});

// The types of entropy available are described to the user
it('Shows the types of entropy available', async function() {
    const placeholderText = await driver.findElement(By.css('.entropy'))
        .getAttribute("placeholder");
    const options = [
        "binary",
        "base 6",
        "dice",
        "base 10",
        "hexadecimal",
        "cards",
    ];
    for (let i=0; i<options.length; i++) {
        const option = options[i];
        expect(placeholderText).toContain(option);
    }
});

// The actual entropy used is shown to the user
it('Shows the actual entropy used', async function() {
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .sendKeys('Not A Very Good Entropy Source At All');
    await driver.sleep(generateDelay);
    const text = await driver.findElement(By.css('.entropy-container'))
        .getText();
    expect(text).toMatch(/Filtered Entropy\s+AedEceAA/);
});

// Binary entropy can be entered
it('Allows binary entropy to be entered', async function() {
    await new Promise((resolve) => {
        testEntropyType(resolve, "01", "binary");
    });
});

// Base 6 entropy can be entered
it('Allows base 6 entropy to be entered', async function() {
    await new Promise((resolve) => {
        testEntropyType(resolve, "012345", "base 6");
    });
});

// Base 6 dice entropy can be entered
it('Allows base 6 dice entropy to be entered', async function() {
    await new Promise((resolve) => {
        testEntropyType(resolve, "123456", "base 6 (dice)");
    });
});

// Base 10 entropy can be entered
it('Allows base 10 entropy to be entered', async function() {
    await new Promise((resolve) => {
        testEntropyType(resolve, "789", "base 10");
    });
});

// Hexadecimal entropy can be entered
it('Allows hexadecimal entropy to be entered', async function() {
    await new Promise((resolve) => {
        testEntropyType(resolve, "abcdef", "hexadecimal");
    });
});

// Dice entropy value is shown as the converted base 6 value
// ie 123456 is converted to 123450
it('Shows dice entropy as base 6', async function() {
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .sendKeys("123456");
    await driver.sleep(generateDelay);
    const text = await driver.findElement(By.css('.entropy-container'))
        .getText();
    expect(text).toMatch(/Filtered Entropy\s+123450/);
});

// The number of bits of entropy accumulated is shown
it("Shows the number of bits of entropy for 20 bits of binary", async function() {
    await testEntropyBits("0000 0000 0000 0000 0000", "20");
});

it("Shows the number of bits of entropy for 1 bit of binary", async function() {
    await testEntropyBits("0", "1");
});

it("Shows the number of bits of entropy for 4 bits of binary", async function() {
    await testEntropyBits("0000", "4");
});

it("Shows the number of bits of entropy for 1 character of base 6 (dice)", async function() {
    // 6 in card is 0 in base 6, 0 is mapped to 00 by entropy.js
    await testEntropyBits("6", "2");
});

it("Shows the number of bits of entropy for 1 character of base 10 with 3 bits", async function() {
    // 7 in base 10 is 111 in base 2, no leading zeros
    await testEntropyBits("7", "3");
});

it("Shows the number of bits of entropy for 1 character of base 10 with 4 bis", async function() {
    // 8 in base 10 is mapped to 0 by entropy.js
    await testEntropyBits("8", "1");
});

it("Shows the number of bits of entropy for 1 character of hex", async function() {
    await testEntropyBits("F", "4");
});

it("Shows the number of bits of entropy for 2 characters of base 10", async function() {
    // 2 as base 10 is binary 010, 9 is mapped to binary 1 by entropy.js
    await testEntropyBits("29", "4");
});

it("Shows the number of bits of entropy for 2 characters of hex", async function() {
    await testEntropyBits("0A", "8");
});

it("Shows the number of bits of entropy for 2 characters of hex with 3 leading zeros", async function() {
    // hex is always multiple of 4 bits of entropy
    await testEntropyBits("1A", "8");
});

it("Shows the number of bits of entropy for 2 characters of hex with 2 leading zeros", async function() {
    await testEntropyBits("2A", "8");
});

it("Shows the number of bits of entropy for 2 characters of hex with 1 leading zero", async function() {
    await testEntropyBits("4A", "8");
});

it("Shows the number of bits of entropy for 2 characters of hex with no leading zeros", async function() {
    await testEntropyBits("8A", "8");
});

it("Shows the number of bits of entropy for 2 characters of hex starting with F", async function() {
    await testEntropyBits("FA", "8");
});

it("Shows the number of bits of entropy for 4 characters of hex with leading zeros", async function() {
    await testEntropyBits("000A", "16");
});

it("Shows the number of bits of entropy for 4 characters of base 6", async function() {
    // 5 in base 6 is mapped to binary 1
    await testEntropyBits("5555", "4");
});

it("Shows the number of bits of entropy for 4 characters of base 6 dice", async function() {
    // uses dice, so entropy is actually 0000 in base 6, which is 4 lots of
    // binary 00
    await testEntropyBits("6666", "8");
});

it("Shows the number of bits of entropy for 4 charactes of base 10", async function() {
    // 2 in base 10 is binary 010 and 7 is binary 111 so is 4 events of 3 bits
    await testEntropyBits("2227", "12");
});

it("Shows the number of bits of entropy for 4 characters of hex with 2 leading zeros", async function() {
    await testEntropyBits("222F", "16");
});

it("Shows the number of bits of entropy for 4 characters of hex starting with F", async function() {
    await testEntropyBits("FFFF", "16");
});

it("Shows the number of bits of entropy for 10 characters of base 10", async function() {
    // 10 events with 3 bits for each event
    await testEntropyBits("0000101017", "30");
});

it("Shows the number of bits of entropy for 10 characters of base 10 account for bias", async function() {
    // 9 events with 3 bits per event and 1 event with 1 bit per event
    await testEntropyBits("0000101018", "28");
});

it("Shows the number of bits of entropy for a full deck of cards", async function() {
    // removing bias is 32*5 + 16*4 + 4*2
    await testEntropyBits("ac2c3c4c5c6c7c8c9ctcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqsks", "232");
});

it("Shows details about the entered entropy for single character", async function() {
    await testEntropyFeedback( {
            entropy: "A",
            filtered: "A",
            type: "hexadecimal",
            events: "1",
            bits: "4",
            words: 0,
            strength: "less than a second",
        });
});
it("Shows details about the entered entropy for repeated characters", async function() {
    await testEntropyFeedback(
            {
                entropy: "AAAAAAAA",
                filtered: "AAAAAAAA",
                type: "hexadecimal",
                events: "8",
                bits: "32",
                words: 0,
                strength: "less than a second - Repeats like \"aaa\" are easy to guess",
            }
    );
});
it("Shows details about the entered entropy with whitespace", async function() {
    await testEntropyFeedback(
            {
                entropy: "AAAAAAAA B",
                filtered: "AAAAAAAAB",
                type: "hexadecimal",
                events: "9",
                bits: "36",
                words: 0,
                strength: "less than a second - Repeats like \"aaa\" are easy to guess",
            }
    );
});
it("Shows details about the entered entropy for 64 bits", async function() {
    await testEntropyFeedback(
            {
                entropy: "AAAAAAAA BBBBBBBB",
                filtered: "AAAAAAAABBBBBBBB",
                type: "hexadecimal",
                events: "16",
                bits: "64",
                words: 0,
                strength: "less than a second - Repeats like \"aaa\" are easy to guess",
            }
    );
});
it("Shows details about the entered entropy for 96 bits", async function() {
    await testEntropyFeedback(
            {
                entropy: "AAAAAAAA BBBBBBBB CCCCCCCC",
                filtered: "AAAAAAAABBBBBBBBCCCCCCCC",
                type: "hexadecimal",
                events: "24",
                bits: "96",
                words: 0,
                strength: "less than a second",
            }
    );
});
it("Shows details about the entered entropy for 128 bits (12 words)", async function() {
    await testEntropyFeedback(
            {
                entropy: "AAAAAAAA BBBBBBBB CCCCCCCC DDDDDDDD",
                filtered: "AAAAAAAABBBBBBBBCCCCCCCCDDDDDDDD",
                type: "hexadecimal",
                events: "32",
                bits: "128",
                words: 12,
                strength: "2 minutes",
            }
    );
});
it("Shows details about the entered entropy for 160 bits (15 words)", async function() {
    await testEntropyFeedback({
        entropy: "AAAAAAAA BBBBBBBB CCCCCCCC DDDDDDDD EEEEEEEE",
        filtered: "AAAAAAAABBBBBBBBCCCCCCCCDDDDDDDDEEEEEEEE",
        type: "hexadecimal",
        events: "40",
        bits: "160",
        words: 15,
        strength: "12 days",
    });
});
it("Shows details about the entered entropy for 192 bits (18 words)", async function() {
    await testEntropyFeedback(
            {
                entropy: "AAAAAAAA BBBBBBBB CCCCCCCC DDDDDDDD EEEEEEEE FFFFFFFF",
                filtered: "AAAAAAAABBBBBBBBCCCCCCCCDDDDDDDDEEEEEEEEFFFFFFFF",
                type: "hexadecimal",
                events: "48",
                bits: "192",
                words: 18,
                strength: "centuries",
            }
    );
});
it("Shows details about the entered entropy for 224 bits (21 words)", async function() {
    await testEntropyFeedback(
            {
                entropy: "AAAAAAAA BBBBBBBB CCCCCCCC DDDDDDDD EEEEEEEE FFFFFFFF 11111111",
                filtered: "AAAAAAAABBBBBBBBCCCCCCCCDDDDDDDDEEEEEEEEFFFFFFFF11111111",
                type: "hexadecimal",
                events: "56",
                bits: "224",
                words: 21,
                strength: "centuries",
            }
    );
});
it("Shows details about the entered entropy for 256 bits (24 words)", async function() {
    await testEntropyFeedback(
            {
                entropy: "AAAAAAAA BBBBBBBB CCCCCCCC DDDDDDDD EEEEEEEE FFFFFFFF 11111111 22222222",
                filtered: "AAAAAAAABBBBBBBBCCCCCCCCDDDDDDDDEEEEEEEEFFFFFFFF1111111122222222",
                type: "hexadecimal",
                events: "64",
                bits: "256",
                words: 24,
                strength: "centuries",
            }
    );
});
it("Shows details about the entered entropy", async function() {
    // Empty test - needs implementation
});

});
