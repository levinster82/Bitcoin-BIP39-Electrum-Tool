(function() {

    // mnemonics is populated as required by getLanguage
    var mnemonics = { "english": new Mnemonic("english") };
    var mnemonic = mnemonics["english"];
    var seed = null;
    var bip32RootKey = null;
    var bip32ExtendedKey = null;
    var network = bitcoinjs.bitcoin.networks.bitcoin;
    var addressRowTemplate = $("#address-row-template");

    var showIndex = true;
    var showAddress = true;
    var showPubKey = true;
    var showPrivKey = true;
    var showQr = false;
    
    var entropyTypeAutoDetect = true;
    var entropyChangeTimeoutEvent = null;
    var phraseChangeTimeoutEvent = null;
    var seedChangedTimeoutEvent = null;
    var rootKeyChangedTimeoutEvent = null;

    var generationProcesses = [];

    var DOM = {};
    DOM.privacyScreenToggle = $(".privacy-screen-toggle");
    DOM.network = $(".network");
    DOM.bip32Client = $("#bip32-client");
    DOM.phraseNetwork = $("#network-phrase");
    DOM.useEntropy = $(".use-entropy");
    DOM.entropyContainer = $(".entropy-container");
    DOM.entropy = $(".entropy");
    DOM.entropyFiltered = DOM.entropyContainer.find(".filtered");
    DOM.entropyType = DOM.entropyContainer.find(".type");
    DOM.entropyTypeInputs = DOM.entropyContainer.find("input[name='entropy-type']");
    DOM.entropyCrackTime = DOM.entropyContainer.find(".crack-time");
    DOM.entropyEventCount = DOM.entropyContainer.find(".event-count");
    DOM.entropyBits = DOM.entropyContainer.find(".bits");
    DOM.entropyBitsPerEvent = DOM.entropyContainer.find(".bits-per-event");
    DOM.entropyWordCount = DOM.entropyContainer.find(".word-count");
    DOM.entropyBinary = DOM.entropyContainer.find(".binary");
    DOM.entropyWordIndexes = DOM.entropyContainer.find(".word-indexes");
    DOM.entropyChecksum = DOM.entropyContainer.find(".checksum");
    DOM.entropyMnemonicLength = DOM.entropyContainer.find(".mnemonic-length");
    DOM.pbkdf2Rounds = DOM.entropyContainer.find(".pbkdf2-rounds");
    DOM.pbkdf2CustomInput = DOM.entropyContainer.find("#pbkdf2-custom-input");
    DOM.pbkdf2InfosDanger = $(".PBKDF2-infos-danger");
    DOM.entropyWeakEntropyOverrideWarning = DOM.entropyContainer.find(".weak-entropy-override-warning");
    DOM.entropyFilterWarning = DOM.entropyContainer.find(".filter-warning");
    DOM.phrase = $(".phrase");
    DOM.mnemonicType = $(".mnemonic-type");
    DOM.mnemonicLabel = $(".mnemonic-label");
    DOM.seedLabel = $("label[for='seed']");
    DOM.passphraseLabel = $("label[for='passphrase']");
    DOM.electrumTabs = $(".electrum-tab");
    DOM.electrumTabPanels = $(".electrum-tab-panel");
    DOM.electrumLegacyTab = $("#electrum-legacy-tab");
    DOM.electrumSegwitTab = $("#electrum-segwit-tab");
    DOM.electrumLegacyAccountXpub = $("#account-xpub-electrum-legacy");
    DOM.electrumSegwitAccountXpub = $("#account-xpub-electrum-segwit");
    DOM.electrumLegacyPath = $("#electrum-legacy-path");
    DOM.electrumSegwitPath = $("#electrum-segwit-path");
    DOM.electrumLegacyChange = $(".electrum-legacy-change");
    DOM.electrumSegwitChange = $(".electrum-segwit-change");
    DOM.autoCompute = $(".autoCompute");
    DOM.splitMnemonic = $(".splitMnemonic");
    DOM.showSplitMnemonic = $(".showSplitMnemonic");
    DOM.phraseSplit = $(".phraseSplit");
    DOM.phraseSplitWarn = $(".phraseSplitWarn");
    DOM.passphrase = $(".passphrase");
    DOM.generateContainer = $(".generate-container");
    DOM.generate = $(".generate");
    DOM.seed = $(".seed");
    DOM.rootKey = $(".root-key");
    DOM.fingerprint = $(".fingerprint");
    DOM.extendedPrivKey = $(".extended-priv-key");
    DOM.extendedPubKey = $(".extended-pub-key");
    DOM.bip32tab = $("#bip32-tab");
    DOM.bip44tab = $("#bip44-tab");
    DOM.bip49tab = $("#bip49-tab");
    DOM.bip84tab = $("#bip84-tab");
    DOM.bip141tab = $("#bip141-tab");
    DOM.bip32panel = $("#bip32");
    DOM.bip44panel = $("#bip44");
    DOM.bip49panel = $("#bip49");
    DOM.bip32path = $("#bip32-path");
    DOM.bip44path = $("#bip44-path");
    DOM.bip44purpose = $("#bip44 .purpose");
    DOM.bip44coin = $("#bip44 .coin");
    DOM.bip44account = $("#bip44 .account");
    DOM.bip44accountXprv = $("#bip44 .account-xprv");
    DOM.bip44accountXpub = $("#bip44 .account-xpub");
    DOM.bip44change = $("#bip44 .change");
    DOM.bip49unavailable = $("#bip49 .unavailable");
    DOM.bip49available = $("#bip49 .available");
    DOM.bip49path = $("#bip49-path");
    DOM.bip49purpose = $("#bip49 .purpose");
    DOM.bip49coin = $("#bip49 .coin");
    DOM.bip49account = $("#bip49 .account");
    DOM.bip49accountXprv = $("#bip49 .account-xprv");
    DOM.bip49accountXpub = $("#bip49 .account-xpub");
    DOM.bip49change = $("#bip49 .change");
    DOM.bip84unavailable = $("#bip84 .unavailable");
    DOM.bip84available = $("#bip84 .available");
    DOM.bip84path = $("#bip84-path");
    DOM.bip84purpose = $("#bip84 .purpose");
    DOM.bip84coin = $("#bip84 .coin");
    DOM.bip84account = $("#bip84 .account");
    DOM.bip84accountXprv = $("#bip84 .account-xprv");
    DOM.bip84accountXpub = $("#bip84 .account-xpub");
    DOM.bip84change = $("#bip84 .change");
    DOM.bip86tab = $("#bip86-tab");
    DOM.bip86unavailable = $("#bip86 .unavailable");
    DOM.bip86available = $("#bip86 .available");
    DOM.bip86path = $("#bip86-path");
    DOM.bip86purpose = $("#bip86 .purpose");
    DOM.bip86coin = $("#bip86 .coin");
    DOM.bip86account = $("#bip86 .account");
    DOM.bip86accountXprv = $("#bip86 .account-xprv");
    DOM.bip86accountXpub = $("#bip86 .account-xpub");
    DOM.bip86change = $("#bip86 .change");
    DOM.bip85 = $('.bip85');
    DOM.showBip85 = $('.showBip85');
    DOM.bip85Field = $('.bip85Field');
    DOM.bip85application = $('#bip85-application');
    DOM.bip85mnemonicLanguage = $('#bip85-mnemonic-language');
    DOM.bip85mnemonicLanguageInput = $('.bip85-mnemonic-language-input');
    DOM.bip85mnemonicLength = $('#bip85-mnemonic-length');
    DOM.bip85mnemonicLengthInput = $('.bip85-mnemonic-length-input');
    DOM.bip85index = $('#bip85-index');
    DOM.bip85indexInput = $('.bip85-index-input');
    DOM.bip85bytes = $('#bip85-bytes');
    DOM.bip85bytesInput = $('.bip85-bytes-input');
    DOM.bip141unavailable = $("#bip141 .unavailable");
    DOM.bip141available = $("#bip141 .available");
    DOM.bip141path = $("#bip141-path");
    DOM.bip141semantics = $(".bip141-semantics");
    DOM.generatedStrength = $(".generate-container .strength");
    DOM.generatedStrengthWarning = $(".generate-container .warning");
    DOM.hardenedAddresses = $(".hardened-addresses");
    DOM.bitcoinCashAddressTypeContainer = $(".bch-addr-type-container");
    DOM.bitcoinCashAddressType = $("[name=bch-addr-type]")
    DOM.useBip38 = $(".use-bip38");
    DOM.bip38Password = $(".bip38-password");
    DOM.addresses = $(".addresses");
    DOM.csvTab = $("#csv-tab a");
    DOM.csv = $(".csv");
    DOM.rowsToAdd = $(".rows-to-add");
    DOM.more = $(".more");
    DOM.moreRowsStartIndex = $(".more-rows-start-index");
    DOM.feedback = $(".feedback");
    DOM.tab = $(".derivation-type a");
    DOM.indexToggle = $(".index-toggle");
    DOM.addressToggle = $(".address-toggle");
    DOM.publicKeyToggle = $(".public-key-toggle");
    DOM.privateKeyToggle = $(".private-key-toggle");
    DOM.languages = $(".languages a");
    DOM.qrContainer = $(".qr-container");
    DOM.qrHider = DOM.qrContainer.find(".qr-hider");
    DOM.qrImage = DOM.qrContainer.find(".qr-image");
    DOM.qrHint = DOM.qrContainer.find(".qr-hint");
    DOM.showQrEls = $("[data-show-qr]");

    function init() {
        // Events
        DOM.privacyScreenToggle.on("change", privacyScreenToggled);
        DOM.generatedStrength.on("change", generatedStrengthChanged);
        DOM.network.on("change", networkChanged);
        DOM.bip32Client.on("change", bip32ClientChanged);
        DOM.useEntropy.on("change", setEntropyVisibility);
        DOM.autoCompute.on("change", delayedPhraseChanged);
        DOM.entropy.on("input", delayedEntropyChanged);
        DOM.entropyMnemonicLength.on("change", entropyChanged);
        DOM.pbkdf2Rounds.on("change", pbkdf2RoundsChanged);
        DOM.pbkdf2CustomInput.on("change", pbkdf2RoundsChanged);
        DOM.entropyTypeInputs.on("change", entropyTypeChanged);
        DOM.phrase.on("input", delayedPhraseChanged);
        DOM.mnemonicType.on("change", mnemonicTypeChanged);
        DOM.showSplitMnemonic.on("change", toggleSplitMnemonic);
        DOM.passphrase.on("input", delayedPhraseChanged);
        DOM.generate.on("click", generateClicked);
        DOM.more.on("click", showMore);
        DOM.seed.on("input", delayedSeedChanged);
        DOM.rootKey.on("input", delayedRootKeyChanged);
        DOM.showBip85.on('change', toggleBip85);
        DOM.bip32path.on("input", calcForDerivationPath);
        DOM.bip44account.on("input", calcForDerivationPath);
        DOM.bip44change.on("input", calcForDerivationPath);
        DOM.bip49account.on("input", calcForDerivationPath);
        DOM.bip49change.on("input", calcForDerivationPath);
        DOM.bip84account.on("input", calcForDerivationPath);
        DOM.bip84change.on("input", calcForDerivationPath);
        DOM.bip86account.on("input", calcForDerivationPath);
        DOM.bip86change.on("input", calcForDerivationPath);
        DOM.bip85application.on('input', calcBip85);
        DOM.bip85mnemonicLanguage.on('change', calcBip85);
        DOM.bip85mnemonicLength.on('change', calcBip85);
        DOM.bip85index.on('input', calcBip85);
        DOM.bip85bytes.on('input', calcBip85);
        DOM.bip141path.on("input", calcForDerivationPath);
        DOM.bip141semantics.on("change", tabChanged);
        DOM.tab.on("shown.bs.tab", tabChanged);
        DOM.hardenedAddresses.on("change", calcForDerivationPath);
        DOM.electrumLegacyChange.on("change", electrumChangeAddressToggled);
        DOM.electrumSegwitChange.on("change", electrumChangeAddressToggled);
        DOM.useBip38.on("change", calcForDerivationPath);
        DOM.bip38Password.on("change", calcForDerivationPath);
        DOM.indexToggle.on("click", toggleIndexes);
        DOM.addressToggle.on("click", toggleAddresses);
        DOM.publicKeyToggle.on("click", togglePublicKeys);
        DOM.privateKeyToggle.on("click", togglePrivateKeys);
        DOM.csvTab.on("click", updateCsv);
        DOM.languages.on("click", languageChanged);
        DOM.bitcoinCashAddressType.on("change", bitcoinCashAddressTypeChange);
        setQrEvents(DOM.showQrEls);
        disableForms();
        hidePending();
        hideValidationError();
        populateNetworkSelect();
        populateClientSelect();
        // Hide Electrum forms by default (BIP39 is default)
        $("#electrum-legacy form, #electrum-segwit form").addClass("hidden");
    }

    // Event handlers

    function generatedStrengthChanged() {
        var strength = parseInt(DOM.generatedStrength.val());
        if (strength < 12) {
            DOM.generatedStrengthWarning.removeClass("hidden");
        }
        else {
            DOM.generatedStrengthWarning.addClass("hidden");
        }
    }

    function networkChanged(e) {
        clearDerivedKeys();
        clearAddressesList();
        DOM.bitcoinCashAddressTypeContainer.addClass("hidden");
        var networkIndex = e.target.value;
        var selectedNetwork = networks[networkIndex];
        selectedNetwork.onSelect();
        adjustNetworkForSegwit();
        if (seed != null) {
            seedChanged()
        }
        else {
            rootKeyChanged();
        }
    }

    function bip32ClientChanged(e) {
        var clientIndex = DOM.bip32Client.val();
        if (clientIndex == "custom") {
            DOM.bip32path.prop("readonly", false);
        }
        else {
            DOM.bip32path.prop("readonly", true);
            clients[clientIndex].onSelect();
            rootKeyChanged();
        }
    }

    function isUsingAutoCompute() {
        return DOM.autoCompute.prop("checked");
    }

    function setEntropyVisibility() {
        if (isUsingOwnEntropy()) {
            DOM.entropyContainer.removeClass("hidden");
            DOM.generateContainer.addClass("hidden");
            DOM.phrase.prop("readonly", true);
            DOM.entropy.focus();
            entropyChanged();
        }
        else {
            DOM.entropyContainer.addClass("hidden");
            DOM.generateContainer.removeClass("hidden");
            DOM.phrase.prop("readonly", false);
            hidePending();
        }
    }

    function delayedPhraseChanged() {

        if(isUsingAutoCompute()) {
        hideValidationError();
        seed = null;
        bip32RootKey = null;
        bip32ExtendedKey = null;
        clearAddressesList();
        showPending();
        if (phraseChangeTimeoutEvent != null) {
            clearTimeout(phraseChangeTimeoutEvent);
        }
        phraseChangeTimeoutEvent = setTimeout(function() {
            phraseChanged();
            var entropy = mnemonic.toRawEntropyHex(DOM.phrase.val());
            if (entropy !== null) {
                DOM.entropyMnemonicLength.val("raw");
                DOM.entropy.val(entropy);
                DOM.entropyTypeInputs.filter("[value='hexadecimal']").prop("checked", true);
                entropyTypeAutoDetect = false;
            }
        }, 400);
    } else {
        clearDisplay();
        clearEntropyFeedback();
        showValidationError("Auto compute is disabled");
    }
    }

    function phraseChanged() {
        showPending();
        setMnemonicLanguage();
        // Get the mnemonic phrase
        var phrase = DOM.phrase.val();
        var errorText = findPhraseErrors(phrase);
        if (errorText) {
            showValidationError(errorText);
            return;
        }
        // Calculate and display
        var passphrase = DOM.passphrase.val();
        calcBip32RootKeyFromSeed(phrase, passphrase);
        calcForDerivationPath();
        calcBip85();
        // Show the word indexes
        showWordIndexes();
        writeSplitPhrase(phrase);
    }

    function tabChanged() {
        showPending();
        adjustNetworkForSegwit();
        // Handle Electrum tab field visibility
        if (DOM.mnemonicType.val() === "electrum") {
            if (electrumLegacyTabSelected()) {
                // Show Legacy fields, hide SegWit fields
                $("#electrum-legacy").addClass("active");
                $("#electrum-segwit").removeClass("active");
                $("#electrum-segwit form").addClass("hidden");
                $("#electrum-legacy form").removeClass("hidden");
                // Update derivation path field for Electrum Legacy (root level)
                DOM.electrumLegacyPath.val("m/");
            } else if (electrumSegwitTabSelected()) {
                // Show SegWit fields, hide Legacy fields  
                $("#electrum-segwit").addClass("active");
                $("#electrum-legacy").removeClass("active");
                $("#electrum-legacy form").addClass("hidden");
                $("#electrum-segwit form").removeClass("hidden");
                // Update derivation path field for Electrum SegWit (account level)
                DOM.electrumSegwitPath.val("m/0'");
            }
        }
        var phrase = DOM.phrase.val();
        var seed = DOM.seed.val();
        if (phrase != "") {
            // Calculate and display for mnemonic
            var errorText = findPhraseErrors(phrase);
            if (errorText) {
                showValidationError(errorText);
                return;
            }
            // Calculate and display
            var passphrase = DOM.passphrase.val();
            calcBip32RootKeyFromSeed(phrase, passphrase);
        }
        else if (seed != "") {
          bip32RootKey = bitcoinjs.bip32.fromSeed(bitcoinjs.buffer.Buffer.from(seed, 'hex'), network);
          var rootKeyBase58 = bip32RootKey.toBase58();
          DOM.rootKey.val(rootKeyBase58);
        }
        else {
            // Calculate and display for root key
            var rootKeyBase58 = DOM.rootKey.val();
            var errorText = validateRootKey(rootKeyBase58);
            if (errorText) {
                showValidationError(errorText);
                return;
            }
            // Calculate and display
            calcBip32RootKeyFromBase58(rootKeyBase58);
        }
        calcForDerivationPath();
    }

    function delayedEntropyChanged() {
        hideValidationError();
        showPending();
        if (entropyChangeTimeoutEvent != null) {
            clearTimeout(entropyChangeTimeoutEvent);
        }
        entropyChangeTimeoutEvent = setTimeout(entropyChanged, 400);
    }

    function pbkdf2RoundsChanged() {
        if (DOM.pbkdf2Rounds.val() == "custom") {
            PBKDF2_ROUNDS = DOM.pbkdf2CustomInput.val();
            DOM.pbkdf2CustomInput.removeClass("hidden");
        } else {
            PBKDF2_ROUNDS = DOM.pbkdf2Rounds.val();
            DOM.pbkdf2CustomInput.addClass("hidden");
        }
        ispbkdf2Rounds2048();
        phraseChanged();
    }
    function ispbkdf2Rounds2048() {
        if (PBKDF2_ROUNDS == 2048) {
            DOM.pbkdf2InfosDanger.addClass("hidden");
        } else {
            DOM.pbkdf2InfosDanger.removeClass("hidden");
        }
    }
    function entropyChanged() {
        // If blank entropy, clear mnemonic, addresses, errors
        if (DOM.entropy.val().trim().length == 0) {
            clearDisplay();
            clearEntropyFeedback();
            DOM.phrase.val("");
            DOM.phraseSplit.val("");
            showValidationError("Blank entropy");
            return;
        }
        // Get the current phrase to detect changes
        var phrase = DOM.phrase.val();
        // Set the phrase from the entropy
        setMnemonicFromEntropy();
        // Recalc addresses if the phrase has changed
        var newPhrase = DOM.phrase.val();
        if (newPhrase != phrase) {
            if (newPhrase.length == 0) {
                clearDisplay();
            }
            else {
                phraseChanged();
            }
        }
        else {
            hidePending();
        }
    }

    function entropyTypeChanged() {
        entropyTypeAutoDetect = false;
        entropyChanged();
    }

    function delayedSeedChanged() {
        // Warn if there is an existing mnemonic or passphrase.
        if (DOM.phrase.val().length > 0 || DOM.passphrase.val().length > 0) {
            if (!confirm("This will clear existing mnemonic and passphrase")) {
                DOM.seed.val(seed);
                return
            }
        }
        hideValidationError();
        showPending();
        // Clear existing mnemonic and passphrase
        DOM.phrase.val("");
        DOM.phraseSplit.val("");
        DOM.passphrase.val("");
        DOM.rootKey.val("");
        clearAddressesList();
        clearDerivedKeys();
        seed = null;
        if (seedChangedTimeoutEvent != null) {
            clearTimeout(seedChangedTimeoutEvent);
        }
        seedChangedTimeoutEvent = setTimeout(seedChanged, 400);
    }

    function delayedRootKeyChanged() {
        // Warn if there is an existing mnemonic or passphrase.
        if (DOM.phrase.val().length > 0 || DOM.passphrase.val().length > 0) {
            if (!confirm("This will clear existing mnemonic and passphrase")) {
                DOM.rootKey.val(bip32RootKey);
                return
            }
        }
        hideValidationError();
        showPending();
        // Clear existing mnemonic and passphrase
        DOM.phrase.val("");
        DOM.phraseSplit.val("");
        DOM.passphrase.val("");
        seed = null;
        if (rootKeyChangedTimeoutEvent != null) {
            clearTimeout(rootKeyChangedTimeoutEvent);
        }
        rootKeyChangedTimeoutEvent = setTimeout(rootKeyChanged, 400);
    }

    function seedChanged() {
        showPending();
        hideValidationError();
        seed = DOM.seed.val();
        bip32RootKey = bitcoinjs.bip32.fromSeed(bitcoinjs.buffer.Buffer.from(seed, 'hex'), network);
        var rootKeyBase58 = bip32RootKey.toBase58();
        DOM.rootKey.val(rootKeyBase58);
        var errorText = validateRootKey(rootKeyBase58);
        if (errorText) {
            showValidationError(errorText);
            return;
        }
        // Calculate and display
        calcForDerivationPath();
        calcBip85();
    }

    function rootKeyChanged() {
        showPending();
        hideValidationError();
        var rootKeyBase58 = DOM.rootKey.val();
        var errorText = validateRootKey(rootKeyBase58);
        if (errorText) {
            showValidationError(errorText);
            return;
        }
        // Calculate and display
        calcBip32RootKeyFromBase58(rootKeyBase58);
        calcForDerivationPath();
        calcBip85();
    }


    function toggleSplitMnemonic() {
        if (DOM.showSplitMnemonic.prop("checked")) {
            DOM.splitMnemonic.removeClass("hidden");
        }
        else {
            DOM.splitMnemonic.addClass("hidden");
        }
    }

    // Handle switching between BIP39 and Electrum mnemonic types
    function mnemonicTypeChanged() {
        var mnemonicType = DOM.mnemonicType.val();
        
        if (mnemonicType === "electrum") {
            DOM.mnemonicLabel.text("Electrum");
            DOM.seedLabel.text("Electrum Seed");
            DOM.passphraseLabel.text("Passphrase (optional)");
            // Hide BIP tabs and show Electrum tabs
            $("#bip32-tab, #bip44-tab, #bip49-tab, #bip84-tab, #bip141-tab").addClass("hidden").removeClass("active");
            // Hide BIP tab content panels
            $("#bip32, #bip44, #bip49, #bip84, #bip141").removeClass("active");
            DOM.electrumTabs.removeClass("hidden");
            // Activate first Electrum tab by default
            DOM.electrumLegacyTab.addClass("active");
            DOM.electrumLegacyTab.find("a").tab("show");
            // Hide SegWit fields initially (since Legacy is default)
            $("#electrum-segwit form").addClass("hidden");
            // Set initial derivation path for Electrum Legacy
            DOM.electrumLegacyPath.val("m/");
            $("#electrum-legacy form").removeClass("hidden");
            // Show spacer for Electrum
            $(".electrum-spacer").removeClass("hidden");
            
            // Gray out/disable BIP39-specific fields (but keep passphrase enabled for Electrum)
            $(".entropy-container, .splitMnemonic").addClass("disabled-for-electrum");
            $(".entropy-container input, .entropy-container select, .phraseSplit").prop("disabled", true);
            $(".seed, .root-key, .fingerprint").prop("readonly", true).addClass("electrum-generated");
            
            // Restrict mnemonic length to 12 and 24 words for Electrum
            DOM.generatedStrength.find("option").addClass("hidden");
            DOM.generatedStrength.find("option[value='12']").removeClass("hidden");
            DOM.generatedStrength.find("option[value='24']").removeClass("hidden");
            // Default to 24 words for Electrum (as per user request)
            DOM.generatedStrength.val("24");
        } else {
            DOM.mnemonicLabel.text("BIP39");
            DOM.seedLabel.text("BIP39 Seed");
            DOM.passphraseLabel.text("BIP39 Passphrase (optional)");
            // Show BIP tabs and hide Electrum tabs
            $("#bip32-tab, #bip44-tab, #bip49-tab, #bip84-tab, #bip141-tab").removeClass("hidden");
            DOM.electrumTabs.addClass("hidden");
            DOM.electrumTabPanels.removeClass("active");
            // Hide Electrum form content
            $("#electrum-legacy form, #electrum-segwit form").addClass("hidden");
            // Hide spacer for BIP39
            $(".electrum-spacer").addClass("hidden");
            // Reactivate BIP44 tab as default
            $("#bip44-tab").addClass("active");
            $("#bip44").addClass("active");
            $("#bip44-tab a").tab("show");
            
            // Re-enable BIP39 fields
            $(".entropy-container, .passphrase, .splitMnemonic").removeClass("disabled-for-electrum");
            $(".entropy-container input, .entropy-container select, .passphrase, .phraseSplit").prop("disabled", false);
            $(".seed, .root-key, .fingerprint").prop("readonly", true).removeClass("electrum-generated");
            
            // Restore all mnemonic length options for BIP39
            DOM.generatedStrength.find("option").removeClass("hidden");
        }
        
        // Trigger phrase validation/processing if there's existing content
        delayedPhraseChanged();
    }

    // Map Electrum tabs to wallet type prefixes and derivation paths
    function getElectrumPrefixFromTab() {
        // Check which Electrum derivation tab is active
        if (electrumSegwitTabSelected()) {
            return "100"; // Segwit (bech32) prefix for Electrum SegWit
        } else if (electrumLegacyTabSelected()) {
            return "01";  // Standard (legacy) prefix for Electrum Legacy
        } else {
            return "01";  // Default to legacy
        }
    }

    // Get Electrum derivation path - different for Legacy vs SegWit
    function getElectrumDerivationPath() {
        var isLegacy = electrumLegacyTabSelected();
        if (electrumChangeAddressSelected()) {
            return isLegacy ? "m/1" : "m/1'"; // Change addresses - Legacy: m/1, SegWit: m/1'
        } else {
            return isLegacy ? "m/0" : "m/0'"; // Receiving addresses - Legacy: m/0, SegWit: m/0'
        }
    }
    
    function electrumChangeAddressSelected() {
        if (electrumLegacyTabSelected()) {
            return DOM.electrumLegacyChange.prop("checked");
        } else if (electrumSegwitTabSelected()) {
            return DOM.electrumSegwitChange.prop("checked");
        }
        return false;
    }
    
    function electrumChangeAddressToggled() {
        // Electrum always uses m/0' account, change/receive is at the chain level
        // No need to update path display since it stays m/0'
        
        // Recalculate addresses with new change/receive setting
        clearAddressesList();
        calcForDerivationPath();
    }

    // Generate Electrum addresses using proper Electrum derivation method
    function generateElectrumAddressData(phrase, passphrase, index) {
        var prefix = getElectrumPrefixFromTab();
        var isSegwit = electrumSegwitTabSelected();
        
        try {
            // Generate seed using Electrum method
            var seedBuffer = electrumMnemonic.mnemonicToSeedSync(phrase, { 
                passphrase: passphrase || "",
                prefix: prefix 
            });
            
            // Create master key from Electrum seed - use correct network for each type
            var keyNetwork = isSegwit ? network : bitcoinjs.bitcoin.networks.bitcoin;
            var masterKey = bitcoinjs.bip32.fromSeed(seedBuffer, keyNetwork);
            
            // Use Electrum's actual derivation paths - different for Legacy vs SegWit
            var key;
            var derivationPath;
            var changeChain = electrumChangeAddressSelected() ? 1 : 0;
            var changePath = electrumChangeAddressSelected() ? "1" : "0";
            
            if (isSegwit) {
                // Electrum SegWit: account key m/0' then derive change/receive chain  
                var accountKey = masterKey.deriveHardened(0);
                key = accountKey.derive(changeChain).derive(index);
                derivationPath = "m/0'/" + changePath + "/" + index;
            } else {
                // Electrum Legacy: derive directly from root m/change/index
                key = masterKey.derive(changeChain).derive(index);
                derivationPath = "m/" + changePath + "/" + index;
            }
            
            
            // Generate address based on Electrum wallet type
            var address;
            if (isSegwit) {
                // Electrum SegWit: native P2WPKH (bc1...)
                address = bitcoinjs.bitcoin.payments.p2wpkh({ 
                    pubkey: key.publicKey, 
                    network: network 
                }).address;
            } else {
                // Electrum Legacy: P2PKH (1...)
                address = bitcoinjs.bitcoin.payments.p2pkh({ 
                    pubkey: key.publicKey, 
                    network: network 
                }).address;
            }
            
            return {
                address: address,
                privateKey: key.toWIF(),
                publicKey: key.publicKey.toString('hex'),
                path: derivationPath,
                key: key
            };
        } catch (e) {
            console.error("Electrum address generation error:", e);
            return null;
        }
    }

    function toggleBip85() {
      if (DOM.showBip85.prop('checked')) {
        DOM.bip85.removeClass('hidden');
        calcBip85();
      } else {
        DOM.bip85.addClass('hidden');
      }
    }

    function toggleBip85Fields() {
      if (DOM.showBip85.prop('checked')) {
        DOM.bip85mnemonicLanguageInput.addClass('hidden');
        DOM.bip85mnemonicLengthInput.addClass('hidden');
        DOM.bip85bytesInput.addClass('hidden');

        var app = DOM.bip85application.val();
        if (app === 'bip39') {
          DOM.bip85mnemonicLanguageInput.removeClass('hidden');
          DOM.bip85mnemonicLengthInput.removeClass('hidden');
        } else if (app === 'hex') {
          DOM.bip85bytesInput.removeClass('hidden');
        }
      }
    }

    function calcBip85() {
      if (!DOM.showBip85.prop('checked')) {
        return
      }

      toggleBip85Fields();

      var app = DOM.bip85application.val();

      var rootKeyBase58 = DOM.rootKey.val();
      if (!rootKeyBase58) {
        return;
      }
      try {
        // BIP85 requires mainnet format - derive from the same seed but with mainnet network
        var mainnetRootKey = bitcoinjs.bip32.fromSeed(bitcoinjs.buffer.Buffer.from(seed, 'hex'), bitcoinjs.bitcoin.networks.bitcoin);
        var master = bitcoinjs.bip85.BIP85.fromBase58(mainnetRootKey.toBase58());

        var result;

        const index = parseInt(DOM.bip85index.val(), 10);

        if (app === 'bip39') {
          const language = parseInt(DOM.bip85mnemonicLanguage.val(), 10);
          const length = parseInt(DOM.bip85mnemonicLength.val(), 10);

          result = master.deriveBIP39(language, length, index).toMnemonic();
        } else if (app === 'wif') {
          result = master.deriveWIF(index).toWIF();
        } else if (app === 'xprv') {
          result = master.deriveXPRV(index).toXPRV();
        } else if (app === 'hex') {
          const bytes = parseInt(DOM.bip85bytes.val(), 10);

          result = master.deriveHex(bytes, index).toEntropy();
        }

        hideValidationError();
        DOM.bip85Field.val(result);
      } catch (e) {
        showValidationError('BIP85: ' + e.message);
        DOM.bip85Field.val('');
      }
    }

    function calcForDerivationPath() {
        clearDerivedKeys();
        clearAddressesList();
        showPending();
        // Don't show segwit if it's selected but network doesn't support it
        if (segwitSelected() && !networkHasSegwit()) {
            showSegwitUnavailable();
            hidePending();
            return;
        }
        showSegwitAvailable();
        // Get the derivation path
        var derivationPath = getDerivationPath();
        var errorText = findDerivationPathErrors(derivationPath);
        if (errorText) {
            showValidationError(errorText);
            return;
        }
        bip32ExtendedKey = calcBip32ExtendedKey(derivationPath);
        if (bip44TabSelected()) {
            displayBip44Info();
        }
        else if (bip49TabSelected()) {
            displayBip49Info();
        }
        else if (bip84TabSelected()) {
            displayBip84Info();
        }
        else if (bip86TabSelected()) {
            displayBip86Info();
        }
        else if (electrumLegacyTabSelected()) {
            displayElectrumLegacyInfo();
        }
        else if (electrumSegwitTabSelected()) {
            displayElectrumSegwitInfo();
        }
        displayBip32Info();
    }

    function generateClicked() {
        if (isUsingOwnEntropy()) {
            return;
        }
        // Pressing enter on BIP85 index field triggers generate click event.
        // See https://github.com/iancoleman/bip39/issues/634
        // To cancel the incorrect generation process, stop here if generate is
        // not focused.
        var buttonIsFocused = DOM.generate[0].contains(document.activeElement);
        if (!buttonIsFocused) {
            return;
        }
        clearDisplay();
        showPending();
        setTimeout(function() {
            setMnemonicLanguage();
            var phrase = generateRandomPhrase();
            if (!phrase) {
                return;
            }
            phraseChanged();
        }, 50);
    }

    function languageChanged() {
        setTimeout(function() {
            setMnemonicLanguage();
            if (DOM.phrase.val().length > 0) {
                var newPhrase = convertPhraseToNewLanguage();
                DOM.phrase.val(newPhrase);
                phraseChanged();
            }
            else {
                // Generate a new phrase in the selected language
                clearDisplay();
                showPending();
                setTimeout(function() {
                    var phrase = generateRandomPhrase();
                    if (phrase) {
                        DOM.phrase.val(phrase);
                        phraseChanged();
                    }
                }, 50);
            }
        }, 50);
    }

    function bitcoinCashAddressTypeChange() {
        rootKeyChanged();
    }

    function toggleIndexes() {
        showIndex = !showIndex;
        $("td.index span").toggleClass("invisible");
    }

    function toggleAddresses() {
        showAddress = !showAddress;
        $("td.address span").toggleClass("invisible");
    }

    function togglePublicKeys() {
        showPubKey = !showPubKey;
        $("td.pubkey span").toggleClass("invisible");
    }

    function togglePrivateKeys() {
        showPrivKey = !showPrivKey;
        $("td.privkey span").toggleClass("invisible");
    }

    function privacyScreenToggled() {
        // private-data contains elements added to DOM at runtime
        // so catch all by adding visual privacy class to the root of the DOM
        if (DOM.privacyScreenToggle.prop("checked")) {
            $("body").addClass("visual-privacy");
        }
        else {
            $("body").removeClass("visual-privacy");
        }
    }

    // Private methods

    function generateRandomPhrase() {
        if (!hasStrongRandom()) {
            var errorText = "This browser does not support strong randomness";
            showValidationError(errorText);
            return;
        }
        
        // Check which mnemonic type is selected (BIP39 or Electrum)
        var mnemonicType = DOM.mnemonicType.val();
        var words;
        
        if (mnemonicType === "electrum") {
            // Generate Electrum mnemonic with wallet type based on active BIP tab
            var prefix = getElectrumPrefixFromTab();
            var numWords = parseInt(DOM.generatedStrength.val());
            // Electrum strength calculation: 12 words = 132 bits, 24 words = 264 bits
            var strength = numWords === 24 ? 264 : 132;
            try {
                words = electrumMnemonic.generateMnemonic({ prefix: prefix, strength: strength });
                DOM.phrase.val(words);
                // Clear entropy display for Electrum (doesn't use same entropy model)
                DOM.entropy.val("");
                DOM.entropyMnemonicLength.val("raw");
                return words;
            } catch (e) {
                showValidationError("Error generating Electrum mnemonic: " + e.message);
                return;
            }
        } else {
            // Generate BIP39 mnemonic using existing logic
            // get the amount of entropy to use
            var numWords = parseInt(DOM.generatedStrength.val());
            var strength = numWords / 3 * 32;
            var buffer = new Uint8Array(strength / 8);
            // create secure entropy
            var data = crypto.getRandomValues(buffer);
            // show the words
            var words = mnemonic.toMnemonic(data);
            DOM.phrase.val(words);
            // show the entropy
            var entropyHex = uint8ArrayToHex(data);
            DOM.entropy.val(entropyHex);
            // ensure entropy fields are consistent with what is being displayed
            DOM.entropyMnemonicLength.val("raw");
            return words;
        }
    }

    function calcBip32RootKeyFromSeed(phrase, passphrase) {
        // Check which mnemonic type is selected for proper seed calculation
        var mnemonicType = DOM.mnemonicType.val();
        
        if (mnemonicType === "electrum") {
            // Use Electrum seed generation with wallet type based on active BIP tab
            var prefix = getElectrumPrefixFromTab();
            try {
                // Validate the mnemonic against the derived prefix from active tab
                if (!electrumMnemonic.validateMnemonic(phrase, prefix)) {
                    throw new Error("Invalid Electrum mnemonic for selected derivation path");
                }
                // Generate seed using Electrum method (different from BIP39)
                var seedBuffer = electrumMnemonic.mnemonicToSeedSync(phrase, { 
                    passphrase: passphrase || "",
                    prefix: prefix 
                });
                seed = seedBuffer.toString('hex');
            } catch (e) {
                showValidationError("Electrum mnemonic error: " + e.message);
                return;
            }
        } else {
            // Use BIP39 seed generation (existing logic)
            seed = mnemonic.toSeed(phrase, passphrase);
        }
        
        // Create BIP32 root key from the seed (same for both types)
        bip32RootKey = bitcoinjs.bip32.fromSeed(bitcoinjs.buffer.Buffer.from(seed, 'hex'), network);
    }

    function calcBip32RootKeyFromBase58(rootKeyBase58) {
        // try parsing with various segwit network params since this extended
        // key may be from any one of them.
        if (networkHasSegwit()) {
            var n = network;
            if ("baseNetwork" in n) {
                n = bitcoinjs.bitcoin.networks[n.baseNetwork];
            }
            // try parsing using base network params
            try {
                bip32RootKey = bitcoinjs.bip32.fromBase58(rootKeyBase58, n);
                return;
            }
            catch (e) {}
            // try parsing using p2wpkh params
            if ("p2wpkh" in n) {
                try {
                    bip32RootKey = bitcoinjs.bip32.fromBase58(rootKeyBase58, n.p2wpkh);
                    return;
                }
                catch (e) {}
            }
            // try parsing using p2wpkh-in-p2sh network params
            if ("p2wpkhInP2sh" in n) {
                try {
                    bip32RootKey = bitcoinjs.bip32.fromBase58(rootKeyBase58, n.p2wpkhInP2sh);
                    return;
                }
                catch (e) {}
            }
            // try parsing using p2wsh network params
            if ("p2wsh" in n) {
                try {
                    bip32RootKey = bitcoinjs.bip32.fromBase58(rootKeyBase58, n.p2wsh);
                    return;
                }
                catch (e) {}
            }
            // try parsing using p2wsh-in-p2sh network params
            if ("p2wshInP2sh" in n) {
                try {
                    bip32RootKey = bitcoinjs.bip32.fromBase58(rootKeyBase58, n.p2wshInP2sh);
                    return;
                }
                catch (e) {}
            }
        }
        // try the network params as currently specified
        bip32RootKey = bitcoinjs.bip32.fromBase58(rootKeyBase58, network);
    }


    function calcBip32ExtendedKey(path) {
        // Check there's a root key to derive from
        if (!bip32RootKey) {
            return bip32RootKey;
        }
        var extendedKey = bip32RootKey;
        // Derive the key from the path
        var pathBits = path.split("/");
        for (var i=0; i<pathBits.length; i++) {
            var bit = pathBits[i];
            var index = parseInt(bit);
            if (isNaN(index)) {
                continue;
            }
            var hardened = bit[bit.length-1] == "'";
            var isPriv = !(extendedKey.isNeutered());
            var invalidDerivationPath = hardened && !isPriv;
            if (invalidDerivationPath) {
                extendedKey = null;
            }
            else if (hardened) {
                extendedKey = extendedKey.deriveHardened(index);
            }
            else {
                extendedKey = extendedKey.derive(index);
            }
        }
        return extendedKey;
    }

    function showValidationError(errorText) {
        DOM.feedback
            .text(errorText)
            .show();
    }

    function hideValidationError() {
        DOM.feedback
            .text("")
            .hide();
    }

    function findPhraseErrors(phrase) {
        // Check which mnemonic type is selected for proper validation
        var mnemonicType = DOM.mnemonicType.val();
        
        if (mnemonicType === "electrum") {
            // Validate Electrum mnemonic
            // Detect blank phrase
            if (!phrase || phrase.trim().length == 0) {
                return "Blank mnemonic";
            }
            
            // Check if mnemonic is valid for Electrum wallet type based on active BIP tab
            var prefix = getElectrumPrefixFromTab();
            try {
                var isValid = electrumMnemonic.validateMnemonic(phrase, prefix);
                if (!isValid) {
                    return "Invalid Electrum mnemonic for selected derivation path";
                }
            } catch (e) {
                return "Electrum validation error: " + e.message;
            }
            return false;
        } else {
            // Validate BIP39 mnemonic using existing logic
            // Preprocess the words
            phrase = mnemonic.normalizeString(phrase);
            var words = phraseToWordArray(phrase);
            // Detect blank phrase
            if (words.length == 0) {
                return "Blank mnemonic";
            }
            // Check each word
            for (var i=0; i<words.length; i++) {
                var word = words[i];
                var language = getLanguage();
                if (WORDLISTS[language].indexOf(word) == -1) {
                    console.log("Finding closest match to " + word);
                    var nearestWord = findNearestWord(word);
                    return word + " not in wordlist, did you mean " + nearestWord + "?";
                }
            }
            // Check the words are valid
            var properPhrase = wordArrayToPhrase(words);
            var isValid = mnemonic.check(properPhrase);
            if (!isValid) {
                return "Invalid mnemonic";
            }
            return false;
        }
    }

    function validateRootKey(rootKeyBase58) {

        // try various segwit network params since this extended key may be from
        // any one of them.
        if (networkHasSegwit()) {
            var n = network;
            if ("baseNetwork" in n) {
                n = bitcoinjs.bitcoin.networks[n.baseNetwork];
            }
            // try parsing using base network params
            try {
                bitcoinjs.bip32.fromBase58(rootKeyBase58, n);
                return "";
            }
            catch (e) {}
            // try parsing using p2wpkh params
            if ("p2wpkh" in n) {
                try {
                    bitcoinjs.bip32.fromBase58(rootKeyBase58, n.p2wpkh);
                    return "";
                }
                catch (e) {}
            }
            // try parsing using p2wpkh-in-p2sh network params
            if ("p2wpkhInP2sh" in n) {
                try {
                    bitcoinjs.bip32.fromBase58(rootKeyBase58, n.p2wpkhInP2sh);
                    return "";
                }
                catch (e) {}
            }
            // try parsing using p2wsh network params
            if ("p2wsh" in n) {
                try {
                    bitcoinjs.bip32.fromBase58(rootKeyBase58, n.p2wsh);
                    return "";
                }
                catch (e) {}
            }
            // try parsing using p2wsh-in-p2sh network params
            if ("p2wshInP2sh" in n) {
                try {
                    bitcoinjs.bip32.fromBase58(rootKeyBase58, n.p2wshInP2sh);
                    return "";
                }
                catch (e) {}
            }
        }
        // try the network params as currently specified
        try {
            bitcoinjs.bip32.fromBase58(rootKeyBase58, network);
        }
        catch (e) {
            return "Invalid root key";
        }
        return "";
    }


    function getDerivationPath() {
        // Check if using Electrum mnemonic type - use Electrum's simplified paths
        var mnemonicType = DOM.mnemonicType.val();
        if (mnemonicType === "electrum") {
            return getElectrumDerivationPath();
        }
        
        // Standard BIP derivation paths for BIP39
        if (bip44TabSelected()) {
            var purpose = parseIntNoNaN(DOM.bip44purpose.val(), 44);
            var coin = parseIntNoNaN(DOM.bip44coin.val(), 0);
            var account = parseIntNoNaN(DOM.bip44account.val(), 0);
            var change = parseIntNoNaN(DOM.bip44change.val(), 0);
            var path = "m/";
            path += purpose + "'/";
            path += coin + "'/";
            path += account + "'/";
            path += change;
            DOM.bip44path.val(path);
            var derivationPath = DOM.bip44path.val();
            return derivationPath;
        }
        else if (bip49TabSelected()) {
            var purpose = parseIntNoNaN(DOM.bip49purpose.val(), 49);
            var coin = parseIntNoNaN(DOM.bip49coin.val(), 0);
            var account = parseIntNoNaN(DOM.bip49account.val(), 0);
            var change = parseIntNoNaN(DOM.bip49change.val(), 0);
            var path = "m/";
            path += purpose + "'/";
            path += coin + "'/";
            path += account + "'/";
            path += change;
            DOM.bip49path.val(path);
            var derivationPath = DOM.bip49path.val();
            return derivationPath;
        }
        else if (bip84TabSelected()) {
            var purpose = parseIntNoNaN(DOM.bip84purpose.val(), 84);
            var coin = parseIntNoNaN(DOM.bip84coin.val(), 0);
            var account = parseIntNoNaN(DOM.bip84account.val(), 0);
            var change = parseIntNoNaN(DOM.bip84change.val(), 0);
            var path = "m/";
            path += purpose + "'/";
            path += coin + "'/";
            path += account + "'/";
            path += change;
            DOM.bip84path.val(path);
            var derivationPath = DOM.bip84path.val();
            return derivationPath;
        }
        else if (bip86TabSelected()) {
            var purpose = parseIntNoNaN(DOM.bip86purpose.val(), 86);
            var coin = parseIntNoNaN(DOM.bip86coin.val(), 0);
            var account = parseIntNoNaN(DOM.bip86account.val(), 0);
            var change = parseIntNoNaN(DOM.bip86change.val(), 0);
            var path = "m/";
            path += purpose + "'/";
            path += coin + "'/";
            path += account + "'/";
            path += change;
            DOM.bip86path.val(path);
            var derivationPath = DOM.bip86path.val();
            return derivationPath;
        }
        else if (bip32TabSelected()) {
            var derivationPath = DOM.bip32path.val();
            return derivationPath;
        }
        else if (bip141TabSelected()) {
            var derivationPath = DOM.bip141path.val();
            return derivationPath;
        }
        else {
        }
    }

    function findDerivationPathErrors(path) {
        // TODO is not perfect but is better than nothing
        // Inspired by
        // https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#test-vectors
        // and
        // https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#extended-keys
        var maxDepth = 255; // TODO verify this!!
        var maxIndexValue = Math.pow(2, 31); // TODO verify this!!
        if (path[0] != "m") {
            return "First character must be 'm'";
        }
        if (path.length > 1) {
            if (path[1] != "/") {
                return "Separator must be '/'";
            }
            var indexes = path.split("/");
            if (indexes.length > maxDepth) {
                return "Derivation depth is " + indexes.length + ", must be less than " + maxDepth;
            }
            for (var depth = 1; depth<indexes.length; depth++) {
                var index = indexes[depth];
                var invalidChars = index.replace(/^[0-9]+'?$/g, "")
                if (invalidChars.length > 0) {
                    return "Invalid characters " + invalidChars + " found at depth " + depth;
                }
                var indexValue = parseInt(index.replace("'", ""));
                if (isNaN(depth)) {
                    return "Invalid number at depth " + depth;
                }
                if (indexValue > maxIndexValue) {
                    return "Value of " + indexValue + " at depth " + depth + " must be less than " + maxIndexValue;
                }
            }
        }
        // Check root key exists or else derivation path is useless!
        if (!bip32RootKey) {
            return "No root key";
        }
        // Check no hardened derivation path when using xpub keys
        var hardenedPath = path.indexOf("'") > -1;
        var hardenedAddresses = bip32TabSelected() && DOM.hardenedAddresses.prop("checked");
        var hardened = hardenedPath || hardenedAddresses;
        var isXpubkey = bip32RootKey.isNeutered();
        if (hardened && isXpubkey) {
            return "Hardened derivation path is invalid with xpub key";
        }
        return false;
    }



    function displayBip44Info() {
        // Get the derivation path for the account
        var purpose = parseIntNoNaN(DOM.bip44purpose.val(), 44);
        var coin = parseIntNoNaN(DOM.bip44coin.val(), 0);
        var account = parseIntNoNaN(DOM.bip44account.val(), 0);
        var path = "m/";
        path += purpose + "'/";
        path += coin + "'/";
        path += account + "'/";
        // Calculate the account extended keys
        var accountExtendedKey = calcBip32ExtendedKey(path);
        var accountXprv = accountExtendedKey.toBase58();
        var accountXpub = accountExtendedKey.neutered().toBase58();

        // Display the extended keys
        DOM.bip44accountXprv.val(accountXprv);
        DOM.bip44accountXpub.val(accountXpub);

    }

    function displayBip49Info() {
        // Get the derivation path for the account
        var purpose = parseIntNoNaN(DOM.bip49purpose.val(), 49);
        var coin = parseIntNoNaN(DOM.bip49coin.val(), 0);
        var account = parseIntNoNaN(DOM.bip49account.val(), 0);
        var path = "m/";
        path += purpose + "'/";
        path += coin + "'/";
        path += account + "'/";
        // Calculate the account extended keys
        var accountExtendedKey = calcBip32ExtendedKey(path);
        var accountXprv = accountExtendedKey.toBase58();
        var accountXpub = accountExtendedKey.neutered().toBase58();
        // Display the extended keys
        DOM.bip49accountXprv.val(accountXprv);
        DOM.bip49accountXpub.val(accountXpub);
    }

    function displayBip84Info() {
        // Get the derivation path for the account
        var purpose = parseIntNoNaN(DOM.bip84purpose.val(), 84);
        var coin = parseIntNoNaN(DOM.bip84coin.val(), 0);
        var account = parseIntNoNaN(DOM.bip84account.val(), 0);
        var path = "m/";
        path += purpose + "'/";
        path += coin + "'/";
        path += account + "'/";
        // Calculate the account extended keys
        var accountExtendedKey = calcBip32ExtendedKey(path);
        var accountXprv = accountExtendedKey.toBase58();
        var accountXpub = accountExtendedKey.neutered().toBase58();
        // Display the extended keys
        DOM.bip84accountXprv.val(accountXprv);
        DOM.bip84accountXpub.val(accountXpub);
    }
    
    function displayBip86Info() {
        // Get the derivation path for the account
        var purpose = parseIntNoNaN(DOM.bip86purpose.val(), 86);
        var coin = parseIntNoNaN(DOM.bip86coin.val(), 0);
        var account = parseIntNoNaN(DOM.bip86account.val(), 0);
        var path = "m/";
        path += purpose + "'/";
        path += coin + "'/";
        path += account + "'/";
        // Calculate the account extended keys
        var accountExtendedKey = calcBip32ExtendedKey(path);
        var accountXprv = accountExtendedKey.toBase58();
        var accountXpub = accountExtendedKey.neutered().toBase58();
        // Display the extended keys
        DOM.bip86accountXprv.val(accountXprv);
        DOM.bip86accountXpub.val(accountXpub);
    }
    
    function displayElectrumLegacyInfo() {
        // Electrum Legacy account extended key - use ROOT level (m/) based on Electrum source code
        var bitcoinMainnet = bitcoinjs.bitcoin.networks.bitcoin;
        
        // Create root key with Bitcoin mainnet parameters for xpub encoding
        var legacyRootKey = bitcoinjs.bip32.fromSeed(bitcoinjs.buffer.Buffer.from(seed, 'hex'), bitcoinMainnet);
        
        // For Electrum Legacy, the account extended public key is at ROOT level (m/)
        var accountXpub = legacyRootKey.neutered().toBase58();
        DOM.electrumLegacyAccountXpub.val(accountXpub);
    }
    function displayElectrumSegwitInfo() {
        // Electrum SegWit account level key (m/0') with zpub encoding
        var baseNetwork = network;
        if ("baseNetwork" in network) {
            baseNetwork = bitcoinjs.bitcoin.networks[network.baseNetwork];
        }
        
        var segwitNetwork = baseNetwork;
        if ("p2wpkh" in baseNetwork) {
            segwitNetwork = baseNetwork.p2wpkh; // use SegWit network params for zpub encoding
        }
        
        // Create a new root key with SegWit network parameters for zpub encoding
        var segwitRootKey = bitcoinjs.bip32.fromSeed(bitcoinjs.buffer.Buffer.from(seed, 'hex'), segwitNetwork);
        var accountExtendedKey = segwitRootKey.deriveHardened(0); // m/0'
        var accountXpub = accountExtendedKey.neutered().toBase58();
        DOM.electrumSegwitAccountXpub.val(accountXpub);
    }

    function displayBip32Info() {
        // Display the key
        DOM.seed.val(seed);
        var rootKey = bip32RootKey.toBase58();
        DOM.rootKey.val(rootKey);
        // Display the fingerprint
        var fingerprint = bip32RootKey.fingerprint.toString('hex');
        DOM.fingerprint.val(fingerprint);
        var xprvkeyB58 = "NA";
        if (!bip32ExtendedKey.isNeutered()) {
            xprvkeyB58 = bip32ExtendedKey.toBase58();
        }
        var extendedPrivKey = xprvkeyB58;
        DOM.extendedPrivKey.val(extendedPrivKey);
        var extendedPubKey = bip32ExtendedKey.neutered().toBase58();
        DOM.extendedPubKey.val(extendedPubKey);
        // Display the addresses and privkeys
        clearAddressesList();
        var initialAddressCount = parseInt(DOM.rowsToAdd.val());
        displayAddresses(0, initialAddressCount);

    }

    function displayAddresses(start, total) {
        generationProcesses.push(new (function() {

            var rows = [];

            this.stop = function() {
                for (var i=0; i<rows.length; i++) {
                    rows[i].shouldGenerate = false;
                }
                hidePending();
            }

            for (var i=0; i<total; i++) {
                var index = i + start;
                var isLast = i == total - 1;
                rows.push(new TableRow(index, isLast));
            }

        })());
    }

    function segwitSelected() {
        return bip49TabSelected() || bip84TabSelected() || bip86TabSelected() || bip141TabSelected() || electrumSegwitTabSelected();
    }

    // Electrum tab selection functions
    function electrumLegacyTabSelected() {
        return DOM.electrumLegacyTab.hasClass("active");
    }

    function electrumSegwitTabSelected() {
        return DOM.electrumSegwitTab.hasClass("active");
    }

    function p2wpkhSelected() {
        return bip84TabSelected() ||
                bip141TabSelected() && DOM.bip141semantics.val() == "p2wpkh" ||
                electrumSegwitTabSelected();
    }

    function p2wpkhInP2shSelected() {
        return bip49TabSelected() ||
            (bip141TabSelected() && DOM.bip141semantics.val() == "p2wpkh-p2sh");
    }

    function p2wshSelected() {
        return bip141TabSelected() && DOM.bip141semantics.val() == "p2wsh";
    }

    function p2wshInP2shSelected() {
        return (bip141TabSelected() && DOM.bip141semantics.val() == "p2wsh-p2sh");
    }

    function p2trSelected() {
        return bip86TabSelected();
    }

    function TableRow(index, isLast) {

        var self = this;
        this.shouldGenerate = true;
        var useHardenedAddresses = DOM.hardenedAddresses.prop("checked");
        var useBip38 = DOM.useBip38.prop("checked");
        var bip38password = DOM.bip38Password.val();
        var isSegwit = segwitSelected();
        var segwitAvailable = networkHasSegwit();
        var isP2wpkh = p2wpkhSelected();
        var isP2wpkhInP2sh = p2wpkhInP2shSelected();
        var isP2wsh = p2wshSelected();
        var isP2wshInP2sh = p2wshInP2shSelected();
        var isP2tr = p2trSelected();

        function init() {
            calculateValues();
        }

        function calculateValues() {
            setTimeout(function() {
                if (!self.shouldGenerate) {
                    return;
                }
                
                // Check if using Electrum - use pure Electrum derivation
                var mnemonicType = DOM.mnemonicType.val();
                if (mnemonicType === "electrum") {
                    var phrase = DOM.phrase.val();
                    var passphrase = DOM.passphrase.val();
                    var electrumData = generateElectrumAddressData(phrase, passphrase, index);
                    
                    if (electrumData) {
                        // Use Electrum-generated data directly
                        self.index = index;
                        self.path = electrumData.path;
                        self.address = electrumData.address;
                        self.pubkey = electrumData.publicKey;
                        self.privkey = electrumData.privateKey;
                        
                        var indexText = electrumData.path;
                        addAddressToList(indexText, electrumData.address, electrumData.publicKey, electrumData.privateKey);
                        if (isLast) {
                            hidePending();
                            updateCsv();
                        }
                        return;
                    } else {
                        // Error case
                        self.address = "Error";
                        self.pubkey = "Error";
                        self.privkey = "Error";
                        addAddressToList("Error", "Error", "Error", "Error");
                        if (isLast) {
                            hidePending();
                            updateCsv();
                        }
                        return;
                    }
                }

                // Standard BIP39 derivation for non-Electrum mode
                var key = "NA";
                if (useHardenedAddresses) {
                    key = bip32ExtendedKey.deriveHardened(index);
                }
                else {
                    key = bip32ExtendedKey.derive(index);
                }
                // check if we have private key
                var hasPrivkey = !key.isNeutered();
                
                // BIP38 requires uncompressed keys
                var useUncompressed = useBip38;
                
                // create keyPair for WIF/BIP38 if needed
                var keyPair = null;
                var publicKeyForAddress = key.publicKey;
                
                if (hasPrivkey) {
                    keyPair = bitcoinjs.ECPair.fromPrivateKey(key.privateKey, { 
                        network: network, 
                        compressed: !useUncompressed 
                    });
                    // Use uncompressed keyPair public key if BIP38 is enabled
                    if (useUncompressed) {
                        publicKeyForAddress = keyPair.publicKey;
                    }
                }
                
                // get address using appropriate public key (compressed or uncompressed)
                // Convert to Buffer if needed (for compatibility with bitcoinjs-lib)
                var pubkeyBuffer = bitcoinjs.buffer.Buffer.from(publicKeyForAddress);
                var address = bitcoinjs.bitcoin.payments.p2pkh({ 
                    pubkey: pubkeyBuffer, 
                    network: network 
                }).address;
                var privkey = "NA";
                if (hasPrivkey && keyPair) {
                    privkey = keyPair.toWIF();
                    // BIP38 encode private key if required
                    if (useBip38) {
                        console.log("Starting BIP38 encryption for index " + index);
                        privkey = bitcoinjs.bip38.encrypt(keyPair.privateKey, !useUncompressed, bip38password, function(p) {
                            console.log("Progressed " + p.percent.toFixed(1) + "% for index " + index);
                        });
                        console.log("BIP38 encryption completed for index " + index + ", result: " + privkey);
                    }
                }
                // get pubkey (uncompressed if BIP38, compressed otherwise)
                var pubkey = bitcoinjs.buffer.Buffer.from(publicKeyForAddress).toString('hex');
                var indexText = getDerivationPath() + "/" + index;
                if (useHardenedAddresses) {
                    indexText = indexText + "'";
                }

                // Segwit addresses use modern payments API
                if (isSegwit) {
                    if (!segwitAvailable) {
                        return;
                    }
                    if (isP2wpkh) {
                        address = bitcoinjs.bitcoin.payments.p2wpkh({ 
                            pubkey: key.publicKey, 
                            network: network 
                        }).address;
                    }
                    else if (isP2wpkhInP2sh) {
                        address = bitcoinjs.bitcoin.payments.p2sh({
                            redeem: bitcoinjs.bitcoin.payments.p2wpkh({ 
                                pubkey: key.publicKey, 
                                network: network 
                            }),
                            network: network
                        }).address;
                    }
                    else if (isP2wsh) {
                        // 1-of-1 multisig wrapped in P2WSH
                        address = bitcoinjs.bitcoin.payments.p2wsh({
                            redeem: bitcoinjs.bitcoin.payments.p2ms({ 
                                m: 1, 
                                pubkeys: [key.publicKey],
                                network: network
                            }),
                            network: network
                        }).address;
                    }
                    else if (isP2wshInP2sh) {
                        // 1-of-1 multisig wrapped in P2SH-P2WSH
                        address = bitcoinjs.bitcoin.payments.p2sh({
                            redeem: bitcoinjs.bitcoin.payments.p2wsh({
                                redeem: bitcoinjs.bitcoin.payments.p2ms({ 
                                    m: 1, 
                                    pubkeys: [key.publicKey],
                                    network: network
                                }),
                                network: network
                            }),
                            network: network
                        }).address;
                    }
                    else if (isP2tr) {
                        // BIP-86 Taproot addresses (P2TR)
                        try {
                            address = bitcoinjs.bitcoin.payments.p2tr({ 
                                internalPubkey: key.publicKey.slice(1, 33), // Use internal pubkey (32 bytes) for BIP-86
                                network: network 
                            }).address;
                        } catch (e) {
                            // Fallback if P2TR is not available in this bitcoinjs-lib version
                            console.warn("P2TR (Taproot) not supported in this bitcoinjs-lib version:", e.message);
                            address = "Taproot not supported";
                        }
                    }
                }




                addAddressToList(indexText, address, pubkey, privkey);
                if (isLast) {
                    hidePending();
                    updateCsv();
                }
            }, 50)
        }

        init();

    }

    function showMore() {
        var rowsToAdd = parseInt(DOM.rowsToAdd.val());
        if (isNaN(rowsToAdd)) {
            rowsToAdd = 20;
            DOM.rowsToAdd.val("20");
        }
        var start = parseInt(DOM.moreRowsStartIndex.val())
        if (isNaN(start)) {
            start = lastIndexInTable() + 1;
        }
        else {
            var newStart = start + rowsToAdd;
            DOM.moreRowsStartIndex.val(newStart);
        }
        if (rowsToAdd > 200) {
            var msg = "Generating " + rowsToAdd + " rows could take a while. ";
            msg += "Do you want to continue?";
            if (!confirm(msg)) {
                return;
            }
        }
        displayAddresses(start, rowsToAdd);
    }

    function clearDisplay() {
        clearAddressesList();
        clearKeys();
        hideValidationError();
    }

    function clearAddressesList() {
        DOM.addresses.empty();
        DOM.csv.val("");
        stopGenerating();
    }

    function stopGenerating() {
        while (generationProcesses.length > 0) {
            var generation = generationProcesses.shift();
            generation.stop();
        }
    }

    function clearKeys() {
        clearRootKey();
        clearDerivedKeys();
    }

    function clearRootKey() {
        DOM.rootKey.val("");
    }

    function clearDerivedKeys() {
        DOM.extendedPrivKey.val("");
        DOM.extendedPubKey.val("");
        DOM.bip44accountXprv.val("");
        DOM.bip44accountXpub.val("");
        DOM.electrumLegacyAccountXpub.val("");
        DOM.electrumSegwitAccountXpub.val("");
    }

    function addAddressToList(indexText, address, pubkey, privkey) {
        var row = $(addressRowTemplate.html());
        // Elements
        var indexCell = row.find(".index span");
        var addressCell = row.find(".address span");
        var pubkeyCell = row.find(".pubkey span");
        var privkeyCell = row.find(".privkey span");
        // Content
        indexCell.text(indexText);
        addressCell.text(address);
        pubkeyCell.text(pubkey);
        privkeyCell.text(privkey);
        // Visibility
        if (!showIndex) {
            indexCell.addClass("invisible");
        }
        if (!showAddress) {
            addressCell.addClass("invisible");
        }
        if (!showPubKey) {
            pubkeyCell.addClass("invisible");
        }
        if (!showPrivKey) {
            privkeyCell.addClass("invisible");
        }
        DOM.addresses.append(row);
        var rowShowQrEls = row.find("[data-show-qr]");
        setQrEvents(rowShowQrEls);
    }

    function hasStrongRandom() {
        return 'crypto' in window && window['crypto'] !== null;
    }

    function disableForms() {
        $("form").on("submit", function(e) {
            e.preventDefault();
        });
    }

    function parseIntNoNaN(val, defaultVal) {
        var v = parseInt(val);
        if (isNaN(v)) {
            return defaultVal;
        }
        return v;
    }

    function showPending() {
        DOM.feedback
            .text("Calculating...")
            .show();
    }

    function findNearestWord(word) {
        var language = getLanguage();
        var words = WORDLISTS[language];
        var minDistance = 99;
        var closestWord = words[0];
        for (var i=0; i<words.length; i++) {
            var comparedTo = words[i];
            if (comparedTo.indexOf(word) == 0) {
                return comparedTo;
            }
            var distance = bitcoinjs.levenshtein.get(word, comparedTo);
            if (distance < minDistance) {
                closestWord = comparedTo;
                minDistance = distance;
            }
        }
        return closestWord;
    }

    function hidePending() {
        DOM.feedback
            .text("")
            .hide();
    }

    function populateNetworkSelect() {
        for (var i=0; i<networks.length; i++) {
            var network = networks[i];
            var option = $("<option>");
            option.attr("value", i);
            option.text(network.name);
            if (network.name == "BTC - Bitcoin") {
                option.prop("selected", true);
            }
            DOM.phraseNetwork.append(option);
        }
    }

    function populateClientSelect() {
        for (var i=0; i<clients.length; i++) {
            var client = clients[i];
            var option = $("<option>");
            option.attr("value", i);
            option.text(client.name);
            DOM.bip32Client.append(option);
        }
    }

    function getLanguage() {
        var defaultLanguage = "english";
        // Try to get from existing phrase
        var language = getLanguageFromPhrase();
        // Try to get from url if not from phrase
        if (language.length == 0) {
            language = getLanguageFromUrl();
        }
        // Default to English if no other option
        if (language.length == 0) {
            language = defaultLanguage;
        }
        return language;
    }

    function getLanguageFromPhrase(phrase) {
        // Check if how many words from existing phrase match a language.
        var language = "";
        if (!phrase) {
            phrase = DOM.phrase.val();
        }
        if (phrase.length > 0) {
            var words = phraseToWordArray(phrase);
            var languageMatches = {};
            for (l in WORDLISTS) {
                // Track how many words match in this language
                languageMatches[l] = 0;
                for (var i=0; i<words.length; i++) {
                    var wordInLanguage = WORDLISTS[l].indexOf(words[i]) > -1;
                    if (wordInLanguage) {
                        languageMatches[l]++;
                    }
                }
                // Find languages with most word matches.
                // This is made difficult due to commonalities between Chinese
                // simplified vs traditional.
                var mostMatches = 0;
                var mostMatchedLanguages = [];
                for (var l in languageMatches) {
                    var numMatches = languageMatches[l];
                    if (numMatches > mostMatches) {
                        mostMatches = numMatches;
                        mostMatchedLanguages = [l];
                    }
                    else if (numMatches == mostMatches) {
                        mostMatchedLanguages.push(l);
                    }
                }
            }
            if (mostMatchedLanguages.length > 0) {
                // Use first language and warn if multiple detected
                language = mostMatchedLanguages[0];
                if (mostMatchedLanguages.length > 1) {
                    console.warn("Multiple possible languages");
                    console.warn(mostMatchedLanguages);
                }
            }
        }
        return language;
    }

    function getLanguageFromUrl() {
        for (var language in WORDLISTS) {
            if (window.location.hash.indexOf(language) > -1) {
                return language;
            }
        }
        return "";
    }

    function setMnemonicLanguage() {
        var language = getLanguage();
        // Load the bip39 mnemonic generator for this language if required
        if (!(language in mnemonics)) {
            mnemonics[language] = new Mnemonic(language);
        }
        mnemonic = mnemonics[language];
    }

    function convertPhraseToNewLanguage() {
        var oldLanguage = getLanguageFromPhrase();
        var newLanguage = getLanguageFromUrl();
        var oldPhrase = DOM.phrase.val();
        var oldWords = phraseToWordArray(oldPhrase);
        var newWords = [];
        for (var i=0; i<oldWords.length; i++) {
            var oldWord = oldWords[i];
            var index = WORDLISTS[oldLanguage].indexOf(oldWord);
            var newWord = WORDLISTS[newLanguage][index];
            newWords.push(newWord);
        }
        newPhrase = wordArrayToPhrase(newWords);
        return newPhrase;
    }

    // TODO look at jsbip39 - mnemonic.splitWords
    function phraseToWordArray(phrase) {
        var words = phrase.split(/\s/g);
        var noBlanks = [];
        for (var i=0; i<words.length; i++) {
            var word = words[i];
            if (word.length > 0) {
                noBlanks.push(word);
            }
        }
        return noBlanks;
    }

    // TODO look at jsbip39 - mnemonic.joinWords
    function wordArrayToPhrase(words) {
        var phrase = words.join(" ");
        var language = getLanguageFromPhrase(phrase);
        if (language == "japanese") {
            phrase = words.join("\u3000");
        }
        return phrase;
    }

    function writeSplitPhrase(phrase) {
        var wordCount = phrase.split(/\s/g).length;
        var left=[];
        for (var i=0;i<wordCount;i++) left.push(i);
        var group=[[],[],[]],
            groupI=-1;
        var seed = Math.abs(sjcl.hash.sha256.hash(phrase)[0])% 2147483647;
        while (left.length>0) {
            groupI=(groupI+1)%3;
            seed = seed * 16807 % 2147483647;
            var selected=Math.floor(left.length*(seed - 1) / 2147483646);
            group[groupI].push(left[selected]);
            left.splice(selected,1);
        }
        var cards=[phrase.split(/\s/g),phrase.split(/\s/g),phrase.split(/\s/g)];
        for (var i=0;i<3;i++) {
            for (var ii=0;ii<wordCount/3;ii++) cards[i][group[i][ii]]='XXXX';
            cards[i]='Card '+(i+1)+': '+wordArrayToPhrase(cards[i]);
        }
        DOM.phraseSplit.val(cards.join("\r\n"));
        var triesPerSecond=10000000000;
        var hackTime=Math.pow(2,wordCount*10/3)/triesPerSecond;
        var displayRedText = false;
        if (hackTime<1) {
            hackTime="<1 second";
            displayRedText = true;
        } else if (hackTime<86400) {
            hackTime=Math.floor(hackTime)+" seconds";
            displayRedText = true;
        } else if(hackTime<31557600) {
            hackTime=Math.floor(hackTime/86400)+" days";
            displayRedText = true;
        } else {
            hackTime=Math.floor(hackTime/31557600)+" years";
        }
        DOM.phraseSplitWarn.html("Time to hack with only one card: "+hackTime);
        if (displayRedText) {
            DOM.phraseSplitWarn.addClass("text-danger");
        } else {
            DOM.phraseSplitWarn.removeClass("text-danger");
        }
    }

    function isUsingOwnEntropy() {
        return DOM.useEntropy.prop("checked");
    }

    function setMnemonicFromEntropy() {
        clearEntropyFeedback();
        // Get entropy value
        var entropyStr = DOM.entropy.val();
        // Work out minimum base for entropy
        var entropy = null;
        if (entropyTypeAutoDetect) {
            entropy = Entropy.fromString(entropyStr);
        }
        else {
            let base = DOM.entropyTypeInputs.filter(":checked").val();
            entropy = Entropy.fromString(entropyStr, base);
        }
        if (entropy.binaryStr.length == 0) {
            return;
        }
        // Show entropy details
        showEntropyFeedback(entropy);
        // Use entropy hash if not using raw entropy
        var bits = entropy.binaryStr;
        var mnemonicLength = DOM.entropyMnemonicLength.val();
        if (mnemonicLength != "raw") {
            // Get bits by hashing entropy with SHA256
            var hash = sjcl.hash.sha256.hash(entropy.cleanStr);
            var hex = sjcl.codec.hex.fromBits(hash);
            bits = bitcoinjs.BigInteger.BigInteger.parse(hex, 16).toString(2);
            while (bits.length % 256 != 0) {
                bits = "0" + bits;
            }
            // Truncate hash to suit number of words
            mnemonicLength = parseInt(mnemonicLength);
            var numberOfBits = 32 * mnemonicLength / 3;
            bits = bits.substring(0, numberOfBits);
            // show warning for weak entropy override
            if (mnemonicLength / 3 * 32 > entropy.binaryStr.length) {
                DOM.entropyWeakEntropyOverrideWarning.removeClass("hidden");
            }
            else {
                DOM.entropyWeakEntropyOverrideWarning.addClass("hidden");
            }
        }
        else {
            // hide warning for weak entropy override
            DOM.entropyWeakEntropyOverrideWarning.addClass("hidden");
        }
        // Discard trailing entropy
        var bitsToUse = Math.floor(bits.length / 32) * 32;
        var start = bits.length - bitsToUse;
        var binaryStr = bits.substring(start);
        // Convert entropy string to numeric array
        var entropyArr = [];
        for (var i=0; i<binaryStr.length / 8; i++) {
            var byteAsBits = binaryStr.substring(i*8, i*8+8);
            var entropyByte = parseInt(byteAsBits, 2);
            entropyArr.push(entropyByte)
        }
        // Convert entropy array to mnemonic
        var phrase = mnemonic.toMnemonic(entropyArr);
        // Set the mnemonic in the UI
        DOM.phrase.val(phrase);
        writeSplitPhrase(phrase);
        // Show the word indexes
        showWordIndexes();
        // Show the checksum
        showChecksum();
    }

    function clearEntropyFeedback() {
        DOM.entropyCrackTime.text("...");
        DOM.entropyType.text("");
        DOM.entropyWordCount.text("0");
        DOM.entropyEventCount.text("0");
        DOM.entropyBitsPerEvent.text("0");
        DOM.entropyBits.text("0");
        DOM.entropyFiltered.html("&nbsp;");
        DOM.entropyBinary.html("&nbsp;");
    }

    function showEntropyFeedback(entropy) {
        var numberOfBits = entropy.binaryStr.length;
        var timeToCrack = "unknown";
        try {
            var z = bitcoinjs.zxcvbn(entropy.base.events.join(""));
            timeToCrack = z.crack_times_display.offline_fast_hashing_1e10_per_second;
            if (z.feedback.warning != "") {
                timeToCrack = timeToCrack + " - " + z.feedback.warning;
            };
        }
        catch (e) {
            console.log("Error detecting entropy strength with zxcvbn:");
            console.log(e);
        }
        var entropyTypeStr = getEntropyTypeStr(entropy);
        DOM.entropyTypeInputs.attr("checked", false);
        DOM.entropyTypeInputs.filter("[value='" + entropyTypeStr + "']").attr("checked", true);
        var wordCount = Math.floor(numberOfBits / 32) * 3;
        var bitsPerEvent = entropy.bitsPerEvent.toFixed(2);
        var spacedBinaryStr = addSpacesEveryElevenBits(entropy.binaryStr);
        DOM.entropyFiltered.html(entropy.cleanHtml);
        DOM.entropyType.text(entropyTypeStr);
        DOM.entropyCrackTime.text(timeToCrack);
        DOM.entropyEventCount.text(entropy.base.events.length);
        DOM.entropyBits.text(numberOfBits);
        DOM.entropyWordCount.text(wordCount);
        DOM.entropyBinary.text(spacedBinaryStr);
        DOM.entropyBitsPerEvent.text(bitsPerEvent);
        // detect and warn of filtering
        var rawNoSpaces = DOM.entropy.val().replace(/\s/g, "");
        var cleanNoSpaces = entropy.cleanStr.replace(/\s/g, "");
        var isFiltered = rawNoSpaces.length != cleanNoSpaces.length;
        if (isFiltered) {
            DOM.entropyFilterWarning.removeClass('hidden');
        }
        else {
            DOM.entropyFilterWarning.addClass('hidden');
        }
    }

    function getEntropyTypeStr(entropy) {
        var typeStr = entropy.base.str;
        // Add some detail if these are cards
        if (entropy.base.asInt == 52) {
            var cardDetail = []; // array of message strings
            // Detect duplicates
            var dupes = [];
            var dupeTracker = {};
            for (var i=0; i<entropy.base.events.length; i++) {
                var card = entropy.base.events[i];
                var cardUpper = card.toUpperCase();
                if (cardUpper in dupeTracker) {
                    dupes.push(card);
                }
                dupeTracker[cardUpper] = true;
            }
            if (dupes.length > 0) {
                var dupeWord = "duplicates";
                if (dupes.length == 1) {
                    dupeWord = "duplicate";
                }
                var msg = dupes.length + " " + dupeWord + ": " + dupes.slice(0,3).join(" ");
                if (dupes.length > 3) {
                    msg += "...";
                }
                cardDetail.push(msg);
            }
            // Detect full deck
            var uniqueCards = [];
            for (var uniqueCard in dupeTracker) {
                uniqueCards.push(uniqueCard);
            }
            if (uniqueCards.length == 52) {
                cardDetail.unshift("full deck");
            }
            // Detect missing cards
            var values = "A23456789TJQK";
            var suits = "CDHS";
            var missingCards = [];
            for (var i=0; i<suits.length; i++) {
                for (var j=0; j<values.length; j++) {
                    var card = values[j] + suits[i];
                    if (!(card in dupeTracker)) {
                        missingCards.push(card);
                    }
                }
            }
            // Display missing cards if six or less, ie clearly going for full deck
            if (missingCards.length > 0 && missingCards.length <= 6) {
                var msg = missingCards.length + " missing: " + missingCards.slice(0,3).join(" ");
                if (missingCards.length > 3) {
                    msg += "...";
                }
                cardDetail.push(msg);
            }
            // Add card details to typeStr
            if (cardDetail.length > 0) {
                typeStr += " (" + cardDetail.join(", ") + ")";
            }
        }
        return typeStr;
    }

    function setQrEvents(els) {
        els.on("mouseenter", createQr);
        els.on("mouseleave", destroyQr);
        els.on("click", toggleQr);
    }

    function createQr(e) {
        var content = e.target.textContent || e.target.value;
        if (content) {
            var qrEl = bitcoinjs.kjua({
                text: content,
                render: "canvas",
                size: 310,
                ecLevel: 'H',
            });
            DOM.qrImage.append(qrEl);
            if (!showQr) {
                DOM.qrHider.addClass("hidden");
            }
            else {
                DOM.qrHider.removeClass("hidden");
            }
            DOM.qrContainer.removeClass("hidden");
        }
    }

    function destroyQr() {
        DOM.qrImage.text("");
        DOM.qrContainer.addClass("hidden");
    }

    function toggleQr() {
        showQr = !showQr;
        DOM.qrHider.toggleClass("hidden");
        DOM.qrHint.toggleClass("hidden");
    }

    function bip44TabSelected() {
        return DOM.bip44tab.hasClass("active");
    }

    function bip32TabSelected() {
        return DOM.bip32tab.hasClass("active");
    }


    function networkHasSegwit() {
        var n = network;
        if ("baseNetwork" in network) {
            n = bitcoinjs.bitcoin.networks[network.baseNetwork];
        }
        // check if only p2wpkh params are required
        if (p2wpkhSelected()) {
            return "p2wpkh" in n;
        }
        // check if only p2wpkh-in-p2sh params are required
        else if (p2wpkhInP2shSelected()) {
            return "p2wpkhInP2sh" in n;
        }
        // require both if it's unclear which params are required
        return "p2wpkh" in n && "p2wpkhInP2sh" in n;
    }

    function bip49TabSelected() {
        return DOM.bip49tab.hasClass("active");
    }

    function bip84TabSelected() {
        return DOM.bip84tab.hasClass("active");
    }

    function bip86TabSelected() {
        return DOM.bip86tab.hasClass("active");
    }

    function bip141TabSelected() {
        return DOM.bip141tab.hasClass("active");
    }

    function setHdCoin(coinValue) {
        DOM.bip44coin.val(coinValue);
        DOM.bip49coin.val(coinValue);
        DOM.bip84coin.val(coinValue);
        DOM.bip86coin.val(coinValue);
    }

    function showSegwitAvailable() {
        DOM.bip49unavailable.addClass("hidden");
        DOM.bip49available.removeClass("hidden");
        DOM.bip84unavailable.addClass("hidden");
        DOM.bip84available.removeClass("hidden");
        DOM.bip86unavailable.addClass("hidden");
        DOM.bip86available.removeClass("hidden");
        DOM.bip141unavailable.addClass("hidden");
        DOM.bip141available.removeClass("hidden");
    }

    function showSegwitUnavailable() {
        DOM.bip49available.addClass("hidden");
        DOM.bip49unavailable.removeClass("hidden");
        DOM.bip84available.addClass("hidden");
        DOM.bip84unavailable.removeClass("hidden");
        DOM.bip86available.addClass("hidden");
        DOM.bip86unavailable.removeClass("hidden");
        DOM.bip141available.addClass("hidden");
        DOM.bip141unavailable.removeClass("hidden");
    }

    function adjustNetworkForSegwit() {
        // If segwit is selected the xpub/xprv prefixes need to be adjusted
        // to avoid accidentally importing BIP49 xpub to BIP44 watch only
        // wallet.
        // See https://github.com/iancoleman/bip39/issues/125
        var segwitNetworks = null;
        // if a segwit network is alread selected, need to use base network to
        // look up new parameters
        if ("baseNetwork" in network) {
            network = bitcoinjs.bitcoin.networks[network.baseNetwork];
        }
        // choose the right segwit params
        if (p2wpkhSelected() && "p2wpkh" in network) {
            network = network.p2wpkh;
        }
        else if (p2wpkhInP2shSelected() && "p2wpkhInP2sh" in network) {
            network = network.p2wpkhInP2sh;
        }
        else if (p2wshSelected() && "p2wsh" in network) {
            network = network.p2wsh;
        }
        else if (p2wshInP2shSelected() && "p2wshInP2sh" in network) {
            network = network.p2wshInP2sh;
        }
    }

    function lastIndexInTable() {
        var pathText = DOM.addresses.find(".index").last().text();
        var pathBits = pathText.split("/");
        var lastBit = pathBits[pathBits.length-1];
        var lastBitClean = lastBit.replace("'", "");
        return parseInt(lastBitClean);
    }

    function uint8ArrayToHex(a) {
        var s = ""
        for (var i=0; i<a.length; i++) {
            var h = a[i].toString(16);
            while (h.length < 2) {
                h = "0" + h;
            }
            s = s + h;
        }
        return s;
    }

    function showWordIndexes() {
        var phrase = DOM.phrase.val();
        var words = phraseToWordArray(phrase);
        var wordIndexes = [];
        var language = getLanguage();
        for (var i=0; i<words.length; i++) {
            var word = words[i];
            var wordIndex = WORDLISTS[language].indexOf(word);
            wordIndexes.push(wordIndex);
        }
        var wordIndexesStr = wordIndexes.join(", ");
        DOM.entropyWordIndexes.text(wordIndexesStr);
    }

    function showChecksum() {
        var phrase = DOM.phrase.val();
        var words = phraseToWordArray(phrase);
        var checksumBitlength = words.length / 3;
        var checksum = "";
        var binaryStr = "";
        var language = getLanguage();
        for (var i=words.length-1; i>=0; i--) {
            var word = words[i];
            var wordIndex = WORDLISTS[language].indexOf(word);
            var wordBinary = wordIndex.toString(2);
            while (wordBinary.length < 11) {
                wordBinary = "0" + wordBinary;
            }
            var binaryStr = wordBinary + binaryStr;
            if (binaryStr.length >= checksumBitlength) {
                var start = binaryStr.length - checksumBitlength;
                var end = binaryStr.length;
                checksum = binaryStr.substring(start, end);
                // add spaces so the last group is 11 bits, not the first
                checksum = checksum.split("").reverse().join("")
                checksum = addSpacesEveryElevenBits(checksum);
                checksum = checksum.split("").reverse().join("")
                break;
            }
        }
        DOM.entropyChecksum.text(checksum);
    }

    function updateCsv() {
        var tableCsv = "path,address,public key,private key\n";
        var rows = DOM.addresses.find("tr");
        for (var i=0; i<rows.length; i++) {
            var row = $(rows[i]);
            var cells = row.find("td");
            for (var j=0; j<cells.length; j++) {
                var cell = $(cells[j]);
                if (!cell.children().hasClass("invisible")) {
                    tableCsv = tableCsv + cell.text();
                }
                if (j != cells.length - 1) {
                    tableCsv = tableCsv + ",";
                }
            }
            tableCsv = tableCsv + "\n";
        }
        DOM.csv.val(tableCsv);
    }

    function addSpacesEveryElevenBits(binaryStr) {
        return binaryStr.match(/.{1,11}/g).join(" ");
    }

    var networks = [
        {
            name: "BTC - Bitcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.bitcoin;
                setHdCoin(0);
            },
        },
        {
            name: "BTC - Bitcoin Testnet",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.testnet;
                setHdCoin(1);
            },
        },
        {
            name: "BTC - Bitcoin RegTest",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.regtest;
                setHdCoin(1);
            },
        }
    ];

    var clients = [
        {
            name: "Bitcoin Core",
            onSelect: function() {
                DOM.bip32path.val("m/0'/0'");
                DOM.hardenedAddresses.prop('checked', true);
            },
        },
        {
            name: "blockchain.info",
            onSelect: function() {
                DOM.bip32path.val("m/44'/0'/0'");
                DOM.hardenedAddresses.prop('checked', false);
            },
        },
        {
            name: "MultiBit HD",
            onSelect: function() {
                DOM.bip32path.val("m/0'/0");
                DOM.hardenedAddresses.prop('checked', false);
            },
        },
        {
            name: "Coinomi, Ledger",
            onSelect: function() {
                DOM.bip32path.val("m/44'/"+DOM.bip44coin.val()+"'/0'");
                DOM.hardenedAddresses.prop('checked', false);
            },
        }
    ];

    // Bitcoin-only functions (altcoin functions removed)

    init();

})();

