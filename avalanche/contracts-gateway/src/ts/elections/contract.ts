import { BigNumber, ContractReceipt, ethers, Event, Wallet } from "ethers";
import { Elections__factory } from "../../gen/contracts";
import { concatMap, from, generate, map, Observable } from "rxjs";
import { Election, NewElection, uint256 } from "../../gen/proto/elections";
import { arrayify } from "ethers/lib/utils";

export interface ElectionsContractWrapper {
  createElection(election: NewElection): Promise<uint256>;

  getElection(electionId: uint256): Promise<Election>;

  electionsCount(): Promise<uint256>;

  streamElections(startFrom: uint256): Observable<Election>;
}

export function electionsContract(): ElectionsContractWrapper {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.EVM_NODE_URL
  );
  const owner = new Wallet(process.env.ELECTIONS_OWNER_KEY!, provider);
  const contract = Elections__factory.connect(
    process.env.ELECTIONS_CONTRACT_ADDRESS!,
    owner
  );

  return {
    createElection(election: NewElection): Promise<uint256> {
      return contract
        .createElection(election)
        .then((t) => t.wait())
        .then(getElectionId)
        .then(toUint256);
    },

    getElection(electionId: uint256): Promise<Election> {
      const parsedId = fromUint256(electionId);
      return Promise.all([
        contract.getElection(parsedId),
        contract.getVotingResults(parsedId),
      ]).then(([[start, end, title, description, candidates], votes]) => {
        const idToVotes = votes.reduce(
          (result, candidateVotes) =>
            result.set(
              candidateVotes.candidateId.toString(),
              candidateVotes.votes
            ),
          new Map()
        );
        return {
          id: toUint256(parsedId),
          start,
          end,
          title,
          description,
          candidates: candidates.map((candidate, i) => {
            return {
              name: candidate,
              votes: toUint256(idToVotes.get(i.toString())),
            };
          }),
        };
      });
    },

    electionsCount(): Promise<uint256> {
      return contract.electionsCount().then(toUint256);
    },

    streamElections(startFrom: uint256): Observable<Election> {
      return from(contract.electionsCount()).pipe(
        concatMap((count) =>
          generate({
            initialState: fromUint256(startFrom),
            condition: (i) => i.lt(count),
            iterate: (i) => i.add(1),
          })
        ),
        map(toUint256),
        map(this.getElection),
        concatMap((e) => from(e))
      );
    },
  };
}

function getElectionId(receipt: ContractReceipt): BigNumber {
  return BigNumber.from(getEvent(receipt, "ElectionCreated").args?.electionId);
}

function getEvent(receipt: ContractReceipt, type: string): Event {
  return receipt.events?.find((e) => e.event === type)!;
}

function toUint256(n: BigNumber): uint256 {
  return { data: Buffer.from(arrayify(n)) };
}

function fromUint256(n: uint256): BigNumber {
  return BigNumber.from(n.data);
}
