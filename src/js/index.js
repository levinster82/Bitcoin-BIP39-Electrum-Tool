(function() {

    // Use bitcoinjs/bip39 library instead of custom implementation
    var bip39 = bitcoinjs.bip39;
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
    var qrLocked = false;
    var lockedQrField = null;
    var qrFieldInfo = null; // Logical tracking of what QR is showing
    
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
    DOM.entropyHashWarning = DOM.entropyContainer.find(".entropy-hash-warning");
    DOM.entropySha256Display = DOM.entropyContainer.find(".entropy-sha256-display");
    DOM.entropySha256 = DOM.entropyContainer.find(".entropy-sha256");
    DOM.phrase = $(".phrase");
    DOM.mnemonicType = $(".mnemonic-type");
    DOM.mnemonicLabel = $(".mnemonic-label");
    DOM.seedLabel = $("label[for='seed']");
    DOM.passphraseLabel = $("label[for='passphrase']");
    DOM.electrumTabs = $("#electrum-legacy-tab, #electrum-segwit-tab");
    DOM.electrumTabPanels = $(".electrum-tab-panel");
    DOM.electrumLegacyTab = $("#electrum-legacy-tab");
    DOM.electrumSegwitTab = $("#electrum-segwit-tab");
    DOM.electrumLegacyAccountXprv = $("#account-xprv-electrum-legacy");
    DOM.electrumLegacyAccountXpub = $("#account-xpub-electrum-legacy");
    DOM.electrumSegwitAccountXprv = $("#account-xprv-electrum-segwit");
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
    DOM.clearAll = $("#clearAll");
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
    DOM.nip06tab = $("#nip06-tab");
    DOM.nip06panel = $("#nip06");
    DOM.nip06path = $("#bip32-path-nip06");
    DOM.nip06purpose = $("#purpose-nip06");
    DOM.nip06coin = $("#coin-nip06");
    DOM.nip06account = $("#account-nip06");
    DOM.nip06change = $("#change-nip06");
    DOM.nip06addressIndex = $("#address-index-nip06");
    DOM.nostrPrivateKey = $("#nostr-private-key");
    DOM.nostrPublicKey = $("#nostr-public-key");
    DOM.nostrPrivateKeyLabel = $("label[for='nostr-private-key']");
    DOM.nostrPublicKeyLabel = $("label[for='nostr-public-key']");
    DOM.nostrNpub = $("#nostr-npub");
    DOM.nostrNsec = $("#nostr-nsec");
    DOM.nostrNpubLabel = $("label[for='nostr-npub']");
    DOM.nostrNsecLabel = $("label[for='nostr-nsec']");
    DOM.showNostrInTable = $("#showNostrInTable");
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
    DOM.tableTab = $("#table-tab a");
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
    DOM.qrType = $(".qr-type");
    DOM.qrGridToggle = $("#qr-grid-toggle");
    DOM.qrGridOverlay = $("#qr-grid-overlay");
    DOM.showQrEls = $("[data-show-qr]");

    function generateCsvContent() {
        var tableCsv = "path,address,public key,private key\n";
        var rows = DOM.addresses.find("tr");
        for (var i=0; i<rows.length; i++) {
            var row = $(rows[i]);
            var cells = row.find("td");
            for (var j=0; j<cells.length; j++) {
                var cell = $(cells[j]);
                var cellText = cell.text();
                if (!cell.children().hasClass("invisible")) {
                    tableCsv = tableCsv + cellText;
                }
                if (j != cells.length - 1) {
                    tableCsv = tableCsv + ",";
                }
            }
            tableCsv = tableCsv + "\n";
        }
        
        // Remove any trailing newline that might create an extra empty row
        return tableCsv.trim();
    }

    function createCsvContainer(tableCsv) {
        $('.csv-data-container').remove();
        $('.addresses-type.tab-content').append(`
            <div class="csv-data-container" style="
                background: var(--input-bg);
                color: var(--text-color);
                padding: 10px 20px;
                border: 1px solid var(--input-border);
                border-radius: 5px;
                font-family: monospace;
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                ">
                    <h6 style="color: var(--text-color); margin: 0;">CSV Export Data:</h6>
                    <button onclick="copyCSVData()" style="
                        background: transparent;
                        border: 1px solid var(--border-color);
                        color: var(--text-color);
                        padding: 4px 8px;
                        border-radius: 6px;
                        font-size: 12px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        transition: background-color 0.2s ease;
                    " onmouseover="this.style.backgroundColor='var(--input-bg)'" onmouseout="this.style.backgroundColor='transparent'">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path>
                            <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>
                        </svg>
                        Copy
                    </button>
                </div>
                <div style="
                    background: var(--code-bg, #f6f8fa);
                    border-radius: 6px;
                    padding: 6px 16px 0 16px;
                    border: 1px solid var(--code-border, #e1e4e8);
                    position: relative;
                ">
                    <textarea style="
                        width: 100%;
                        height: 100%;
                        min-height: 200px;
                        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
                        font-size: 13px;
                        background: transparent;
                        color: var(--code-text, #24292e);
                        border: 0;
                        outline: none;
                        resize: none;
                        white-space: pre;
                        overflow-x: auto;
                        overflow-y: auto;
                        line-height: 1.45;
                        padding: 0;
                        box-sizing: border-box;
                        display: block;
                        margin: 0;
                    " readonly id="csv-textarea">${tableCsv}</textarea>
                </div>
                <small style="color: var(--text-color); opacity: 0.7; display: block; margin: 5px 0 0 0; font-size: 11px;">
                    Copy the CSV data above to save to a file or import into spreadsheet software.
                </small>
            </div>
        `);
        
        // Auto-expand textarea to fit content
        setTimeout(function() {
            var textarea = document.getElementById('csv-textarea');
            if (textarea) {
                textarea.style.height = 'auto';
                var contentHeight = textarea.scrollHeight;
                var minHeight = 200;
                var finalHeight = Math.max(minHeight, contentHeight + 10);
                textarea.style.height = finalHeight + 'px';
            }
        }, 100);
    }

    // Global function for copy button
    window.copyCSVData = function() {
        var textarea = document.getElementById('csv-textarea');
        if (textarea) {
            try {
                // Use modern Clipboard API if available (doesn't select text)
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(textarea.value);
                } else {
                    // Fallback: briefly select and copy, then deselect
                    textarea.select();
                    textarea.setSelectionRange(0, 99999);
                    document.execCommand('copy');
                    // Clear selection immediately
                    textarea.setSelectionRange(0, 0);
                    textarea.blur();
                }
                
                // Show feedback by temporarily changing button text
                var button = event.target.closest('button');
                var originalHTML = button.innerHTML;
                button.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
                    </svg>
                    Copied!
                `;
                
                setTimeout(function() {
                    button.innerHTML = originalHTML;
                }, 2000);
                
            } catch (err) {
                console.error('Failed to copy text: ', err);
                
                // Fallback: show instructions
                var button = event.target.closest('button');
                var originalHTML = button.innerHTML;
                button.innerHTML = 'Select All & Copy';
                setTimeout(function() {
                    button.innerHTML = originalHTML;
                }, 2000);
            }
        }
    };

    function updateCsvIfVisible() {
        // Only update CSV if CSV tab is currently active
        if (DOM.csvTab.hasClass('active')) {
            var tableCsv = generateCsvContent();
            
            // Check if container already exists, if so just update the content
            var existingTextarea = document.getElementById('csv-textarea');
            if (existingTextarea) {
                existingTextarea.value = tableCsv;
                
                // Force immediate refresh and resize
                setTimeout(function() {
                    existingTextarea.style.height = 'auto';
                    var contentHeight = existingTextarea.scrollHeight;
                    var minHeight = 200;
                    var finalHeight = Math.max(minHeight, contentHeight + 10);
                    existingTextarea.style.height = finalHeight + 'px';
                }, 10);
            } else {
                createCsvContainer(tableCsv);
            }
        }
    }

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
        DOM.qrType.on("change", qrTypeChanged);
        DOM.qrGridToggle.on("click", toggleQrGrid);
        DOM.qrContainer.on("click", function(e) {
            // Close QR if clicking anywhere except the grid toggle button
            if (!$(e.target).closest("#qr-grid-toggle").length) {
                destroyQr();
                showQr = false;
                qrLocked = false;
                lockedQrField = null;
                qrFieldInfo = null;
            }
        });
        DOM.showSplitMnemonic.on("change", toggleSplitMnemonic);
        DOM.passphrase.on("input", delayedPhraseChanged);
        DOM.generate.on("click", generateClicked);
        DOM.clearAll.on("click", clearAllClicked);
        DOM.more.on("click", showMore);
        DOM.seed.on("input", delayedSeedChanged);
        DOM.rootKey.on("input", delayedRootKeyChanged);
        DOM.showBip85.on('change', toggleBip85);
        DOM.showNostrInTable.on('change', calcForDerivationPath);
        DOM.bip32path.on("input", calcForDerivationPath);
        DOM.bip44account.on("input", calcForDerivationPath);
        DOM.bip44change.on("input", calcForDerivationPath);
        DOM.bip49account.on("input", calcForDerivationPath);
        DOM.bip49change.on("input", calcForDerivationPath);
        DOM.bip84account.on("input", calcForDerivationPath);
        DOM.bip84change.on("input", calcForDerivationPath);
        DOM.bip86account.on("input", calcForDerivationPath);
        DOM.bip86change.on("input", calcForDerivationPath);
        DOM.nip06account.on("input", calcForDerivationPath);
        DOM.nip06addressIndex.on("input", calcForDerivationPath);
        DOM.bip85application.on('input', calcBip85);
        DOM.bip85mnemonicLanguage.on('change', calcBip85);
        DOM.bip85mnemonicLength.on('change', calcBip85);
        DOM.bip85index.on('input', calcBip85);
        DOM.bip85bytes.on('input', calcBip85);
        DOM.bip141path.on("input", calcForDerivationPath);
        DOM.bip141semantics.on("change", tabChanged);
        DOM.tab.on("shown.bs.tab", function(e) {
            // Fix Bootstrap active class management for initially hidden tabs (Electrum)
            if (e.target.href.includes("electrum-")) {
                DOM.electrumTabs.removeClass("active");
                $(e.target).parent().addClass("active");
            }
            
            tabChanged();
        });
        // Remove duplicate Electrum tab handlers since they're already handled by DOM.tab
        DOM.hardenedAddresses.on("change", calcForDerivationPath);
        DOM.electrumLegacyChange.on("change", electrumChangeAddressToggled);
        DOM.electrumSegwitChange.on("change", electrumChangeAddressToggled);
        DOM.useBip38.on("change", calcForDerivationPath);
        DOM.bip38Password.on("change", calcForDerivationPath);
        DOM.indexToggle.on("click", toggleIndexes);
        DOM.addressToggle.on("click", toggleAddresses);
        DOM.publicKeyToggle.on("click", togglePublicKeys);
        DOM.privateKeyToggle.on("click", togglePrivateKeys);

        DOM.csvTab.on("click", function(e) {
            // Manually handle tab switching for Bootstrap 5
            $('.addresses-type .nav-link').removeClass('active');
            $('.addresses-type .tab-pane').removeClass('active show');
            $(this).addClass('active');
            $('#table').removeClass('active show');
            
            var tableCsv = generateCsvContent();
            createCsvContainer(tableCsv);
        });
        // Also listen for Bootstrap 5 tab shown event
        DOM.csvTab.on("shown.bs.tab", function(e) {
            updateCsv();
        });
        
        // Handle Table tab click
        DOM.tableTab.on("click", function(e) {
            $('.addresses-type .nav-link').removeClass('active');
            $('.addresses-type .tab-pane').removeClass('active show');
            $(this).addClass('active');
            $('#table').addClass('active show');
            $('.csv-data-container').remove();
        });
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
            // Try to get entropy from mnemonic (if valid)
            var phraseValue = DOM.phrase.val();
            var entropy = null;
            try {
                if (bip39.validateMnemonic(phraseValue)) {
                    entropy = bip39.mnemonicToEntropy(phraseValue);
                }
            } catch (e) {
                // Invalid mnemonic, entropy will remain null
            }
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
        // Normalize whitespace before seed generation
        phrase = phrase.trim().replace(/\s+/g, ' ');
        // Calculate and display
        var passphrase = DOM.passphrase.val();
        calcBip32RootKeyFromSeed(phrase, passphrase);
        calcForDerivationPath();
        calcBip85();
        // Show the word indexes
        showWordIndexes();
        writeSplitPhrase(phrase);

        // Update QR code if it's currently displayed
        updateQrIfNeeded();
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
                clearAddressesList();
                clearKeys();
                // Don't hide validation error if it's showing the entropy minimum message
                var currentFeedback = DOM.feedback.text();
                if (currentFeedback !== "128 bits minimum entropy required") {
                    hideValidationError();
                }
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

        // Update QR code if it's currently displayed
        updateQrIfNeeded();
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

        // Update QR code if it's currently displayed
        updateQrIfNeeded();
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
            // Hide BIP tabs (including NIP06) and show Electrum tabs
            $("#bip32-tab, #bip44-tab, #bip49-tab, #bip84-tab, #bip141-tab, #bip86-tab, #nip06-tab").addClass("hidden").removeClass("active");
            // Remove active class from BIP tab links
            $("#bip32-tab a, #bip44-tab a, #bip49-tab a, #bip84-tab a, #bip141-tab a, #bip86-tab a, #nip06-tab a").removeClass("active");
            // Hide BIP tab content panels
            $("#bip32, #bip44, #bip49, #bip84, #bip141, #bip86, #nip06").removeClass("active");
            DOM.electrumTabs.removeClass("hidden").show();
            // Activate first Electrum tab by default
            DOM.electrumLegacyTab.addClass("active");
            DOM.electrumLegacyTab.find("a").tab("show");
            // Hide SegWit fields initially (since Legacy is default)
            $("#electrum-segwit form").addClass("hidden");
            // Set initial derivation path for Electrum Legacy
            DOM.electrumLegacyPath.val("m/");
            $("#electrum-legacy form").removeClass("hidden");
            // Spacer removed
            
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
            
            // Show Electrum description, hide BIP39 description
            $(".bip39-description, .bip39-spec-link").addClass("hidden");
            $(".electrum-description, .electrum-spec-link").removeClass("hidden");
        } else {
            DOM.mnemonicLabel.text("BIP39");
            DOM.seedLabel.text("BIP39 Seed");
            DOM.passphraseLabel.text("BIP39 Passphrase (optional)");
            // Show BIP tabs (including NIP06) and hide Electrum tabs
            $("#bip32-tab, #bip44-tab, #bip49-tab, #bip84-tab, #bip141-tab, #bip86-tab, #nip06-tab").removeClass("hidden");
            DOM.electrumTabs.addClass("hidden").hide();
            DOM.electrumTabPanels.removeClass("active");
            // Remove active class from Electrum tabs
            DOM.electrumLegacyTab.removeClass("active");
            DOM.electrumSegwitTab.removeClass("active");
            // Remove active class from Electrum tab links
            $("#electrum-legacy-tab a, #electrum-segwit-tab a").removeClass("active");
            // Hide Electrum form content
            $("#electrum-legacy form, #electrum-segwit form").addClass("hidden");
            // Spacer removed
            // Reactivate BIP44 tab as default
            $("#bip44-tab").addClass("active");
            $("#bip44-tab a").addClass("active");
            $("#bip44").addClass("active show");
            $("#bip44-tab a").tab("show");
            
            // Re-enable BIP39 fields
            $(".entropy-container, .passphrase, .splitMnemonic").removeClass("disabled-for-electrum");
            $(".entropy-container input, .entropy-container select, .passphrase, .phraseSplit").prop("disabled", false);
            $(".seed, .root-key, .fingerprint").prop("readonly", false).removeClass("electrum-generated");
            
            // Restore all mnemonic length options for BIP39
            DOM.generatedStrength.find("option").removeClass("hidden");
            
            // Show BIP39 description, hide Electrum description
            $(".electrum-description, .electrum-spec-link").addClass("hidden");
            $(".bip39-description, .bip39-spec-link").removeClass("hidden");
        }
        
        // Trigger phrase validation/processing if there's existing content
        delayedPhraseChanged();
    }

    function qrTypeChanged() {
        var qrType = DOM.qrType.val();

        // Show/hide grid button based on QR format
        if (qrType === "seedqr-standard" || qrType === "seedqr-compact") {
            DOM.qrGridToggle.removeClass("hidden");
        } else {
            DOM.qrGridToggle.addClass("hidden");
            // Hide grid if it's currently visible
            var canvas = DOM.qrGridOverlay[0];
            if (canvas.style.display !== "none") {
                canvas.style.display = "none";
                DOM.qrGridToggle.text("Show Grid").removeClass("btn-secondary").addClass("btn-outline-secondary");
                $('.qr-content-container').css('padding', '0');
            }
        }

        // Regenerate QR if it's currently visible and showing mnemonic field
        if (!DOM.qrContainer.hasClass("hidden")) {
            // Check if the mnemonic field is the current QR source
            var mnemonicValue = DOM.phrase.val();
            if (mnemonicValue) {
                // Clear existing QR
                DOM.qrImage.text("");
                // Regenerate QR with new format
                var mockEvent = { target: DOM.phrase[0] };
                createQr(mockEvent);

                // Redraw grid if it's currently visible and SeedQR format
                var canvas = DOM.qrGridOverlay[0];
                if (canvas.style.display !== "none" && (qrType === "seedqr-standard" || qrType === "seedqr-compact")) {
                    // Wait for QR to be generated, then redraw grid
                    setTimeout(function() {
                        drawQrGrid();
                    }, 100);
                }
            }
        }
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

    // Cache for Electrum seed and master keys to avoid expensive recalculation
    var electrumCache = {
        phrase: null,
        passphrase: null,
        prefix: null,
        isSegwit: null,
        seedBuffer: null,
        masterKey: null
    };

    // Generate Electrum addresses using proper Electrum derivation method with caching
    function generateElectrumAddressData(phrase, passphrase, index) {
        var prefix = getElectrumPrefixFromTab();
        var isSegwit = electrumSegwitTabSelected();
        
        try {
            var masterKey;
            
            // Check if we can use cached seed and master key
            if (electrumCache.phrase === phrase && 
                electrumCache.passphrase === passphrase && 
                electrumCache.prefix === prefix && 
                electrumCache.isSegwit === isSegwit && 
                electrumCache.seedBuffer && 
                electrumCache.masterKey) {
                // Use cached values
                masterKey = electrumCache.masterKey;
            } else {
                // Generate new seed and master key
                var seedBuffer = electrumMnemonic.mnemonicToSeedSync(phrase, { 
                    passphrase: passphrase || "",
                    prefix: prefix 
                });
                
                // Create master key from Electrum seed - use correct network for each type
                var keyNetwork = isSegwit ? network : bitcoinjs.bitcoin.networks.bitcoin;
                masterKey = bitcoinjs.bip32.fromSeed(seedBuffer, keyNetwork);
                
                // Cache the results
                electrumCache.phrase = phrase;
                electrumCache.passphrase = passphrase;
                electrumCache.prefix = prefix;
                electrumCache.isSegwit = isSegwit;
                electrumCache.seedBuffer = seedBuffer;
                electrumCache.masterKey = masterKey;
            }
            
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
        else if (nip06TabSelected()) {
            displayNip06Info();
        }
        displayBip32Info();

        // Update CSV if CSV tab is currently visible - delay to ensure table is updated
        setTimeout(function() {
            updateCsvIfVisible();
        }, 500);

        // Update QR after table has time to populate
        setTimeout(function() {
            updateQrIfNeeded();
        }, 600);
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
            
            // Update CSV if CSV tab is currently visible - additional delay to ensure table is updated
            setTimeout(function() {
                updateCsvIfVisible();
            }, 500);
        }, 50);
    }

    function clearAllClicked() {
        // First, disable auto-computation to prevent interference
        DOM.autoCompute.prop("checked", false);
        
        // Clear all computed output fields FIRST to prevent seed validation errors
        DOM.seed.val("");
        seed = null;  // Set global seed variable to null
        clearKeys();  // Use existing function instead of manual clearing
        DOM.fingerprint.val("");
        
        // Clear the mnemonic phrase
        DOM.phrase.val("");
        
        // Clear passphrase
        DOM.passphrase.val("");
        
        // Reset entropy inputs
        DOM.entropy.val("");
        DOM.entropyMnemonicLength.val("raw");
        DOM.entropyContainer.find("input[name='entropy-type'][value='hexadecimal']").prop('checked', true);
        
        // Don't change mnemonic type - let user keep their current selection (BIP39 or Electrum)
        
        // Reset word strength to default (24)
        DOM.generatedStrength.val("24");
        
        // Reset BIP derivation values to defaults
        DOM.bip44account.val("0");
        DOM.bip44change.val("0");
        DOM.bip49account.val("0");
        DOM.bip49change.val("0");
        DOM.bip84account.val("0");
        DOM.bip84change.val("0");
        DOM.bip86account.val("0");
        DOM.bip86change.val("0");
        DOM.nip06account.val("0");
        
        // Reset network to Bitcoin (index 0 in networks array)
        DOM.network.val("0");
        // Clear addresses list using built-in function
        clearAddressesList();
        
        // Reset BIP85 fields to defaults
        DOM.bip85application.val("bip39");
        DOM.bip85mnemonicLength.val("12");
        DOM.bip85index.val("0");
        DOM.bip85bytes.val("64");
        DOM.bip85Field.val("");
        
        // Reset split mnemonic to default (unchecked)
        DOM.showSplitMnemonic.prop("checked", false);
        DOM.phraseSplit.val("");
        // Trigger the split mnemonic toggle to hide the field
        toggleSplitMnemonic();
        
        // Language is reset by default (English is the default/only option)
        
        // BIP44 account keys already cleared by clearKeys() above
        
        // Reset derivation path field ONLY for the currently active tab
        if (DOM.mnemonicType.val() === "electrum") {
            if (electrumLegacyTabSelected()) {
                DOM.electrumLegacyPath.val("m/");
            } else if (electrumSegwitTabSelected()) {
                DOM.electrumSegwitPath.val("m/0'");
            }
        } else {
            // BIP39 mode - reset path only for the currently active tab
            if (bip44TabSelected()) {
                DOM.bip44path.val("m/44'/0'/0'/0");
            } else if (bip49TabSelected()) {
                DOM.bip49path.val("m/49'/0'/0'/0");
            } else if (bip84TabSelected()) {
                DOM.bip84path.val("m/84'/0'/0'/0");
            } else if (bip86TabSelected()) {
                DOM.bip86path.val("m/86'/0'/0'/0");
            } else if (bip141TabSelected()) {
                DOM.bip141path.val("m/0");
            } else if (nip06TabSelected()) {
                // NIP06 path is handled internally
            } else if (bip32TabSelected()) {
                DOM.bip32path.val("m/0");
            }
        }
        
        // Clear NIP06 fields
        DOM.nostrPrivateKey.val("");
        DOM.nostrPublicKey.val("");
        DOM.nostrNpub.val("");
        DOM.nostrNsec.val("");
        
        // Reset other checkboxes to defaults
        DOM.privacyScreenToggle.prop("checked", false);
        DOM.showNostrInTable.prop("checked", false);
        
        // Use built-in functions for cleanup
        hidePending();  // Hide any pending/loading states
        hideValidationError();  // Hide any validation errors
        stopGenerating();  // Stop any ongoing generation processes
        
        // Clear remaining manual fields
        DOM.hardenedAddresses.prop("checked", false);
        DOM.useBip38.prop("checked", false);
        DOM.bip38Password.val("");
        
        // Clear addresses table and CSV
        DOM.addresses.empty();
        DOM.csv.val("");
        
        // Don't force tab switching - let user keep their current tab active
        
        // Clear any error/warning displays  
        hidePending();
        // DOM.feedback is already handled by hideValidationError() above
        DOM.entropyHashWarning.addClass("hidden");
        
        // Clear entropy display
        DOM.entropyBits.text("");
        DOM.entropyBinary.text("");
        
        // Stop any ongoing generation processes
        stopGenerating();
        
        // Clear any timeouts that might refill fields
        if (typeof phraseChangeTimeoutEvent !== 'undefined') {
            clearTimeout(phraseChangeTimeoutEvent);
        }
        
        // Trigger privacy screen toggle to ensure correct state
        privacyScreenToggled();
        
        // Re-enable auto compute after a delay to ensure clearing is complete
        setTimeout(function() {
            DOM.autoCompute.prop("checked", true);
        }, 200);
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
            var words = bip39.entropyToMnemonic(uint8ArrayToHex(data));
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
            // Use BIP39 seed generation with official bitcoinjs/bip39 library
            var seedBuffer = bip39.mnemonicToSeedSync(phrase, passphrase || "");
            seed = seedBuffer.toString('hex');
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
            // Preprocess the words (normalize whitespace)
            phrase = phrase.trim().replace(/\s+/g, ' ');
            var words = phraseToWordArray(phrase);
            // Detect blank phrase
            if (words.length == 0) {
                return "Blank mnemonic";
            }
            // Check each word
            for (var i=0; i<words.length; i++) {
                var word = words[i];
                var language = getLanguage();
                var wordlist = bip39.wordlists[language];
                if (wordlist.indexOf(word) == -1) {
                    console.log("Finding closest match to " + word);
                    var nearestWord = findNearestWord(word);
                    return word + " not in wordlist, did you mean " + nearestWord + "?";
                }
            }
            // Check the words are valid using official bip39 library
            var properPhrase = wordArrayToPhrase(words);
            var isValid = bip39.validateMnemonic(properPhrase);
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
        else if (nip06TabSelected()) {
            var purpose = parseIntNoNaN(DOM.nip06purpose.val(), 44);
            var coin = parseIntNoNaN(DOM.nip06coin.val(), 1237);
            var account = parseIntNoNaN(DOM.nip06account.val(), 0);
            var change = parseIntNoNaN(DOM.nip06change.val(), 0);
            var addressIndex = parseIntNoNaN(DOM.nip06addressIndex.val(), 0);
            
            var derivationPath = "m/";
            derivationPath += purpose + "'/";
            derivationPath += coin + "'/";
            derivationPath += account + "'/";
            derivationPath += change + "/";
            derivationPath += addressIndex;
            DOM.nip06path.val(derivationPath);
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
        
        // For Electrum Legacy, the account extended keys are at ROOT level (m/)
        var accountXprv = legacyRootKey.toBase58();
        var accountXpub = legacyRootKey.neutered().toBase58();
        DOM.electrumLegacyAccountXprv.val(accountXprv);
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
        var accountXprv = accountExtendedKey.toBase58();
        var accountXpub = accountExtendedKey.neutered().toBase58();
        DOM.electrumSegwitAccountXprv.val(accountXprv);
        DOM.electrumSegwitAccountXpub.val(accountXpub);
    }

    function displayNip06Info() {
        // Get the derivation path for NIP-06
        var purpose = parseIntNoNaN(DOM.nip06purpose.val(), 44);
        var coin = parseIntNoNaN(DOM.nip06coin.val(), 1237);
        var account = parseIntNoNaN(DOM.nip06account.val(), 0);
        var change = parseIntNoNaN(DOM.nip06change.val(), 0);
        var addressIndex = parseIntNoNaN(DOM.nip06addressIndex.val(), 0);
        
        // Build the full NIP-06 derivation path: m/44'/1237'/account'/0/addressIndex
        var path = "m/";
        path += purpose + "'/";
        path += coin + "'/";
        path += account + "'/";
        path += change + "/";
        path += addressIndex;
        
        // Calculate the key at the full derivation path
        var nostrKey = calcBip32ExtendedKey(path);
        
        // Get the raw private and public keys (32 bytes each)
        var privateKeyHex = nostrKey.privateKey.toString('hex');
        var publicKeyHex = nostrKey.publicKey.slice(1).toString('hex'); // Remove the 0x02/0x03 prefix for Nostr
        
        // Display the hex keys
        DOM.nostrPrivateKey.val(privateKeyHex);
        DOM.nostrPublicKey.val(publicKeyHex);
        
        // Update labels with current account number
        DOM.nostrPrivateKeyLabel.text("Account " + account + " Nostr Private Key (hex)");
        DOM.nostrPublicKeyLabel.text("Account " + account + " Nostr Public Key (hex)");
        DOM.nostrNpubLabel.text("Account " + account + " npub (Bech32)");
        DOM.nostrNsecLabel.text("Account " + account + " nsec (Bech32)");
        
        // Generate npub and nsec using bech32 encoding
        try {
            var npub = bech32EncodeNostr('npub', publicKeyHex);
            var nsec = bech32EncodeNostr('nsec', privateKeyHex);
            DOM.nostrNpub.val(npub);
            DOM.nostrNsec.val(nsec);
        } catch(e) {
            DOM.nostrNpub.val("Error: " + e.message);
            DOM.nostrNsec.val("Error: " + e.message);
        }
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
                            // Update QR code if it's currently displayed
                            updateQrIfNeeded();
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
                            // Update QR code if it's currently displayed
                            updateQrIfNeeded();
                        }
                        return;
                    }
                }

                // Standard BIP39 derivation for non-Electrum mode
                var key = "NA";
                if (nip06TabSelected()) {
                    // For NIP06, derive the full path with account number from table index
                    var nip06Path = "m/44'/1237'/" + index + "'/0/" + parseIntNoNaN(DOM.nip06addressIndex.val(), 0);
                    key = calcBip32ExtendedKey(nip06Path);
                } else if (useHardenedAddresses) {
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
                if (nip06TabSelected()) {
                    var indexText = "m/44'/1237'/" + index + "'/0/" + parseIntNoNaN(DOM.nip06addressIndex.val(), 0);
                } else {
                    var indexText = getDerivationPath() + "/" + index;
                    if (useHardenedAddresses) {
                        indexText = indexText + "'";
                    }
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

                // Convert to Nostr format if checkbox is checked and we're on NIP06 tab
                if (nip06TabSelected() && DOM.showNostrInTable.prop('checked')) {
                    try {
                        // For NIP06, convert hex pubkey to npub and WIF privkey to nsec
                        if (pubkey && pubkey.length >= 66) {
                            // Remove 02/03 prefix and get raw 32-byte public key
                            var rawPubkey = pubkey.substring(2);
                            // Ensure exactly 64 characters (32 bytes)
                            if (rawPubkey.length === 64) {
                                pubkey = bech32EncodeNostr("npub", rawPubkey);
                            }
                        }
                        if (privkey && privkey !== "NA" && hasPrivkey) {
                            // Decode WIF to get raw private key
                            var keyPair = bitcoinjs.ECPair.fromWIF(privkey, network);
                            var rawPrivkey = bitcoinjs.buffer.Buffer.from(keyPair.privateKey).toString('hex');
                            // Ensure exactly 64 characters (32 bytes)
                            if (rawPrivkey.length === 64) {
                                privkey = bech32EncodeNostr("nsec", rawPrivkey);
                            }
                        }
                    } catch (e) {
                        console.error("Error converting to Nostr format:", e);
                        console.error("pubkey length:", pubkey ? pubkey.length : "undefined");
                        console.error("privkey:", privkey);
                    }
                }

                addAddressToList(indexText, address, pubkey, privkey);
                if (isLast) {
                    hidePending();
                    updateCsv();
                    // Regenerate QR if it was showing a table element
                    if (!DOM.qrContainer.hasClass("hidden") && lockedQrField && $(lockedQrField).closest(".addresses").length > 0) {
                        var mockEvent = { target: lockedQrField };
                        createQr(mockEvent);
                    }
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
        
        // Update CSV if CSV tab is currently visible - delay to ensure table rows are added
        setTimeout(function() {
            updateCsvIfVisible();
        }, 500);
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
        DOM.electrumLegacyAccountXprv.val("");
        DOM.electrumLegacyAccountXpub.val("");
        DOM.electrumSegwitAccountXprv.val("");
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

    // Encode Nostr keys using bech32 (npub/nsec format)
    function bech32EncodeNostr(hrp, hexKey) {
        // Convert hex string to bytes array
        var keyBytes = [];
        for (var i = 0; i < hexKey.length; i += 2) {
            keyBytes.push(parseInt(hexKey.substr(i, 2), 16));
        }
        
        // Use the bech32 library from libs global
        if (typeof libs !== 'undefined' && libs.bech32) {
            try {
                var words = libs.bech32.toWords(keyBytes);
                return libs.bech32.encode(hrp, words);
            } catch (e) {
                throw new Error("Bech32 encoding failed: " + e.message);
            }
        } else {
            throw new Error("bech32 library not available");
        }
    }

    function showPending() {
        DOM.feedback
            .text("Calculating...")
            .show();
    }

    function findNearestWord(word) {
        var language = getLanguage();
        var words = bip39.wordlists[language];
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
            // BIP39 supported languages
            var supportedLanguages = ['english', 'japanese', 'chinese_simplified', 'chinese_traditional', 'french', 'italian', 'korean', 'spanish', 'czech', 'portuguese'];
            for (var j=0; j<supportedLanguages.length; j++) {
                var l = supportedLanguages[j];
                // Track how many words match in this language
                languageMatches[l] = 0;
                var wordlist = bip39.wordlists[l];
                for (var i=0; i<words.length; i++) {
                    var wordInLanguage = wordlist.indexOf(words[i]) > -1;
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
        var supportedLanguages = ['english', 'japanese', 'chinese_simplified', 'chinese_traditional', 'french', 'italian', 'korean', 'spanish', 'czech', 'portuguese'];
        for (var i = 0; i < supportedLanguages.length; i++) {
            var language = supportedLanguages[i];
            if (window.location.hash.indexOf(language) > -1) {
                return language;
            }
        }
        return "";
    }

    function setMnemonicLanguage() {
        var language = getLanguage();
        // Set the default wordlist for the bip39 library
        if (language && bip39.wordlists[language]) {
            bip39.setDefaultWordlist(language);
        }
    }

    function convertPhraseToNewLanguage() {
        var oldLanguage = getLanguageFromPhrase();
        var newLanguage = getLanguageFromUrl();
        var oldPhrase = DOM.phrase.val();
        var oldWords = phraseToWordArray(oldPhrase);
        var newWords = [];
        for (var i=0; i<oldWords.length; i++) {
            var oldWord = oldWords[i];
            var oldWordlist = bip39.wordlists[oldLanguage];
            var newWordlist = bip39.wordlists[newLanguage];
            var index = oldWordlist.indexOf(oldWord);
            var newWord = newWordlist[index];
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
        
        // Check for minimum entropy requirement early (128 bits for 12 words)
        var bitsToUse = Math.floor(entropy.binaryStr.length / 32) * 32;
        if (bitsToUse < 128) {
            // Still show entropy feedback but don't generate mnemonic
            showEntropyFeedback(entropy);
            // Clear phrase and addresses
            DOM.phrase.val("");
            writeSplitPhrase("");
            clearAddressesList();
            clearKeys();
            // Show the validation error AFTER all other operations
            setTimeout(function() {
                showValidationError("128 bits minimum entropy required");
            }, 10);
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
        
        // If entropy exceeds BIP39 maximum, hash it down to 256 bits
        if (bits.length > 256) {
            var hash = sjcl.hash.sha256.hash(entropy.cleanStr);
            var hex = sjcl.codec.hex.fromBits(hash);
            bits = bitcoinjs.BigInteger.BigInteger.parse(hex, 16).toString(2);
            while (bits.length % 256 != 0) {
                bits = "0" + bits;
            }
            bitsToUse = 256; // Use all 256 bits from hash
            // Show warning that entropy was hashed
            DOM.entropyHashWarning.removeClass('hidden');
            // Show the SHA256 hashed entropy field and display the hex value
            DOM.entropySha256Display.removeClass('hidden');
            DOM.entropySha256.val(hex);
        } else {
            // Hide hash warning and SHA256 field if entropy is within limits
            DOM.entropyHashWarning.addClass('hidden');
            DOM.entropySha256Display.addClass('hidden');
            DOM.entropySha256.val('');
        }
        
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
        var phrase = bip39.entropyToMnemonic(uint8ArrayToHex(entropyArr));
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
        DOM.entropyHashWarning.addClass('hidden');
        DOM.entropySha256Display.addClass('hidden');
        DOM.entropySha256.val('');
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
        els.on("mouseenter", function(e) {
            if (!qrLocked) {
                createQr(e);
            }
        });
        els.on("mouseleave", function() {
            if (!qrLocked) {
                destroyQr();
            }
        });
        els.on("click", function(e) {
            toggleQr(e);
        });
    }

    function generateStandardSeedQR(mnemonicPhrase) {
        try {
            // Split the mnemonic into words and trim whitespace
            var words = mnemonicPhrase.trim().split(/\s+/);

            // Validate word count (12 or 24 words for SeedQR)
            if (words.length !== 12 && words.length !== 24) {
                throw new Error("SeedQR requires 12 or 24 word mnemonic");
            }

            // Get the BIP39 wordlist for current language
            var language = getLanguage();
            var wordlist = bip39.wordlists[language];
            var indices = [];

            // Convert each word to its index in the wordlist
            for (var i = 0; i < words.length; i++) {
                var word = words[i].toLowerCase();
                var index = wordlist.indexOf(word);
                if (index === -1) {
                    throw new Error("Invalid word in mnemonic: " + word);
                }
                // Convert to 4-digit zero-padded string
                indices.push(index.toString().padStart(4, '0'));
            }

            // Concatenate all indices into one numeric string
            return indices.join('');
        } catch (error) {
            console.error("SeedQR Standard encoding error:", error);
            return mnemonicPhrase; // Fallback to raw text
        }
    }

    function generateCompactSeedQR(mnemonicPhrase) {
        try {
            // Split the mnemonic into words and trim whitespace
            var words = mnemonicPhrase.trim().split(/\s+/);

            // Validate word count (12 or 24 words for SeedQR)
            if (words.length !== 12 && words.length !== 24) {
                throw new Error("SeedQR requires 12 or 24 word mnemonic");
            }

            // Get the BIP39 wordlist for current language
            var language = getLanguage();
            var wordlist = bip39.wordlists[language];
            var indices = [];

            // Convert each word to its index in the wordlist
            for (var i = 0; i < words.length; i++) {
                var word = words[i].toLowerCase();
                var index = wordlist.indexOf(word);
                if (index === -1) {
                    throw new Error("Invalid word in mnemonic: " + word);
                }
                indices.push(index);
            }

            // For CompactSeedQR, we need to convert to binary and remove checksum bits
            var binaryString = '';
            for (var i = 0; i < indices.length; i++) {
                // Convert each index to 11-bit binary string
                var binary = indices[i].toString(2).padStart(11, '0');
                binaryString += binary;
            }

            // Remove checksum bits from the end
            var checksumBits;
            if (words.length === 12) {
                checksumBits = 4; // 12-word seed has 4 checksum bits
            } else if (words.length === 24) {
                checksumBits = 8; // 24-word seed has 8 checksum bits
            }

            // Remove checksum bits from the end of binary string
            var entropyBits = binaryString.slice(0, -checksumBits);

            // Convert entropy bits to bytes for QR encoding
            var bytes = [];
            for (var i = 0; i < entropyBits.length; i += 8) {
                var byte = entropyBits.substr(i, 8);
                if (byte.length === 8) {
                    bytes.push(parseInt(byte, 2));
                }
            }

            // Return as Uint8Array for proper binary encoding
            return new Uint8Array(bytes);
        } catch (error) {
            console.error("SeedQR Compact encoding error:", error);
            return mnemonicPhrase; // Fallback to raw text
        }
    }

    function createQr(e) {
        var content = e.target.textContent || e.target.value;
        if (content) {
            var qrContent = content;

            // Check if this is the mnemonic field and if SeedQR format is selected
            var isMnemonicField = $(e.target).hasClass("phrase");

            // Show/hide grid button based on field type and QR format
            if (isMnemonicField) {
                var qrType = DOM.qrType.val();
                if (qrType === "seedqr-standard" || qrType === "seedqr-compact") {
                    DOM.qrGridToggle.removeClass("hidden");
                } else {
                    DOM.qrGridToggle.addClass("hidden");
                }
            } else {
                // For non-mnemonic fields, hide grid button
                DOM.qrGridToggle.addClass("hidden");
            }
            var qrOptions = {
                errorCorrectionLevel: 'H',
                type: 'image/png',
                quality: 0.92,
                margin: 1,
                width: 310
            };

            if (isMnemonicField) {
                var qrType = DOM.qrType.val();
                if (qrType === "seedqr-standard") {
                    var numericString = generateStandardSeedQR(content);
                    qrContent = [{ data: numericString, mode: 'numeric' }];
                    qrOptions.errorCorrectionLevel = 'L'; // SeedQR uses Low error correction
                    // Force exact QR version for SeedQR compatibility
                    var wordCount = content.trim().split(/\s+/).length;
                    if (wordCount === 12) {
                        qrOptions.version = 2; // 25x25 modules for 12-word
                    } else if (wordCount === 24) {
                        qrOptions.version = 3; // 29x29 modules for 24-word
                    }
                } else if (qrType === "seedqr-compact") {
                    var binaryData = generateCompactSeedQR(content);
                    qrContent = [{ data: binaryData, mode: 'byte' }];
                    qrOptions.errorCorrectionLevel = 'L'; // SeedQR uses Low error correction
                    // Compact format uses smaller versions
                    var wordCount = content.trim().split(/\s+/).length;
                    if (wordCount === 12) {
                        qrOptions.version = 1; // V1 (21x21) for compact 12-word
                    } else if (wordCount === 24) {
                        qrOptions.version = 2; // V2 (25x25) for compact 24-word
                    }
                }
            }


            // Generate QR code using node-qrcode directly to canvas (avoids data URL caching)
            var canvas = document.createElement('canvas');
            bitcoinjs.qrcode.toCanvas(canvas, qrContent, qrOptions, function(err) {
                if (err) {
                    console.error('QR code generation error:', err);
                    return;
                }

                // Clear previous QR code
                DOM.qrImage.empty();

                // Style the canvas element
                $(canvas).css({
                    'max-width': '100%',
                    'height': 'auto'
                });

                DOM.qrImage.append(canvas);

                if (!showQr) {
                    DOM.qrHider.addClass("hidden");
                }
                else {
                    DOM.qrHider.removeClass("hidden");
                }
                DOM.qrContainer.removeClass("hidden");

                // Update grid if it's currently visible
                var gridCanvas = DOM.qrGridOverlay[0];
                if (gridCanvas.style.display !== "none") {
                    drawQrGrid();
                }
            });
        }
    }

    function destroyQr() {
        DOM.qrImage.empty();
        DOM.qrContainer.addClass("hidden");
    }

    function getQrFieldInfo(field) {
        var $field = $(field);
        var $row = $field.closest("tr");

        // Check if it's a table row element
        if ($row.length > 0 && $row.closest(".addresses").length > 0) {
            var rowIndex = $row.index();
            var cellType = "";

            if ($field.closest(".address").length > 0) cellType = "address";
            else if ($field.closest(".pubkey").length > 0) cellType = "pubkey";
            else if ($field.closest(".privkey").length > 0) cellType = "privkey";
            else if ($field.closest(".index").length > 0) cellType = "index";

            return {
                type: "table",
                rowIndex: rowIndex,
                cellType: cellType
            };
        }

        // Check for static fields by ID or class
        if ($field.hasClass("phrase") || $field.attr("id") === "phrase") {
            return { type: "phrase" };
        }
        if ($field.hasClass("seed") || $field.attr("id") === "seed") {
            return { type: "seed" };
        }
        if ($field.hasClass("root-key") || $field.attr("id") === "root-key") {
            return { type: "root-key" };
        }

        // For other fields, try to identify by ID or class
        var fieldId = $field.attr("id");
        if (fieldId) {
            return { type: "static", id: fieldId };
        }

        return { type: "unknown" };
    }

    function findFieldFromInfo(info) {
        if (!info) return null;

        if (info.type === "table") {
            var $rows = DOM.addresses.find("tr");
            if (info.rowIndex < $rows.length) {
                var $row = $rows.eq(info.rowIndex);
                var $cell = $row.find("." + info.cellType + " span");
                if ($cell.length > 0) {
                    return $cell[0];
                }
            }
        } else if (info.type === "phrase") {
            return DOM.phrase[0];
        } else if (info.type === "seed") {
            return DOM.seed[0];
        } else if (info.type === "root-key") {
            return DOM.rootKey[0];
        } else if (info.type === "static" && info.id) {
            return document.getElementById(info.id);
        }

        return null;
    }

    function updateQrIfNeeded() {
        if (!DOM.qrContainer.hasClass("hidden") && qrFieldInfo) {
            var newField = findFieldFromInfo(qrFieldInfo);
            if (newField) {
                lockedQrField = newField;
                var mockEvent = { target: newField };
                createQr(mockEvent);
            }
        }
    }

    function toggleQr(e) {
        var currentField = e.target;

        if (qrLocked && lockedQrField === currentField) {
            // Clicking the same locked field - unlock and hide
            showQr = false;
            qrLocked = false;
            lockedQrField = null;
            qrFieldInfo = null;
            DOM.qrHider.addClass("hidden");
        } else {
            // Clicking a different field or no field is locked - show QR for this field
            showQr = true;
            qrLocked = true;
            lockedQrField = currentField;
            qrFieldInfo = getQrFieldInfo(currentField);
            createQr(e);
            DOM.qrHider.removeClass("hidden");
        }
    }

    function toggleQrGrid() {
        var canvas = DOM.qrGridOverlay[0];
        var button = DOM.qrGridToggle;

        if (canvas.style.display === "none") {
            drawQrGrid();
            canvas.style.display = "block";
            button.text("Hide Grid").removeClass("btn-outline-secondary").addClass("btn-secondary");
            // Expand inner container to show grid labels
            $('.qr-content-container').css('padding', '25px');
        } else {
            canvas.style.display = "none";
            button.text("Show Grid").removeClass("btn-secondary").addClass("btn-outline-secondary");
            // Restore original container size
            $('.qr-content-container').css('padding', '0');
        }
    }

    function drawQrGrid() {
        var canvas = DOM.qrGridOverlay[0];
        var qrCanvas = DOM.qrImage.find("canvas")[0];

        if (!qrCanvas) return;

        // Add padding for labels
        var labelPadding = 25;
        canvas.width = qrCanvas.width + labelPadding;
        canvas.height = qrCanvas.height + labelPadding;

        // Position canvas to show labels outside QR canvas
        // Account for .qr-image CSS margin of 5px horizontally only
        var qrImageMargin = 5;
        canvas.style.top = -labelPadding + "px";
        canvas.style.left = (-labelPadding + qrImageMargin) + "px";

        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Get QR version from current mnemonic type and format
        var qrSize = getQrSize();
        var gridConfig = getGridConfig(qrSize);

        if (!gridConfig) return;

        // Account for QR code's internal margin (1 module on each side)
        var qrMarginModules = 1;
        var totalQrSize = gridConfig.size + (qrMarginModules * 2);
        var moduleSize = qrCanvas.width / totalQrSize;
        var qrMarginPixels = qrMarginModules * moduleSize;

        // Draw grid lines and labels with proper offsets
        drawGridLines(ctx, qrCanvas.width, qrCanvas.height, gridConfig, labelPadding, qrMarginPixels);
        drawGridLabels(ctx, qrCanvas.width, qrCanvas.height, gridConfig, labelPadding, qrMarginPixels);
    }

    function getQrSize() {
        // Get current mnemonic to determine word count
        var mnemonic = DOM.phrase.val().trim();
        if (!mnemonic) return 29; // Default to largest

        var wordCount = mnemonic.split(/\s+/).length;
        var qrType = DOM.qrType.val();

        // Map based on SeedQR specification
        if (qrType === "seedqr-compact") {
            return wordCount === 12 ? 21 : 25; // V1 : V2
        } else if (qrType === "seedqr-standard") {
            return wordCount === 12 ? 25 : 29; // V2 : V3
        }
        return 29; // Default for raw text
    }

    function getGridConfig(qrSize) {
        switch (qrSize) {
            case 21:
                // 21x21 divided into 3x3 sections of 7x7 modules each
                return { size: 21, sections: 3, sectionSize: 7, labels: ['A','B','C'] };
            case 25:
                // 25x25 divided into 5x5 sections of 5x5 modules each
                return { size: 25, sections: 5, sectionSize: 5, labels: ['A','B','C','D','E'] };
            case 29:
                // 29x29 divided into roughly 6x6 sections - uneven division
                return { size: 29, sections: 6, sectionSizes: [5,5,5,5,5,4], labels: ['A','B','C','D','E','F'] };
            default:
                return null;
        }
    }

    function drawGridLines(ctx, width, height, config, padding, qrMargin) {
        ctx.strokeStyle = '#ff0000'; // Red grid lines
        ctx.lineWidth = 1;

        // Calculate actual QR module size accounting for margins
        var totalQrSize = config.size + 2; // Add 2 for margins (1 on each side)
        var moduleSize = width / totalQrSize;

        // Start position accounts for both label padding and QR margin
        var startX = padding + qrMargin;
        var startY = padding + qrMargin;

        // Draw initial vertical line at start position
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX, startY + (config.size * moduleSize));
        ctx.stroke();

        // Draw vertical lines
        var xPos = startX;
        for (var i = 0; i < config.sections; i++) {
            var sectionSize = config.sectionSizes ? config.sectionSizes[i] : config.sectionSize;
            xPos += sectionSize * moduleSize;

            ctx.beginPath();
            ctx.moveTo(xPos, startY);
            ctx.lineTo(xPos, startY + (config.size * moduleSize));
            ctx.stroke();
        }

        // Draw initial horizontal line at start position
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + (config.size * moduleSize), startY);
        ctx.stroke();

        // Draw horizontal lines
        var yPos = startY;
        for (var i = 0; i < config.sections; i++) {
            var sectionSize = config.sectionSizes ? config.sectionSizes[i] : config.sectionSize;
            yPos += sectionSize * moduleSize;

            ctx.beginPath();
            ctx.moveTo(startX, yPos);
            ctx.lineTo(startX + (config.size * moduleSize), yPos);
            ctx.stroke();
        }
    }

    function drawGridLabels(ctx, width, height, config, padding, qrMargin) {
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Calculate actual QR module size accounting for margins
        var totalQrSize = config.size + 2; // Add 2 for margins (1 on each side)
        var moduleSize = width / totalQrSize;

        // Start position accounts for both label padding and QR margin
        var startX = padding + qrMargin;
        var startY = padding + qrMargin;

        // Draw column labels (1, 2, 3...) above the grid
        var xPos = startX;
        for (var i = 0; i < config.sections; i++) {
            var sectionSize = config.sectionSizes ? config.sectionSizes[i] : config.sectionSize;
            var centerX = xPos + (sectionSize * moduleSize) / 2;

            // Label above the grid
            ctx.fillText((i + 1).toString(), centerX, padding / 2);

            xPos += sectionSize * moduleSize;
        }

        // Draw row labels (A, B, C...) to the left of the grid
        ctx.textAlign = 'center';
        var yPos = startY;
        for (var i = 0; i < config.sections; i++) {
            var sectionSize = config.sectionSizes ? config.sectionSizes[i] : config.sectionSize;
            var centerY = yPos + (sectionSize * moduleSize) / 2;

            // Label to the left of the grid
            ctx.fillText(config.labels[i], padding / 2, centerY);

            yPos += sectionSize * moduleSize;
        }
    }

    function bip44TabSelected() {
        return DOM.bip44tab.find(".nav-link").hasClass("active");
    }

    function bip32TabSelected() {
        return DOM.bip32tab.find(".nav-link").hasClass("active");
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
        return DOM.bip49tab.find(".nav-link").hasClass("active");
    }

    function bip84TabSelected() {
        return DOM.bip84tab.find(".nav-link").hasClass("active");
    }

    function bip86TabSelected() {
        return DOM.bip86tab.find(".nav-link").hasClass("active");
    }

    function bip141TabSelected() {
        return DOM.bip141tab.find(".nav-link").hasClass("active");
    }

    function nip06TabSelected() {
        return DOM.nip06tab.find(".nav-link").hasClass("active");
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
            var wordlist = bip39.wordlists[language];
            var wordIndex = wordlist.indexOf(word);
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
            var wordlist = bip39.wordlists[language];
            var wordIndex = wordlist.indexOf(word);
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
        // This function is no longer used - CSV generation is handled in the tab click event
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
        html.setAttribute('data-theme', 'light');
        toggleButton.innerHTML = '🌙';
    } else if (currentThemeMode === 'light') {
        // Light → Dark
        currentThemeMode = 'dark';
        html.setAttribute('data-theme', 'dark');
        toggleButton.innerHTML = '☀️';
    } else {
        // Dark → Auto
        currentThemeMode = 'auto';
        const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemIsDark) {
            html.setAttribute('data-theme', 'dark');
        } else {
            html.setAttribute('data-theme', 'light');
        }
        toggleButton.innerHTML = '🌗';
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
        toggleButton.innerHTML = '🌗';
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
                toggleButton.innerHTML = '🌗';
            }
        }
    });
    
});
