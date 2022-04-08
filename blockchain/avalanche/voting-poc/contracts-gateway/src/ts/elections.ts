import {
  sendUnaryData,
  ServerUnaryCall,
  ServerWritableStream,
  UntypedHandleCall,
} from "@grpc/grpc-js";
import { Empty } from "../gen/proto/google/protobuf/empty";
import {
  Candidate,
  Election,
  ElectionId,
  ElectionsServer,
  NewElection,
} from "../gen/proto/elections";
import { BigNumber, ContractReceipt, ethers, Event, Wallet } from "ethers";
import { Elections__factory } from "../gen/contracts";
import { arrayify } from "ethers/lib/utils";
import { Status } from "@grpc/grpc-js/build/src/constants";

const provider = new ethers.providers.JsonRpcProvider(process.env.EVM_NODE_URL);
const owner = new Wallet(process.env.ELECTIONS_OWNER_KEY!, provider);
const contract = Elections__factory.connect(
  process.env.ELECTIONS_CONTRACT_ADDRESS!,
  owner
);

export class ElectionsServerImpl implements ElectionsServer {
  [name: string]: UntypedHandleCall;

  createElection(
    call: ServerUnaryCall<NewElection, ElectionId>,
    callback: sendUnaryData<ElectionId>
  ): void {
    contract
      .createElection(call.request)
      .then((t) => t.wait())
      .then(getElectionId)
      .then((id) => {
        callback(
          null,
          ElectionId.fromPartial({ id: { data: Buffer.from(arrayify(id)) } })
        );
      })
      .catch((e) => {
        console.log(`Create election failed: ${getRevertReason(e)}`);
        callback({ code: Status.UNKNOWN });
      });
  }

  getElection(
    call: ServerUnaryCall<ElectionId, Election>,
    callback: sendUnaryData<Election>
  ): void {
    const electionId = BigNumber.from(call.request.id!.data);
    Promise.all([
      contract.getElection(electionId),
      contract.getVotingResults(electionId),
    ]).then(([[start, end, title, description, candidates], votes]) => {
      const idToVotes = votes.reduce(
        (result, candidateVotes) =>
          result.set(candidateVotes.candidateId, candidateVotes.votes),
        new Map()
      );
      callback(null, {
        start,
        end,
        title,
        description,
        candidates: candidates.map((candidate, i) => {
          return { name: candidate, votes: { data: idToVotes.get(i) } };
        }),
      });
    });
  }

  streamElections(call: ServerWritableStream<Empty, Election>): void {
    call.write(Election.fromPartial({ title: "My First Election" }));
    call.write(Election.fromPartial({ title: "My Second Election" }));
    call.end();
  }
}

function getElectionId(receipt: ContractReceipt): BigNumber {
  return BigNumber.from(getEvent(receipt, "ElectionCreated").args?.electionId);
}

function getEvent(receipt: ContractReceipt, type: string): Event {
  return receipt.events?.find((e) => e.event === type)!;
}

function getRevertReason(e: any): string {
  if (!e.error) {
    return e.message;
  }
  return getRevertReason(e.error);
}
