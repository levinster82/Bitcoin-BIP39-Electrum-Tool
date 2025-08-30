// Console setup
var browser = process.env.BROWSER;

if (!browser) {
    console.log("Browser can be set via environment variable, eg");
    console.log("BROWSER=firefox jasmine spec/debug-trezorvectors-fast.js");
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
var fs = require('fs');
var path = require('path');

var driver;

// Load test vectors
var testVectors;
try {
    var vectorsPath = path.join(__dirname, '../vectors/complete_vectors.json');
    var vectorsData = fs.readFileSync(vectorsPath, 'utf8');
    testVectors = JSON.parse(vectorsData);
    console.log(`Loaded ${testVectors.english.length} test vectors`);
} catch (error) {
    console.error('Failed to load test vectors:', error);
    process.exit(1);
}

async function testSetup() {
    var chrome = require('selenium-webdriver/chrome');
    var firefox = require('selenium-webdriver/firefox');
    
    if (browser === "chrome") {
        var options = new chrome.Options();
        options.addArguments("--headless=new");
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--window-size=1920,1080");
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
    
    // Load the BIP39 tool
    var url = "http://localhost:8000";
    await driver.get(url);
    
    // Wait for page to load
    await driver.wait(until.elementLocated(By.css(".phrase")), 10000);
    
    // Set passphrase to "TREZOR" to match test vectors
    var passphraseField = await driver.findElement(By.css(".passphrase"));
    await passphraseField.clear();
    await passphraseField.sendKeys("TREZOR");
}

async function testTeardown() {
    if (driver) {
        await driver.quit();
    }
}

async function setMnemonic(mnemonic) {
    // Clear any existing state first
    var phraseField = await driver.findElement(By.css(".phrase"));
    await phraseField.clear();
    await driver.sleep(100);
    
    // Set the new mnemonic
    await phraseField.sendKeys(mnemonic);
    
    // Trigger the phrase change event
    await driver.executeScript("document.querySelector('.phrase').dispatchEvent(new Event('input', { bubbles: true }));");
    
    // Wait for processing - optimized timing
    await driver.sleep(500);
}

async function ensureAddressRows(targetIndex) {
    var currentRows = await driver.findElements(By.css("tbody.addresses tr"));
    var targetRowIndex = parseInt(targetIndex) + 1;
    
    if (currentRows.length < targetRowIndex) {
        var startIndex = currentRows.length;
        var rowsNeeded = targetRowIndex - currentRows.length + 10;
        
        var startIndexField = await driver.findElement(By.css(".more-rows-start-index"));
        await startIndexField.clear();
        await startIndexField.sendKeys(startIndex.toString());
        
        var rowsToAddField = await driver.findElement(By.css(".rows-to-add"));
        await rowsToAddField.clear();
        await rowsToAddField.sendKeys(rowsNeeded.toString());
        
        // Scroll more button into view and click
        var moreButton = await driver.findElement(By.css("button.more"));
        await driver.executeScript("arguments[0].scrollIntoView({behavior: 'instant', block: 'nearest'});", moreButton);
        await driver.sleep(100);
        await moreButton.click();
        
        await driver.sleep(100); // Faster row generation
    }
}

async function switchToTab(tabSelector) {
    var tab = await driver.findElement(By.css(tabSelector));
    await driver.executeScript("arguments[0].scrollIntoView({behavior: 'instant', block: 'nearest'});", tab);
    await driver.sleep(100);
    await tab.click();
    await driver.sleep(100);
}

async function setAccountAndChange(accountField, changeField, changeValue) {
    var accountFieldElement = await driver.findElement(By.css(accountField));
    await accountFieldElement.clear();
    await accountFieldElement.sendKeys("0");
    
    var changeFieldElement = await driver.findElement(By.css(changeField));
    await changeFieldElement.clear();
    await changeFieldElement.sendKeys(changeValue.toString());
    
    await driver.sleep(100);
}

async function getAddressAtIndex(addressIndex) {
    var addressSelector = `tbody.addresses tr:nth-child(${parseInt(addressIndex) + 1}) td:nth-child(2)`;
    var addressElement = await driver.findElement(By.css(addressSelector));
    return await addressElement.getText();
}

async function getAllAddressesForTab(tabSelector, accountField, changeField) {
    // Switch to tab
    await switchToTab(tabSelector);
    
    // Get receive addresses (change = 0)
    await setAccountAndChange(accountField, changeField, 0);
    await driver.sleep(100);
    
    // Ensure we have enough rows for index 58 AFTER setting fields
    await ensureAddressRows(58);
    
    var address0 = await getAddressAtIndex(0);
    var address58 = await getAddressAtIndex(58);
    
    // Get change addresses (change = 1)
    await setAccountAndChange(accountField, changeField, 1);
    await driver.sleep(100);
    
    // Ensure rows again after changing to change addresses
    await ensureAddressRows(58);
    
    var changeAddress0 = await getAddressAtIndex(0);
    var changeAddress58 = await getAddressAtIndex(58);
    
    return {
        address_0: address0,
        address_58: address58,
        change_address_0: changeAddress0,
        change_address_58: changeAddress58
    };
}

function checkAssertion(description, actual, expected) {
    var passed = actual === expected;
    var status = passed ? "✓ PASS" : "✗ FAIL";
    console.log(`   ${description}: ${status}`);
    if (!passed) {
        console.log(`     Expected: ${expected}`);
        console.log(`     Actual:   ${actual}`);
    }
    return passed;
}

// Test Suite - Debug Version with Detailed Assertions
describe("Trezor BIP39 Vector Tests (Debug - Fast)", function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;
    
    beforeAll(async function() {
        await testSetup();
    });
    
    afterAll(async function() {
        await testTeardown();
    });
    
    // Test all vectors for each language
    Object.keys(testVectors).filter(lang => lang !== 'russian' && lang !== 'turkish').forEach(function(language) {
        describe(`${language} language tests`, function() {
            
            testVectors[language].forEach(function(vector, index) {
                
                it(`Vector ${index + 1}: All 15 tests for ${vector.mnemonic_phrase_space_separated.substring(0, 30)}...`, async function() {
                    console.log(`\nTesting ${language} vector ${index + 1}: ${vector.mnemonic_phrase_space_separated.substring(0, 50)}...`);
                    
                    // Set mnemonic
                    await setMnemonic(vector.mnemonic_phrase_space_separated);
                    
                    console.log("\n1. Testing basic generation...");
                    
                    // Get basic BIP39 data
                    var seedField = await driver.findElement(By.css(".seed"));
                    var rootKeyField = await driver.findElement(By.css(".root-key"));
                    var fingerprintField = await driver.findElement(By.css(".fingerprint"));
                    
                    var actualSeed = await seedField.getAttribute("value");
                    var actualXprv = await rootKeyField.getAttribute("value");
                    var actualFingerprint = await fingerprintField.getAttribute("value");
                    
                    // Test BIP39 basics (3 tests)
                    checkAssertion("Seed", actualSeed.toLowerCase(), vector.seed_hex_512_bits.toLowerCase());
                    expect(actualSeed.toLowerCase()).toBe(vector.seed_hex_512_bits.toLowerCase());
                    
                    checkAssertion("Master Key", actualXprv, vector.master_extended_private_key_xprv);
                    expect(actualXprv).toBe(vector.master_extended_private_key_xprv);
                    
                    checkAssertion("Fingerprint", actualFingerprint, vector.master_fingerprint_xfp);
                    expect(actualFingerprint).toBe(vector.master_fingerprint_xfp);
                    
                    console.log("\n2. Testing address generation...");
                    
                    // Test BIP44 addresses
                    console.log("  Testing BIP44...");
                    var bip44Addresses = await getAllAddressesForTab('#bip44-tab a', "#account-bip44", "#change-bip44");
                    var account0_bip44 = vector.derivations.bip44.account_0;
                    
                    checkAssertion("BIP44 Address 0/0", bip44Addresses.address_0, account0_bip44.address_0);
                    expect(bip44Addresses.address_0).toBe(account0_bip44.address_0);
                    
                    checkAssertion("BIP44 Address 0/58", bip44Addresses.address_58, account0_bip44.address_58);
                    expect(bip44Addresses.address_58).toBe(account0_bip44.address_58);
                    
                    checkAssertion("BIP44 Change Address 1/0", bip44Addresses.change_address_0, account0_bip44.change_address_0);
                    expect(bip44Addresses.change_address_0).toBe(account0_bip44.change_address_0);
                    
                    checkAssertion("BIP44 Change Address 1/58", bip44Addresses.change_address_58, account0_bip44.change_address_58);
                    expect(bip44Addresses.change_address_58).toBe(account0_bip44.change_address_58);
                    
                    // Test BIP84 addresses
                    console.log("  Testing BIP84...");
                    var bip84Addresses = await getAllAddressesForTab('#bip84-tab a', "#account-bip84", "#change-bip84");
                    var account0_bip84 = vector.derivations.bip84.account_0;
                    
                    checkAssertion("BIP84 Address 0/0", bip84Addresses.address_0, account0_bip84.address_0);
                    expect(bip84Addresses.address_0).toBe(account0_bip84.address_0);
                    
                    checkAssertion("BIP84 Address 0/58", bip84Addresses.address_58, account0_bip84.address_58);
                    expect(bip84Addresses.address_58).toBe(account0_bip84.address_58);
                    
                    checkAssertion("BIP84 Change Address 1/0", bip84Addresses.change_address_0, account0_bip84.change_address_0);
                    expect(bip84Addresses.change_address_0).toBe(account0_bip84.change_address_0);
                    
                    checkAssertion("BIP84 Change Address 1/58", bip84Addresses.change_address_58, account0_bip84.change_address_58);
                    expect(bip84Addresses.change_address_58).toBe(account0_bip84.change_address_58);
                    
                    // Test BIP86 addresses
                    console.log("  Testing BIP86...");
                    var bip86Addresses = await getAllAddressesForTab('#bip86-tab a', "#account-bip86", "#change-bip86");
                    var account0_bip86 = vector.derivations.bip86.account_0;
                    
                    checkAssertion("BIP86 Address 0/0", bip86Addresses.address_0, account0_bip86.address_0);
                    expect(bip86Addresses.address_0).toBe(account0_bip86.address_0);
                    
                    checkAssertion("BIP86 Address 0/58", bip86Addresses.address_58, account0_bip86.address_58);
                    expect(bip86Addresses.address_58).toBe(account0_bip86.address_58);
                    
                    checkAssertion("BIP86 Change Address 1/0", bip86Addresses.change_address_0, account0_bip86.change_address_0);
                    expect(bip86Addresses.change_address_0).toBe(account0_bip86.change_address_0);
                    
                    checkAssertion("BIP86 Change Address 1/58", bip86Addresses.change_address_58, account0_bip86.change_address_58);
                    expect(bip86Addresses.change_address_58).toBe(account0_bip86.change_address_58);
                    
                    console.log(`   Vector ${index + 1} Summary: All 15 tests completed`);
                });
            });
            
        });
    });
    
});