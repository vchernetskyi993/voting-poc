import { BigNumber, ContractReceipt, ethers, Event, Wallet } from "ethers";
import { Elections__factory } from "../../gen/contracts";
import { Observable } from "rxjs";
import {
  Election,
  ElectionId,
  NewElection,
  uint256,
} from "../../gen/proto/elections";
import { arrayify } from "ethers/lib/utils";

export interface ElectionsContractWrapper {
  createElection(election: NewElection): Promise<ElectionId>;

  getElection(electionId: ElectionId): Promise<Election>;

  streamElections(): Observable<Election>;
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
    createElection(election: NewElection): Promise<ElectionId> {
      return contract
        .createElection(election)
        .then((t) => t.wait())
        .then(getElectionId)
        .then((id) => ElectionId.fromPartial({ id: toUint256(id) }));
    },

    getElection(electionId: ElectionId): Promise<Election> {
      const parsedId = fromUint256(electionId.id!);
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

    streamElections(): Observable<Election> {
      return new Observable((subscriber) => {
        subscriber.next(Election.fromPartial({ title: "My First Election" }));
        subscriber.next(Election.fromPartial({ title: "My Second Election" }));
        subscriber.complete();
      });
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
