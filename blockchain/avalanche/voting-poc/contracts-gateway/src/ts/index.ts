import "./config";
import { Server, ServerCredentials } from "@grpc/grpc-js";
import { ElectionsService } from "../gen/proto/elections";
import { ElectionsServerImpl } from "./elections";

const server = new Server();
server.addService(ElectionsService, new ElectionsServerImpl());
server.bindAsync(
  `0.0.0.0:${process.env.SERVER_PORT}`,
  ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error(err);
    }
    server.start();
    console.log(`Server running at port ${port}`);
  }
);
