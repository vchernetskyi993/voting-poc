import {
  sendUnaryData,
  ServerUnaryCall,
  ServerWritableStream,
  UntypedHandleCall,
} from "@grpc/grpc-js";
import { Empty } from "../gen/google/protobuf/empty";
import {
  Election,
  ElectionId,
  ElectionsServer,
  NewElection,
} from "../gen/elections";

export class Elections implements ElectionsServer {
  [name: string]: UntypedHandleCall;

  createElection(
    call: ServerUnaryCall<NewElection, ElectionId>,
    callback: sendUnaryData<ElectionId>
  ): void {
    callback(
      null,
      ElectionId.fromPartial({ id: { data: Buffer.from([1, 2, 3, 4, 5]) } })
    );
  }

  getElection(
    call: ServerUnaryCall<ElectionId, Election>,
    callback: sendUnaryData<Election>
  ): void {
    callback(null, Election.fromPartial({ title: "My Election" }));
  }

  streamElections(call: ServerWritableStream<Empty, Election>): void {
    call.write(Election.fromPartial({ title: "My First Election" }));
    call.write(Election.fromPartial({ title: "My Second Election" }));
    call.end();
  }
}
