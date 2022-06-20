# Owner Voting CLI

Application for owner functionality.

## Usage

Setup:
```bash
# create&activate virtualenv anyway you like

# load requirements
pip install -r requirements.txt

# go to ../contract, build & deploy voting program

# build Python client
anchorpy client-gen ../contract/target/idl/voting.json voting_client

# run script
python voting.py --help
```

Get organization key:
```bash
solana-keygen pubkey ../gateway/keys/organization.json
```
