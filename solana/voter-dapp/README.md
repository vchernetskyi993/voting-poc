# Voting App

Example voting front-end application. Uses Solana [program](../contract/) as a back-end.
Like [a gateway dapp](../gateway/) this app is tied to 1 organization.
So, it provides an ability for users to vote on some organizational decisions.

## Getting started

```bash
# install dependencies
yarn

# start dev server
yarn start
```

My VS Code debug config:
```json
{
    "name": "Launch localhost",
    "type": "firefox",
    "request": "launch",
    "reAttach": true,
    "url": "http://localhost:1234",
    "webRoot": "${workspaceFolder}",
    "pathMappings": [
        {
            "url": "file:///__parcel_source_root/src",
            "path": "${workspaceFolder}/src"
        }
    ],
    "profile": "default-release",
    "keepProfileChanges": true
}
```
