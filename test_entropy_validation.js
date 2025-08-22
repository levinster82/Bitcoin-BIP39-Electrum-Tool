// Test script for entropy validation functions
// Run this in browser console to test various scenarios

// Test 1: Perfect random entropy (should pass)
function testGoodEntropy() {
    console.log("=== Testing Good Entropy ===");
    var buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
    
    var validation = validateEntropyQualityForSize(buffer);
    console.log("Validation result:", validation);
    console.log("Valid:", validation.valid);
    console.log("Score:", validation.score.toFixed(1) + "%");
    console.log("Entropy:", validation.entropy.toFixed(3) + "/" + validation.maxEntropy.toFixed(1));
    console.log("Issues:", validation.issues);
    console.log("Chi-square:", validation.chiSquare.toFixed(2));
}

// Test 2: All zeros (should fail)
function testBadEntropyZeros() {
    console.log("\n=== Testing Bad Entropy (All Zeros) ===");
    var buffer = new Uint8Array(32).fill(0);
    
    var validation = validateEntropyQualityForSize(buffer);
    console.log("Validation result:", validation);
    console.log("Valid:", validation.valid);
    console.log("Score:", validation.score.toFixed(1) + "%");
    console.log("Entropy:", validation.entropy.toFixed(3) + "/" + validation.maxEntropy.toFixed(1));
    console.log("Issues:", validation.issues);
}

// Test 3: Repeating pattern (should fail)
function testBadEntropyPattern() {
    console.log("\n=== Testing Bad Entropy (Repeating Pattern) ===");
    var buffer = new Uint8Array(32);
    for (var i = 0; i < 32; i++) {
        buffer[i] = i % 4; // 0,1,2,3,0,1,2,3...
    }
    
    var validation = validateEntropyQualityForSize(buffer);
    console.log("Validation result:", validation);
    console.log("Valid:", validation.valid);
    console.log("Score:", validation.score.toFixed(1) + "%");
    console.log("Entropy:", validation.entropy.toFixed(3) + "/" + validation.maxEntropy.toFixed(1));
    console.log("Issues:", validation.issues);
}

// Test 4: Sequential pattern (should fail)
function testBadEntropySequential() {
    console.log("\n=== Testing Bad Entropy (Sequential) ===");
    var buffer = new Uint8Array(32);
    for (var i = 0; i < 32; i++) {
        buffer[i] = i;
    }
    
    var validation = validateEntropyQualityForSize(buffer);
    console.log("Validation result:", validation);
    console.log("Valid:", validation.valid);
    console.log("Score:", validation.score.toFixed(1) + "%");
    console.log("Entropy:", validation.entropy.toFixed(3) + "/" + validation.maxEntropy.toFixed(1));
    console.log("Issues:", validation.issues);
}

// Test 5: Mixed quality (marginal entropy)
function testMarginalEntropy() {
    console.log("\n=== Testing Marginal Entropy ===");
    var buffer = new Uint8Array(32);
    // Mix of random and some patterns
    crypto.getRandomValues(buffer.subarray(0, 20));
    for (var i = 20; i < 32; i++) {
        buffer[i] = 0xFF; // Too many 0xFF bytes
    }
    
    var validation = validateEntropyQualityForSize(buffer);
    console.log("Validation result:", validation);
    console.log("Valid:", validation.valid);
    console.log("Score:", validation.score.toFixed(1) + "%");
    console.log("Entropy:", validation.entropy.toFixed(3) + "/" + validation.maxEntropy.toFixed(1));
    console.log("Issues:", validation.issues);
}

// Test 6: Different BIP39 entropy sizes
function testDifferentSizes() {
    console.log("\n=== Testing Different BIP39 Entropy Sizes ===");
    var sizes = [
        {bytes: 16, words: 12, bits: 128},
        {bytes: 20, words: 15, bits: 160}, 
        {bytes: 24, words: 18, bits: 192},
        {bytes: 28, words: 21, bits: 224},
        {bytes: 32, words: 24, bits: 256}
    ];
    
    sizes.forEach(function(size) {
        console.log(`\n--- Testing ${size.words} words (${size.bits} bits, ${size.bytes} bytes) ---`);
        var buffer = new Uint8Array(size.bytes);
        crypto.getRandomValues(buffer);
        
        var validation = validateEntropyQualityForSize(buffer);
        console.log(`Max possible entropy: ${validation.maxEntropy.toFixed(3)} bits`);
        console.log(`Actual entropy: ${validation.entropy.toFixed(3)} bits`);
        console.log(`Score: ${validation.score.toFixed(1)}%`);
        console.log(`Valid: ${validation.valid}`);
        if (validation.issues.length > 0) {
            console.log(`Issues: ${validation.issues.join(', ')}`);
        }
    });
}

// Run all tests
function runAllTests() {
    testGoodEntropy();
    testBadEntropyZeros();
    testBadEntropyPattern();
    testBadEntropySequential();
    testMarginalEntropy();
    testDifferentSizes();
    
    console.log("\n=== All tests completed ===");
    console.log("Check the console output above for results");
    console.log("Good entropy should show ✓ marks and high scores");
    console.log("Bad entropy should show ✗ or ⚠ marks and low scores");
}

console.log("Entropy validation test functions loaded!");
console.log("Run: runAllTests() to test all scenarios");
console.log("Or run individual tests: testGoodEntropy(), testBadEntropyZeros(), testDifferentSizes(), etc.");