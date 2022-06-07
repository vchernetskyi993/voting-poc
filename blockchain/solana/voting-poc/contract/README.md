# Elections contract

Core part of open elections. Contact for communicating with Solana network.

## Dev setup

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

To run tests from VS Code [Mocha Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter):
```json
{
  "mochaExplorer.env": {
    "ANCHOR_PROVIDER_URL": "https://api.devnet.solana.com",
    "ANCHOR_WALLET": "/home/nightingale/.config/solana/id.json"
  }
}
```

To re-test with clean state:

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
