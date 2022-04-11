import { Server, ServerCredentials } from "@grpc/grpc-js";
import { ElectionsServer, ElectionsService } from "../gen/proto/elections";

export function startServer(elections: ElectionsServer): Promise<Server> {
  const server = new Server();
  server.addService(ElectionsService, elections);
  return new Promise((resolve, reject) => {
    server.bindAsync(
      `0.0.0.0:${process.env.SERVER_PORT}`,
      ServerCredentials.createInsecure(),
      (err, port) => {
        if (err) {
          reject(err);
          return;
        }
        server.start();
        console.log(`Server running at port ${port}`);
        resolve(server);
      }
    );
  });
}
