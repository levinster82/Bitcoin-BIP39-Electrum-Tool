// Console setup
var browser = process.env.BROWSER;

if (!browser) {
    console.log("Browser can be set via environment variable, eg");
    console.log("BROWSER=firefox jasmine spec/trezorvectors.js");
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
    var phraseField = await driver.findElement(By.css(".phrase"));
    await phraseField.clear();
    await phraseField.sendKeys(mnemonic);
    
    // Trigger the phrase change event
    await driver.executeScript("document.querySelector('.phrase').dispatchEvent(new Event('input', { bubbles: true }));");
    
    // Wait for processing
    await driver.sleep(1000);
}

async function getSeedHex() {
    var seedField = await driver.findElement(By.css(".seed"));
    return await seedField.getAttribute("value");
}

async function getMasterPrivateKey() {
    var rootKeyField = await driver.findElement(By.css(".root-key"));
    return await rootKeyField.getAttribute("value");
}

async function getMasterFingerprint() {
    var fingerprintField = await driver.findElement(By.css(".fingerprint"));
    return await fingerprintField.getAttribute("value");
}

async function getAddressAtPath(derivationPath, addressType = "p2pkh") {
    // Parse derivation path like "m/44'/0'/0'/0/0" to extract components
    var pathParts = derivationPath.replace("m/", "").split("/");
    var purpose = pathParts[0].replace("'", "");
    var coin = pathParts[1].replace("'", "");
    var account = pathParts[2].replace("'", "");
    var change = pathParts[3];
    var addressIndex = pathParts[4];
    
    // Switch to appropriate tab and set the account/change values
    switch (addressType) {
        case "p2pkh":
            // Explicitly switch to BIP44 tab with scroll-into-view
            var bip44Tab = await driver.findElement(By.css('#bip44-tab a'));
            await driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", bip44Tab);
            await driver.sleep(500);
            await bip44Tab.click();
            await driver.sleep(500);
            
            var accountField = await driver.findElement(By.css("#account-bip44"));
            await accountField.clear();
            await accountField.sendKeys(account);
            
            var changeField = await driver.findElement(By.css("#change-bip44"));
            await changeField.clear();
            await changeField.sendKeys(change);
            break;
        case "p2wpkh":
            // Switch to BIP84 tab first with scroll-into-view
            var bip84Tab = await driver.findElement(By.css('#bip84-tab a'));
            await driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", bip84Tab);
            await driver.sleep(500);
            await bip84Tab.click();
            await driver.sleep(500);
            
            var bip84AccountField = await driver.findElement(By.css("#account-bip84"));
            await bip84AccountField.clear();
            await bip84AccountField.sendKeys(account);
            
            var bip84ChangeField = await driver.findElement(By.css("#change-bip84"));
            await bip84ChangeField.clear();
            await bip84ChangeField.sendKeys(change);
            break;
        case "p2tr":
            // Switch to BIP86 tab first with scroll-into-view
            var bip86Tab = await driver.findElement(By.css('#bip86-tab a'));
            await driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", bip86Tab);
            await driver.sleep(500);
            await bip86Tab.click();
            await driver.sleep(500);
            
            var bip86AccountField = await driver.findElement(By.css("#account-bip86"));
            await bip86AccountField.clear();
            await bip86AccountField.sendKeys(account);
            
            var bip86ChangeField = await driver.findElement(By.css("#change-bip86"));
            await bip86ChangeField.clear();
            await bip86ChangeField.sendKeys(change);
            break;
        default:
            throw new Error(`Unsupported address type: ${addressType}`);
    }
    
    // Wait for derivation calculation
    await driver.sleep(1000);
    
    // Check if we need to generate more rows for higher address indices
    var targetRowIndex = parseInt(addressIndex) + 1; // 1-based for nth-child
    var currentRows = await driver.findElements(By.css("tbody.addresses tr"));
    
    if (currentRows.length < targetRowIndex) {
        // Need to generate more addresses starting from current count
        var startIndex = currentRows.length;
        var rowsNeeded = targetRowIndex - currentRows.length + 10; // Add extra buffer
        
        // Set the starting index
        var startIndexField = await driver.findElement(By.css(".more-rows-start-index"));
        await startIndexField.clear();
        await startIndexField.sendKeys(startIndex.toString());
        
        // Set number of rows to add
        var rowsToAddField = await driver.findElement(By.css(".rows-to-add"));
        await rowsToAddField.clear();
        await rowsToAddField.sendKeys(rowsNeeded.toString());
        
        // Scroll more button into view and click with enhanced reliability
        var moreButton = await driver.findElement(By.css("button.more"));
        
        // Double-check the button is scrolled properly into view
        await driver.executeScript("arguments[0].scrollIntoView({behavior: 'auto', block: 'start'});", moreButton);
        await driver.sleep(500);
        
        // Verify button is now in viewport before clicking
        var inViewport = await driver.executeScript(`
            var elem = arguments[0];
            var rect = elem.getBoundingClientRect();
            return rect.top >= 0 && rect.top < window.innerHeight - 50; // 50px buffer
        `, moreButton);
        
        if (!inViewport) {
            // If still not properly positioned, try alternative scroll
            await driver.executeScript(`
                var elem = arguments[0];
                var rect = elem.getBoundingClientRect();
                window.scrollTo(0, window.scrollY + rect.top - 100);
            `, moreButton);
            await driver.sleep(500);
        }
        
        await moreButton.click();
        
        // Wait for the new rows to be generated
        await driver.sleep(2000);
    }
    
    // Get the address at the specified index from the addresses table
    // Address index starts from 0, so we need to find the right row
    // Column 2 contains the addresses, column 3 contains public keys
    var addressSelector = `tbody.addresses tr:nth-child(${parseInt(addressIndex) + 1}) td:nth-child(2)`;
    var addressElement = await driver.findElement(By.css(addressSelector));
    return await addressElement.getText();
}

