import { ethers, Wallet } from "ethers";
import { Elections, Elections__factory } from "../../gen/contracts";

export function electionsContract(): Elections {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.EVM_NODE_URL
  );
  const owner = new Wallet(process.env.ELECTIONS_OWNER_KEY!, provider);
  return Elections__factory.connect(
    process.env.ELECTIONS_CONTRACT_ADDRESS!,
    owner
  );
}
