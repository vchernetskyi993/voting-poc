import {
  sendUnaryData,
  ServerUnaryCall,
  ServerWritableStream,
} from "@grpc/grpc-js";
import { Empty } from "../../gen/proto/google/protobuf/empty";
import {
  Election,
  ElectionId,
  ElectionsServer,
  NewElection,
  uint256,
} from "../../gen/proto/elections";
import { BigNumber, ContractReceipt, Event } from "ethers";
import { Elections } from "../../gen/contracts";
import { arrayify } from "ethers/lib/utils";
import { Status } from "@grpc/grpc-js/build/src/constants";

export function electionsServer(contract: Elections): ElectionsServer {
  return {
    createElection(
      call: ServerUnaryCall<NewElection, ElectionId>,
      callback: sendUnaryData<ElectionId>
    ): void {
      contract
        .createElection(call.request)
        .then((t) => t.wait())
        .then(getElectionId)
        .then((id) => {
          callback(null, ElectionId.fromPartial({ id: toUint256(id) }));
        })
        .catch(genericHandler("Create election", callback));
    },

    getElection(
      call: ServerUnaryCall<ElectionId, Election>,
      callback: sendUnaryData<Election>
    ): void {
      const electionId = BigNumber.from(call.request.id!.data);
      Promise.all([
        contract.getElection(electionId),
        contract.getVotingResults(electionId),
      ])
        .then(([[start, end, title, description, candidates], votes]) => {
          const idToVotes = votes.reduce(
            (result, candidateVotes) =>
              result.set(
                candidateVotes.candidateId.toString(),
                candidateVotes.votes
              ),
            new Map()
          );
          callback(null, {
            id: toUint256(electionId),
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
          });
        })
        .catch(genericHandler("Get election", callback));
    },

    streamElections(call: ServerWritableStream<Empty, Election>): void {
      call.write(Election.fromPartial({ title: "My First Election" }));
      call.write(Election.fromPartial({ title: "My Second Election" }));
      call.end();
    },
  };
}

function getElectionId(receipt: ContractReceipt): BigNumber {
  return BigNumber.from(getEvent(receipt, "ElectionCreated").args?.electionId);
}

function getEvent(receipt: ContractReceipt, type: string): Event {
  return receipt.events?.find((e) => e.event === type)!;
}

function genericHandler(
  prefix: string,
  callback: sendUnaryData<any>
): (error: any) => void {
  return (error: any): void => {
    console.log(`${prefix} failed: ${getMessage(error)}`);
    callback({ code: Status.UNKNOWN });
  };
}

function getMessage(e: any): string {
  if (!e.error) {
    return e.message;
  }
  return getMessage(e.error);
}

function toUint256(n: BigNumber): uint256 {
  return { data: Buffer.from(arrayify(n)) };
}
