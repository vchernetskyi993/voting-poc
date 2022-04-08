# gRPC Gateway

This project demonstrates gRPC gateway for Avalanche.

Before building this project build `../contracts`. This project requires compiled Solidity ABI.

Main build lifecycle commands are added as NPM scripts.
```shell
npm run clean
npm run generate # compiles proto&typechain 
npm test
npm run serve # start node server without compiling TS
npm start
```
