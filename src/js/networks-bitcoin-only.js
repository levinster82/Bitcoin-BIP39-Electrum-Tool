    var networks = [
        {
            name: "BTC - Bitcoin",
            onSelect: function() {
                network = libs.bitcoin.networks.bitcoin;
                setHdCoin(0);
            },
        },
        {
            name: "BTC - Bitcoin Testnet",
            onSelect: function() {
                network = libs.bitcoin.networks.testnet;
                setHdCoin(1);
            },
        },
        {
            name: "BTC - Bitcoin RegTest",
            onSelect: function() {
                network = libs.bitcoin.networks.regtest;
                setHdCoin(1);
            },
        }
    ];