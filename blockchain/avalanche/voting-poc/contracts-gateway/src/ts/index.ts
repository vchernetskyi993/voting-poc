import { Server, ServerCredentials } from "@grpc/grpc-js";
import { ElectionsService } from "../gen/elections";
import { Elections } from "./elections";

const server = new Server();
server.addService(ElectionsService, new Elections());
server.bindAsync(
  // TODO: move to config
  "0.0.0.0:50051",
  ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error(err);
    }
    server.start();
    console.log(`Server running at port ${port}`);
  }
);
