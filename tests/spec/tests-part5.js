// Usage:
// cd /path/to/repo/tests
// jasmine spec/tests-part5.js
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
    console.log("BROWSER=firefox jasmine spec/tests-part5.js");
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
var entropyFeedbackDelay = 300;

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

function testNetwork(done, params, comparisons) {
    // enter the mnemonic
    driver.findElement(By.css('.phrase'))
        .then(function(el) {
            return el.sendKeys(params.phrase);
        })
        // wait 1 second for address generation
        .then(function() {
            return driver.sleep(1000);
        })
        // select the network if not mainnet
        .then(function() {
            if (params.selectValue !== "0") {
                return driver.findElement(By.css('.network option[value="' + params.selectValue + '"]')).then(function(el) {
                    return el.click();
                }).then(function() {
                    return driver.sleep(500);
                });
            }
        })
        // select the bip86 tab
        .then(function() {
            return driver.findElement(By.css('#bip86-tab a'));
        })
        .then(function(el) {
            return el.click();
        })
        // set the account if not 0
        .then(function() {
            if (params.account !== 0) {
                return driver.findElement(By.css('#bip86 .account')).then(function(el) {
                    el.clear();
                    el.sendKeys(params.account.toString());
                    return driver.sleep(300);
                });
            }
        })
        // set the change if not 0
        .then(function() {
            if (params.change !== 0) {
                return driver.findElement(By.css('#bip86 .change')).then(function(el) {
                    el.clear();
                    el.sendKeys(params.change.toString());
                    return driver.sleep(300);
                });
            }
        })
        // wait for everything to be calculated
        .then(function() {
            return driver.sleep(500);
        })
        .then(function() {
            return driver.findElements(By.css('.address'));
        })
        .then(function(els) {
            expect(els.length).toBeGreaterThan(0);
            // check first address
            return els[0].getText();
        })
        .then(function(address) {
            expect(address).toBe(comparisons.firstAddress);
        })
        .then(function() {
            return driver.findElements(By.css('.pubkey'));
        })
        .then(function(els) {
            expect(els.length).toBeGreaterThan(0);
            return els[0].getText();
        })
        .then(function(pubkey) {
            expect(pubkey).toBe(comparisons.firstPubkey);
        })
        .then(function() {
            return driver.findElements(By.css('.privkey'));
        })
        .then(function(els) {
            expect(els.length).toBeGreaterThan(0);
            return els[0].getText();
        })
        .then(function(privkey) {
            expect(privkey).toBe(comparisons.firstPrivkey);
        })
        // get the xpub shown on the page
        .then(function() {
            return driver.findElement(By.css('#bip86 .account-xpub'));
        })
        .then(function(el) {
            return el.getAttribute('value');
        })
        .then(function(xpub) {
            expect(xpub).toBe(comparisons.xpub);
        })
        // get the xprv shown on the page  
        .then(function() {
            return driver.findElement(By.css('#bip86 .account-xprv'));
        })
        .then(function(el) {
            return el.getAttribute('value');
        })
        .then(function(xprv) {
            expect(xprv).toBe(comparisons.xprv);
        })
        .then(done);
}

// Tests

