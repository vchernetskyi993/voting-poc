import shelljs from "shelljs";
import fs from "fs";

const TYPECHAIN_BINARY = "node_modules/.bin/typechain";
const OUT_DIR = "src/gen/contracts";
const CONTRACT_PATH =
  "../contracts/artifacts/contracts/Elections.sol/Elections.json";

const OPTIONS = [
  "--show-stack-traces",
  "--target=web3-v1",
  `--out-dir ${OUT_DIR}`,
];

shelljs.exec(`${TYPECHAIN_BINARY} ${OPTIONS.join(" ")} ${CONTRACT_PATH}`);

const electionsAbi = require(`../${CONTRACT_PATH}`);
fs.writeFileSync(`${OUT_DIR}/elections-abi.json`, JSON.stringify(electionsAbi.abi))