// Test Suite
describe("Trezor BIP39 Vector Tests", function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000; // 60 second timeout
    
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
                describe(`Vector ${index + 1}`, function() {
                    
                    it(`should generate correct seed`, async function() {
                        console.log(`Testing ${language} vector ${index + 1}: ${vector.mnemonic_phrase_space_separated.substring(0, 50)}...`);
                        
                        await setMnemonic(vector.mnemonic_phrase_space_separated);
                        
                        var actualSeed = await getSeedHex();
                        expect(actualSeed.toLowerCase()).toBe(vector.seed_hex_512_bits.toLowerCase());
                    });
                    
                    it(`should generate correct master private key`, async function() {
                        await setMnemonic(vector.mnemonic_phrase_space_separated);
                        
                        var actualXprv = await getMasterPrivateKey();
                        expect(actualXprv).toBe(vector.master_extended_private_key_xprv);
                    });
                    
                    it(`should generate correct master fingerprint`, async function() {
                        await setMnemonic(vector.mnemonic_phrase_space_separated);
                        
                        var actualFingerprint = await getMasterFingerprint();
                        expect(actualFingerprint).toBe(vector.master_fingerprint_xfp);
                    });
                    
                    it(`should generate correct BIP44 address at m/44'/0'/0'/0/0`, async function() {
                        await setMnemonic(vector.mnemonic_phrase_space_separated);
                        
                        var account0 = vector.derivations.bip44.account_0;
                        var address0 = await getAddressAtPath("m/44'/0'/0'/0/0", "p2pkh");
                        expect(address0).toBe(account0.address_0);
                    });
                    
                    it(`should generate correct BIP44 change address at m/44'/0'/0'/1/0`, async function() {
                        await setMnemonic(vector.mnemonic_phrase_space_separated);
                        
                        var account0 = vector.derivations.bip44.account_0;
                        var changeAddress0 = await getAddressAtPath("m/44'/0'/0'/1/0", "p2pkh");
                        expect(changeAddress0).toBe(account0.change_address_0);
                    });
                    
                    it(`should generate correct BIP44 address at m/44'/0'/0'/0/58`, async function() {
                        await setMnemonic(vector.mnemonic_phrase_space_separated);
                        
                        var account0 = vector.derivations.bip44.account_0;
                        var address58 = await getAddressAtPath("m/44'/0'/0'/0/58", "p2pkh");
                        expect(address58).toBe(account0.address_58);
                    });
                    
                    it(`should generate correct BIP44 change address at m/44'/0'/0'/1/58`, async function() {
                        await setMnemonic(vector.mnemonic_phrase_space_separated);
                        
                        var account0 = vector.derivations.bip44.account_0;
                        var changeAddress58 = await getAddressAtPath("m/44'/0'/0'/1/58", "p2pkh");
                        expect(changeAddress58).toBe(account0.change_address_58);
                    });
                    
                    it(`should generate correct BIP84 address at m/84'/0'/0'/0/0`, async function() {
                        await setMnemonic(vector.mnemonic_phrase_space_separated);
                        
                        var account0 = vector.derivations.bip84.account_0;
                        var address0 = await getAddressAtPath("m/84'/0'/0'/0/0", "p2wpkh");
                        expect(address0).toBe(account0.address_0);
                    });
                    
                    it(`should generate correct BIP84 change address at m/84'/0'/0'/1/0`, async function() {
                        await setMnemonic(vector.mnemonic_phrase_space_separated);
                        
                        var account0 = vector.derivations.bip84.account_0;
                        var changeAddress0 = await getAddressAtPath("m/84'/0'/0'/1/0", "p2wpkh");
                        expect(changeAddress0).toBe(account0.change_address_0);
                    });
                    
                    it(`should generate correct BIP84 address at m/84'/0'/0'/0/58`, async function() {
                        await setMnemonic(vector.mnemonic_phrase_space_separated);
                        
                        var account0 = vector.derivations.bip84.account_0;
                        var address58 = await getAddressAtPath("m/84'/0'/0'/0/58", "p2wpkh");
                        expect(address58).toBe(account0.address_58);
                    });
                    
                    it(`should generate correct BIP84 change address at m/84'/0'/0'/1/58`, async function() {
                        await setMnemonic(vector.mnemonic_phrase_space_separated);
                        
                        var account0 = vector.derivations.bip84.account_0;
                        var changeAddress58 = await getAddressAtPath("m/84'/0'/0'/1/58", "p2wpkh");
                        expect(changeAddress58).toBe(account0.change_address_58);
                    });
                    
                    it(`should generate correct BIP86 address at m/86'/0'/0'/0/0`, async function() {
                        await setMnemonic(vector.mnemonic_phrase_space_separated);
                        
                        var account0 = vector.derivations.bip86.account_0;
                        var address0 = await getAddressAtPath("m/86'/0'/0'/0/0", "p2tr");
                        expect(address0).toBe(account0.address_0);
                    });
                    
                    it(`should generate correct BIP86 change address at m/86'/0'/0'/1/0`, async function() {
                        await setMnemonic(vector.mnemonic_phrase_space_separated);
                        
                        var account0 = vector.derivations.bip86.account_0;
                        var changeAddress0 = await getAddressAtPath("m/86'/0'/0'/1/0", "p2tr");
                        expect(changeAddress0).toBe(account0.change_address_0);
                    });
                    
                    it(`should generate correct BIP86 address at m/86'/0'/0'/0/58`, async function() {
                        await setMnemonic(vector.mnemonic_phrase_space_separated);
                        
                        var account0 = vector.derivations.bip86.account_0;
                        var address58 = await getAddressAtPath("m/86'/0'/0'/0/58", "p2tr");
                        expect(address58).toBe(account0.address_58);
                    });
                    
                    it(`should generate correct BIP86 change address at m/86'/0'/0'/1/58`, async function() {
                        await setMnemonic(vector.mnemonic_phrase_space_separated);
                        
                        var account0 = vector.derivations.bip86.account_0;
                        var changeAddress58 = await getAddressAtPath("m/86'/0'/0'/1/58", "p2tr");
                        expect(changeAddress58).toBe(account0.change_address_58);
                    });
                    
                });
            });
            
        });
    });
    
});