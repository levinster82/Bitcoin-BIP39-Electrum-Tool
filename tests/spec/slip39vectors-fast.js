// Usage:
// cd /path/to/repo/tests
// jasmine spec/slip39vectors-fast.js
//
// Runs all 45 official SLIP-39 test vectors (tests/vectors/slip39/vectors.json, vendored from
// trezor/python-shamir-mnemonic - see tests/vectors/slip39/README.md) through the actual browser
// UI: mnemonic field -> recovered seed -> BIP32 root key. One shared driver session across every
// vector for speed, mirroring trezorvectors-fast.js's pattern for the BIP39 vectors.
//
// Complements tests/spec/tests-slip39.js, which covers this app's own UI behavior (mode
// switching, the group-config table, tab-switch regression, custom-secret entry) that these
// vectors - pure combine-and-check cases - don't exercise at all.

var browser = process.env.BROWSER;
if (!browser) {
    console.log("Browser can be set via environment variable, eg");
    console.log("BROWSER=firefox jasmine spec/slip39vectors-fast.js");
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

var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var until = webdriver.until;
var Select = webdriver.Select;
var fs = require('fs');
var path = require('path');

var driver;

var vectors = JSON.parse(fs.readFileSync(path.join(__dirname, '../vectors/slip39/vectors.json'), 'utf8'));
console.log(`Loaded ${vectors.length} SLIP-39 test vectors`);

var url = "http://localhost:8000";

async function testSetup() {
    var chrome = require('selenium-webdriver/chrome');
    var firefox = require('selenium-webdriver/firefox');

    if (browser === "chrome") {
        var options = new chrome.Options();
        options.addArguments("--headless=new");
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        driver = new webdriver.Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
    } else {
        var options = new firefox.Options();
        options.addArguments("--headless");
        driver = new webdriver.Builder()
            .forBrowser('firefox')
            .setFirefoxOptions(options)
            .build();
    }

    await driver.get(url);
    await driver.wait(until.elementLocated(By.css("#mnemonic-type")), 10000);

    // Switch to SLIP-39 mode once - stays selected for every vector in this file
    var mnemonicType = await driver.findElement(By.css("#mnemonic-type"));
    await new Select(mnemonicType).selectByValue("slip39");
    await driver.sleep(200);

    // Every valid vector in this set uses passphrase "TREZOR"; harmless for invalid ones too,
    // since checksum/threshold/padding failures are rejected before passphrase decryption applies
    var passphraseField = await driver.findElement(By.css(".passphrase"));
    await passphraseField.clear();
    await passphraseField.sendKeys("TREZOR");
}

async function testTeardown() {
    if (driver) {
        await driver.quit();
    }
}

async function setSlip39Shares(mnemonics) {
    var phraseField = await driver.findElement(By.css(".phrase"));
    await phraseField.clear();
    await driver.sleep(10);
    await phraseField.sendKeys(mnemonics.join("\n"));
    await driver.executeScript("document.querySelector('.phrase').dispatchEvent(new Event('input', { bubbles: true }));");
    await driver.sleep(400);
}

describe("SLIP-39 Official Test Vectors (trezor/python-shamir-mnemonic)", function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;

    beforeAll(async function() {
        await testSetup();
    });

    afterAll(async function() {
        await testTeardown();
    });

    vectors.forEach(function(vector, index) {
        var description = vector[0];
        var mnemonics = vector[1];
        var expectedSecretHex = vector[2];
        var expectedXprv = vector[3];
        var isValidCase = expectedSecretHex.length > 0;

        it(`Vector ${index + 1}: ${description}`, async function() {
            await setSlip39Shares(mnemonics);

            if (isValidCase) {
                var seedField = await driver.findElement(By.css(".seed"));
                var rootKeyField = await driver.findElement(By.css(".root-key"));
                var actualSeed = await seedField.getAttribute("value");
                var actualXprv = await rootKeyField.getAttribute("value");

                expect(actualSeed.toLowerCase()).toBe(expectedSecretHex.toLowerCase());
                expect(actualXprv).toBe(expectedXprv);
            } else {
                var feedback = await driver.findElement(By.css(".feedback"));
                var feedbackVisible = await feedback.isDisplayed();
                expect(feedbackVisible).toBe(true);
            }
        });
    });
});
