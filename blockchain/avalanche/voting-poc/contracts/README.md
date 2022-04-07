# Solidity contracts

This project demonstrates Hardhat usage with Avalanche.

Main build lifecycle commands are added as NPM scripts.
```shell
npm run clean
npm run compile
npm test
npm run coverage
npm run docgen
```

Other useful commands:
```shell
npx hardhat help
npx hardhat node
REPORT_GAS=true npx hardhat test
npx eslint '**/*.{js,ts}'
npx eslint '**/*.{js,ts}' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

## Deployment

### Hardhat node

1. Start EVM node.
```shell
npx hardhat node
```

2. Deploy Elections.
```shell
npx hardhat run --network localhost scripts/01_deploy_elections.ts
```

### Local Avalanche network:

Requires `Go` installation.

1. Start network.
    1. Clone https://github.com/ava-labs/avalanche-network-runner

    2. From `avalanche-network-runner` run:
    ```shell
    go run ./examples/local/fivenodenetwork/main.go
    ```

2. Deploy Elections.
```shell
npx hardhat run --network avalancheLocal scripts/01_deploy_elections.ts
```

## Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/deploy.ts
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```
