// Usage:
// cd /path/to/repo/tests
// jasmine spec/tests-nip06.js
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
    console.log("BROWSER=firefox jasmine spec/tests-nip06.js");
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

function testNostrKeys(done, params, comparisons) {
    // enter the mnemonic
    driver.findElement(By.css('.phrase'))
        .then(function(el) {
            return el.sendKeys(params.phrase);
        })
        // wait 1 second for address generation
        .then(function() {
            return driver.sleep(1000);
        })
        // select the nip06 tab
        .then(function() {
            return driver.findElement(By.css('#nip06-tab a'));
        })
        .then(function(el) {
            return el.click();
        })
        // set the account if not 0
        .then(function() {
            if (params.account !== 0) {
                return driver.findElement(By.css('#account-nip06')).then(function(el) {
                    el.clear();
                    el.sendKeys(params.account.toString());
                    return driver.sleep(300);
                });
            }
        })
        // wait for everything to be calculated
        .then(function() {
            return driver.sleep(500);
        })
        // check nostr private key (hex)
        .then(function() {
            return driver.findElement(By.css('#nostr-private-key'));
        })
        .then(function(el) {
            return el.getAttribute('value');
        })
        .then(function(privKeyHex) {
            expect(privKeyHex).toBe(comparisons.privateKeyHex);
        })
        // check nostr public key (hex)
        .then(function() {
            return driver.findElement(By.css('#nostr-public-key'));
        })
        .then(function(el) {
            return el.getAttribute('value');
        })
        .then(function(pubKeyHex) {
            expect(pubKeyHex).toBe(comparisons.publicKeyHex);
        })
        // check npub
        .then(function() {
            return driver.findElement(By.css('#nostr-npub'));
        })
        .then(function(el) {
            return el.getAttribute('value');
        })
        .then(function(npub) {
            expect(npub).toBe(comparisons.npub);
        })
        // check nsec
        .then(function() {
            return driver.findElement(By.css('#nostr-nsec'));
        })
        .then(function(el) {
            return el.getAttribute('value');
        })
        .then(function(nsec) {
            expect(nsec).toBe(comparisons.nsec);
        })
        .then(done);
}

