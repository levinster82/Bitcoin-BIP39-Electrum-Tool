// SeedQR Test Suite
// Tests both Standard and Compact SeedQR formats against official test vectors
//
// Usage:
// cd /path/to/repo/tests
// jasmine spec/tests-seedqr.js
//
// Dependencies:
// nodejs, selenium, jasmine, jimp (for QR code reading)
//
// Install QR code reading dependency:
// npm install jimp jsqr

// USER SPECIFIED OPTIONS
var browser = process.env.BROWSER;
if (!browser) {
    console.log("Browser can be set via environment variable, eg");
    console.log("BROWSER=firefox jasmine spec/tests-seedqr.js");
    console.log("Options for BROWSER are firefox chrome");
    console.log("Using default browser: chrome");
    browser = "chrome";
}
else if (browser !== 'chrome' && browser !== 'firefox') {
    throw `Unsupported browser: "${browser}", must be "chrome" or "firefox"`;
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

// QR code reading dependencies
var Jimp = require('jimp');
var jsQR = require('jsqr');

var newDriver = null;
var driver = null;

// Delays in ms
var generateDelay = 500;
var feedbackDelay = 200;
var qrGenerationDelay = 300;

// Use localhost server for all browsers
var url = "http://localhost:8000";

// Load test vectors
var testVectorsPath = path.join(__dirname, '../vectors/seedqr/seedqr_test_vectors.json');
var testVectors = JSON.parse(fs.readFileSync(testVectorsPath, 'utf8'));

// Browser-specific setup
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
        return new webdriver.Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
    }
}

// Helper Functions

function clearField(selector, done) {
    driver.findElement(By.css(selector))
        .then(function(field) {
            field.clear();
            field.sendKeys("");
            if (done) {
                done();
            }
        });
}

function sendKeysToId(text, id) {
    return driver.findElement(By.id(id))
        .then(function(el) {
            return el.sendKeys(text);
        });
}

function sendKeysToSelector(text, selector) {
    return driver.findElement(By.css(selector))
        .then(function(el) {
            return el.sendKeys(text);
        });
}

function clickSelector(selector) {
    return driver.findElement(By.css(selector))
        .then(function(el) {
            // Use JavaScript click directly for better reliability and speed
            return driver.executeScript('arguments[0].click();', el);
        });
}

function selectOption(selector, value) {
    return driver.findElement(By.css(selector))
        .then(function(selectElement) {
            return driver.executeScript(
                'arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event("change"));',
                selectElement,
                value
            );
        });
}

function hoverElement(selector) {
    return driver.findElement(By.css(selector))
        .then(function(el) {
            return driver.actions().move({origin: el}).perform();
        });
}

function waitForQrCode() {
    return driver.wait(until.elementLocated(By.css('.qr-container canvas')), 5000);
}

function captureQrCode() {
    return driver.findElement(By.css('.qr-container canvas'))
        .then(function(canvas) {
            // Execute script to get canvas data as base64
            return driver.executeScript('return arguments[0].toDataURL("image/png");', canvas);
        })
        .then(function(dataUrl) {
            // Extract base64 data from data URL
            var base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
            return Buffer.from(base64Data, 'base64');
        });
}

function readQrCode(imageBuffer) {
    return new Promise(function(resolve, reject) {
        Jimp.read(imageBuffer)
            .then(function(image) {
                // Convert image to RGBA format that jsQR expects
                var imageData = {
                    data: new Uint8ClampedArray(image.bitmap.data),
                    width: image.bitmap.width,
                    height: image.bitmap.height
                };

                var result = jsQR(imageData.data, imageData.width, imageData.height);

                if (result) {
                    resolve(result);
                } else {
                    reject(new Error('No QR code found'));
                }
            })
            .catch(reject);
    });
}

function compareQrData(actualQrResult, expectedData, format) {
    if (format === 'standard') {
        // For standard format, compare as numeric string
        return actualQrResult.data === expectedData.numeric;
    } else if (format === 'compact') {
        // For compact format, use direct binary data from jsQR
        if (!actualQrResult.binaryData) {
            console.log("No binary data found in jsQR result");
            return false;
        }

        // Convert jsQR binary data to hex using simple array methods
        var actualHex = Array.from(actualQrResult.binaryData)
            .map(function(b) { return b.toString(16).padStart(2, '0'); })
            .join('').toUpperCase();

        return actualHex === expectedData.hex;
    }
    return false;
}

// Test Setup and Teardown

beforeEach(function(done) {
    driver = newDriver();
    driver.get(url)
        .then(function() {
            done();
        });
});

afterEach(function(done) {
    driver.quit()
        .then(function() {
            done();
        });
});

// Test Suite

