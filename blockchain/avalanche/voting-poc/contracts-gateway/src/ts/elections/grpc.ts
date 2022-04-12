import {
  sendUnaryData,
  ServerUnaryCall,
  ServerWritableStream,
} from "@grpc/grpc-js";
import { Empty } from "../../gen/proto/google/protobuf/empty";
import {
  Election,
  ElectionsServer,
  NewElection,
  uint256,
} from "../../gen/proto/elections";
import { Status } from "@grpc/grpc-js/build/src/constants";
import { ElectionsContractWrapper } from "./contract";

export function electionsServer(
  contract: ElectionsContractWrapper
): ElectionsServer {
  return {
    createElection(
      call: ServerUnaryCall<NewElection, uint256>,
      callback: sendUnaryData<uint256>
    ): void {
      contract
        .createElection(call.request)
        .then((id) => callback(null, id))
        .catch(genericHandler("Create election", callback));
    },

    getElection(
      call: ServerUnaryCall<uint256, Election>,
      callback: sendUnaryData<Election>
    ): void {
      contract
        .getElection(call.request)
        .then((election) => callback(null, election))
        .catch(genericHandler("Get election", callback));
    },

    electionsCount(
      call: ServerUnaryCall<Empty, uint256>,
      callback: sendUnaryData<uint256>
    ): void {
      contract
        .electionsCount()
        .then((n) => callback(null, n))
        .catch(genericHandler("Elections count", callback));
    },

    streamElections(call: ServerWritableStream<uint256, Election>): void {
      contract
        .streamElections(call.request)
        .forEach((election) => call.write(election))
        .finally(() => call.end())
        .catch((err) => console.error(`Stream elections failed: ${err}`));
    },
  };
}

function genericHandler(
  prefix: string,
  callback: sendUnaryData<any>
): (error: any) => void {
  return (error: any): void => {
    console.error(`${prefix} failed: ${getMessage(error)}`);
    callback({ code: Status.UNKNOWN });
  };
}

function getMessage(e: any): string {
  if (!e.error) {
    return e.message;
  }
  return getMessage(e.error);
}
