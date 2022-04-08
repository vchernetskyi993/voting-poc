import dotenv from "dotenv";
import { Server, ServerCredentials } from "@grpc/grpc-js";
import { ElectionsService } from "../gen/elections";
import { Elections } from "./elections";

dotenv.config();

const server = new Server();
server.addService(ElectionsService, new Elections());
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