describe("SeedQR Test Suite", function() {

    testVectors.test_vectors.forEach(function(vector) {

        describe("Test Vector " + vector.id + " (" + vector.word_count + "-word)", function() {

            it("should generate correct Standard SeedQR", function(done) {
                // 1. Ensure BIP39 mnemonic type is selected
                selectOption('#mnemonic-type', 'bip39')
                    .then(function() {
                        return driver.sleep(feedbackDelay);
                    })
                    // 2. Press clear all button
                    .then(function() {
                        return clickSelector('#clearAll');
                    })
                    .then(function() {
                        return driver.sleep(feedbackDelay);
                    })
                    // 3. Enter mnemonic from vector file
                    .then(function() {
                        return sendKeysToSelector(vector.seed_phrase, '#phrase');
                    })
                    .then(function() {
                        return driver.sleep(generateDelay);
                    })
                    // 4. Select SeedQR Standard format
                    .then(function() {
                        return selectOption('#qr-type', 'seedqr-standard');
                    })
                    .then(function() {
                        return driver.sleep(feedbackDelay);
                    })
                    // 5. Hover over mnemonic field to display QR code
                    .then(function() {
                        return hoverElement('#phrase');
                    })
                    .then(function() {
                        return driver.sleep(qrGenerationDelay);
                    })
                    // 6. Wait for QR code to appear
                    .then(function() {
                        return waitForQrCode();
                    })
                    // 7. Capture and read QR code
                    .then(function() {
                        return captureQrCode();
                    })
                    .then(function(imageBuffer) {
                        return readQrCode(imageBuffer);
                    })
                    // 8. Verify against test vector
                    .then(function(qrResult) {
                        var isValid = compareQrData(qrResult, vector.standard_seedqr, 'standard');
                        expect(isValid).toBe(true);

                        if (!isValid) {
                            console.log("Standard SeedQR mismatch for vector " + vector.id);
                            console.log("Expected:", vector.standard_seedqr.numeric);
                            console.log("Actual:  ", qrResult.data);
                        }

                        done();
                    })
                    .catch(function(error) {
                        console.error("Standard SeedQR test failed for vector " + vector.id + ":", error);
                        done.fail(error);
                    });
            }, 60000); // 60 second timeout

            // Only test compact format if vector has compact data
            if (vector.compact_seedqr && vector.compact_seedqr.bitstream) {

                it("should generate correct Compact SeedQR", function(done) {
                    // 1. Ensure BIP39 mnemonic type is selected
                    selectOption('#mnemonic-type', 'bip39')
                        .then(function() {
                            return driver.sleep(feedbackDelay);
                        })
                        // 2. Press clear all button
                        .then(function() {
                            return clickSelector('#clearAll');
                        })
                        .then(function() {
                            return driver.sleep(feedbackDelay);
                        })
                        // 3. Enter mnemonic from vector file
                        .then(function() {
                            return sendKeysToSelector(vector.seed_phrase, '#phrase');
                        })
                        .then(function() {
                            return driver.sleep(generateDelay);
                        })
                        // 4. Select SeedQR Compact format
                        .then(function() {
                            return selectOption('#qr-type', 'seedqr-compact');
                        })
                        .then(function() {
                            return driver.sleep(feedbackDelay);
                        })
                        // 5. Hover over mnemonic field to display QR code
                        .then(function() {
                            return hoverElement('#phrase');
                        })
                        .then(function() {
                            return driver.sleep(qrGenerationDelay);
                        })
                        // 6. Wait for QR code to appear
                        .then(function() {
                            return waitForQrCode();
                        })
                        // 7. Capture and read QR code
                        .then(function() {
                            return captureQrCode();
                        })
                        .then(function(imageBuffer) {
                            return readQrCode(imageBuffer);
                        })
                        // 8. Verify against test vector
                        .then(function(qrResult) {
                            var isValid = compareQrData(qrResult, vector.compact_seedqr, 'compact');
                            expect(isValid).toBe(true);

                            if (!isValid) {
                                console.log("Compact SeedQR mismatch for vector " + vector.id);
                                console.log("Expected hex:", vector.compact_seedqr.hex);
                                console.log("Expected bitstream:", vector.compact_seedqr.bitstream);
                                console.log("Actual result:", qrResult);

                                if (qrResult.binaryData) {
                                    var actualHex = Buffer.from(qrResult.binaryData).toString('hex').toUpperCase();
                                    console.log("Actual hex:", actualHex);
                                } else {
                                    console.log("No binary data found in QR result");
                                }
                            }

                            done();
                        })
                        .catch(function(error) {
                            console.error("Compact SeedQR test failed for vector " + vector.id + ":", error);
                            // Add a small delay before failing to prevent resource conflicts
                            return driver.sleep(1000).then(function() {
                                done.fail(error);
                            }).catch(function() {
                                done.fail(error);
                            });
                        });
                }, 60000); // 60 second timeout

            }

        });

    });

});

console.log("SeedQR Test Suite initialized with " + testVectors.test_vectors.length + " test vectors");