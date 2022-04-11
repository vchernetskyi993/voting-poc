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
} from "../../gen/proto/elections";
import { Status } from "@grpc/grpc-js/build/src/constants";
import { ElectionsContractWrapper } from "./contract";

export function electionsServer(
  contract: ElectionsContractWrapper
): ElectionsServer {
  return {
    createElection(
      call: ServerUnaryCall<NewElection, ElectionId>,
      callback: sendUnaryData<ElectionId>
    ): void {
      contract
        .createElection(call.request)
        .then((id) => callback(null, id))
        .catch(genericHandler("Create election", callback));
    },

    getElection(
      call: ServerUnaryCall<ElectionId, Election>,
      callback: sendUnaryData<Election>
    ): void {
      contract
        .getElection(call.request)
        .then((election) => callback(null, election))
        .catch(genericHandler("Get election", callback));
    },

    streamElections(call: ServerWritableStream<Empty, Election>): void {
      contract
        .streamElections()
        .forEach((election) => call.write(election))
        .finally(() => call.end());
    },
  };
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
