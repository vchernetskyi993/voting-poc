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
