import shelljs from "shelljs";

const TYPECHAIN_BINARY = "node_modules/.bin/typechain";
const OUT_DIR = "src/gen/contracts";
const CONTRACT_PATH =
  "../contracts/artifacts/contracts/Elections.sol/Elections.json";

const OPTIONS = [
  "--show-stack-traces",
  "--target=ethers-v5",
  `--out-dir ${OUT_DIR}`,
];

shelljs.exec(`${TYPECHAIN_BINARY} ${OPTIONS.join(" ")} ${CONTRACT_PATH}`);
