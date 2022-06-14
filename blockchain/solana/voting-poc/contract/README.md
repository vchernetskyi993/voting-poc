# Elections contract

Core part of open elections. Contact for communicating with Solana network.

## Dev setup

### To test on localhost:

```bash
anchor test

# OR:
anchor build
solana-test-validator
anchor deploy
ANCHOR_PROVIDER_URL="http://localhost:8899" \
    ANCHOR_WALLET="/home/nightingale/.config/solana/id.json" \
    yarn run mocha
```

### Testing on devnet:

Uncomment waiting in `fund` in `tests/voting.ts`.

```bash
# deploy to devnet
anchor deploy --provider.cluster devnet

# test on devnet without re-deploy
anchor test --provider.cluster devnet --skip-deploy

# test using mocha
ANCHOR_PROVIDER_URL="https://api.devnet.solana.com" \
    ANCHOR_WALLET="/home/nightingale/.config/solana/id.json" \
    yarn run mocha
```

To re-test on devnet with clean state:

1. Remove old keys: `rm -rf target/test target/deploy/`

2. Generate new program id `anchor keys list` and set it in `Anchor.toml` and `lib.rs`

3. Build: `anchor build` 

4. Ensure that you have more than 5 SOL: `solana balance` & `solana airdrop 2`

5. Deploy: `anchor deploy --provider.cluster devnet`

6. Run test
```bash
ANCHOR_PROVIDER_URL="https://api.devnet.solana.com" \
    ANCHOR_WALLET="/home/nightingale/.config/solana/id.json" \
    yarn run mocha -g "<your test name>"
```

### VS Code

To run tests from VS Code [Mocha Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter):
```json
{
  "mochaExplorer.env": {
    "ANCHOR_PROVIDER_URL": "https://api.devnet.solana.com",
    "ANCHOR_WALLET": "/home/nightingale/.config/solana/id.json"
  }
}
```