describe('BIP-86 Taproot Tests (Part 5)', function() {

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

    // BIP-86 Taproot test vectors from bitcoinjs-lib taproot.spec.ts
    it('Should generate correct BIP-86 Taproot addresses from bitcoinjs-lib test vectors', function(done) {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
        // Official test vector from bitcoinjs-lib taproot.spec.ts:
        // - Mnemonic: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
        // - xprv: "xprv9s21ZrQH143K3GJpoapnV8SFfukcVBSfeCficPSGfubmSFDxo1kuHnLisriDvSnRRuL2Qrg5ggqHKNVpxR86QEC8w35uxmGoggxtQTPvfUu"
        // - Path: "m/86'/0'/0'/0/0"
        // - Internal Pubkey: "cc8a4bc64d897bddc5fbc2f670f7a8ba0b386779106cf1223c6fc5d7cd6fc115"
        // - Expected Address: "bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr"
        
        testNetwork(done, {
            phrase: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
            selectValue: "0",
            account: 0,
            change: 0
        }, {
            firstAddress: "bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr",
            firstPubkey: "03cc8a4bc64d897bddc5fbc2f670f7a8ba0b386779106cf1223c6fc5d7cd6fc115",
            firstPrivkey: "KyRv5iFPHG7iB5E4CqvMzH3WFJVhbfYK4VY7XAedd9Ys69mEsPLQ",
            xpub: "xpub6BgBgsespWvERF3LHQu6CnqdvfEvtMcQjYrcRzx53QJjSxarj2afYWcLteoGVky7D3UKDP9QyrLprQ3VCECoY49yfdDEHGCtMMj92pReUsQ",
            xprv: "xprv9xgqHN7yz9MwCkxsBPN5qetuNdQSUttZNKw1dcYTV4mkaAFiBVGQziHs3NRSWMkCzvgjEe3n9xV8oYywvM8at9yRqyaZVz6TYYhX98VjsUk"
        });
    });

    it('Should generate correct BIP-86 addresses for different account values', function(done) {
        testNetwork(done, {
            phrase: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
            selectValue: "0", 
            account: 1,
            change: 0
        }, {
            // Expected values for account 1 (m/86'/0'/1'/0/0)
            firstAddress: "bc1pkq6ayylfpe5hn05550ry25pkakuf72x9qkjc2sl06dfcet8sg25q9y3j3y",
            firstPubkey: "0244becfe627731a2ad296f83d6a4e8ab44b7a98baf48217de8d77ad9fb8c9cb80",
            firstPrivkey: "L3GyYZcghoZJGeWiuYyVt9Ps8z9CMLV2NWfq9eDKRVXEePaPtWLV",
            xpub: "xpub6BgBgsespWvEUBtu8NPpew4suu4JeuYz1ryQBqRKYk6BCN4p6nugJwXyBFjwPS93FTP4Rvkgqzhoy4ZysXh6f6jPWrjwbtG5PBzqPJghDkT",
            xprv: "xprv9xgqHN7yz9MwFhpS2LrpHo89MsDpFSq8ee3oPT1hzQZCKZjfZFbRm9DVKzfmP3RhuTVHRVv8K1obGMBkH7fDPiJkWMms7PduWmGkcY1WQ7i"
        });
    });

    it('Should generate correct BIP-86 addresses for change addresses', function(done) {
        testNetwork(done, {
            phrase: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
            selectValue: "0",
            account: 0,
            change: 1
        }, {
            // Expected values for change addresses (m/86'/0'/0'/1/0)
            firstAddress: "bc1p3qkhfews2uk44qtvauqyr2ttdsw7svhkl9nkm9s9c3x4ax5h60wqwruhk7",
            firstPubkey: "02399f1b2f4393f29a18c937859c5dd8a77350103157eb880f02e8c08214277cef",
            firstPrivkey: "KzsCLFtWKpeNKMHFyHKT8vGRuGQxEY8CQjgLcEj14C8xK2PyEFeN",
            xpub: "xpub6BgBgsespWvERF3LHQu6CnqdvfEvtMcQjYrcRzx53QJjSxarj2afYWcLteoGVky7D3UKDP9QyrLprQ3VCECoY49yfdDEHGCtMMj92pReUsQ",  
            xprv: "xprv9xgqHN7yz9MwCkxsBPN5qetuNdQSUttZNKw1dcYTV4mkaAFiBVGQziHs3NRSWMkCzvgjEe3n9xV8oYywvM8at9yRqyaZVz6TYYhX98VjsUk"
        });
    });

    it('Should generate correct BIP-86 addresses on testnet', function(done) {
        testNetwork(done, {
            phrase: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
            selectValue: "1",
            account: 0,
            change: 0
        }, {
            // Expected values for testnet (tb1...)
            firstAddress: "tb1p8wpt9v4frpf3tkn0srd97pksgsxc5hs52lafxwru9kgeephvs7rqlqt9zj",
            firstPubkey: "0255355ca83c973f1d97ce0e3843c85d78905af16b4dc531bc488e57212d230116",
            firstPrivkey: "cV628xvqToz45dwdPmTcJ9RgEVnWMwP8dpZBGzb9LfTk3sBHFNwc",
            xpub: "tpubDDfvzhdVV4unsoKt5aE6dcsNsfeWbTgmLZPi8LQDYU2xixrYemMfWJ3BaVneH3u7DBQePdTwhpybaKRU95pi6PMUtLPBJLVQRpzEnjfjZzX",
            xprv: "tprv8gytrHbFLhE7zLJ6BvZWEDDGJe8aS8VrmFnvqpMv8CEZtUbn2NY5KoRKQNpkcL1yniyCBRi7dAPy4kUxHkcSvd9jzLmLMEG96TPwant2jbX"
        });
    });

    it('Should show the correct derivation path for BIP-86', function(done) {
        driver.findElement(By.css('.phrase'))
            .then(function(el) {
                el.clear();
                el.sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about");
                return el;
            })
            // select bip86 tab
            .then(function() {
                return driver.findElement(By.css('#bip86-tab a'));
            })
            .then(function(el) {
                return el.click();
            })
            // wait for the derivation path to be updated
            .then(function() {
                return driver.sleep(feedbackDelay);
            })
            // check the derivation path
            .then(function() {
                return driver.findElement(By.css('#bip86-path'));
            })
            .then(function(el) {
                return el.getAttribute("value");
            })
            .then(function(path) {
                expect(path).toBe("m/86'/0'/0'/0");
            })
            .then(done);
    });

    it('Should update derivation path when account is changed', function(done) {
        driver.findElement(By.css('.phrase'))
            .then(function(el) {
                el.clear();
                el.sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about");
                return el;
            })
            // select bip86 tab
            .then(function() {
                return driver.findElement(By.css('#bip86-tab a'));
            })
            .then(function(el) {
                return el.click();
            })
            // change account to 3
            .then(function() {
                return driver.findElement(By.css('#bip86 .account'));
            })
            .then(function(el) {
                el.clear();
                el.sendKeys("3");
                return el;
            })
            // wait for the derivation path to be updated
            .then(function() {
                return driver.sleep(feedbackDelay);
            })
            // check the updated derivation path
            .then(function() {
                return driver.findElement(By.css('#bip86-path'));
            })
            .then(function(el) {
                return el.getAttribute("value");
            })
            .then(function(path) {
                expect(path).toBe("m/86'/0'/3'/0");
            })
            .then(done);
    });

    it('Should update derivation path when change is modified', function(done) {
        driver.findElement(By.css('.phrase'))
            .then(function(el) {
                el.clear();
                el.sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about");
                return el;
            })
            // select bip86 tab
            .then(function() {
                return driver.findElement(By.css('#bip86-tab a'));
            })
            .then(function(el) {
                return el.click();
            })
            // change the change value to 1
            .then(function() {
                return driver.findElement(By.css('#bip86 .change'));
            })
            .then(function(el) {
                el.clear();
                el.sendKeys("1");
                return el;
            })
            // wait for the derivation path to be updated
            .then(function() {
                return driver.sleep(feedbackDelay);
            })
            // check the updated derivation path
            .then(function() {
                return driver.findElement(By.css('#bip86-path'));
            })
            .then(function(el) {
                return el.getAttribute("value");
            })
            .then(function(path) {
                expect(path).toBe("m/86'/0'/0'/1");
            })
            .then(done);
    });

    it('Should handle invalid BIP-86 parameters gracefully', function(done) {
        // enter mnemonic first
        driver.findElement(By.css('.phrase'))
            .then(function(el) {
                return el.sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about");
            })
            // wait for initial address generation
            .then(function() {
                return driver.sleep(1000);
            })
            // select bip86 tab
            .then(function() {
                return driver.findElement(By.css('#bip86-tab a'));
            })
            .then(function(el) {
                return el.click();
            })
            // wait for tab to load
            .then(function() {
                return driver.sleep(1000);
            })
            // set invalid account value
            .then(function() {
                return driver.findElement(By.css('#bip86 .account'));
            })
            .then(function(el) {
                el.clear();
                el.sendKeys("-1");
                return el;
            })
            // wait for processing
            .then(function() {
                return driver.sleep(500);
            })
            // verify the application doesn't crash with invalid input
            .then(function() {
                return driver.findElement(By.css('#bip86-path'));
            })
            .then(function(el) {
                return el.getAttribute('value');
            })
            .then(function(path) {
                // Should still show a valid derivation path even with invalid account
                expect(path).toContain("m/86'");
            })
            .then(done);
    });
});