// Dark mode toggle functionality
let currentThemeMode = 'auto'; // 'auto', 'light', 'dark'

function toggleTheme() {
    const html = document.documentElement;
    const toggleButton = document.getElementById('theme-toggle');
    
    if (currentThemeMode === 'auto') {
        // Auto → Light
        currentThemeMode = 'light';
        html.removeAttribute('data-theme');
        toggleButton.innerHTML = '🌙 Dark';
    } else if (currentThemeMode === 'light') {
        // Light → Dark
        currentThemeMode = 'dark';
        html.setAttribute('data-theme', 'dark');
        toggleButton.innerHTML = '☀️ Light';
    } else {
        // Dark → Auto
        currentThemeMode = 'auto';
        const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemIsDark) {
            html.setAttribute('data-theme', 'dark');
        } else {
            html.removeAttribute('data-theme');
        }
        toggleButton.innerHTML = '🌙/☀️ Auto';
    }
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('theme-toggle');
    
    // Always start in Auto mode - follow system preference
    currentThemeMode = 'auto';
    const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (systemIsDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    
    if (toggleButton) {
        toggleButton.innerHTML = '🌙/☀️ Auto';
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        // Only apply system theme if in auto mode
        if (currentThemeMode === 'auto') {
            const toggleButton = document.getElementById('theme-toggle');
            if (e.matches) {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
            // Keep the Auto button text
            if (toggleButton) {
                toggleButton.innerHTML = '🌙/☀️ Auto';
            }
        }
    });
});