function testNostrTable(done, params, comparisons) {
    // enter the mnemonic
    driver.findElement(By.css('.phrase'))
        .then(function(el) {
            return el.sendKeys(params.phrase);
        })
        // wait 1 second for address generation
        .then(function() {
            return driver.sleep(1000);
        })
        // select the nip06 tab
        .then(function() {
            return driver.findElement(By.css('#nip06-tab a'));
        })
        .then(function(el) {
            return el.click();
        })
        // check the nostr table checkbox if needed
        .then(function() {
            if (params.useNostrTable) {
                return driver.findElement(By.css('#showNostrInTable')).then(function(el) {
                    return el.click();
                }).then(function() {
                    return driver.sleep(500);
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
            // check first address (account 0)
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
        .then(done);
}

// Tests

describe('NIP-06 Nostr Key Derivation Tests', function() {

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

    // Test Vector 1
    it('Should generate correct NIP-06 keys from test vector 1', function(done) {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
        // NOSTR Vector1
        // entropy (hex): f9c2f045862b81f9b9ad5d33630d7f786acd79f5c9421f3a83e285abead9c2ea
        // mnemonic: what bleak badge arrange retreat wolf trade produce cricket blur garlic valid proud rude strong choose busy staff weather area salt hollow arm fade
        // private key (hex): c15d739894c81a2fcfd3a2df85a0d2c0dbc47a280d092799f144d73d7ae78add
        // nsec: nsec1c9wh8xy5eqdzln7n5t0ctgxjcrdug73gp5yj0x03gntn67h83twssdfhel
        // public key (hex): d41b22899549e1f3d335a31002cfd382174006e166d3e658e3a5eecdb6463573
        // npub: npub16sdj9zv4f8sl85e45vgq9n7nsgt5qphpvmf7vk8r5hhvmdjxx4es8rq74h
        
        testNostrKeys(done, {
            phrase: "what bleak badge arrange retreat wolf trade produce cricket blur garlic valid proud rude strong choose busy staff weather area salt hollow arm fade",
            account: 0
        }, {
            privateKeyHex: "c15d739894c81a2fcfd3a2df85a0d2c0dbc47a280d092799f144d73d7ae78add",
            publicKeyHex: "d41b22899549e1f3d335a31002cfd382174006e166d3e658e3a5eecdb6463573",
            npub: "npub16sdj9zv4f8sl85e45vgq9n7nsgt5qphpvmf7vk8r5hhvmdjxx4es8rq74h",
            nsec: "nsec1c9wh8xy5eqdzln7n5t0ctgxjcrdug73gp5yj0x03gntn67h83twssdfhel"
        });
    });

    // Test Vector 2
    it('Should generate correct NIP-06 keys from test vector 2', function(done) {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
        // NOSTR Vector2
        // entropy (hex): 7e91e681dd067802c50aa8216d564a89
        // mnemonic: leader monkey parrot ring guide accident before fence cannon height naive bean
        // private key (hex): 7f7ff03d123792d6ac594bfa67bf6d0c0ab55b6b1fdb6249303fe861f1ccba9a
        // nsec: nsec10allq0gjx7fddtzef0ax00mdps9t2kmtrldkyjfs8l5xruwvh2dq0lhhkp
        // public key (hex): 17162c921dc4d2518f9a101db33695df1afb56ab82f5ff3e5da6eec3ca5cd917
        // npub: npub1zutzeysacnf9rru6zqwmxd54mud0k44tst6l70ja5mhv8jjumytsd2x7nu
        
        testNostrKeys(done, {
            phrase: "leader monkey parrot ring guide accident before fence cannon height naive bean",
            account: 0
        }, {
            privateKeyHex: "7f7ff03d123792d6ac594bfa67bf6d0c0ab55b6b1fdb6249303fe861f1ccba9a",
            publicKeyHex: "17162c921dc4d2518f9a101db33695df1afb56ab82f5ff3e5da6eec3ca5cd917",
            npub: "npub1zutzeysacnf9rru6zqwmxd54mud0k44tst6l70ja5mhv8jjumytsd2x7nu",
            nsec: "nsec10allq0gjx7fddtzef0ax00mdps9t2kmtrldkyjfs8l5xruwvh2dq0lhhkp"
        });
    });

    it('Should show the correct derivation path for NIP-06', function(done) {
        driver.findElement(By.css('.phrase'))
            .then(function(el) {
                el.clear();
                el.sendKeys("what bleak badge arrange retreat wolf trade produce cricket blur garlic valid proud rude strong choose busy staff weather area salt hollow arm fade");
                return el;
            })
            // select nip06 tab
            .then(function() {
                return driver.findElement(By.css('#nip06-tab a'));
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
                return driver.findElement(By.css('#bip32-path-nip06'));
            })
            .then(function(el) {
                return el.getAttribute("value");
            })
            .then(function(path) {
                expect(path).toBe("m/44'/1237'/0'/0/0");
            })
            .then(done);
    });

    it('Should update derivation path when account is changed', function(done) {
        driver.findElement(By.css('.phrase'))
            .then(function(el) {
                el.clear();
                el.sendKeys("what bleak badge arrange retreat wolf trade produce cricket blur garlic valid proud rude strong choose busy staff weather area salt hollow arm fade");
                return el;
            })
            // select nip06 tab
            .then(function() {
                return driver.findElement(By.css('#nip06-tab a'));
            })
            .then(function(el) {
                return el.click();
            })
            // change account to 2
            .then(function() {
                return driver.findElement(By.css('#account-nip06'));
            })
            .then(function(el) {
                el.clear();
                el.sendKeys("2");
                return el;
            })
            // wait for the derivation path to be updated
            .then(function() {
                return driver.sleep(feedbackDelay);
            })
            // check the updated derivation path
            .then(function() {
                return driver.findElement(By.css('#bip32-path-nip06'));
            })
            .then(function(el) {
                return el.getAttribute("value");
            })
            .then(function(path) {
                expect(path).toBe("m/44'/1237'/2'/0/0");
            })
            .then(done);
    });

    it('Should update field labels with account number', function(done) {
        driver.findElement(By.css('.phrase'))
            .then(function(el) {
                el.clear();
                el.sendKeys("what bleak badge arrange retreat wolf trade produce cricket blur garlic valid proud rude strong choose busy staff weather area salt hollow arm fade");
                return el;
            })
            // select nip06 tab
            .then(function() {
                return driver.findElement(By.css('#nip06-tab a'));
            })
            .then(function(el) {
                return el.click();
            })
            // change account to 5
            .then(function() {
                return driver.findElement(By.css('#account-nip06'));
            })
            .then(function(el) {
                el.clear();
                el.sendKeys("5");
                return el;
            })
            // wait for the labels to be updated
            .then(function() {
                return driver.sleep(feedbackDelay);
            })
            // check that npub label shows account number
            .then(function() {
                return driver.findElement(By.css('label[for="nostr-npub"]'));
            })
            .then(function(el) {
                return el.getText();
            })
            .then(function(labelText) {
                expect(labelText).toBe("Account 5 npub (Bech32)");
            })
            // check that nsec label shows account number
            .then(function() {
                return driver.findElement(By.css('label[for="nostr-nsec"]'));
            })
            .then(function(el) {
                return el.getText();
            })
            .then(function(labelText) {
                expect(labelText).toBe("Account 5 nsec (Bech32)");
            })
            .then(done);
    });

    it('Should display npub/nsec format in table when checkbox is checked and match individual fields', function(done) {
        // enter the mnemonic
        driver.findElement(By.css('.phrase'))
            .then(function(el) {
                return el.sendKeys("what bleak badge arrange retreat wolf trade produce cricket blur garlic valid proud rude strong choose busy staff weather area salt hollow arm fade");
            })
            // wait for generation
            .then(function() {
                return driver.sleep(1000);
            })
            // select the nip06 tab
            .then(function() {
                return driver.findElement(By.css('#nip06-tab a'));
            })
            .then(function(el) {
                return el.click();
            })
            // wait for tab to load
            .then(function() {
                return driver.sleep(500);
            })
            // First verify individual fields show correct test vector values
            .then(function() {
                return driver.findElement(By.css('#nostr-npub'));
            })
            .then(function(el) {
                return el.getAttribute('value');
            })
            .then(function(npub) {
                expect(npub).toBe("npub16sdj9zv4f8sl85e45vgq9n7nsgt5qphpvmf7vk8r5hhvmdjxx4es8rq74h");
            })
            .then(function() {
                return driver.findElement(By.css('#nostr-nsec'));
            })
            .then(function(el) {
                return el.getAttribute('value');
            })
            .then(function(nsec) {
                expect(nsec).toBe("nsec1c9wh8xy5eqdzln7n5t0ctgxjcrdug73gp5yj0x03gntn67h83twssdfhel");
            })
            // Now check the checkbox to enable Nostr format in table
            .then(function() {
                return driver.findElement(By.css('#showNostrInTable'));
            })
            .then(function(el) {
                return el.click();
            })
            .then(function() {
                return driver.sleep(500);
            })
            // Verify table shows the SAME npub/nsec as individual fields
            .then(function() {
                return driver.findElements(By.css('.pubkey'));
            })
            .then(function(els) {
                expect(els.length).toBeGreaterThan(0);
                return els[0].getText();
            })
            .then(function(tablePubkey) {
                expect(tablePubkey).toBe("npub16sdj9zv4f8sl85e45vgq9n7nsgt5qphpvmf7vk8r5hhvmdjxx4es8rq74h");
            })
            .then(function() {
                return driver.findElements(By.css('.privkey'));
            })
            .then(function(els) {
                expect(els.length).toBeGreaterThan(0);
                return els[0].getText();
            })
            .then(function(tablePrivkey) {
                expect(tablePrivkey).toBe("nsec1c9wh8xy5eqdzln7n5t0ctgxjcrdug73gp5yj0x03gntn67h83twssdfhel");
            })
            // Verify address column still shows Bitcoin address
            .then(function() {
                return driver.findElements(By.css('.address'));
            })
            .then(function(els) {
                expect(els.length).toBeGreaterThan(0);
                return els[0].getText();
            })
            .then(function(address) {
                expect(address).toBe("1FKjYnSZsxGA5t8Q7zTKyFyGW7JmM4aBNG");
            })
            .then(done);
    });

    it('Should display npub/nsec format in table when checkbox is checked and match individual fields - test vector 2', function(done) {
        // enter the mnemonic for test vector 2
        driver.findElement(By.css('.phrase'))
            .then(function(el) {
                return el.sendKeys("leader monkey parrot ring guide accident before fence cannon height naive bean");
            })
            // wait for generation
            .then(function() {
                return driver.sleep(1000);
            })
            // select the nip06 tab
            .then(function() {
                return driver.findElement(By.css('#nip06-tab a'));
            })
            .then(function(el) {
                return el.click();
            })
            // wait for tab to load
            .then(function() {
                return driver.sleep(500);
            })
            // First verify individual fields show correct test vector 2 values
            .then(function() {
                return driver.findElement(By.css('#nostr-npub'));
            })
            .then(function(el) {
                return el.getAttribute('value');
            })
            .then(function(npub) {
                expect(npub).toBe("npub1zutzeysacnf9rru6zqwmxd54mud0k44tst6l70ja5mhv8jjumytsd2x7nu");
            })
            .then(function() {
                return driver.findElement(By.css('#nostr-nsec'));
            })
            .then(function(el) {
                return el.getAttribute('value');
            })
            .then(function(nsec) {
                expect(nsec).toBe("nsec10allq0gjx7fddtzef0ax00mdps9t2kmtrldkyjfs8l5xruwvh2dq0lhhkp");
            })
            // Now check the checkbox to enable Nostr format in table
            .then(function() {
                return driver.findElement(By.css('#showNostrInTable'));
            })
            .then(function(el) {
                return el.click();
            })
            .then(function() {
                return driver.sleep(500);
            })
            // Verify table shows the SAME npub/nsec as individual fields
            .then(function() {
                return driver.findElements(By.css('.pubkey'));
            })
            .then(function(els) {
                expect(els.length).toBeGreaterThan(0);
                return els[0].getText();
            })
            .then(function(tablePubkey) {
                expect(tablePubkey).toBe("npub1zutzeysacnf9rru6zqwmxd54mud0k44tst6l70ja5mhv8jjumytsd2x7nu");
            })
            .then(function() {
                return driver.findElements(By.css('.privkey'));
            })
            .then(function(els) {
                expect(els.length).toBeGreaterThan(0);
                return els[0].getText();
            })
            .then(function(tablePrivkey) {
                expect(tablePrivkey).toBe("nsec10allq0gjx7fddtzef0ax00mdps9t2kmtrldkyjfs8l5xruwvh2dq0lhhkp");
            })
            // Verify hex keys match test vector 2
            .then(function() {
                return driver.findElement(By.css('#nostr-private-key'));
            })
            .then(function(el) {
                return el.getAttribute('value');
            })
            .then(function(privKeyHex) {
                expect(privKeyHex).toBe("7f7ff03d123792d6ac594bfa67bf6d0c0ab55b6b1fdb6249303fe861f1ccba9a");
            })
            .then(function() {
                return driver.findElement(By.css('#nostr-public-key'));
            })
            .then(function(el) {
                return el.getAttribute('value');
            })
            .then(function(pubKeyHex) {
                expect(pubKeyHex).toBe("17162c921dc4d2518f9a101db33695df1afb56ab82f5ff3e5da6eec3ca5cd917");
            })
            .then(done);
    });

    it('Should increment account numbers in table rows', function(done) {
        driver.findElement(By.css('.phrase'))
            .then(function(el) {
                return el.sendKeys("what bleak badge arrange retreat wolf trade produce cricket blur garlic valid proud rude strong choose busy staff weather area salt hollow arm fade");
            })
            // wait for generation
            .then(function() {
                return driver.sleep(1000);
            })
            // select nip06 tab
            .then(function() {
                return driver.findElement(By.css('#nip06-tab a'));
            })
            .then(function(el) {
                return el.click();
            })
            // wait for table to populate
            .then(function() {
                return driver.sleep(500);
            })
            // check that first row shows account 0 path
            .then(function() {
                return driver.findElements(By.css('.index span'));
            })
            .then(function(els) {
                expect(els.length).toBeGreaterThan(1);
                return els[0].getText();
            })
            .then(function(path) {
                expect(path).toBe("m/44'/1237'/0'/0/0");
            })
            // check that second row shows account 1 path
            .then(function() {
                return driver.findElements(By.css('.index span'));
            })
            .then(function(els) {
                return els[1].getText();
            })
            .then(function(path) {
                expect(path).toBe("m/44'/1237'/1'/0/0");
            })
            .then(done);
    });

    it('Should generate correct NIP-06 keys for Vector 1 Account 5', function(done) {
        testNostrKeys(done, {
            phrase: "what bleak badge arrange retreat wolf trade produce cricket blur garlic valid proud rude strong choose busy staff weather area salt hollow arm fade",
            account: 5
        }, {
            privateKeyHex: "6e97b8318eaa298e246c7f596cc721e4d10d2f1c82ac49dda4ceacb1328a91ff",
            publicKeyHex: "a3ea32cba4c9fa581bdadcf2bb963c90aade93b8dadf22f591fa6c0d4f3bb138",
            npub: "npub1504r9jaye8a9sx76mneth93ujz4dayacmt0j9av3lfkq6nemkyuqlpzq0t",
            nsec: "nsec1d6tmsvvw4g5cufrv0avke3epungs6tcus2kynhdye6ktzv52j8lshfgh6n"
        });
    });

    it('Should generate correct NIP-06 keys for Vector 1 Account 10', function(done) {
        testNostrKeys(done, {
            phrase: "what bleak badge arrange retreat wolf trade produce cricket blur garlic valid proud rude strong choose busy staff weather area salt hollow arm fade",
            account: 10
        }, {
            privateKeyHex: "3dfe3230e1a516a55da9e6f416c24086ff4c114e8bbec9d649b82c7013799b96",
            publicKeyHex: "9826feefaff485f9ef22fd7e2e37f878c82843331f2c1b894a22695dbfd64e92",
            npub: "npub1nqn0ama07jzlnmezl4lzudlc0ryzssenrukphz22yf54m07kf6fqpwdznt",
            nsec: "nsec18hlryv8p55t22hdfum6pdsjqsml5cy2w3wlvn4jfhqk8qymenwtqjll2v7"
        });
    });

    it('Should generate correct NIP-06 keys for Vector 1 Account 25', function(done) {
        testNostrKeys(done, {
            phrase: "what bleak badge arrange retreat wolf trade produce cricket blur garlic valid proud rude strong choose busy staff weather area salt hollow arm fade",
            account: 25
        }, {
            privateKeyHex: "fa87254eef1fb06304a7ee0d9e8ddabf7c4a73a9e926eebb0b89f50a22a86b3b",
            publicKeyHex: "a62851a6c681ce6d07b8cd89784fb088c6a783fa21a56be8f42289f3d3a753f2",
            npub: "npub15c59rfkxs88x6pacekyhsnas3rr20ql6yxjkh685y2yl85a820eqazjzfp",
            nsec: "nsec1l2rj2nh0r7cxxp98acxearw6ha7y5uafaynwawct386s5g4gdvasxentdd"
        });
    });

    it('Should generate correct NIP-06 keys for Vector 2 Account 5', function(done) {
        testNostrKeys(done, {
            phrase: "leader monkey parrot ring guide accident before fence cannon height naive bean",
            account: 5
        }, {
            privateKeyHex: "71ac6050f6974298caaccd411e39c43ce684d2b3dfb842cbccdf545c1cbad64e",
            publicKeyHex: "0a53cd729ab4f98af9f4c28a258932a2da85498d7b35416848fc48bb02a6b2cc",
            npub: "npub1pffu6u56knuc4705c29ztzfj5tdg2jvd0v65z6zgl3ytkq4xktxqhfrcyk",
            nsec: "nsec1wxkxq58kjapf3j4ve4q3uwwy8nngf54nm7uy9j7vma29c8966e8q84w62w"
        });
    });

    it('Should generate correct NIP-06 keys for Vector 2 Account 10', function(done) {
        testNostrKeys(done, {
            phrase: "leader monkey parrot ring guide accident before fence cannon height naive bean",
            account: 10
        }, {
            privateKeyHex: "d73b7311304033aa3c03df2d866a15ba7e51df7d9892d08121dbee5b004ae46d",
            publicKeyHex: "a2a0b0eeb2f6e714d7b4d085daf1eb95b1857b48041689e812ab409b3afd6661",
            npub: "npub152stpm4j7mn3f4a56zza4u0tjkcc276gqstgn6qj4dqfkwhavessfyuu7j",
            nsec: "nsec16uahxyfsgqe650qrmukcv6s4hfl9rhmanzfdpqfpm0h9kqz2u3ks4vgcxk"
        });
    });

    it('Should generate correct NIP-06 keys for Vector 2 Account 25', function(done) {
        testNostrKeys(done, {
            phrase: "leader monkey parrot ring guide accident before fence cannon height naive bean",
            account: 25
        }, {
            privateKeyHex: "c309ba6dd483f81a3477c0009c23666ef2e3a9d7704d38335946955da195b26f",
            publicKeyHex: "a72efca429f637fbaf3b015c81ce7e4a13f0087eceb506aac07049f9b6b92723",
            npub: "npub15uh0efpf7cmlhtemq9wgrnn7fgflqzr7e66sd2kqwpylnd4eyu3s0cqcqj",
            nsec: "nsec1cvym5mw5s0up5drhcqqfcgmxdmew82whwpxnsv6eg624mgv4kfhs9qfep4"
        });
    });

    it('Should handle NIP-06 parameters correctly with different accounts', function(done) {
        // Test that different account numbers generate different keys
        driver.findElement(By.css('.phrase'))
            .then(function(el) {
                return el.sendKeys("leader monkey parrot ring guide accident before fence cannon height naive bean");
            })
            // select nip06 tab
            .then(function() {
                return driver.findElement(By.css('#nip06-tab a'));
            })
            .then(function(el) {
                return el.click();
            })
            // set account to 1
            .then(function() {
                return driver.findElement(By.css('#account-nip06'));
            })
            .then(function(el) {
                el.clear();
                el.sendKeys("1");
                return el;
            })
            // wait for calculation
            .then(function() {
                return driver.sleep(500);
            })
            // get the private key for account 1
            .then(function() {
                return driver.findElement(By.css('#nostr-private-key'));
            })
            .then(function(el) {
                return el.getAttribute('value');
            })
            .then(function(account1PrivKey) {
                // Should be different from account 0 private key
                expect(account1PrivKey).not.toBe("7f7ff03d123792d6ac594bfa67bf6d0c0ab55b6b1fdb6249303fe861f1ccba9a");
                expect(account1PrivKey.length).toBe(64); // Should still be valid 32-byte hex
            })
            .then(done);
    });
});
