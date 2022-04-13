import Web3 from "web3";
import { AbiItem } from "web3-utils";
import { Elections } from "../gen/contracts";
import electionsAbi from "../gen/contracts/elections-abi.json";

export function getElectionsContract(web3: Web3, account: string): Elections {
  return new web3.eth.Contract(
    electionsAbi as AbiItem[],
    process.env.REACT_APP_ELECTIONS_CONTRACT_ADDRESS,
    { from: account }
  ) as any as Elections;
}

type CandidateData = {
  name: string;
  votes: BigInt;
};

export type ElectionData = {
  start: number;
  end: number;
  title: string;
  description: string;
  candidates: CandidateData[];
};

export function getElection(
  contract: Elections,
  electionId: number
): Promise<ElectionData> {
  return Promise.all([
    contract.methods.getElection(electionId).call(),
    contract.methods.getVotingResults(electionId).call(),
  ]).then(([[start, end, title, description, candidates], votes]) => {
    const idToVotes = votes.reduce(
      (res, [id, count]) => res.set(+id, BigInt(count)),
      new Map<number, BigInt>()
    );
    return {
      start: +start,
      end: +end,
      title,
      description,
      candidates: candidates.map((name, id) => {
        return { name, votes: idToVotes.get(id)! };
      }),
    };
  });
}
