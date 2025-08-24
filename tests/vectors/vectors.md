# File complete_vectors.json is compiled using vectors.json from https://github.com/trezor/python-mnemonic/vectors.json 
# which uses BIP39 passphrase TREZOR for it's vectors.
# ensure complete_vectors.json remains in tests/vectors dir for scripts in tests/spec

# complete_vectors.json build notes
# setup python venv
cd tests/vectors
mkdir bip39_vectors
python3 -m venv bip39_vectors
source bip39_vectors/bin/activate
cd bip39_vectors
pip install bip_utils
mkdir work
cd work
# copy vectorgen.py from tests/vectors to tests/vectors/bip39_vectors/work
# bip_utils doesn't support japanese russian turkish. so our script maps them to english.
# grab the wordlists
wget https://raw.githubusercontent.com/trezor/python-mnemonic/refs/heads/master/src/mnemonic/wordlist/english.txt
wget https://raw.githubusercontent.com/trezor/python-mnemonic/refs/heads/master/src/mnemonic/wordlist/japanese.txt
wget https://raw.githubusercontent.com/trezor/python-mnemonic/refs/heads/master/src/mnemonic/wordlist/russian.txt
wget https://raw.githubusercontent.com/trezor/python-mnemonic/refs/heads/master/src/mnemonic/wordlist/turkish.txt
# grab vectors.json from trezor/python-mnemonic
wget https://raw.githubusercontent.com/trezor/python-mnemonic/refs/heads/master/vectors.json
# create comlete_vectors.json with the following. 
python3 vectorgen.py vectors.json complete_vectors.json
# copy complete_vectors.json to tests/vectors/
# exit venv
deactivate
# optional cleanup rm -r tests/vectors/bip39_vectors
